ChatMessages = new Meteor.Collection('chatmessages');
ChatRooms = new Meteor.Collection('chatrooms');



if(Meteor.isClient){
	Meteor.subscribe('chatmessages');
	Meteor.subscribe('chatrooms');

	Meteor.startup(function(){
		chat.init();
	})
	

	Template.message.helpers({
		css: function(){
			return chat.css;
		}
	})

	Template.rooms.helpers({
		rooms: function(){
			return chat.getRooms();
		},
		css: function(){
			return chat.css;
		}
	})

	Template.rooms.events({
		"submit #selectRoom": function(event, template){
			chat.selectRoom(event.target.room_id.value);
			return false;
		}
	})

	Template.newRoom.events({
		"submit #newRoomForm": function(event, template){
			chat.createNewRoom(event.target.newRoomName.value, function(err, res){
				if(err){
					// console.log(err.error)
					// console.log(err.reason)
				}else{
					event.target.newRoomName.value = '';
				}
			})

		    // Prevent default form submit
		    return false;
		}
	});

	Template.newRoom.helpers({
		css: function(){
			return chat.css;
		},
		errorMsg: function(){
			return Template.instance().errorMsg.get();
		}
	})

	Template.newRoom.created = function(){
		this.errorMsg = new ReactiveVar('');
	}

	Template.editAnonName.events({
		"submit #editAnonNameForm": function(e, t){
			chat.changeName(e.target.AnonName.value)
			return false;
		}
	})

	Template.editAnonName.helpers({
		anonName: function(){
			if(chat.options.allowAnon){
				return Session.get('anonName')
			}else{
				return '';
			}
		},
		css: function(){
			return chat.css;
		}
	})

	Template.room.helpers({
		data: function(){
			return chat.getRoom(Session.get('currentRoom_id'))
		},
		joined: function(){
			console.log(chat.getJoined(Session.get('currentRoom_id')));
			return chat.getJoined(Session.get('currentRoom_id'))
		},
		msgs: function(){
			return chat.getMessages(Session.get('currentRoom_id'));
		},
		css: function(){
			return chat.css;
		}
	})

	Template.message.onRendered(function(){
		chat.options.chatContainer_id = 'chatMsgBox';
		chat.scrollBottom()
	})

	Template.room.events({
		"submit #newMessage": function(e){

			chat.sendMessage(e.target.message.value, '', function(err, res){
				e.target.message.value = "";

				if(err){
					console.log(err.error)
					console.log(err.reason)
				}else{
					e.target.message.value = '';
				}
			});

		    // Prevent default form submit
		    return false;
		},
		"keyup input[name=message]": function(e){
			chat.newMessageActivity(e.target.value, e.keyCode)
		}
	})

	Template.changeStatus.helpers({
		css: function(){
			return chat.css;
		}
	})

	Template.changeStatus.events({
		"click .selectStatus": function(e, o){
			chat.changeStatus(e.currentTarget.dataset.status);
		}
	})

	Template.chatManagement.events({
		"click #clearAllJoinedUsers": function(){
			Meteor.call('removeAllUsersFromRooms');
		},
		"click .chatMngtsaveRoomName": function(e, t){
			var room_id = e.target.id.split('-')[1];
			var newName = document.getElementById('editRoomName-'+room_id).value;
			Meteor.call('renameRoom', room_id, newName)
		},
		"click .chatMngtdeleteRoom": function(e, t){
			var room_id = e.target.id.split('-')[1];
			Meteor.call('deleteRoom', room_id)
		}
	})

	Template.chatManagement.helpers({
		rooms: function(){
			return chat.getRooms();
		},
		css: function(){
			return chat.css;
		}
	})

}

if(Meteor.isServer){
	Meteor.publish('chatmessages', function(){
		return ChatMessages.find({}, {sort: {createdAt: -1}, limit: chat.options.getMessagesLimit});
	})
	Meteor.publish('chatrooms', function(){
		return ChatRooms.find();
	})
}

