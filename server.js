'use strict';
const express = require("express");
const app = express();
const chatCat = require('./app');
const passport = require('passport');

app.set('port',process.env.PORT || 3000);
app.use(express.static('public'));
app.set('view engine','ejs');

//mount session midlleware
app.use(chatCat.session);

//mount auth midlleware, res.user is available after mounted
app.use(passport.initialize());
app.use(passport.session());

//mount morgan to log the http request
app.use(require('morgan')('combined',{
	stream: {
		write: message => {
			chatCat.logger.log('info', message);
		}
	}
}));

//mount router midlleware
app.use('/',chatCat.router);


chatCat.ioServer(app).listen(app.get('port'),()=>{
	console.log('ChatCAT Running on Port: ',app.get('port'));
})