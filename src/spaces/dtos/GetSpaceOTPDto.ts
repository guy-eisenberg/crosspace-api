import { IsUUID } from 'class-validator';

export class GetSpaceOTPDto {
  @IsUUID('4')
  spaceId: string;
}
