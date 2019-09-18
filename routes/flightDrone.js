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

router.get("/:lat/:long", async function(req, res, next) {
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
                        drone.connect(async function() {
                            const HomeGPS = await getHomeGPS();
                            await makeMavlink(req.params.lat,req.params.long,HomeGPS.latitude,HomeGPS.longitude);
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
                                },5000);
                            });
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

function makeMavlink(lat,long,homelat,homelong){
    return new Promise((resolve,reject) =>{
        var fs = require('fs');
        var Homelatitude = homelat;
        var Homelongitude = homelong;
        var Homealtitude = 30;
        var Goallatitude = lat;
        var Goallongitude = long;
        var Goalaltitude = 30;
        var line1 = "QGC WPL 120\n"
        fs.writeFileSync('newfile.txt','QGC WPL 120\n0	0	3	178		0.000000	6.000000	-1.000000	0.000000	0.000000	0.000000	0.000000	1\n1	0	3	16		0.000000	5.000000	0.000000	0.000000	'+Homelatitude+'	'+Homelongitude+'	'+Homealtitude+'	1\n2	0	3	16		0.000000	5.000000	0.000000	0.000000	'+Goallatitude+'	'+Goallongitude+'	'+Goalaltitude+'	1\n3	0	3	2500		0.000000	30.000000	2073600.00	0.000000	0.000000	0.000000	0.000000	1\n4	0	3	18		0.000000	2.000000	0.000000	5.000000	'+Goallatitude+'	'+Goallongitude+'	'+Goalaltitude+'	1\n5	0	3	2501		0.000000	0.000000	0.000000	0.000000	0.000000	0.000000	0.000000	1\n6	0	3	16		0.000000	5.000000	0.000000	0.000000	'+Homelatitude+'	'+Homelongitude+'	'+Homealtitude+'	1\n' ,function(err){
            //新規作成、上書き
        });
        fs.readFile('newfile.txt','utf8',function(err,data){
            console.log(data);
            //ログ出し
        });

    });
}

function getHomeGPS(){
    return new Promise((resolve,reject)=>{
        drone.on("PositionChanged",(data)=>{
            if(data.latitude != 500){
                resolve(data);
            }
        });
    });
}