const html2json = require("html2json").html2json;
const _ = require("lodash");
const css2json = require("css2json");
const jp = require("jsonpath");

const domValidation = (contentHTML, contentCSS, htmlExpectedStructure, cssExpectedStructure) => {
  let isHtmlValid = true;
  let htmlInputStructure = "";
  let differencesHTML = [];

  let isCSSValid = true;
  let cssInputStructure = "";
  let differencesCSS = [];

  htmlInputStructure = parseHTML2JSON(contentHTML);
  isHtmlValid = _.isEqual(htmlInputStructure, htmlExpectedStructure);

  if (!isHtmlValid) {
    compareJson(htmlInputStructure, htmlExpectedStructure, differencesHTML);
  }

  if (contentCSS.toString() !== "") {
    cssInputStructure = parseCSS2JSON(contentCSS);
    isCSSValid = _.isEqual(cssInputStructure, cssExpectedStructure);
    differencesCSS = compareJSON4CSS(cssInputStructure, cssExpectedStructure);
  }

  let response = {
    isHtmlValid,
    htmlInputStructure,
    htmlExpectedStructure,
    differencesHTML,
    isCSSValid,
    differencesCSS,
  };

  return response;
};

function compareJson(obj1, obj2, differences) {
  compare("$.children[*].tag", "", differences);
  function compare(str, path, differences) {
    let jp1 = jp.query(obj1, str);
    let jp2 = jp.query(obj2, str);

    valid = jp2.some((r) => {
      if (!jp1.includes(r)) {
        differences.push({ message: "La respuesta no contiene el elemento", value: `${path}/${r}` });
      }
    });

    jp2.forEach((element) => {
      let s = `?(@.tag=="${element}")]`;
      let newStr = str.replace("*].tag", s) + ".children[*].tag";
      let newPath = path + "/" + element;
      compare(newStr, newPath, differences);
    });
  }
}

const parseCSS2JSON = (data) => {
  return parseStyle(data.toString());
};

function parseStyle(json) {
  return css2json(json);
}

const parseHTML2JSON = (data) => {
  return parseHTML(html2json(data.toString()));
};

const parseHTML = (json) => {
  let responseObject = {};
  if (json.node === "root") {
    responseObject.node = "root";
  }
  if (json.tag) {
    responseObject.tag = json.tag;
  }
  if (json.attr) {
    responseObject.attr = json.attr;
  }

  if (json.child) {
    let tmpArray = [];
    for (let i = 0; i < json.child.length; i++) {
      let response = parseHTML(json.child[i]);
      if (_.has(response, "tag")) {
        tmpArray.push(response);
      }
    }
    if (tmpArray.length !== 0) {
      responseObject.children = tmpArray;
    }
  }
  return responseObject;
};

function compareJSON4CSS(obj1, obj2) {
  let result = [];

  if (obj1 && obj2) {
    for (let i in obj2) {
      if (!obj1.hasOwnProperty(i) || !_.isEqual(_.sortBy(obj2[i]), _.sortBy(obj1[i]))) {
        result.push(`Error en el selector ${i}`);
      }
    }
  }
  return _.flattenDeep(result);
}

exports.domValidation = domValidation;
exports.parseHTML2JSON = parseHTML2JSON;
exports.parseCSS2JSON = parseCSS2JSON;
