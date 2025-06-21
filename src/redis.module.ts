import { Global, Module } from '@nestjs/common';
import { createClient } from 'redis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: async () => {
        const redis = createClient({ url: 'redis://redis:6379' });
        try {
          await redis.connect();

          console.log('Redis client is ready.');
        } catch (err) {
          console.log(err);
        }

        return redis;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
