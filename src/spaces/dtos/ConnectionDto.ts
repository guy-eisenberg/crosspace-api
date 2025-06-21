import { IsObject, IsString, IsUUID } from 'class-validator';
import { ConnectionEvent } from 'src/types';

export class ConnectionParamDto {
  @IsUUID('4')
  targetDeviceId: string;
}

export class ConnectionBodyDto {
  @IsString()
  event: ConnectionEvent;

  @IsObject()
  data: object;
}
