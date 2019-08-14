var express = require("express");
var router = express.Router();

//↑モジュール呼び出してる

router.get("/", function(req, res, next) {
  res.send("hello world");
});

module.exports = router;
