import { type NextFunction, type Request, type Response } from 'express';

export function deviceIdMiddleware(
  req: Request,
  _: Response,
  next: NextFunction,
) {
  let deviceId = (req.session as unknown as { deviceId: string | undefined })
    .deviceId;

  if (!deviceId) {
    deviceId = crypto.randomUUID();
    (req.session as any as { deviceId: string | undefined }).deviceId =
      deviceId;
  }

  if (req.path) console.log(`${deviceId} --> ${req.path}`);

  next();
}
