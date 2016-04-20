'use strict';
const config = require('./config');
const redis = require('redis').createClient;
const adapter = require('socket.io-redis');

//Social Authentication invoke
require('./auth')();

//Create an Socket.io version http Server instance
// bind
let ioServer = app => {
	//{ 
	// 	room name,
	// 	roomID, //dynamiclly generate
	// 	users:{ soketid,userid,user,userPic}
	// }
	app.locals.chatrooms = [];//store in memery by default
	
	//binding socket.io to express app
	const server = require('http').Server(app);
	const io = require('socket.io')(server);
	
	//only websocket support session affinity
	io.set('transports', ['websocket']);
	
	//force Socket.io send and recieve buffer from Redis
	//use to sending or publishing data buffers to redis
	let pubClient = redis(config.redis.port, config.redis.host, {
		auth_pass: config.redis.password
	});
	//use to get data back from redis
	let subClient = redis(config.redis.port, config.redis.host, {
		return_buffers: true,//return data by original status, not stringify
		auth_pass: config.redis.password
	});
	
	//For scaling purpose, store data in redis, not in memery anymore
	//redis store everything in memery
	io.adapter(adapter({
		//two key-value pairs
		pubClient,
		subClient
	}));
	
	//bridge between session and soket.io
	// session midlleware based on the socket req will fecth the associated
	// profile of the active user from the session and provide to the socket
	io.use((socket, next) => {
		require('./session')(socket.request, {}, next);
	});
	
	//mount socket midlleware and invoke
	require('./socket')(io, app);
	return server;
}

module.exports = {
	router: require('./routes')(),
	session: require('./session'),
	ioServer,
	logger: require('./logger')
}