import { IsArray, IsUUID } from 'class-validator';

export class DeleteFilesFromSpaceParamDto {
  @IsUUID('4')
  spaceId: string;
}

export class DeleteFilesFromSpaceBodyDto {
  @IsArray()
  @IsUUID('4', { each: true })
  fileIds: string[];
}
