'use strict';

module.exports = {
    setUserArray: function(app,column,value,userID,add,callback) {
        var db = app.get('db');
        //Function formats SQL strings, must set column value on server to prevent SQL injection.
        var query;
        if (add) query = `UPDATE users SET ${column} = array_append(${column},$1) WHERE usr_id = $2`;
        else query = `UPDATE users SET ${column} = array_remove(${column},$1) WHERE usr_id = $2`;

        var data = [value,userID];
      
        db.query(query,data, (err, dbres) => {
            if (err) {
                console.log("DB ERROR SetUserArray: \n" + err);
                callback();
                return;
            }

            callback();
            return;
        });
    },
    getUserInfo: function(app,session,callback) {
        var db = app.get('db');
        var query = 'SELECT users.usr_id, username, email, creation_date FROM sessions, users WHERE session_str = $1 AND sessions.usr_id = users.usr_id';
        var data = [session];
      
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
    },
    verifyString: function(input,options = {mustBeEmail: false,checkReservedNameList: false,minLength: 8, maxLength: 256}) {
        const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        if (input.length < options.minLength) return `Input too short. Must be atleast ${minLength} characters long.`;
        if (input.length > options.maxLength) return `Input too long. Must be atleast ${maxLength} characters long.`;
        if (options.mustBeEmail && !emailRegex.test(input)) return `Input must be a valid email adress.`;
        if (options.checkReservedNameList && ['general','feedback','help','main','server','host','owner','system'].indexOf(input.toLowerCase()) != -1) return `Input cannot be in the reserved word list. Try another name.`;

        return ``;
    },
    randomString: function(length) {
        var pool = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var result = "";
        for (var x = 0; x < length;x++) {
        result += pool.charAt(Math.random() * pool.length - 1);
        }
        return result;
    },
    verifyImageBase64: function(bufferString) {
        var result = false;
      
        //png,jpeg,bmp,gif87a,gif89a,tiff LE,tiff BE
        var allowedFormats = ['89504E470D0A1A0A','FFD8FF','424D','474946383761','474946383961','49492A00','4D4D002A'];
      
        for (var x = 0; x < allowedFormats.length; x++) {
      
          if (Buffer.from(bufferString,'base64').subarray(0,allowedFormats[x].length / 2).toString('hex').toUpperCase() == allowedFormats[x]) {
            result = true;
            break;
          }
        }
      
        return result;
    },
    toDateUniqueString: function(date) {
        return date.toISOString().replaceAll('-','').replaceAll(':','').replaceAll('.','');
    }
};