import { IsUUID } from 'class-validator';

export class GetSpaceFilesDto {
  @IsUUID('4')
  spaceId: string;
}
