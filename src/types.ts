import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export interface AppSession {
  deviceId: string;
}

export class FileMetadata {
  @IsUUID('4')
  id: string;

  @IsUUID('4')
  deviceId: string;

  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsNumber()
  size: number;

  @IsString()
  @IsOptional()
  thumbnail?: string;
}

export type ConnectionEvent =
  | 'create-connection'
  | 'send-offer'
  | 'ice-candidate';

export type TransferEvent =
  | 'transfer-start'
  | 'transfer-pause'
  | 'transfer-close';

export interface DeviceMetadata {
  id: string;
  userAgent: string;
}
