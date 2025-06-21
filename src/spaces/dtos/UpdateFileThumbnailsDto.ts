import { IsUUID } from 'class-validator';

export class UpdateFileThumbnailsParamDto {
  @IsUUID('4')
  spaceId: string;
}

export class UpdateFileThumbnailsBodyDto {
  @IsUUID('4', { each: true })
  fileIds: string[];
}
