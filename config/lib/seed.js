'use strict';

var _ = require('lodash'),
	config = require('../config'),
	mongoose = require('mongoose'),
	path = require('path'),
	chalk = require('chalk'),
	crypto = require('crypto');

// global seed options object
var seedOptions = {};

var isProduction  = config.feature_hide;
var isDevelopment = !isProduction;

function removeUser (user) {
	return new Promise(function (resolve, reject) {
		var User = mongoose.model('User');
		User.find({ username: user.username }).remove(function (err) {
			if (err) {
				reject(new Error('Failed to remove local ' + user.username));
			}
			resolve();
		});
	});
}

function saveUser (user) {
	return function() {
		return new Promise(function (resolve, reject) {
			// Then save the user
			user.save(function (err, theuser) {
				if (err) {
					console.log (err);
					reject(new Error('Failed to add local ' + user.username));
				} else {
					resolve(theuser);
				}
			});
		});
	};
}

function checkUserNotExists (user) {
	return new Promise(function (resolve, reject) {
		var User = mongoose.model('User');
		User.find({ username: user.username }, function (err, users) {
			if (err) {
				reject(new Error('Failed to find local account ' + user.username));
			}

			if (users.length === 0) {
				resolve();
			} else {
				// console.log('Database Seeding:\t\t\t' + 'local account already exists: ' + user.username);
				// resolve ();
				reject(new Error('Failed due to local account already exists: ' + user.username));
			}
		});
	});
}

function reportSuccess (password) {
	return function (user) {
		return new Promise(function (resolve, reject) {
			if (seedOptions.logResults) {
				console.log(chalk.bold.red('Database Seeding:\t\t\tLocal ' + user.username + ' added with password set to ' + password));
			}
			resolve();
		});
	};
}

// save the specified user with the password provided from the resolved promise
function seedTheUser (user) {
	return function (password) {
		return new Promise(function (resolve, reject) {

			var User = mongoose.model('User');
			// set the new password
			user.password = password;

			if (user.username === seedOptions.seedAdmin.username && process.env.NODE_ENV === 'production') {
				checkUserNotExists(user)
					.then(saveUser(user))
					.then(reportSuccess(password))
					.then(function () {
						resolve();
					})
					.catch(function (err) {
						reject(err);
					});
			} else {
				// removeUser(user)
				checkUserNotExists(user)
					.then(saveUser(user))
					.then(reportSuccess(password))
					.then(function () {
						resolve();
					})
					// .catch(function (err) {
					//   // resolve();
					//   reject(err);
					// });
					;
			}
		});
	};
}

function clearTemplates () {
	var T = mongoose.model ('MessageTemplate');
	return new Promise (function (resolve, reject) {
		T.remove ({}, function () {
			resolve ();
		});
	});
}

