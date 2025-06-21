import { RedisClientType } from 'redis';
import { R } from 'src/redis/keys';

export async function isDeviceRegistered(
  redis: RedisClientType,
  { deviceId }: { deviceId: string },
) {
  return (await redis.exists(R.device(deviceId))) === 1;
}
