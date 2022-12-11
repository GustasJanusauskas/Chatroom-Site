'use strict';

const express = require("express");
const path = require('path');

module.exports = {
    getroot: function (req,res) {
        res.sendFile(path.join(__dirname,'..',String.raw`chatroomsite_frontend\dist\chatroomsite_frontend\index.html`));
    },
};