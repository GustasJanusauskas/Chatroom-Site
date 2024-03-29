CREATE DATABASE chatroomdb;
\c chatroomdb;

CREATE TABLE users(
	usr_id bigserial UNIQUE NOT NULL,
	username varchar(128) UNIQUE NOT NULL,
	password varchar(256) NOT NULL,
	email varchar(256) UNIQUE NOT NULL,
	creation_date timestamptz DEFAULT NOW(),
	saved_rooms bigint[] DEFAULT '{}',
	salt varchar(16),
	pepper varchar(16),
	PRIMARY KEY(usr_id)
);

CREATE TABLE sessions(
	usr_id bigint UNIQUE NOT NULL,
	session_str varchar(128) UNIQUE,
	FOREIGN KEY (usr_id) REFERENCES users(usr_id) ON DELETE CASCADE
);

CREATE TABLE rooms(
	room_id bigserial UNIQUE NOT NULL,
	room_name varchar(128) UNIQUE NOT NULL,
	author_id bigint NOT NULL,
	creation_date timestamptz DEFAULT NOW(),
	PRIMARY KEY(room_id)
);

CREATE TABLE messages(
	msg_id bigserial UNIQUE NOT NULL,
	author_id bigint NOT NULL,
	room_id bigint NOT NULL,
	msg varchar(512) NOT NULL,
	creation_date timestamptz DEFAULT NOW(),
	PRIMARY KEY(msg_id),
	FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE
);

WITH adminid AS (
	INSERT INTO users(username,password,email,salt,pepper)
	VALUES('System','unused','System@chatroom.com','unused','unused')
	RETURNING usr_id
),
roomid AS (
	INSERT INTO rooms(room_name,author_id)
	VALUES ('General', (SELECT usr_id FROM adminid) ),
	('Feedback', (SELECT usr_id FROM adminid) ),
	('Help', (SELECT usr_id FROM adminid) )
)
INSERT INTO sessions(usr_id,session_str)
VALUES( (SELECT usr_id FROM adminid) ,NULL);