var express = require("express");
var router = express.Router();

const { domValidation, parseHTML2JSON, parseCSS2JSON } = require("../lib/validator");

router.get("/", function (req, res, next) {
  res.json({ version: "1.0.0", name: "html-validator" });
});

router.post("/", (req, res) => {
  const {
    body: { htmlContent, cssContent, htmlStructure, cssStructure },
  } = req;

  let htmlBuffer = Buffer.from(htmlContent, "base64");
  let cssBuffer = Buffer.from(cssContent, "base64");

  const result = domValidation(htmlBuffer, cssBuffer, htmlStructure, cssStructure);
  res.json(result);
});

router.post("/parseHTML2JSON", (req, res) => {
  const {
    body: { htmlContent },
  } = req;
  const htmlBuffer = Buffer.from(htmlContent, "base64");
  const result = parseHTML2JSON(htmlBuffer);
  res.json(result);
});

router.post("/parseCSS2JSON", (req, res) => {
  const {
    body: { contentCSS },
  } = req;
  const cssText = Buffer.from(contentCSS, "base64");
  const result = parseCSS2JSON(cssText);
  res.json(result);
});

module.exports = router;
