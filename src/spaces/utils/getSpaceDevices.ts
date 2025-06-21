import { type RedisClientType } from 'redis';
import { R } from 'src/redis/keys';

export async function getSpaceDevices(
  redis: RedisClientType,
  { spaceId }: { spaceId: string },
) {
  const spaceDevicesStr = (await redis.get(R.space(spaceId).devices)) || '[]';

  return JSON.parse(spaceDevicesStr) as string[];
}
