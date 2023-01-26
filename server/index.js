'use strict';

const routes = require('./controllers/routes');
const PGClient = require('pg').Client;
const express = require('express');
const path = require('path');

const PORT = process.env.PORT || 3001;

//Enables extra debug messages
const VERBOSE_DEBUG = false;

//DB Config
const dbclient = new PGClient({
  user: process.env.USER || 'postgres',
  host: process.env.HOST || 'localhost',
  database: process.env.DATABASE || 'chatroomdb',
  password: process.env.PASSWORD || 'root',
  port: process.env.DB_PORT || 5432
}); dbclient.connect();

//Max size per single request
const app = express();
app.use(express.json({limit: '16mb'}));
app.set('db',dbclient); //Set DB connection as a global var

//Static File hosting
app.use(express.static(path.join(__dirname,'..',String.raw`chatroomsite_frontend\dist\chatroomsite_frontend`)));

//Routing
app.get('/', routes.getroot);
app.post('/register',routes.register);
app.post('/login',routes.login);
app.post('/searchrooms',routes.searchRooms);
app.post('/getroominfo',routes.getRoomInfo);
app.post('/createroom',routes.createRoom);

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});