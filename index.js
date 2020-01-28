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
  try {
    const readStream = GridFS.createReadStream({
      filename: req.query.name,
    }).on('error', function (err) {
      res.status(500).send({ "error": err })
    })

    const bufs = [];
    readStream.on('data', function (chunk) {
      bufs.push(chunk);
    });
    readStream.on('end', function () {
      const fbuf = Buffer.concat(bufs);
      const base64 = fbuf.toString('base64');
      res.status(200).send({ "data": base64 })
    });
  } catch (err) {
    res.status(500).send({ "error": err });
  }
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
  try {
    const model = await Model.findOneAndUpdate({ name: req.body.name }, { model: req.body.model }, { new: true });
    res.status(200).send({ "data": model });
  } catch (err) {
    res.status(500).send({ "error": err });
  }
})

app.delete("/deleteModel", async (req, res) => {
  try {
    GridFS.files.find({ filename: req.query.name }).toArray(function (err, files) {
      if (err)
        res.status(500).send({ "error": err });
      else {
        const id = files[0]._id

        GridFS.db.collection('fs.chunks').remove({ files_id: mongoose.Types.ObjectId(id) }, function (err) {
          if (err)
            res.status(500).send({ "error": err });
          else {
            GridFS.files.remove({ _id: mongoose.Types.ObjectId(id) }, async function (err) {
              if (err)
                res.status(500).send({ "error": err })
              else {
                try {
                  const model = await Model.deleteOne({ name: req.query.name });
                  res.status(200).send({ "data": model });
                  return;
                } catch (err) {
                  res.status(500).send({ "error": err })
                  return;
                }
              }
            })
          }
        })
      }
    })
  } catch (err) {
    res.status(500).send({ "error": err });
  }
})

app.listen(port, () => {
  console.log(`Listening to requests on http://localhost:${port}`);
});