const express = require("express");
const http = require("http");
//const bodyParser = require("body-parser");
const morgan = require("morgan");
const app = express();
const mongoose = require("mongoose");

require("./models/user");
const router = require("./router");

mongoose.connect(
  "mongodb+srv://jamg:jamuel26@jamg-cluster-ccgrf.gcp.mongodb.net/auth?retryWrites=true&w=majority",
  { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }
);

// App Setup
app.use(morgan("tiny"));
//app.use(bodyParser.json({ type: "*/*" })); //deprecated
app.use(express.json());
router(app);

// Server Setup
const port = process.env.PORT || 5000;
const server = http.createServer(app);
server.listen(port);
console.log("Server is Listening on: ", port);
