const url = new URL(window.location.href);
const type = url.searchParams.get("type");
const exercise = url.searchParams.get("exercise");
const key = url.searchParams.get("key");

initializeDivs();

function initializeDivs() {
  if (type === "1") {
    document.getElementById("formType2").hidden = true;
  }
  document.getElementById("validation-html").hidden = false;
  document.getElementById("validation-css").hidden = true;
  document.getElementById("details-html").hidden = false;
  document.getElementById("general-errors").hidden = true;
}

document.getElementById("fileForm").onchange = function (event) {
  event.preventDefault();
  if (type === "1" && document.getElementById("fileHTML").files.length > 0)
    document.getElementById("submit").disabled = false;

  if (
    type === "2" &&
    document.getElementById("fileHTML").files.length > 0 &&
    document.getElementById("fileCSS").files.length > 0
  )
    document.getElementById("submit").disabled = false;
};

document.getElementById("fileForm").onsubmit = function (event) {
  event.preventDefault();
  document.getElementById("form-container").hidden = true;
  const selectedHTMLFile = document.getElementById("fileHTML").files[0];
  const selectedCSSFile = document.getElementById("fileCSS").files[0];

  processFiles(selectedHTMLFile, selectedCSSFile);
};

function returnFileContent(htmlFile, cssFile, callback) {
  if (htmlFile) {
    returnFile(htmlFile, (dataHTML) => {
      if (cssFile) {
        returnFile(cssFile, (dataCSS) => {
          callback(dataHTML, dataCSS);
        });
      } else {
        callback(dataHTML, "");
      }
    });
  } else {
    callback("", "");
  }
}

