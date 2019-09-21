var express = require("express");
var router = express.Router();
var wifi = require("node-wifi");
var conectedFlag = 0;
var ftp = require("ftp");
var c = new ftp();
var fs = require("fs");
var archiver = require("archiver");
var droneName = "Bebop2-043314";
//ドローンの動画を取得する処理
router.get("/", (req, res, next) => {
  wifi.init({
    iface: null
  });
  wifi.scan(function(err, networks) {
    console.log("start: wifi.scan");
    if (err) {
      console.log(err);
    } else {
      for (var i = 0; i < Object.keys(networks).length; i++) {
        if (networks[i].ssid == droneName) {
          //    res.send("1");
          conectedFlag = 1;
          break;
        }
      }
    }
    if (conectedFlag == 1) {
      wifi.connect({ ssid: droneName, password: "" }, () => {
        console.log("start:wifi.connect");
        setTimeout(() => {
          console.log("start: setTimeout");
          c.connect({
            host: "192.168.42.1",
            port: 21,
            user: "anonymous",
            password: ""
          });
          c.cwd("internal_000/Bebop_2/media", function(err, currentDir) {
            console.log("start : c.cwd");
            c.list(function(err, list) {
              if (err) throw err;
              c.get(getFile(0, list), function(err, stream) {
                console.log("start: c.get");
                if (err) throw err;
                stream.once("close", function() {
                  c.end();
                });
                var ev = stream.pipe(fs.createWriteStream("./movie.mp4"));
                ev.on("finish", function() {
                  console.log("movie is created");
                  var output = fs.createWriteStream("./dronemovie.zip");
                  var archive = archiver("zip", {
                    zlib: { level: 9 } // Sets the compression level.
                  });
                  output.on("close", () => {
                    console.log(archive.pointer() + " total bytes");
                    console.log(
                      "archiver has been finalized and the output file descriptor has closed."
                    );
                    res.download("./dronemovie.zip", "dronemovie.zip", err => {
                      if (err) {
                        console.log(err.stack);
                      } else {
                        console.log("Downloading done.");
                      }
                    });
                  });
                  output.on("end", () => {
                    console.log("Data has been drained");
                  });
                  archive.on("warning", err => {
                    throw err;
                  });
                  archive.on("error", err => {
                    throw err;
                  });
                  archive.pipe(output);

                  var file1 = "./movie.mp4";
                  archive.append(fs.createReadStream(file1), {
                    name: "file1.mp4"
                  });
                  archive.finalize();
                });
              });
            });
          });
        }, 5000);
      });
    } else {
      res.send("0");
    }
  });
});
module.exports = router;

function getFile(i, H) {
  H.sort(compare);
  return H[i].name;
}
function compare(a, b) {
  var r = 0;
  if (a.date < b.date) {
    r = 1;
  } else if (a.date > b.date) {
    r = -1;
  }
  return r;
}
