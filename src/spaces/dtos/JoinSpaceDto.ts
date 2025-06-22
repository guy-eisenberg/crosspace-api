import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class JoinSpaceParamDto {
  @IsUUID('4')
  spaceId: string;
}

export class JoinSpaceBodyDto {
  @IsString()
  @Length(32, 32)
  @IsOptional()
  token: string | null;
}
