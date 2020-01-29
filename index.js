const Model = require('./models-schema');
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const fileUpload = require('express-fileupload');
const bb = require('express-busboy');
const utils = require('./utils');

require('dotenv').config();

const app = express();
const port = process.env.PORT || "8000";

const mongoose = require('mongoose');
mongoose.connect(process.env.DB_URL + '/' + process.env.DB_NAME,
  { useNewUrlParser: true, useUnifiedTopology: true });


const Grid = require('gridfs-stream');
var GridFS
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  GridFS = Grid(db.db, mongoose.mongo);
  console.log('Connected to mongodb, uri:', process.env.DB_URL + '/' + process.env.DB_NAME);
});


app.use(bodyParser.json({ limit: '160mb', extended: true }));
// app.use(bodyParser.urlencoded({ extended: true }));

// secure apps by setting various HTTP headers
app.use(helmet());

// enable CORS - Cross Origin Resource Sharing
app.use(cors());
app.use(fileUpload())

app.get("/", (req, res) => {
  res.status(200).send("Server is up");
});

app.post("/addModel", async (req, res) => {
  bb.extend(app, {
    upload: true,
  })

  const response = utils.putFile(req.files.model, req.body.name, GridFS);

  var obj = {
    "name": req.body.name,
    "project": req.body.project,
    "model": ""
  }
  const model = new Model(obj);
  try {
    await model.save()
  } catch (err) {
    console.log(err)

    res.status(500).send({ "error": err });
    return;
  }
  if (response == "Success") {
    res.status(200).send({ "data": model });
  } else {
    await Model.deleteOne({ name: req.body.name });
    res.status(500).send({ "error": "Error uploading file and saving model" });
  }
})

app.get('/getFile', async (req, res) => {
  utils.getFile(req.query.name, GridFS, res, utils.returnGetFileResponse)
})

app.get("/getModels", async (req, res) => {
  try {
    const models = await Model.find();
    res.status(200).send({ "data": models });
  } catch (err) {
    res.status(500).send({ "error": err });
  }
})

app.get("/getModelByProject", async (req, res) => {
  try {
    const models = await Model.find({ project: req.query.projectName })
    res.status(200).send({ "data": models });
  } catch (err) {
    res.status(500).send({ "error": err });
  }
})

app.put("/editModel", async (req, res) => {
  bb.extend(app, {
    upload: true,
  })
  const file = req.files.model;
  const name = req.body.name
  utils.deleteFile(req.body.name, GridFS, res, mongoose, function(res, response) {
    if (response.error)
      res.status(500).send(response);
    else {
      console.log("deleted file")
      const resp = utils.putFile(file, name, GridFS);
      if (resp == "Success")
        res.status(200).send({"data": "done"});
      else
        res.status(500).send({"error": "error editing file"});
    }
  })
})

app.delete("/deleteModel", async (req, res) => {
  try {
    await Model.deleteOne({ name: req.query.name });
    utils.deleteFile(req.query.name, GridFS, res, mongoose, utils.returnDeleteFileResponse);
  } catch (err) {
    res.status(500).send({ "error": err });
  }
})

app.listen(port, () => {
  console.log(`Listening to requests on http://localhost:${port}`);
});