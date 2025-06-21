import { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from 'express';
import { Server, type Socket } from 'socket.io';

export class SessionIoAdapter extends IoAdapter {
  private middlewares: RequestHandler[];

  constructor(app: INestApplication, middlewares: RequestHandler[]) {
    super(app);
    this.middlewares = middlewares;
  }

  createIOServer(port: number, options?: any) {
    const server: Server = super.createIOServer(port, options);

    for (const middleware of this.middlewares) {
      server.use((socket: Socket, next: NextFunction) => {
        void middleware(socket.request as Request, {} as Response, next);
      });
    }

    return server;
  }
}
