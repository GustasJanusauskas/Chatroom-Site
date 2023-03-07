'use strict';

const helpers = require('./helperfunctions');

const sanitizeHtml = require('sanitize-html');
const imageThumbnail = require('image-thumbnail');
const fs = require('fs');

//Extra debug info at runtime
const VERBOSE_DEBUG = true;

module.exports = {
    websocketSetup: function(app) {
      const server = app.get('ws');

      server.on('connection', (ws,req) => {
        const connip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

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

              //Sanitize message (remove HTML tags)
              var sanitizedMessage = sanitizeHtml(jsonMessage.body, {
                allowedTags: [],
                allowedAttributes: {}
              });

              //Save message to psql DB (message history)
              saveMessage(app,sanitizedMessage,senderinfo.id,ws.room);

              //Find other users in the same room as sender
              server.clients.forEach(user => {
                if (user.room === ws.room) {
                  user.send(JSON.stringify({author:senderinfo.username,body:sanitizedMessage,date:new Date()}));
                }
              });
            });
          }
          //Image or file upload
          else if (jsonMessage.type == 'upload') {
            helpers.getUserInfo(app,jsonMessage.session, senderinfo => {
              if (!senderinfo) return; //no user found/not logged in

              saveFile(jsonMessage.body,jsonMessage.extension,senderinfo.id, (uploadpath) => {
                const msg = `uploads\\${uploadpath}`;

                //Save link to psql DB (message history)
                saveMessage(app,msg,senderinfo.id,ws.room);

                //Find other users in the same room as sender, link to newly uploaded file/image
                server.clients.forEach(user => {
                  if (user.room === ws.room) {
                    user.send(JSON.stringify({author:senderinfo.username,body:msg,date:new Date()}));
                  }
                });
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

function saveFile(filestr,fileext,authorID, callback) {
  const file = Buffer.from(filestr, 'base64');
  var filePath = `upload-${authorID}-${helpers.toDateUniqueString(new Date())}-${helpers.randomString(8)}`; //we add the extension later

  //If uploads directory doesn't exist create one
  if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

  //If image
  if (helpers.verifyImageBase64(file)) {
    //Compress image
    imageThumbnail(file,{percentage: 75,responseType:'buffer',jpegOptions:{force:true,quality:75}}).then(readyImg => {
      //Save image
      filePath += `.jpg`;
      fs.writeFile(`uploads\\${filePath}`,readyImg, () => {
        if (callback) callback(filePath);
      });
    });
  }
  //If file
  else {
    //Save file
    filePath += `.${fileext}`;
    fs.writeFile(`uploads\\${filePath}`,file, () => {
      if (callback) callback(filePath);
    });
  }
}

function saveMessage(app,msgbody,authorID,roomID) {
  const db = app.get('db');
  const query = 'INSERT INTO messages(msg, author_id, room_id) VALUES ($1,$2,$3);';
  const data = [msgbody,authorID,roomID];

  db.query(query,data, (err, dbres) => {
    if (err) {
        console.log("DB ERROR SaveMessage: \n" + err);
        return;
    }
  });
}