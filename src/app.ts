import express, { Response, Request, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import aiworkerRoutes from "./routes/aiworker.routes";
import authRoutes from "./auth/auth.routes";
import { authenticate, authorize } from "./auth/auth.middleware";

export const app = express();

app.use(express.json());

// app.get('/', (req, res) => {
//   res.send('Hello World!');
// });

app.use(cookieParser());

app.use("/api/v1/aiworker", aiworkerRoutes);
app.use("/api/v1/auth", authRoutes);

app.get("/admin", authenticate, authorize(["ADMIN"]), (req, res) => {
  res.send("Hello admin!");
});
