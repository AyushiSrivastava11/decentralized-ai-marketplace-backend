import express, { Response, Request, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import aiworkerRoutes from "./routes/aiworker.routes";
import adminRoutes from "./routes/admin.routes";
import authRoutes from "./auth/auth.routes";
import userRoutes from "./routes/user.route";
import paymentRoutes from "./routes/payment.routes"
import { authenticate, authorize } from "./auth/auth.middleware";
import path from "path";

export const app = express();

app.use(express.json());
const FRONT_PORT = process.env.FRONT_PORT || 5173;

// app.get('/', (req, res) => {
//   res.send('Hello World!');
// });

app.use(cookieParser());

app.use(cors({
  origin: "http://localhost:" + FRONT_PORT,
  credentials: true,
}));

app.use("/api/v1/aiworker", aiworkerRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/invoices", express.static(path.join(__dirname, "invoices")));

app.get("/admin", authenticate, authorize(["ADMIN"]), (req, res) => {
  res.send("Hello admin!");
});
