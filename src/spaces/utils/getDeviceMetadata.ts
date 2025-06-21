import { RedisClientType } from 'redis';
import { R } from 'src/redis/keys';

export default async function getDeviceMetadata(
  redis: RedisClientType,
  deviceId: string,
) {
  const deviceStr = await redis.get(R.device(deviceId));
  if (!deviceStr) return undefined;

  const device = JSON.parse(deviceStr) as { userAgent: string };
  return {
    id: deviceId,
    userAgent: device.userAgent,
  };
}
