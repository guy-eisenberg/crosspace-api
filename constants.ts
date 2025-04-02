import { type CorsOptions } from "cors";
import { type SessionOptions } from "express-session";

export const PORT = 8080;

export const CORS_CONFIG: CorsOptions = {
  origin: [process.env.SITE_URL as string],
  methods: ["GET", "POST"],
  credentials: true,
};

export const SESSION_CONFIG: SessionOptions = {
  secret: "my-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
  },
};
