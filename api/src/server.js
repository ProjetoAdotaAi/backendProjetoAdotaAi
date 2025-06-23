import dotenv from "dotenv";
dotenv.config();

import http from "node:http";
import app from "./app.js";

const error = (err) => {
  console.error(`An error has occurred on start server\n ${err.message}`);
  throw err;
};

const listening = () => {
  console.log(`Server running on port ${process.env.PORT}`);
  // console.log(`Server running on http://192.168.100.140:${process.env.PORT || 4040}`);
};

const server = http.createServer(app);
server.listen(process.env.PORT || 4040);
// server.listen(process.env.PORT || 4040, '0.0.0.0', () => {
//   console.log(`Server is listening on http://192.168.100.140:${process.env.PORT || 4040}`);
// });
server.on("error", error);
server.on("listening", listening);