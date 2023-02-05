'use strict';

const helpers = require('./helperfunctions');

const path = require('path');
const crypto = require('crypto');

module.exports = {
    getroot: function (req,res) {
        res.sendFile(path.join(__dirname,'..',String.raw`chatroomsite_frontend\dist\chatroomsite_frontend\index.html`));
    },
    searchRooms: function(req,res) {
        var verifyResult;

        //Verify data
        verifyResult = helpers.verifyString(req.body.name,{minLength: 3, maxLength: 128});
        if (verifyResult != '') {
            res.json({error:verifyResult});
            return;
        }

        //Prepare search term
        var search = req.body.name.replace('%','');
        search += '%';

        var db = req.app.get('db');
        var query = 'SELECT room_id, room_name, users.username FROM rooms, users WHERE rooms.room_name LIKE $1 AND rooms.author_id = users.usr_id LIMIT 30;';
        var data = [search];
      
        db.query(query,data, (err, dbres) => {
            if (err) {
                console.log("DB ERROR SearchRooms: \n" + err);
                res.json({error:'Database error, please try again.'});
                return;
            }

            const result = [];
            for (let index = 0; index < dbres.rows.length; index++) {
                result.push({
                    id:dbres.rows[index].room_id,
                    name: dbres.rows[index].room_name,
                    author: dbres.rows[index].username,
                });
            }

            res.json(result);
        });
    },
    getRoomInfo: function(req,res) {
        var db = req.app.get('db');
        var query = 'SELECT msg_id, username, msg, messages.creation_date FROM messages, users WHERE room_id = $1 AND users.usr_id = messages.author_id ORDER BY creation_date;';
        var data = [req.body.id];

        db.query(query,data, (err, dbres) => {
            if (err) {
                console.log("DB ERROR SearchRooms: \n" + err);
                res.json({error:'Database error, please try again.'});
                return;
            }

            const result = [];
            for (let index = 0; index < dbres.rows.length; index++) {
                result.push({
                    id:dbres.rows[index].msg_id,
                    author: dbres.rows[index].username,
                    body: dbres.rows[index].msg,
                    date: dbres.rows[index].creation_date
                });
            }

            res.json(result);
        });
    },
    createRoom: function(req,res) {
        var verifyResult;

        //Verify data
        verifyResult = helpers.verifyString(req.body.name,{minLength: 3, maxLength: 128, checkReservedNameList:true});
        if (verifyResult != '') {
            res.json({error:verifyResult});
            return;
        }

        helpers.getUserInfo(req.app,req.body.session, user => {
            if (!user) {
                res.json({error:'User not found, try logging in again.'});
                return;
            }

            //Create user row
            var db = req.app.get('db');
            var query = 'INSERT INTO rooms(room_name,author_id) VALUES($1,$2) RETURNING room_id;';
            var data = [req.body.name,user.id];
        
            db.query(query,data, (err, dbres) => {
                if (err) {
                    res.json({error:'A room already exists with that name.'});
                    console.log('DB ERROR CreateRoom: \n' + err);
                    return;
                }

                res.json({
                    id:dbres.rows[0].room_id
                });
            });
        });
    },
    register: function(req,res) {
        var verifyResult;

        //Verify data
        verifyResult = helpers.verifyString(req.body.email,{mustBeEmail: true});
        if (verifyResult != '') {
            res.json({error:verifyResult});
            return;
        }

        verifyResult = helpers.verifyString(req.body.username,{checkReservedNameList: true, maxLength: 128});
        if (verifyResult != '') {
            res.json({error:verifyResult});
            return;
        }

        verifyResult = helpers.verifyString(req.body.password);
        if (verifyResult != '') {
            res.json({error:verifyResult});
            return;
        }

        //Generate password hash
        var salt = helpers.RandomString(16);
        var pepper = helpers.RandomString(16);
        var finalPass = crypto.createHash('BLAKE2b512').update(salt + req.body.password + pepper).digest('hex');
        
        //Create user row
        var db = req.app.get('db');
        var query = 'INSERT INTO users(username,password,email,salt,pepper) VALUES($1,$2,$3,$4,$5) RETURNING usr_id;';
        var data = [req.body.username,finalPass,req.body.email,salt,pepper];
    
        var DBErr = false;
        db.query(query,data, (err, dbres) => {
          if (err) {
              res.json({error:'An account already exists with that username/email.'});
              console.log('DB ERROR RegUser: \n' + err);
              return;
          }
      
          //Create session for user, session string empty until login
          var innerData = [dbres.rows[0].usr_id];
          var innerQuery = 'INSERT INTO sessions(usr_id,session_str) VALUES($1,NULL);';
      
          db.query(innerQuery,innerData, (err, dbres) => {
            if (err) {
                console.log("DB ERROR RegSession: \n" + err);
                DBErr = true;
                return;
            }
            return;
          });
      
          //Check for unhandled DB errors.
          if (DBErr) {
            res.json({error:'Database error. Please try again.'});
            return;
          }
          else res.json({error:''});
        });
    },
    login: function(req,res) {
        var verifyResult;

        //Verify data
        verifyResult = helpers.verifyString(req.body.username,{checkReservedNameList: true, maxLength: 128});
        if (verifyResult != '') {
            res.json({error:verifyResult});
            return;
        }

        verifyResult = helpers.verifyString(req.body.password);
        if (verifyResult != '') {
            res.json({error:verifyResult});
            return;
        }

        var db = req.app.get('db');
        var query = 'SELECT * FROM users WHERE username = $1';
        var data = [req.body.username];
      
        db.query(query,data, (err, dbres) => {
            if (err || dbres.rows.length === 0) {
                if (err) console.log("DB ERROR Login: \n" + err);

                res.json({error:'No account with that username exists.'});
                return;
            }
      
            //Hash password
            var salt = dbres.rows[0].salt;
            var pepper = dbres.rows[0].pepper;
            var finalPass = crypto.createHash('BLAKE2b512').update(salt + req.body.password + pepper).digest('hex');

            //Check if password matches DB..
            if (finalPass === dbres.rows[0].password) {
                //Generate and update session string
                var session = helpers.RandomString(128);
                var innerData = [session,dbres.rows[0].usr_id];
                var innerQuery = 'UPDATE sessions SET session_str = $1 WHERE usr_id = $2;';

                db.query(innerQuery,innerData, (err, dbres) => {
                    if (err) {
                        console.log("DB ERROR UpdateSession: \n" + err);
                        res.json({error:'Database error, please try again.'});
                        return;
                    }

                    //Succesful login
                    console.log("User " + req.body.username + " started new session.");
                    res.json({session:session});
                });
            }
            else {
                res.json({error:'Incorrect password.'});
            }
        });
    }
};