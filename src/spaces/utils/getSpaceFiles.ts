import { type RedisClientType } from 'redis';
import { R } from 'src/redis/keys';
import { type FileMetadata } from 'src/types';

export async function getSpaceFiles(
  redis: RedisClientType,
  { spaceId }: { spaceId: string },
) {
  const filesStr = (await redis.get(R.space(spaceId).files)) || '{}';

  return JSON.parse(filesStr) as { [id: string]: FileMetadata };
}
