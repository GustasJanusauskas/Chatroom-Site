'use strict';

const routes = require('./controllers/routes');
const PGClient = require('pg');
const express = require("express");

const PORT = process.env.PORT || 3001;

//Enables extra debug messages
const VERBOSE_DEBUG = false;

//DB Config
const dbclient = new PGClient({
  user: 'postgres',
  host: 'localhost',
  database: 'socialsitedb',
  password: 'root',
  port: 5432
}); dbclient.connect();


//Max size per single request
const app = express();
app.use(express.json({limit: '16mb'}));

//Static File hosting
app.use(express.static(path.join(__dirname,'..',String.raw`chatroomsite_frontend\dist\chatroomsite_frontend`)));

//Routing
app.get('/', routes.getroot);

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});