function processFiles(selectedHTMLFile, selectedCSSFile) {
  returnFileContent(selectedHTMLFile, selectedCSSFile, (dataHTML, dataCSS) => {
    let htmlContent = btoa(dataHTML);
    let cssContent = btoa(dataCSS);
    d3.json(`./validResponses/${exercise}.json`, (error, data) => {
      const payload = {
        htmlContent,
        htmlStructure: data.htmlStructure,
        cssContent,
        cssStructure: data.cssStructure,
        key,
      };
      fetch("http://157.253.238.65:8000", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .catch((error) => {
          document.getElementById("general-errors").hidden = false;
          document.getElementById(
            "general-errors"
          ).innerHTML = `<p>Ocurrió un error durante la validación: ${error}</p><p>Por favor póngase envie un correo a misovirtual-isw@uniandes.edu.co, 
            para que le indique los pasos a seguir. </p>`;
        })
        .then((res) => {
          renderResponse(
            res.isHtmlValid,
            res.differencesHTML,
            res.isCSSValid,
            res.differencesCSS,
            res.grade
          );
          drawTree(res.htmlInputStructure, "#source");
          drawTree(res.htmlExpectedStructure, "#target");
        });
    });
  });
}

function returnFile(file, callback) {
  var reader = new FileReader();
  reader.readAsText(file, "UTF-8");
  reader.onload = function (evt) {
    callback(evt.target.result);
  };
  reader.onerror = function (evt) {
    console.log("error reading file");
  };
}

function renderResponse(
  isHtmlValid,
  differencesHTML,
  isCSSValid,
  differencesCSS,
  grade
) {
  document.getElementById("validation-html").hidden = false;
  if (type === "2") {
    document.getElementById("validation-css").hidden = false;
  }
  if (isHtmlValid) {
    document.getElementById(
      "structureResult-html"
    ).innerHTML = `<p>La estructura del archivo html proporcionado es válida</p><p>Nota: ${grade}</p>`;
    document.getElementById("structureResult-html").className = "text-success";
  } else {
    document.getElementById("details-html").hidden = false;
    document.getElementById("errors-html").hidden = false;
    document.getElementById(
      "structureResult-html"
    ).innerHTML = `<p>La estructura del archivo html proporcionado no es válida</p><p>Nota: ${grade}</p>`;
    document.getElementById("structureResult-html").className = "text-danger";

    document.getElementById("errors-html-list").innerHTML = differencesHTML
      .map((e) => `<li>${e.message} ${e.value} </li>`)
      .join("");
  }

  if (isCSSValid) {
    document.getElementById("structureResult-css").innerHTML =
      "La estructura del archivo css proporcionado es válida";
    document.getElementById("structureResult-css").className = "text-success";
  } else {
    document.getElementById("errors-css").hidden = false;
    document.getElementById("structureResult-css").innerHTML =
      "La estructura del archivo css proporcionado no es válida";
    document.getElementById("structureResult-css").className = "text-danger";

    document.getElementById("errors-css-list").innerHTML = differencesCSS
      .map((e) => `<li>${e}</li>`)
      .join("");
  }
}

function drawTree(treeData, div) {
  /************** Generate the tree diagram	 *****************/
  var margin = { top: 20, right: 120, bottom: 20, left: 120 },
    width = 800 - margin.right - margin.left,
    height = 500 - margin.top - margin.bottom;

  var i = 0,
    duration = 750,
    root;

  var tree = d3.layout.tree().size([height, width]);

  var diagonal = d3.svg.diagonal().projection(function (d) {
    return [d.y, d.x];
  });

  var svg = d3
    .select(div)
    .append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  //root = treeData[0];
  root = treeData;
  root.x0 = height / 2;
  root.y0 = 0;

  update(root);

  d3.select(self.frameElement).style("height", "500px");

  function update(source) {
    // Compute the new tree layout.
    var nodes = tree.nodes(root).reverse(),
      links = tree.links(nodes);

    // Normalize for fixed-depth.
    nodes.forEach(function (d) {
      d.y = d.depth * 180;
    });

    // Update the nodes…
    var node = svg.selectAll("g.node").data(nodes, function (d) {
      return d.id || (d.id = ++i);
    });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", function (d) {
        return "translate(" + source.y0 + "," + source.x0 + ")";
      })
      .on("click", click);

    nodeEnter
      .append("circle")
      .attr("r", 1e-6)
      .style("fill", function (d) {
        return d._children ? "lightsteelblue" : "#fff";
      });

    nodeEnter
      .append("text")
      .attr("x", function (d) {
        return d.children || d._children ? -13 : 13;
      })
      .attr("dy", ".35em")
      .attr("text-anchor", function (d) {
        return d.children || d._children ? "end" : "start";
      })
      .text(function (d) {
        return d.tag || d.node;
      })
      .style("fill-opacity", 1e-6);

    // Transition nodes to their new position.
    var nodeUpdate = node
      .transition()
      .duration(duration)
      .attr("transform", function (d) {
        return "translate(" + d.y + "," + d.x + ")";
      });

    nodeUpdate
      .select("circle")
      .attr("r", 10)
      .style("fill", function (d) {
        return d._children ? "lightsteelblue" : "#fff";
      });

    nodeUpdate.select("text").style("fill-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node
      .exit()
      .transition()
      .duration(duration)
      .attr("transform", function (d) {
        return "translate(" + source.y + "," + source.x + ")";
      })
      .remove();

    nodeExit.select("circle").attr("r", 1e-6);

    nodeExit.select("text").style("fill-opacity", 1e-6);

    // Update the links…
    var link = svg.selectAll("path.link").data(links, function (d) {
      return d.target.id;
    });

    // Enter any new links at the parent's previous position.
    link
      .enter()
      .insert("path", "g")
      .attr("class", "link")
      .attr("d", function (d) {
        var o = { x: source.x0, y: source.y0 };
        return diagonal({ source: o, target: o });
      });

    // Transition links to their new position.
    link.transition().duration(duration).attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link
      .exit()
      .transition()
      .duration(duration)
      .attr("d", function (d) {
        var o = { x: source.x, y: source.y };
        return diagonal({ source: o, target: o });
      })
      .remove();

    // Stash the old positions for transition.
    nodes.forEach(function (d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  // Toggle children on click.
  function click(d) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    update(d);
  }
}
