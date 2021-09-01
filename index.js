require("dotenv").config();
const express = require("express");
const http = require("http");
//const bodyParser = require("body-parser");
const morgan = require("morgan");
const app = express();
const mongoose = require("mongoose");

require("./models/user");
const router = require("./router");

mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   useCreateIndex: true,
//   useFindAndModify: false,
});

// App Setup
app.use(morgan("tiny"));
//app.use(bodyParser.json({ type: "*/*" })); //deprecated
app.use(express.json());
router(app);

if (["production"].includes(process.env.NODE_ENV)) {
  app.use(express.static("client/build"));

  const path = require("path");
  app.get("*", (req, res) => {
    res.sendFile(path.resolve("client", "build", "index.html"));
  });
}

// Server Setup
const port = process.env.PORT || 5000;
const server = http.createServer(app);
server.listen(port);
console.log("Server is Listening on: ", port);
