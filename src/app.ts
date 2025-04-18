import express, {Response, Request, NextFunction} from 'express';
export const app = express();
import cors from "cors";
import cookieParser from "cookie-parser";
import aiworkerRoutes from "./routes/aiworker.routes";

app.use(express.json());

// app.get('/', (req, res) => {
//   res.send('Hello World!');
// });

app.use(cookieParser());

app.use("/api/v1/aiworker", aiworkerRoutes);
