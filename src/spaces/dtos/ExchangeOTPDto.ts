import { IsString } from 'class-validator';

export class ExchangeOTPDto {
  @IsString()
  otp: string;
}