function seedTestMessageTemplate () {
	var T = mongoose.model ('MessageTemplate');
	var saveT = function (t) {
		return new Promise (function (resolve, reject) {
			t.save (function (err) {
				resolve ();
			});
		});
	};
	return clearTemplates ().then (function () {
		return Promise.all ([
			new T ({
				messageCd            : 'add-user-to-company-request',
				messageLevel         : 'request',
				description          : 'Notify a user they have been invited to join a company' ,
				isSubscriptionType   : false,
				messageBodyTemplate  : '<p><strong>{{Inviter.name}}</strong> has invited you to join <strong>{{org.name}}</strong>.</p><p>If you accept, {{org.name}} will be able to put you forward as a team member on proposals for <i>Sprint With Us</i> opportunities.</p>',
				messageShortTemplate : '',
				messageTitleTemplate : 'You\'ve been invited to join {{org.name}}',
				emailBodyTemplate    : '<p>Hi {{user.name}}</p><br/><p><strong>{{Inviter.name}}</strong> has invited you to join <strong>{{org.name}}</strong> so they can put you forward as a team member on proposals for <i>Sprint With Us</i> opportunities.</p>',
				emailSubjectTemplate : 'You\'ve been invited to join {{org.name}}',
				modelsRequired       : ['org'],
				daysToArchive        : 7,
				linkTemplate         : '/join/org/{{org._id}}',
				actions              : [{
					actionCd      : 'decline',
					linkTitleTemplate : 'Decline',
					isDefault     : true
				},{
					actionCd      : 'accept',
					linkTitleTemplate : 'Accept'
				}]
			}),
			new T ({
				messageCd            : 'invitation-from-company',
				messageLevel         : 'request',
				description          : 'Invite a user to sign up, because they have been invited by company' ,
				isSubscriptionType   : false,
				messageBodyTemplate  : '<p><strong>{{Inviter name}}</strong> has invited you to join <strong>{{org.name}}</strong>.</p><p>If you accept, {{org.name}} will be able to put you forward as a team member on proposals for <i>Sprint With Us</i> opportunities.</p>',
				messageShortTemplate : '',
				messageTitleTemplate : 'You\'ve been invited to join {{org.name}}',
				emailBodyTemplate    : '<p>Hi there</p><br/>Company {{org.name}} is inviting you to sign up on the BCDevExchange and join <strong>{{org.name}}</strong> so they can put you forward as a team member on a proposal.</p>',
				emailSubjectTemplate : 'Sign up and join {{org.name}}',
				modelsRequired       : ['org'],
				daysToArchive        : 7,
				linkTemplate         : '/join/org/{{org._id}}',
				actions              : [{
					actionCd      : 'decline',
					linkTitleTemplate : 'Decline',
					isDefault     : true
				},{
					actionCd      : 'accept',
					linkTitleTemplate : 'Accept'
				}]
			}),
			new T ({
				messageCd            : 'opportunity-update',
				messageLevel         : 'info',
				description          : 'notify the user that there were updates to an opportunity they are watching' ,
				isSubscriptionType   : true,
				messageBodyTemplate  : '<p>Hi there</p><br/>Opportunity {{opportunity.name}} has been updated. <a href="{{ domain }}/{{opportunity.path}}">Click here to view the opportunity</a></p>',
				messageShortTemplate : '<a href="{{ opportunity.path }}">{{ opportunity.name }}</a>',
				messageTitleTemplate : 'Opportunity updated',
				emailBodyTemplate    : '<img src="https://bcdevexchange.org/modules/core/client/img/logo/new-logo-220px.png"> <br/><br/> Hi {{user.displayName}}, <br/><br/> An opportunity you followed has been updated: <h4>{{ opportunity.name }}</h4> <h4><a href="{{ domain }}/{{ opportunity.path }}">See the details</a></h4> --- <i>To stop receiving notifications about this opportunity, <a href="{{ domain }}/{{ opportunity.path }}">browse to the opportunity</a> and un-watch it</i>',
				emailSubjectTemplate : 'Opportunity {{ opportunity.name }} has been updated',
				modelsRequired       : ['opportunity'],
				daysToArchive        : 1,
				linkTemplate         : '/defaultonly',
				actions              : [{
					actionCd      : 'ok',
					linkTitleTemplate : 'OK',
					isDefault     : true
				}]
			}),
			new T ({
				messageCd            : 'opportunity-add',
				messageLevel         : 'info',
				description          : 'notify the user that there is a new opportunity' ,
				isSubscriptionType   : true,
				messageBodyTemplate  : '<p>Hi there</p><br/>Opportunity {{opportunity.name}} has been added. <a href="{{ domain }}/{{opportunity.path}}">Click here to view the opportunity</a></p>',
				messageShortTemplate : '<a href="{{ opportunity.path }}">{{ opportunity.name }}</a>',
				messageTitleTemplate : 'Opportunity Added',
				emailBodyTemplate    : '<img src="https://bcdevexchange.org/modules/core/client/img/logo/new-logo-220px.png"> <br/><br/> Hi {{user.displayName}}, <br/><br/> We\'ve just posted a new opportunity: <h4>{{ opportunity.name }}</h4> <ul><li>Value: <b>{{ opportunity.earn }}</b></li><li>Value: <b>{{ opportunity.deadline_format_date }}</b></li></ul><h4><a href="{{ domain }}/{{ opportunity.path }}">See the details</a></h4> Have a great day!<br/><b>The BCDevExchange Team</b><br/><br/>--- <i>To stop receiving notifications about new opportunities, <a href="{{ domain }}/opportunities">browse to the opportunity listing</a> and stop listening, or visit <a href="{{ domain }}/settings/privacy">your profile</a> and uncheck "Tell me about new opportunities" </i>',
				emailSubjectTemplate : 'A new opportunity has just been posted!',
				modelsRequired       : ['opportunity'],
				daysToArchive        : 1,
				linkTemplate         : '/defaultonly',
				actions              : [{
					actionCd      : 'ok',
					linkTitleTemplate : 'OK',
					isDefault     : true
				}]
			}),
			new T ({
				messageCd            : 'opportunity-assign-cwu',
				messageLevel         : 'info',
				description          : 'notify the user that they have been assigned the opportunity' ,
				isSubscriptionType   : true,
				messageBodyTemplate  : '<img src="https://bcdevexchange.org/modules/core/client/img/logo/new-logo-220px.png"> <br/> <h2>Congratulations {{user.displayName}}!</h2> The Proposal you submitted to work on, {{ opportunity.name }}, has been selected! {{opportunity.assignor}} is offering the assignment to you.',
				messageShortTemplate : '<a href="{{ opportunity.path }}">{{ opportunity.name }}</a>',
				messageTitleTemplate : 'Your Proposal has been selected!',
				emailBodyTemplate    : '<img src="https://bcdevexchange.org/modules/core/client/img/logo/new-logo-220px.png"> <br/> <h2>Congratulations {{user.displayName}}!</h2> The Proposal you submitted to work on, {{ opportunity.name }}, has been selected! {{opportunity.assignor}} is offering the assignment to you.',
				emailSubjectTemplate : 'Your Proposal has been selected!',
				modelsRequired       : ['opportunity'],
				daysToArchive        : 1,
				linkTemplate         : '/defaultonly',
				actions              : [{
					actionCd      : 'ok',
					linkTitleTemplate : 'OK',
					isDefault     : true
				}]
			}),
			new T ({
				messageCd            : 'opportunity-assign-swu',
				messageLevel         : 'info',
				description          : 'notify the user that they have been assigned the opportunity' ,
				isSubscriptionType   : true,
				messageBodyTemplate  : '<img src="https://bcdevexchange.org/modules/core/client/img/logo/new-logo-220px.png"> <br/> <h2>Congratulations {{user.displayName}}!</h2> The Proposal you submitted to work on, {{ opportunity.name }}, has been selected! {{opportunity.assignor}} is offering the assignment to you.',
				messageShortTemplate : '<a href="{{ opportunity.path }}">{{ opportunity.name }}</a>',
				messageTitleTemplate : 'Your Proposal has been selected!',
				emailBodyTemplate    : '<img src="https://bcdevexchange.org/modules/core/client/img/logo/new-logo-220px.png"> <br/> <h2>Congratulations {{user.displayName}}!</h2> The Proposal you submitted to work on, {{ opportunity.name }}, has been selected! {{opportunity.assignor}} is offering the assignment to you.',
				emailSubjectTemplate : 'Your Proposal has been selected!',
				modelsRequired       : ['opportunity'],
				daysToArchive        : 1,
				linkTemplate         : '/defaultonly',
				actions              : [{
					actionCd      : 'ok',
					linkTitleTemplate : 'OK',
					isDefault     : true
				}]
			})
		].map (saveT));
	});
};

