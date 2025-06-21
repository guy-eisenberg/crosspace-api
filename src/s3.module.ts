import { S3Client } from '@aws-sdk/client-s3';
import { Global, Module } from '@nestjs/common';

export const S3_CLIENT = 'S3_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: S3_CLIENT,
      useFactory() {
        const s3 = new S3Client({
          region: process.env.AWS_REGION as string,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_ID as string,
            secretAccessKey: process.env.AWS_ACCESS_SECRET as string,
          },
        });

        return s3;
      },
    },
  ],
  exports: [S3_CLIENT],
})
export class S3Module {}
