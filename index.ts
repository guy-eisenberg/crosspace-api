import dotenv from "dotenv";
dotenv.config();

import { RedisStore } from "connect-redis";
import cors from "cors";
import express from "express";
import session from "express-session";
import { createServer } from "http";
import { createClient } from "redis";
import { Server, type Socket } from "socket.io";
import twilio from "twilio";
import { CORS_CONFIG, PORT, SESSION_CONFIG } from "./constants";
import { deviceId } from "./middleware/deviceId";
import { SessionSocket } from "./types";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: CORS_CONFIG,
  cookie: true,
});

const redis = createClient({ url: "redis://redis:6379" });
redis
  .connect()
  .then(() => console.log("Redis client is ready."))
  .catch((err) => console.log(err));

const sessionMiddleware = session({
  ...SESSION_CONFIG,
  store: new RedisStore({ client: redis }),
});

app.use(cors(CORS_CONFIG));
app.use(sessionMiddleware);
app.use(deviceId);

io.use((socket, next) => {
  sessionMiddleware(
    socket.request as express.Request,
    {} as express.Response,
    next as express.NextFunction
  );
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Crosspace API listening on port ${PORT}.`);
});

app.get("/init", (_, res) => {
  res.send("ok");
});

app.get("/get-ice-servers", async (res, req) => {
  const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
  const token = await client.tokens.create();

  req.send(token.iceServers);
});

app.post("/portal", async (res, req) => {
  const deviceId = res.session.deviceId;
  if (!deviceId) throw new Error("Session not set!");

  const existingPortalName = await redis.get(`device-${deviceId}-portal`);
  if (existingPortalName) {
    const existingPortalStr = await redis.get(existingPortalName);

    if (existingPortalStr) {
      const existingPortal = JSON.parse(existingPortalStr) as {
        spaceId: string;
      };

      await deviceToSocket[deviceId].leave(existingPortal.spaceId);
      await redis.del(existingPortalName);
    }
  }

  const newPortal = {
    deviceId,
    spaceId: crypto.randomUUID(),
  };

  await deviceToSocket[deviceId].join(newPortal.spaceId);

  await redis.set(`portal-${newPortal.spaceId}`, JSON.stringify(newPortal));
  await redis.set(`device-${deviceId}-portal`, `portal-${newPortal.spaceId}`);

  req.send({ spaceId: newPortal.spaceId });
});

const deviceToSocket: { [id: string]: Socket } = {};

io.on("connection", async (socket) => {
  const deviceId = (socket as SessionSocket).request.session.deviceId as string;
  console.log(`New socket connection! Device ${deviceId}`);

  deviceToSocket[deviceId] = socket;

  socket.on("connection-incoming", (data) => {
    const { targetDevice, offer } = data as {
      targetDevice: string;
      offer: any;
    };

    io.to(targetDevice).emit("connection-incoming", {
      originDevice: deviceId,
      offer,
    });
  });

  socket.on("connection-accepted", (data) => {
    const { targetDevice, answer } = data as {
      targetDevice: string;
      answer: any;
    };

    io.to(targetDevice).emit("connection-accepted", {
      originDevice: deviceId,
      answer,
    });
  });

  socket.on("new-ice-candidate", (data) => {
    const { targetDevice, candidate } = data as {
      targetDevice: string;
      candidate: any;
    };

    io.to(targetDevice).emit("new-ice-candidate", {
      originDevice: deviceId,
      candidate,
    });
  });

  socket.on("file-request", async (data) => {
    const { space, id } = data as { space: string; id: string };

    const currentFilesStr = (await redis.get(`space-${space}-files`)) || "[]";
    const currentFiles = JSON.parse(currentFilesStr) as {
      id: string;
      originDevice: string;
    }[];

    const file = currentFiles.find((f) => f.id === id);

    if (file) {
      io.to(file.originDevice).emit("file-request", {
        originDevice: deviceId,
        own: file.originDevice === deviceId,
        file,
      });
    }
  });

  socket.on("file-transfer-cancel", (data) => {
    const { targetDevice, transferId } = data as {
      targetDevice: string;
      transferId: string;
    };

    io.to(targetDevice).emit("file-transfer-cancel", {
      transferId,
    });
  });

  socket.on("join-space", async (data, callback) => {
    const { spaceId } = data as { spaceId: string };

    await socket.join(spaceId);

    socket.to(spaceId).emit("new-device", {
      space: spaceId,
      device: deviceId,
    });

    socket.on("disconnect", async () => {
      console.log("Disconnect!");

      const currentFilesStr =
        (await redis.get(`space-${spaceId}-files`)) || "[]";
      const currentFiles = JSON.parse(currentFilesStr) as {
        originDevice: string;
      }[];

      const newFiles = currentFiles.filter((f) => f.originDevice !== deviceId);
      if (newFiles.length > 0)
        await redis.set(`space-${spaceId}-files`, JSON.stringify(newFiles));
      else await redis.del(`space-${spaceId}-files`);

      io.to(spaceId).emit("files-changed", {
        space: spaceId,
        files: newFiles,
      });

      io.to(spaceId).emit("device-disconnected", {
        space: spaceId,
        device: deviceId,
      });
    });

    const currentFilesStr = (await redis.get(`space-${spaceId}-files`)) || "[]";
    const currentFiles = JSON.parse(currentFilesStr) as any[];

    callback({ files: currentFiles });
  });

  socket.on("new-files", async (data, commit) => {
    const { space, files } = data as { space: string; files: any[] };

    const currentFilesStr = (await redis.get(`space-${space}-files`)) || "[]";
    const currentFiles = JSON.parse(currentFilesStr) as any[];

    const newFilesData = files.map((file) => ({
      ...file,
      originDevice: deviceId,
    }));

    const newFiles = [...currentFiles, ...newFilesData];
    await redis.set(`space-${space}-files`, JSON.stringify(newFiles));

    io.to(space).emit("files-changed", {
      space: space,
      files: newFiles,
    });

    commit();
  });

  socket.on("file-deleted", async (data, commit) => {
    const { space, id } = data as { space: string; id: string };

    const currentFilesStr = (await redis.get(`space-${space}-files`)) || "[]";
    const currentFiles = JSON.parse(currentFilesStr) as { id: string }[];

    const newFiles = currentFiles.filter((f) => f.id !== id);
    await redis.set(`space-${space}-files`, JSON.stringify(newFiles));

    io.to(space).emit("files-changed", {
      space: space,
      files: newFiles,
    });

    commit();
  });

  await socket.join(deviceId);
});
