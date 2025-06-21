import { IsUUID } from 'class-validator';

export class GetSpaceDevicesDto {
  @IsUUID('4')
  spaceId: string;
}
