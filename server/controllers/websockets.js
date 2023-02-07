'use strict';

const helpers = require('./helperfunctions');

//Extra debug info at runtime
const VERBOSE_DEBUG = true;

module.exports = {
    websocketSetup: function(app) {
      var server = app.get('ws');

      server.on('connection', (ws,req) => {
        var connip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        if (VERBOSE_DEBUG) console.log(`User ${connip} opened ws connection.`);

        ws.on('message', function(message) {
          var jsonMessage = JSON.parse(message);
          if (VERBOSE_DEBUG) console.log(`Received ${jsonMessage.type} from ${connip}.`);
      
          //Disconnect
          if (jsonMessage.type == 'disconnect') {
            if (VERBOSE_DEBUG) console.log(`User ${connip} disconnected from ws.`);
            //unused
          }
          //Room Switch
          else if (jsonMessage.type == 'roomswitch') {
            if (VERBOSE_DEBUG) console.log(`User ${connip} switched to room ${jsonMessage.room}`);

            ws.room = jsonMessage.room;
          }
          //Message
          else if (jsonMessage.type == 'message') {
            //Get sender's info, this will be used in the message
            helpers.getUserInfo(app,jsonMessage.session, senderinfo => {
              if (!senderinfo) return; //no user found/not logged in

              //Save message to psql DB (message history)
              saveMessage(app,jsonMessage.body,senderinfo.id,ws.room);

              //Find other users in the same room as sender
              server.clients.forEach(user => {
                if (user.room === ws.room) {
                  //user.socket.send(JSON.stringify({author:senderinfo.username,body:jsonMessage.body,date:new Date()}));
                  user.send(JSON.stringify({author:senderinfo.username,body:jsonMessage.body,date:new Date()}));
                }
              });
            });
          }
        });
        ws.on('close', function() {
            if (VERBOSE_DEBUG) console.log(`User ${connip} closed ws connection.`);
        });
      });
    }
};

function saveMessage(app,msgbody,authorID,room) {
  var db = app.get('db');
  var query = 'INSERT INTO messages(msg, author_id, room_id) VALUES ($1,$2,$3);';
  var data = [msgbody,authorID,room];

  db.query(query,data, (err, dbres) => {
    if (err) {
        console.log("DB ERROR SaveMessage: \n" + err);
        return;
    }
  });
}