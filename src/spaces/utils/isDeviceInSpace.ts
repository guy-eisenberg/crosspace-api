import { type RedisClientType } from 'redis';
import { getSpaceDevices } from './getSpaceDevices';

export async function isDeviceInSpace(
  redis: RedisClientType,
  { deviceId, spaceId }: { deviceId: string; spaceId: string },
) {
  const spacesDevices = await getSpaceDevices(redis, { spaceId });

  return spacesDevices.includes(deviceId);
}
