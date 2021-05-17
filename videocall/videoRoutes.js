const { db } = require("../models/roomIdSchema");
const sendMail = require("../public/jsFiles/mail");

var express = require("express"),
  router = express.Router(),
  { v4: uuidV4 } = require("uuid"),
  indexRoute = require("../routes/indexRoutes"),
  room = require("../models/roomIdSchema");

router.post("/start_call", (req, res) => {
  var roomId = uuidV4();
  var newRoom = { roomId: roomId };
  console.log(
    req.body.filename,
    req.body.email,
    "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"
  );
  room.create(newRoom, function (err, newCreated) {
    if (err) {
      console.log(err);
    } else {
      const link = "http://localhost:3000/start_call" + roomId;
      sendMail(link, req.body.email, function (err, data) {
        if (err) {
          console.log(err);
        } else {
          res.redirect(`/start_call${roomId}`);
          res.status({ message: "Email sent!!!" });
        }
      });
    }
  });
});

router.get("/start_call:room", (req, res) => {
  res.render("../videocall/video", { roomId: req.params.room });
});

router.get("/join_call", (req, res) => {
  room.find({}, function (err, allId) {
    if (err) {
      console.log(err);
    } else {
      console.log(allId);
      res.redirect("/start_call" + allId[0].roomId);
    }
  });
});

module.exports = router;