//
// Seed the default notifications for each object type in the system
//
function seedNotifications () {
	var Notification = mongoose.model ('Notification');
	//
	// we make notifications for add / delete for Users, Opportunities, Programs, and Projects
	//
	var objects = ['User', 'Program', 'Project', 'Opportunity'];
	var events = ['Add', 'Delete', 'UpdateAny'];
	var prefix = 'not';
	var codes = [];
	objects.forEach (function (obj) {
		var lobj = obj.toLowerCase();
		events.forEach (function (evt) {
			var levt = evt.toLowerCase();
			codes.push ({
				code     : [prefix, levt, lobj].join('-'),
				name     : evt+' '+obj,
				// question : 'Notify me of object: ['+obj+'] event: ['+evt+']',
				target   : obj,
				// subject  : 'subject default',
				// body     : 'body default',
				event    : evt
			});
		});
	});
	// console.log (codes);
	return Promise.all (codes.map (function (code) {
		var notification = new Notification ({
			code        : code.code,
			name        : code.name,
			// description : code.name,
			// question    : code.question,
			target      : code.target,
			event       : code.event
			// subject     : code.subject,
			// body        : code.body
		});
		return new Promise (function (resolve, reject) {
			Notification.find ({code:code.code}, function (err, result) {
				if (err || result.length > 0) resolve ();
				else {
					notification.save (function (err, m) {
						// if (err) console.error (err);
						resolve (m);
					});
				}
			});
		});
	}));
}

