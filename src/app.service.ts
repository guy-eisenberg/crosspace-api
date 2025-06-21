import { Inject, Injectable } from '@nestjs/common';
import { createHmac } from 'crypto';
import { RedisClientType } from 'redis';
import { REDIS_CLIENT } from './redis.module';
import { R } from './redis/keys';

@Injectable()
export class AppService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: RedisClientType) {}

  async registerDevice({
    userAgent,
    deviceId,
  }: {
    userAgent: string;
    deviceId: string;
  }) {
    await this.redis.set(
      R.device(deviceId),
      JSON.stringify({ id: deviceId, userAgent }),
    );
  }

  getIceServers() {
    const timestamp = Math.floor(Date.now() / 1000);
    const ttl = 86400;
    const username = `${timestamp + ttl}:crosspace`;

    const hmac = createHmac('sha1', process.env.TURN_AUTH_SECRET as string);
    hmac.update(username);
    const credential = hmac.digest('base64');

    const stunServers = [
      {
        urls: `stun:${process.env.TURN_URL}:5349`,
      },
      {
        urls: `turn:${process.env.TURN_URL}:5349`,
        username,
        credential,
      },
    ];

    return { stunServers };
  }
}
