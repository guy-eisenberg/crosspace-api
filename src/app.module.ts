import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from './redis.module';
import { SpacesModule } from './spaces/spaces.module';
import { S3Module } from './s3.module';

@Module({
  imports: [ConfigModule.forRoot(), SpacesModule, RedisModule, S3Module],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
