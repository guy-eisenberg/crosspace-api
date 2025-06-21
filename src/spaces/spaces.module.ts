import { Module } from '@nestjs/common';
import { SpacesController } from './spaces.controller';
import { SpacesService } from './spaces.service';
import { SpacesGateway } from './spaces.gateway';

@Module({
  providers: [SpacesService, SpacesGateway],
  controllers: [SpacesController],
})
export class SpacesModule {}
