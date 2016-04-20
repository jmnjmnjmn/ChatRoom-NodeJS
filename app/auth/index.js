'use strict';
const passport = require('passport');
const config = require('../config');
const h = require('../helpers');
const logger = require('../logger');
const FacebookStrategy = require('passport-facebook').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;


module.exports = () => {
	//connect to Express-session
	//done(): invoke when authorization process ends, this id is unique id mongodb assign to each collection
	passport.serializeUser((user, done)=>{
		done(null, user.id);
	});
	
	//fetch user from mongodb
	//after mount this passport, req.user is available.
	passport.deserializeUser((id, done) =>{
		//Find the user using the _id
		h.findById(id)
			.then(user => done(null, user))
			.catch(error => logger.log('error','Error when deserializing the user: ' + error));
	});

	let authProcessor = (accessToken, refreshToken, profile, done) => {
		// Find a user in the local db using profile.id
		// If the user is found, return the user data using the done()
		// If not found, create one inthe local db and return 
		h.findOne(profile.id)
			.then(result => {
				if(result) {
					done(null, result);//result: user obj back from mongodb
				} else {
					// Create a new user and return
					h.createNewUser(profile)
						.then(newChatUser => done(null, newChatUser))
						.catch(error => logger.log('error','Create New User Error: ' + error));
				}
			});

	}
	passport.use(new FacebookStrategy(config.fb, authProcessor));
	passport.use(new TwitterStrategy(config.twitter, authProcessor));
}