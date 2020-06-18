const html2json = require("html2json").html2json;
const _ = require("lodash");
const css2json = require("css2json");

const domValidation = (
  contentHTML,
  contentCSS,
  htmlExpectedStructure,
  cssExpectedStructure
) => {
  let htmlInputStructure = parseHTML2JSON(contentHTML);
  let isHtmlValid = _.isEqual(htmlInputStructure, htmlExpectedStructure);

  let differencesHTML = compareJSON(
    htmlInputStructure.children[0],
    htmlExpectedStructure.children[0]
  );

  let isCSSValid = true;
  let differencesCSS = [];

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

function compareJSON(obj1, obj2, array) {
  let result = [];
  let tags = compareTagName(obj1, obj2);
  let children = compareChildrenNumber(obj1, obj2);
  let attribs = compareAttribs(obj1, obj2);
  if (tags) result.push(tags);
  if (children) result.push(children);
  if (attribs) result.push(attribs);

  if (obj1.children && obj2.children) {
    for (let i = 0; i < obj1.children.length; i++) {
      let r = compareJSON(obj1.children[i], obj2.children[i]);
      result.push(r);
    }
  }
  return _.flattenDeep(result);
}

function compareChildrenNumber(obj1, obj2) {
  if (obj1 && obj2 && obj1.children && obj2.children) {
    if (obj1.children.length !== obj2.children.length) {
      return `Se esperaba el elemento con el tag ${obj1.tag} tuviese ${obj2.children.length} hijos pero tiene ${obj1.children.length}`;
    }
  }
}
function compareTagName(obj1, obj2) {
  if (obj1 && obj2 && obj1.tag && obj2.tag) {
    if (obj1.tag !== obj2.tag) {
      return `Se esperaba el tag ${obj2.tag} pero se obtuvo ${obj1.tag}`;
    }
  }
}

function compareAttribs(obj1, obj2) {
  let cause = "";
  if (obj1 && obj2 && obj1.attr) {
    for (let i in obj2.attr) {
      if (
        !obj1.attr.hasOwnProperty(i) ||
        !_.isEqual(_.sortBy(obj2.attr[i]), _.sortBy(obj1.attr[i]))
      ) {
        cause += `Error en el atributo ${i}: ${obj2.attr[i]} del tag ${obj2.tag}`;
      }
    }
  }
  return cause;
}

exports.domValidation = domValidation;
exports.parseHTML2JSON = parseHTML2JSON;
exports.parseCSS2JSON = parseCSS2JSON;
