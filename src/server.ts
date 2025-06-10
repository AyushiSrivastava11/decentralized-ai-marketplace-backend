import { app } from "./app";
import http from "http";
const server = http.createServer(app);
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});