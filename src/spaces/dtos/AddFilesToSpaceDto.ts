import { IsUUID } from 'class-validator';
import { FileMetadata } from 'src/types';

export class AddFilesToSpaceParamDto {
  @IsUUID('4')
  spaceId: string;
}

export class AddFilesToSpaceBodyDto {
  // @IsArray()
  // @ValidateNested({ each: true })
  // @Type(() => FileMetadata)
  files: FileMetadata[];
}
