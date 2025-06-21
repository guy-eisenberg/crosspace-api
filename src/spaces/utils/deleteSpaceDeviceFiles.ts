import { RedisClientType } from 'redis';
import { FileMetadata } from 'src/types';
import { getSpaceFiles } from './getSpaceFiles';
import { setSpaceFiles } from './setSpaceFiles';

export default async function deleteSpaceDeviceFiles(
  redis: RedisClientType,
  { spaceId, deviceId }: { spaceId: string; deviceId: string },
) {
  const spaceFiles = await getSpaceFiles(redis, { spaceId });

  const updatedSpaceFiles: {
    [id: string]: FileMetadata;
  } = {};

  for (const file of Object.values(spaceFiles)) {
    if (file.deviceId !== deviceId) updatedSpaceFiles[file.id] = file;
  }

  await setSpaceFiles(redis, { spaceId, files: updatedSpaceFiles });

  return updatedSpaceFiles;
}
