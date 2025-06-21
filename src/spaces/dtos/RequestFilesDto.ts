import { IsArray, IsUUID } from 'class-validator';

export class RequestFilesParamDto {
  @IsUUID('4')
  spaceId: string;
}

export class RequestFilesBodyDto {
  @IsArray()
  @IsUUID('4', { each: true })
  fileIds: string[];
}
