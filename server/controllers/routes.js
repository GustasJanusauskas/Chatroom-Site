'use strict';

const path = require('path');
const crypto = require('crypto');

module.exports = {
    getroot: function (req,res) {
        res.sendFile(path.join(__dirname,'..',String.raw`chatroomsite_frontend\dist\chatroomsite_frontend\index.html`));
    },
    searchRooms: function(req,res) {
        var verifyResult;

        //Verify data
        verifyResult = verifyString(req.body.name,{minLength: 3, maxLength: 128});
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
        verifyResult = verifyString(req.body.name,{minLength: 3, maxLength: 128, checkReservedNameList:true});
        if (verifyResult != '') {
            res.json({error:verifyResult});
            return;
        }

        getUserInfo(req, user => {
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
        verifyResult = verifyString(req.body.email,{mustBeEmail: true});
        if (verifyResult != '') {
            res.json({error:verifyResult});
            return;
        }

        verifyResult = verifyString(req.body.username,{checkReservedNameList: true, maxLength: 128});
        if (verifyResult != '') {
            res.json({error:verifyResult});
            return;
        }

        verifyResult = verifyString(req.body.password);
        if (verifyResult != '') {
            res.json({error:verifyResult});
            return;
        }

        //Generate password hash
        var salt = RandomString(16);
        var pepper = RandomString(16);
        var finalPass = crypto.createHash('BLAKE2b512').update(salt + req.body.password + pepper).digest('hex');
        
        //Create user row
        var db = req.app.get('db');
        var query = 'INSERT INTO users(username,password,email,creation_date,salt,pepper) VALUES($1,$2,$3,NOW(),$4,$5) RETURNING usr_id;';
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
        verifyResult = verifyString(req.body.username,{checkReservedNameList: true, maxLength: 128});
        if (verifyResult != '') {
            res.json({error:verifyResult});
            return;
        }

        verifyResult = verifyString(req.body.password);
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
                var session = RandomString(128);
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

function getUserInfo(req,callback) {
    var db = req.app.get('db');
    var query = 'SELECT users.usr_id, username, email, creation_date FROM sessions, users WHERE session_str = $1 AND sessions.usr_id = users.usr_id';
    var data = [req.body.session];
  
    db.query(query,data, (err, dbres) => {
        if (err || dbres.rows.length === 0) {
            if (err) console.log("DB ERROR GetUserInfo: \n" + err);
            callback();
            return;
        }

        callback({
            id: dbres.rows[0].usr_id,
            username: dbres.rows[0].username,
            email: dbres.rows[0].email,
            creation_date: dbres.rows[0].creation_date
        });
        return;
    });
}

const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
function verifyString(input,options = {mustBeEmail: false,checkReservedNameList: false,minLength: 8, maxLength: 256}) {
    if (input.length < options.minLength) return `Input too short. Must be atleast ${minLength} characters long.`;
    if (input.length > options.maxLength) return `Input too long. Must be atleast ${maxLength} characters long.`;
    if (options.mustBeEmail && !emailRegex.test(input)) return `Input must be a valid email adress.`;
    if (options.checkReservedNameList && ['general','main','server','host','owner','system'].indexOf(input.toLowerCase()) != -1) return `Input cannot be in the reserved word list. Try another name.`;

    return ``;
}

function RandomString(length) {
    var pool = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var result = "";
    for (var x = 0; x < length;x++) {
      result += pool.charAt(Math.random() * pool.length - 1);
    }
    return result;
  }