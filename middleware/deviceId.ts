import { type NextFunction, type Request, type Response } from "express";

export async function deviceId(
  req: Request,
  res: Response,
  next: NextFunction
) {
  let deviceId = req.session.deviceId;

  if (!deviceId) {
    deviceId = crypto.randomUUID();
    req.session.deviceId = deviceId;
  }

  next();
}
