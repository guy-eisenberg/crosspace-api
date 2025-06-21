import { Inject } from '@nestjs/common';
import {
  type OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { RedisClientType } from 'redis';
import { type Server, type Socket } from 'socket.io';
import { CORS_CONFIG } from 'src/constants';
import { REDIS_CLIENT } from 'src/redis.module';
import getDeviceMetadata from './utils/getDeviceMetadata';

@WebSocketGateway(undefined, { cors: CORS_CONFIG, cookie: true })
export class SpacesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  deviceToSocket = new Map<string, Socket>();

  constructor(@Inject(REDIS_CLIENT) private readonly redis: RedisClientType) {}

  handleConnection(client: Socket) {
    const deviceId = (
      client.request as unknown as { session: { deviceId: string } }
    ).session.deviceId;

    console.log(`IO - Device of id '${deviceId}' connected.`);

    this.deviceToSocket.set(deviceId, client);
  }

  handleDisconnect(client: Socket) {
    const deviceId = (
      client.request as unknown as { session: { deviceId: string } }
    ).session.deviceId;

    console.log(`IO - Device of id '${deviceId}' disconnected.`);
  }

  private getDeviceSocket({ deviceId }: { deviceId: string }) {
    const socket = this.deviceToSocket.get(deviceId);

    return socket;
  }

  async addDeviceToSpaceRoom({
    deviceId,
    roomId,
    onDeviceDisconnect,
  }: {
    deviceId: string;
    roomId: string;
    onDeviceDisconnect: () => Promise<void>;
  }) {
    const socket = this.getDeviceSocket({ deviceId });
    if (!socket) return;

    await socket.join(roomId);

    const device = await getDeviceMetadata(this.redis, deviceId);

    socket.on('disconnect', async () => {
      await socket.leave(roomId);

      await onDeviceDisconnect();

      socket
        .to(roomId)
        .emit('devices-changed', { device, event: 'disconnect' });
    });

    socket.to(roomId).emit('devices-changed', { device, event: 'connect' });

    console.log(
      `Joined device of id '${deviceId}' to a space room of id '${roomId}'`,
    );
  }

  async emitTo({
    deviceId,
    event,
    data,
  }: {
    deviceId: string;
    event: string;
    data: any;
  }) {
    const socket = this.getDeviceSocket({ deviceId });
    if (!socket) return;

    const [res] = await this.server
      .to(socket.id)
      .timeout(3000)
      .emitWithAck(event, data);

    return res;
  }
}
