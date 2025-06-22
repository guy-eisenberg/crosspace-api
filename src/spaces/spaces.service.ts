import {
  DeleteObjectsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { type RedisClientType } from 'redis';
import { OTP_TTL, TOKEN_TTL } from 'src/constants';
import { REDIS_CLIENT } from 'src/redis.module';
import { R } from 'src/redis/keys';
import { S3_CLIENT } from 'src/s3.module';
import { ConnectionEvent, FileMetadata } from 'src/types';
import { generateOTP } from 'src/utils/generateOTP';
import { generateToken } from 'src/utils/generateToken';
import { SpacesGateway } from './spaces.gateway';
import deleteSpaceDeviceFiles from './utils/deleteSpaceDeviceFiles';
import getDeviceMetadata from './utils/getDeviceMetadata';
import { getSpaceDevices } from './utils/getSpaceDevices';
import { getSpaceFiles } from './utils/getSpaceFiles';
import { isDeviceInSpace } from './utils/isDeviceInSpace';
import { isDeviceRegistered } from './utils/isDeviceRegistered';
import { setSpaceFiles } from './utils/setSpaceFiles';

@Injectable()
export class SpacesService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: RedisClientType,
    @Inject(S3_CLIENT) private readonly s3: S3Client,
    private readonly events: SpacesGateway,
  ) {}

  private async checkDeviceAuth({
    deviceId,
    spaceId,
  }: {
    deviceId: string;
    spaceId: string;
  }) {
    const isRegistered = await isDeviceRegistered(this.redis, { deviceId });
    if (!isRegistered)
      throw new HttpException('UNAUTHORIZED', HttpStatus.UNAUTHORIZED);

    const isInSpace = await isDeviceInSpace(this.redis, {
      deviceId,
      spaceId,
    });
    if (!isInSpace)
      throw new HttpException('UNAUTHORIZED', HttpStatus.UNAUTHORIZED);
  }

  async exchangeOTP({ deviceId, otp }: { deviceId: string; otp: string }) {
    const spaceId = await this.redis.get(R.otp(otp).space);

    if (spaceId) {
      const spacesDevices = await getSpaceDevices(this.redis, { spaceId });

      if (!spacesDevices.includes(deviceId)) {
        await this.redis.set(
          R.space(spaceId).devices,
          JSON.stringify([...spacesDevices, deviceId]),
        );
      }
    }

    return { spaceId };
  }

  async getSpaceToken({
    deviceId,
    spaceId,
  }: {
    deviceId: string;
    spaceId: string;
  }): Promise<{ token: string; ttl: number }> {
    await this.checkDeviceAuth({ deviceId, spaceId });

    const existingToken = await this.redis.get(R.space(spaceId).token);
    if (existingToken) {
      const existingTokenTTL = await this.redis.ttl(R.space(spaceId).token);

      return { token: existingToken, ttl: existingTokenTTL };
    }

    const token = generateToken();

    await this.redis.setEx(R.space(spaceId).token, TOKEN_TTL, token);

    return { token, ttl: TOKEN_TTL };
  }

  async getSpaceOTP({
    deviceId,
    spaceId,
  }: {
    deviceId: string;
    spaceId: string;
  }): Promise<{ otp: string; ttl: number }> {
    await this.checkDeviceAuth({ deviceId, spaceId });

    const existingOTP = await this.redis.get(R.space(spaceId).otp);
    if (existingOTP) {
      const existingOTPTTL = await this.redis.ttl(R.space(spaceId).otp);

      return { otp: existingOTP, ttl: existingOTPTTL };
    }

    const otp = generateOTP();

    await this.redis.setEx(R.otp(otp).space, OTP_TTL, spaceId);
    await this.redis.setEx(R.space(spaceId).otp, OTP_TTL, otp);

    return { otp, ttl: OTP_TTL };
  }

  async addFilesToSpace({
    deviceId,
    spaceId,
    files,
  }: {
    deviceId: string;
    spaceId: string;
    files: FileMetadata[];
  }) {
    await this.checkDeviceAuth({ deviceId, spaceId });

    const spaceFiles = await getSpaceFiles(this.redis, { spaceId });

    for (const file of files) {
      spaceFiles[file.id] = file;
      spaceFiles[file.id].deviceId = deviceId;
    }

    await this.redis.set(R.space(spaceId).files, JSON.stringify(spaceFiles));

    this.events.server
      .to(spaceId)
      .emit('files-changed', { files: spaceFiles, event: 'add' });
  }

  async deleteFilesFromSpace({
    deviceId,
    spaceId,
    fileIds,
  }: {
    deviceId: string;
    spaceId: string;
    fileIds: string[];
  }) {
    await this.checkDeviceAuth({ deviceId, spaceId });

    const spaceFiles = await getSpaceFiles(this.redis, { spaceId });

    for (const id of fileIds) delete spaceFiles[id];

    await setSpaceFiles(this.redis, { spaceId, files: spaceFiles });

    // Delete file thumbnails:
    if (fileIds.length > 0) {
      const cmd = new DeleteObjectsCommand({
        Bucket: process.env.S3_BUCKET,
        Delete: {
          Objects: fileIds.map((id) => ({
            Key: `${spaceId}/thumbnails/${id}`,
          })),
          Quiet: true,
        },
      });

      await this.s3.send(cmd);
    }

    this.events.server
      .to(spaceId)
      .emit('files-changed', { files: spaceFiles, event: 'delete' });
  }

  async requestFiles({
    deviceId,
    spaceId,
    fileIds,
  }: {
    deviceId: string;
    spaceId: string;
    fileIds: string[];
  }) {
    await this.checkDeviceAuth({ deviceId, spaceId });

    const spaceFiles = await getSpaceFiles(this.redis, { spaceId });

    const transfers: { [fileId: string]: string } = {};

    await Promise.all(
      fileIds.map((fileId) =>
        (async () => {
          const file = spaceFiles[fileId];
          if (!file) return;

          const transferId = await this.events.emitTo({
            deviceId: file.deviceId,
            event: 'file-request',
            data: { originDeviceId: deviceId, file },
          });

          transfers[fileId] = transferId;
        })(),
      ),
    );

    console.log(transfers);

    return { transfers };
  }

  async createThumbnailUploadUrls({
    deviceId,
    spaceId,
    fileIds,
  }: {
    deviceId: string;
    spaceId: string;
    fileIds: string[];
  }) {
    await this.checkDeviceAuth({ deviceId, spaceId });

    const urls: { [id: string]: string } = {};

    await Promise.all(
      fileIds.map((fileId) =>
        (async () => {
          const url = await generateUrl(this.s3, fileId);
          urls[fileId] = url;
        })(),
      ),
    );

    return { urls };

    async function generateUrl(s3: S3Client, fileId: string) {
      const cmd = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET as string,
        Key: `${spaceId}/thumbnails/${fileId}`,
      });

      const url = await getSignedUrl(s3, cmd);

      return url;
    }
  }

  async updateFileThumbnails({
    deviceId,
    spaceId,
    fileIds,
  }: {
    deviceId: string;
    spaceId: string;
    fileIds: string[];
  }) {
    await this.checkDeviceAuth({ deviceId, spaceId });

    const spaceFiles = await getSpaceFiles(this.redis, { spaceId });

    Object.values(spaceFiles).forEach((file) => {
      if (!fileIds.includes(file.id)) return;

      const thumbnailUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${spaceId}/thumbnails/${file.id}`;

      file.thumbnail = thumbnailUrl;
    });

    await this.redis.set(R.space(spaceId).files, JSON.stringify(spaceFiles));

    this.events.server.to(spaceId).emit('files-changed', {
      files: spaceFiles,
      event: 'thumbnails-update',
    });
  }

  async connection({
    deviceId,
    targetDeviceId,
    event,
    data,
  }: {
    deviceId: string;
    targetDeviceId: string;
    event: ConnectionEvent;
    data: any;
  }) {
    if (
      event !== 'create-connection' &&
      event !== 'send-offer' &&
      event !== 'ice-candidate'
    )
      return;

    const res = await this.events.emitTo({
      deviceId: targetDeviceId,
      event,
      data: {
        originDeviceId: deviceId,
        data,
      },
    });

    return res;
  }

  async joinSpace({
    deviceId,
    spaceId,
    token,
  }: {
    deviceId: string;
    spaceId: string;
    token: string | null;
  }) {
    const spacesDevices = await getSpaceDevices(this.redis, { spaceId });

    if (!spacesDevices.includes(deviceId)) {
      // Space was initialized, need a token to join:
      if (spacesDevices.length > 0) {
        // If no token was provided by the user, throw an error:
        if (!token)
          throw new HttpException('UNAUTHORIZED', HttpStatus.UNAUTHORIZED);

        const currentToken = await this.redis.get(R.space(spaceId).token);

        if (!currentToken || token !== currentToken)
          throw new HttpException('UNAUTHORIZED', HttpStatus.UNAUTHORIZED);
      }

      await this.redis.set(
        R.space(spaceId).devices,
        JSON.stringify([...spacesDevices, deviceId]),
      );
    }

    await this.events.addDeviceToSpaceRoom({
      deviceId,
      roomId: spaceId,
      onDeviceDisconnect: async () => {
        const updatedSpaceFiles = await deleteSpaceDeviceFiles(this.redis, {
          spaceId,
          deviceId,
        });

        this.events.server.to(spaceId).emit('files-changed', {
          files: updatedSpaceFiles,
          event: 'thumbnails-update',
        });
      },
    });

    const deviceIds = await getSpaceDevices(this.redis, { spaceId });
    const devices = (
      await Promise.all(
        deviceIds.map(async (id) => {
          const metadata = await getDeviceMetadata(this.redis, id);

          return {
            id: id === deviceId ? 'this' : id,
            userAgent: metadata?.userAgent,
          };
        }),
      )
    ).filter((d) => d !== undefined);

    const files = await getSpaceFiles(this.redis, { spaceId });

    return { devices, files };
  }
}
