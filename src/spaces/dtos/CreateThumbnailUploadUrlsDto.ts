import { IsUUID } from 'class-validator';

export class CreateThumbnailUploadUrlsParamDto {
  @IsUUID('4')
  spaceId: string;
}

export class CreateThumbnailUploadUrlsBodyDto {
  @IsUUID('4', { each: true })
  fileIds: string[];
}
