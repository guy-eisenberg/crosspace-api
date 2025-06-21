import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { RedisStore } from 'connect-redis';
import * as session from 'express-session';
import { type RedisClientType } from 'redis';
import { SessionIoAdapter } from './adapters/SessionIoAdapter';
import { AppModule } from './app.module';
import { CORS_CONFIG, SESSION_CONFIG } from './constants';
import { deviceIdMiddleware } from './middlewares/device-id.middleware';
import { REDIS_CLIENT } from './redis.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(CORS_CONFIG);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const redis = app.get(REDIS_CLIENT) as RedisClientType;

  const sessionMiddleware = session({
    ...SESSION_CONFIG,
    store: new RedisStore({ client: redis }),
  });

  app.use(sessionMiddleware);
  app.use(deviceIdMiddleware);

  app.useWebSocketAdapter(
    new SessionIoAdapter(app, [sessionMiddleware, deviceIdMiddleware]),
  );

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  await app.listen(8080);
}
void bootstrap();