Meteor.methods({
	createNewRoom: function(roomName){
		var foundRoom = ChatRooms.findOne({'roomName':roomName});

		if(foundRoom){
			// return {err: true, msg: 'That room already exists', _id: foundRoom._id};
			throw new Meteor.Error('room-exists', 'That room already exists');

		}else{
			var doc_id = ChatRooms.insert({
				roomName: roomName,
				createdAt: new Date() // current time
			}, function(err, docsInserted){

			});

			return {err: false, msg: 'Room created', _id: doc_id};
		}
		// return {err: false, msg: 'Room created', _id: 'sfsdgdgfe'};
	},
	sendChatMessage: function(msg, room_id, anonName, anon_id){
		if(Meteor.userId()){			
			var user = {
				_id: Meteor.userId(),
				name: Meteor.user().username
			}
			var anon = false
		}else if(chat.options.allowAnon){
			var user = {
				_id: anon_id,
				name: anonName
			}
			var anon = true;
		}else{
			throw new Meteor.Error('logged-out', 'Please login to send a message');
			// return {err: true, msg: 'Please login to send a message'}
		}
		
		var msgObj = {
			msg: msg,
			user: user,
			room_id: room_id,
			anon: anon,
			createdAt: new Date()
		}

		var newMsg_id;
		if(user){
			newMsg_id = ChatMessages.insert(msgObj);
		}
		return {msg: 'Message sent', id: newMsg_id}
	},

	addUserToRoom: function(room_id, anonName, anon_id){
		if(Meteor.userId()){			
			var user = {
				_id: Meteor.userId(),
				name: Meteor.user().username,
				anon: false,
				joined: new Date(),
				lastMsg: new Date()
			}
		}else if(chat.options.allowAnon){
			var user = {
				_id: anon_id,
				name: anonName,
				anon: true,
				joined: new Date(),
				lastMsg: new Date()
			}
		}

		if(room_id){
			ChatRooms.update({'_id':room_id}, {$push:{'joined':user}})
		}
	},

	removeUserFromAllRooms: function(anon_id){
		if(Meteor.userId()){			
			var user_id = Meteor.userId();
		}else{
			var user_id = anon_id;
		}

		if(user_id){
			ChatRooms.update({'joined._id': user_id}, {$pull:{joined:{_id: user_id}}});
		}
	},

	changeJoinedUserName: function(anonName, anon_id){
		if(Meteor.userId()){			
			var newName = Meteor.user().username;
			var user_id = Meteor.userId();
		}else{
			var newName = anonName;
			var user_id = anon_id;
		}

		if(user_id){
			ChatRooms.update({'joined._id': user_id}, {$set:{'joined.$.name': newName}}, {multi: true})
		}
	},

	changeMessageUserName: function(anonName, anon_id){
		if(Meteor.userId()){			
			var newName = Meteor.user().username;
			var user_id = Meteor.userId();
		}else{
			var newName = anonName;
			var user_id = anon_id;
		}
		if(user_id){
			ChatMessages.update({'user._id': user_id}, {$set:{'user.name': newName}}, {multi: true})
		}
	},

	changeJoinedUserStatus: function(room_id, anonName, anon_id, newStatus){
		if(_.contains(chat.options.statuses, newStatus)){
			if(Meteor.userId()){			
				var newName = Meteor.user().username;
				var user_id = Meteor.userId();
			}else{
				var newName = anonName;
				var user_id = anon_id;
			}
			if(user_id && room_id){
				ChatRooms.update({'joined._id': user_id, '_id': room_id}, {$set:{'joined.$.status': newStatus}})
			}
		}

	},

	changeJoinedUserLastMsg: function(room_id, anon_id){
		if(Meteor.userId()){			
			var user_id = Meteor.userId();
		}else{
			var user_id = anon_id;
		}
		if(user_id && room_id){
			ChatRooms.update({'joined._id': user_id, '_id': room_id}, {$set:{'joined.$.lastMsg': new Date()}})
		}

	},

	removeAllUsersFromRooms: function(room_id){
		if(typeof room_id === 'undefined'){
			ChatRooms.update({'joined': {$exists: true}}, {$unset:{'joined':true}},{multi: true});
		}else{
			ChatRooms.update({'_id': room_id}, {$unset: {'joined':true}});
		}
	},

	renameRoom: function(room_id, newName){
		ChatRooms.update({_id:room_id}, {$set:{roomName: newName}})
	},

	deleteRoom: function(room_id){
		ChatRooms.remove({_id: room_id})
	}
})
