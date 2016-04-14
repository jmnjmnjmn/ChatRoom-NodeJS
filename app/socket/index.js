'use strict';
const h = require('../helpers');
module.exports = (io, app) => {
	let allrooms = app.locals.chatrooms;


	io.of('/roomslist').on('connection',socket => {
		socket.on('getChatrooms', ()=>{
			socket.emit('chatRoomsList', JSON.stringify(allrooms));
		});

		socket.on('createNewRoom', newRoomInput =>{
			// console.log(newRoomInput);
			//check if a room exists
			//if not, create one and broadcast
			if(!h.findRoomByName(allrooms, newRoomInput)){
				allrooms.push({
					room: newRoomInput,
					roomID: h.randomHex(),
					users:[]
				});
			
			//Emit an updated list to the creator
			socket.emit('chatRoomsList', JSON.stringify(allrooms));
			//Emit an updated list to everyone connect to the rooms page
			socket.broadcast.emit('chatRoomsList', JSON.stringify(allrooms));


			}

		});
	});

	io.of('/chatter').on('connection', socket =>{
		//Join a chatroom 
		socket.on('join', data =>{
			let usersList = h.addUserToRoom(allrooms, data, socket);

			// Update list of active users
			socket.broadcast.to(data.roomID).emit('updateUsersList', JSON.stringify(usersList.users));
			socket.emit('updateUsersList', JSON.stringify(usersList.users));
		});

		//When a socket exits
		socket.on('disconnect', () => {
			//Find a room , to which the socket is connect to and purge the user
			let room = h.removeUserFromRoom(allrooms, socket);
			socket.broadcast.to(room.roomID).emit('updateUsersList', JSON.stringify(room.users));
		});

		//when a new message arrives
		socket.on('newMessage', data=>{
			socket.to(data.roomID).emit('inMessage', JSON.stringify(data));
		});
	});

}