// report the error
function reportError (reject) {
	return function (err) {
		if (seedOptions.logResults) {
			console.log();
			console.log('Database Seeding:\t\t\t' + err);
			console.log();
		}
		reject(err);
	};
}

module.exports.start = function start(options) {
	// Initialize the default seed options
	seedOptions = _.clone(config.seedDB.options, true);

	seedTestMessageTemplate ();
	// Check for provided options

	if (_.has(options, 'logResults')) {
		seedOptions.logResults = options.logResults;
	}

	if (_.has(options, 'seedUser')) {
		seedOptions.seedUser = options.seedUser;
	}

	if (_.has(options, 'seedAdmin')) {
		seedOptions.seedAdmin = options.seedAdmin;
	}

	var User = mongoose.model('User');
	return new Promise(function (resolve, reject) {

		var adminAccount = new User(seedOptions.seedAdmin);
		var userAccount = new User(seedOptions.seedUser);
		var devAccount = new User ({
			username: 'dev',
			provider: 'local',
			email: 'dev@localhost.com',
			firstName: 'Test',
			lastName: 'Developer',
			displayName: 'Test Developer',
			roles: ['user']
		});
		var devAccount2 = new User ({
			username: 'dev2',
			provider: 'local',
			email: 'dev2@localhost.com',
			firstName: 'Test 2',
			lastName: 'Developer 2',
			displayName: 'Test Developer 2',
			roles: ['user']
		});
		var govAccount = new User ({
			username: 'gov',
			provider: 'local',
			email: 'gov@localhost.com',
			firstName: 'Test',
			lastName: 'Government',
			displayName: 'Test Government',
			roles: ['user', 'gov']
		});
		Promise.resolve ()
		.then (seedNotifications)
		.then (function () {
			// If production only seed admin if it does not exist
			if (isProduction) {
				User.generateRandomPassphrase()
					.then(function (random) {
						var passed = process.env.ADMINPW;
						return passed || 'adminadmin';
					})
					.then(seedTheUser(adminAccount))
					.then(function () {
						resolve();
					})
					.catch(reportError(reject));
			} else {
				// Add both Admin and User account
				Promise.resolve ()
				//
				// dev account
				//
				.then(function () { return 'devdev'; })
				.then(seedTheUser(devAccount2))
				.then(function () { return 'devdev'; })
				.then(seedTheUser(devAccount))
				//
				// gov account
				//
				.then(function () { return 'govgov'; })
				.then(seedTheUser(govAccount))
				//
				// admin account
				//
				.then (User.generateRandomPassphrase())
				.then(function (random) {
					var passed = process.env.ADMINPW;
					console.log (passed);
					return passed || 'adminadmin';
				})
				.then(seedTheUser(adminAccount))
				//
				// general user account
				//
				.then(function () { return 'useruser'; })
				.then(seedTheUser(userAccount))
				//
				// done
				//
				.then(function () {
					resolve();
				})
				.catch(reportError(reject));
			}

		})
		.catch (reportError(reject));

	});
};
