var express = require("express");
var router = express.Router();

const lti = require("../lib/lti");

router.post("/", function (req, res, next) {
  lti
    .registerCourseraActivity(req)
    .then(function (resp) {
      res.redirect(`/?type=${resp.type}&exercise=${resp.exercise}`);
      next();
    })
    .catch(next);
});

module.exports = router;
