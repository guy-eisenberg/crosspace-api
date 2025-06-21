import { RedisClientType } from 'redis';
import { R } from 'src/redis/keys';
import { FileMetadata } from 'src/types';

export async function setSpaceFiles(
  redis: RedisClientType,
  {
    spaceId,
    files,
  }: { spaceId: string; files: { [fileId: string]: FileMetadata } },
) {
  if (Object.entries(files).length > 0)
    await redis.set(R.space(spaceId).files, JSON.stringify(files));
  else await redis.del(R.space(spaceId).files);
}
