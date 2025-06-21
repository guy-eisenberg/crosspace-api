import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Session,
} from '@nestjs/common';
import type { AppSession } from 'src/types';
import {
  AddFilesToSpaceBodyDto,
  AddFilesToSpaceParamDto,
} from './dtos/AddFilesToSpaceDto';
import { ConnectionBodyDto, ConnectionParamDto } from './dtos/ConnectionDto';
import {
  CreateThumbnailUploadUrlsBodyDto,
  CreateThumbnailUploadUrlsParamDto,
} from './dtos/CreateThumbnailUploadUrlsDto';
import {
  DeleteFilesFromSpaceBodyDto,
  DeleteFilesFromSpaceParamDto,
} from './dtos/DeleteFilesFromSpaceDto';
import { ExchangeOTPDto } from './dtos/ExchangeOTPDto';
import { GetSpaceOTPDto } from './dtos/GetSpaceOTPDto';
import { JoinSpaceBodyDto, JoinSpaceParamDto } from './dtos/JoinSpaceDto';
import {
  RequestFilesBodyDto,
  RequestFilesParamDto,
} from './dtos/RequestFilesDto';
import {
  UpdateFileThumbnailsBodyDto,
  UpdateFileThumbnailsParamDto,
} from './dtos/UpdateFileThumbnailsDto';
import { SpacesService } from './spaces.service';

@Controller('spaces')
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Get('/exchange-otp')
  exchangeOTP(
    @Session() { deviceId }: AppSession,
    @Query() { otp }: ExchangeOTPDto,
  ) {
    return this.spacesService.exchangeOTP({ deviceId, otp });
  }

  @Get('/:spaceId/otp')
  getSpaceOTP(
    @Session() { deviceId }: AppSession,
    @Param() { spaceId }: GetSpaceOTPDto,
  ) {
    return this.spacesService.getSpaceOTP({ deviceId, spaceId });
  }

  @Get('/:spaceId/totp')
  getSpaceTOTP(
    @Session() { deviceId }: AppSession,
    @Param() { spaceId }: GetSpaceOTPDto,
  ) {
    return this.spacesService.getSpaceTOTP({ deviceId, spaceId });
  }

  @Post('/:spaceId/files')
  addFilesToSpace(
    @Session() { deviceId }: AppSession,
    @Param() { spaceId }: AddFilesToSpaceParamDto,
    @Body() { files }: AddFilesToSpaceBodyDto,
  ) {
    return this.spacesService.addFilesToSpace({ deviceId, spaceId, files });
  }

  @Delete('/:spaceId/files')
  deleteFilesFromSpace(
    @Session() { deviceId }: AppSession,
    @Param() { spaceId }: DeleteFilesFromSpaceParamDto,
    @Body() { fileIds: files }: DeleteFilesFromSpaceBodyDto,
  ) {
    return this.spacesService.deleteFilesFromSpace({
      deviceId,
      spaceId,
      fileIds: files,
    });
  }

  @Post('/:spaceId/files-request')
  requestFiles(
    @Session() { deviceId }: AppSession,
    @Param() { spaceId }: RequestFilesParamDto,
    @Body() { fileIds }: RequestFilesBodyDto,
  ) {
    return this.spacesService.requestFiles({ deviceId, spaceId, fileIds });
  }

  @Post('/:spaceId/thumbnail-upload-urls')
  createThumbnailUploadUrls(
    @Session() { deviceId }: AppSession,
    @Param() { spaceId }: CreateThumbnailUploadUrlsParamDto,
    @Body() { fileIds }: CreateThumbnailUploadUrlsBodyDto,
  ) {
    return this.spacesService.createThumbnailUploadUrls({
      deviceId,
      spaceId,
      fileIds,
    });
  }

  @Post('/:spaceId/update-file-thumbnails')
  updateThumbnails(
    @Session() { deviceId }: AppSession,
    @Param() { spaceId }: UpdateFileThumbnailsParamDto,
    @Body() { fileIds }: UpdateFileThumbnailsBodyDto,
  ) {
    return this.spacesService.updateFileThumbnails({
      deviceId,
      spaceId,
      fileIds,
    });
  }

  @Post('/:spaceId/join')
  joinSpace(
    @Session() { deviceId }: AppSession,
    @Param() { spaceId }: JoinSpaceParamDto,
    @Body() { totp }: JoinSpaceBodyDto,
  ) {
    console.log('Join', deviceId, spaceId, totp);
    return this.spacesService.joinSpace({ deviceId, spaceId, totp });
  }

  @Post('/connection/:targetDeviceId')
  connection(
    @Session() { deviceId }: AppSession,
    @Param() { targetDeviceId }: ConnectionParamDto,
    @Body() { event, data }: ConnectionBodyDto,
  ) {
    return this.spacesService.connection({
      deviceId,
      targetDeviceId,
      event,
      data,
    });
  }
}
