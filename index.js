// Imports
const express = require("express");
const app = express();
const handlebars = require("express-handlebars");
const fs = require("fs");
const xmlbuilder = require("xmlbuilder");
const path = require("path");

// Constants
const PICTURES_DIR = "./pictures/";
const NOT_EVALUATED_DIR = PICTURES_DIR + "notEvaluated/";
const ACCEPTED_DIR = PICTURES_DIR + "accepted/";
const REJECTED_DIR = PICTURES_DIR + "rejected/";
const XML_IMG_PATH =
  "D:\\dev\\ai\\TFODCourse\\Tensorflow\\workspace\\images\\collectedimages\\";

// Static files
app.use("/pictures", express.static("pictures"));
app.use("/model", express.static("model"));
app.use(express.json());

// View engine
app.engine("handlebars", handlebars());
app.set("view engine", "handlebars");

// Default route
app.get("/", (req, res) => {
  const images = fs.readdirSync("./pictures/notEvaluated");

  res.render("index", {
    imageArray: encodeURIComponent(JSON.stringify(images)),
  });
});

// Base folder structure
if (!fs.existsSync("./pictures")) {
  fs.mkdirSync("pictures");
  console.log(
    "Pictures folders created. Place images into pictures/notEvaluated to get started!"
  );
}

if (!fs.existsSync("./pictures/notEvaluated")) {
  fs.mkdirSync("pictures/notEvaluated");
}

if (!fs.existsSync("./pictures/accepted")) {
  fs.mkdirSync("pictures/accepted");
}

if (!fs.existsSync("./pictures/rejected")) {
  fs.mkdirSync("pictures/rejected");
}

if (!fs.existsSync("./model")) {
  fs.mkdirSync("model");
}

// Accept route
app.post("/accept", (req, res) => {
  if (
    req.body?.filename &&
    fs.existsSync(NOT_EVALUATED_DIR + req.body.filename)
  ) {
    fs.renameSync(
      NOT_EVALUATED_DIR + req.body.filename,
      ACCEPTED_DIR + req.body.filename
    );

    const xml = generateXml(
      req.body.label,
      XML_IMG_PATH,
      req.body.filename,
      req.body.xmin,
      req.body.ymin,
      req.body.xmax,
      req.body.ymax
    );

    const basename = path.parse(req.body.filename).name;
    fs.writeFileSync(ACCEPTED_DIR + basename + ".xml", xml);
  }
});

// Reject route
app.post("/reject", (req, res) => {
  if (req.body?.image && fs.existsSync(NOT_EVALUATED_DIR + req.body.image)) {
    fs.renameSync(
      NOT_EVALUATED_DIR + req.body.image,
      REJECTED_DIR + req.body.image
    );
  }
});

// App launch
app.listen(80, () => {
  console.log("AutoLabeling is up and running!");
});

// XML util
const generateXml = (label, filePath, filename, xmin, ymin, xmax, ymax) => {
  const xmlObject = {
    annotation: {
      folder: label.toLowerCase(),
      filename,
      path: `${filePath}${label.toLowerCase()}\\${filename}`,
      source: {
        database: "Unknown",
      },
      size: {
        width: 640,
        height: 480,
        depth: 3,
      },
      segmented: 0,
      object: {
        name: label,
        pose: "Unspecified",
        truncated: 0,
        difficult: 0,
        bndbox: {
          xmin,
          ymin,
          xmax,
          ymax,
        },
      },
    },
  };

  return xmlbuilder.create(xmlObject).end({ pretty: true });
};
