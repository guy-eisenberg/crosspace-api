import express from "express";
import session from "express-session";
import { type Socket } from "socket.io";

export interface SessionSocket extends Socket {
  request: express.Request & {
    session: session.Session & Partial<session.SessionData>;
  };
}
