'use strict';

const express = require("express");
const path = require('path');
const crypto = require('crypto');
const { appendFile } = require("fs");

module.exports = {
    getroot: function (req,res) {
        res.sendFile(path.join(__dirname,'..',String.raw`chatroomsite_frontend\dist\chatroomsite_frontend\index.html`));
    },
    //DB TODO: in the event of user deleting their account, when retrieving that user's messages display user as 'Deleted user'

    //INSERT INTO users(username,password,email,creation_date) VALUES ('test','pass','test@mail.com',NOW());
    //INSERT INTO sessions(usr_id,session_str) VALUES (1,'aaaabbbb');
    register: function(req,res) {
        var verifyResult;

        //Verify data
        verifyResult = verifyString(req.email,{mustBeEmail: true});
        if (verifyResult != '') {
            res.json({error:verifyResult});
            return;
        }

        verifyResult = verifyString(req.username,{checkReservedNameList: true, maxLength: 128});
        if (verifyResult != '') {
            res.json({error:verifyResult});
            return;
        }

        verifyResult = verifyString(req.password);
        if (verifyResult != '') {
            res.json({error:verifyResult});
            return;
        }

        //Generate password hash
        var salt = RandomString(16);
        var pepper = RandomString(16);
        var finalPass = crypto.createHash('BLAKE2b512').update(salt + req.password + pepper).digest('hex');
        
        //Create user row
        var db = req.app.get('db');
        var query = 'INSERT INTO users(username,password,email,created,salt,pepper) VALUES($1,$2,$3,NOW(),$4,$5) RETURNING usr_id, username;';
        var data = [req.username,finalPass,req.email,salt,pepper];
      
        var DBErr = false;
        db.query(query,data, (err, res) => {
          if (err) {
              res.json({error:'An account already exists with that username/email.'});
              console.log('DB ERROR RegUser: \n' + err);
              return;
          }
      
          //Create session for user, session string empty until login
          var innerData = [res.rows[0].usr_id];
          var innerQuery = 'INSERT INTO sessions(usr_id,sessionID) VALUES($1,NULL);';
      
          db.query(innerQuery,innerData, (err, res) => {
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
    }, //TODO: finish login
    login: function(req,res) {

    }
};

const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
function verifyString(input,options = {mustBeEmail: false,checkReservedNameList: false,minLength: 8, maxLength: 256}) {
    if (input.length < options.minLength) return `Input too short. Must be atleast ${minLength} characters long.`;
    if (input.length > options.maxLength) return `Input too long. Must be atleast ${maxLength} characters long.`;
    if (options.mustBeEmail && !emailRegex.test(input)) return `Must be a valid email adress.`;
    if (options.checkReservedNameList && ['server','host','owner','system'].indexOf(input.toLowerCase()) != -1) return `Username cannot be in the reserved word list. Try another username.`;

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