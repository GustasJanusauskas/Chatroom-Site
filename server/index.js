'use strict';

const routes = require('./controllers/routes');
const PGClient = require('pg');
const express = require("express");

const PORT = process.env.PORT || 3001;

//Enables extra debug messages
const VERBOSE_DEBUG = false;

//DB Config
const dbclient = new PGClient({
  user: process.env.USER || 'postgres',
  host: process.env.HOST || 'localhost',
  database: process.env.DATABASE || 'chatroomsitedb',
  password: process.env.PASSWORD || 'root',
  port: process.env.DB_PORT || 5432
}); dbclient.connect();
//Set DB connection as a global var
app.set('db',dbclient);


//Max size per single request
const app = express();
app.use(express.json({limit: '16mb'}));

//Static File hosting
app.use(express.static(path.join(__dirname,'..',String.raw`chatroomsite_frontend\dist\chatroomsite_frontend`)));

//Routing
app.get('/', routes.getroot);
app.post('/register',routes.register);
app.post('/login',routes.login);

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});