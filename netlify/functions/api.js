const serverless = require("serverless-http");
const connectDB = require("../../config/connectDB");
const app = require("../../app");

let dbReady;
let handler;

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  if (!dbReady) {
    dbReady = connectDB();
  }
  await dbReady;

  if (!handler) {
    handler = serverless(app, {
      binary: ["image/*", "multipart/form-data"],
    });
  }

  return handler(event, context);
};
