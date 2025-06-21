import { Controller, Get, Headers, Session } from '@nestjs/common';
import { AppService } from './app.service';
import { AppSession } from './types';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/init')
  async init(
    @Headers('user-agent') userAgent: string,
    @Session() { deviceId }: AppSession,
  ) {
    await this.appService.registerDevice({ userAgent, deviceId });
    const { stunServers } = await this.appService.getIceServers();

    return { deviceId, stunServers };
  }
}
