'use strict';

module.exports = {
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
    RandomString: function(length) {
        var pool = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var result = "";
        for (var x = 0; x < length;x++) {
        result += pool.charAt(Math.random() * pool.length - 1);
        }
        return result;
    }
};