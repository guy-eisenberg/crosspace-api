import { IsUUID } from 'class-validator';

export class GetSpaceTokenDto {
  @IsUUID('4')
  spaceId: string;
}
