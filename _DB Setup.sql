CREATE DATABASE chatroomdb;
\c chatroomdb;

CREATE TABLE users(
	usr_id bigserial UNIQUE NOT NULL,
	username varchar(128) UNIQUE NOT NULL,
	password varchar(256) NOT NULL,
	email varchar(256) UNIQUE NOT NULL,
	creation_date timestamptz,
	salt varchar(16),
	pepper varchar(16),
	PRIMARY KEY(usr_id)
);

CREATE TABLE sessions(
	usr_id bigint REFERENCES users(usr_id) ON DELETE CASCADE UNIQUE NOT NULL,
	session_str varchar(64) UNIQUE
);

CREATE TABLE rooms(
	room_id bigserial UNIQUE NOT NULL,
	name varchar(128) NOT NULL,
	creation_date timestamptz,
	PRIMARY KEY(room_id)
);

CREATE TABLE messages(
	msg_id bigserial UNIQUE NOT NULL,
	author_id bigint NOT NULL,
	room_id bigint REFERENCES rooms(room_id) ON DELETE CASCADE NOT NULL,
	msg varchar(512) NOT NULL,
	creation_date timestamptz,
	PRIMARY KEY(msg_id)
);