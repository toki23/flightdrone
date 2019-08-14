var express = require("express");
var fs = require("fs");
var ftp = require("ftp");
var wifi = require("node-wifi");
var bebop = require("node-bebop");
var router = express.Router();
var drone = bebop.createClient();
const c = new ftp();
var bebopName = "Bebop2-043314";
var conectedFlag = 0;

router.get("/:number", async function(req, res, next) {
    wifi.init({
        iface:null
    });

    wifi.scan(function(err, networks) {
        console.log("start: wifi.scan");
        if (err) {
            console.log(err);
        } else {
            for (var i = 0; i < Object.keys(networks).length; i++) {
                if (networks[i].ssid == bebopName) {
                    console.log("bebop2 there");
                    res.send("1");
                    conectedFlag = 1;
                    break;
                }
            }
        }

        if(conectedFlag == 1){

            wifi.getCurrentConnections(function(err, currentConnections) {
                console.log("start: wifi.getCurrentConnections");
                if (err) {
                    console.log(err);
                }
                if(currentConnections.ssid !=  bebopName){
                    console.log("not already connected");
                    wifi.connect({ ssid: bebopName, password: "" },function(err) {
                        console.log("start: wifi.connect");
                        if (err) {
                            console.log(err);
                        }
                        console.log("Connected");
                    });
                }
                setTimeout(()=>{
                    console.log("start: setTimeout");
                    c.connect({
                        host: "192.168.42.1",
                        port: 21,
                        user: "anonymous",
                        password: ""
                    });

                    c.on("ready", function() {
                        console.log("start: c.on(ready)")
                        console.log("ok");
                       // await makeMavlink(1,2,3);
                        c.put(
                        "./routes/flightPlan.mavlink",
                        "internal_000/flightplans/flightPlan.mavlink",
                        function(err) {
                            console.log("start: c.put");
                            if (err) throw err;
                            console.log("putfinish");
                            c.end();
                            setTimeout(function(){
                                console.log("start: setTimeout");
                                drone.connect(function() {
                                    console.log("start: drone.connect");
                                    drone.on("ready",function(data){
                                        console.log("drone: ready");
                                        drone.Mavlink.start(
                                            "/data/ftp/internal_000/flightplans/flightPlan.mavlink",
                                            0
                                        );
                                        drone.on("BatteryStateChanged",data =>{
                                            console.log(data);
                                        });
                                    });
                                });
                            },5000);
                        });
                    });
                },5000);
            });
        }else{
            res.send("0");
        }
    });
});

module.exports = router;

// function makeMavlink(lat,long,alt){
//     return new Promise((resolve,reject) =>{
//         fs.writeFile("./routes/flightPlan.mavlink",(err)=>{
//             if(err)console.log(err);

//         });


//     });
// }
