ChatMessages = new Meteor.Collection('chatmessages');
ChatRooms = new Meteor.Collection('chatrooms');

chat = {
	css: {
		msgs: 'well chatMsgBox msgs',
		joinedList: 'well joined-users',

		btns: 'btn btn-default',
		btnGroup: 'input-group-btn',

		input: 'form-control',
		inputGroup: 'input-group',

		eachRoomName: '',

		eachMessage: '',
		eachMessageDate: 'msg-date',
		eachMessageUsername: 'msg-name',
		eachMessageAnonUsername: 'msg-name',
		eachMessageli: 'msg-li'
	},
	options: {
		startingRoom_id: '',
		allowAnon: true
	},
	scrollBottom: function(){
		var element = document.getElementById("chatMsgBox");
		element.scrollTop = element.scrollHeight;
	}
}

if(Meteor.isClient){

	Meteor.startup(function(){
		Session.set('currentRoom_id', chat.options.startingRoom_id);
		//check if the user is logged in, if not and we allow anonyous users make up a username
		if(Meteor.userId){			
			var name = Meteor.user().username;
		}else if(chat.options.allowAnon){
			Session.set('anonName', 'Anonymous'+Random.id(3));
		}
	})
	

	Template.message.helpers({
		css: function(){
			return chat.css;
		}
	})

	Template.rooms.helpers({
		rooms: function(){
			return ChatRooms.find();
		},
		css: function(){
			return chat.css;
		}
	})

	Template.rooms.events({
		"submit #selectRoom": function(event, template){
			Meteor.call('removeUserFromAllRooms', Session.get('anonName'));
			Session.set('currentRoom_id', event.target.room_id.value);
			Meteor.call('addUserToRoom', event.target.room_id.value, Session.get('anonName'));
			return false;
		}
	})

	Template.newRoom.events({
		"submit #newRoomForm": function(event, template){
			var roomName = event.target.newRoomName.value;
			Meteor.call('createNewRoom', roomName, function(err, res){
				if(err){

				}else{
					if(!res.err){
						event.target.newRoomName.value = "";
					}
					console.log(res);
					// template.errorMsg.set(res.msg);

				}
			});

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

	Template.room.helpers({
		data: function(){
			if(Session.get('currentRoom_id') !== ''){
				return ChatRooms.findOne({'_id': Session.get('currentRoom_id')});
			}
		},
		msgs: function(){
			if(Session.get('currentRoom_id') !== ''){
				return ChatMessages.find({'room_id': Session.get('currentRoom_id')});
			}
		},
		css: function(){
			return chat.css;
		}
	})

	Template.message.onRendered(function(){
		chat.scrollBottom();
	})

	Template.room.events({
		"submit #newMessage": function(e){
			var msg = e.target.message.value;

			if(Session.get('currentRoom_id') !== ''){
				Meteor.call('sendChatMessage', msg, Session.get('currentRoom_id'), Session.get('anonName'), function(err, res){
					console.log(res)
					chat.scrollBottom();
				    // Clear form
				    e.target.message.value = "";
				})
			}


		    // Prevent default form submit
		    return false;
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
			return ChatRooms.find();
		},
	})

}

Meteor.methods({
	createNewRoom: function(roomName){
		var foundRoom = ChatRooms.findOne({'roomName':roomName});

		if(typeof foundRoom !== 'undefined'){
			return {err: true, msg: 'That room already exists', _id: foundRoom._id};

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
	sendChatMessage: function(msg, room_id, name){
		if(Meteor.userId){			
			var user = {
				_id: Meteor.userId,
				name: Meteor.user().username
			}
			var anon = false
		}else if(chat.options.allowAnon){
			var user = {
				name: name
			}
			anon = true;
		}else{
			return {err: true, msg: 'Please login to send a message'}
		}
		
		var msgObj = {
			msg: msg,
			user: user,
			room_id: room_id,
			anon: anon,
			createdAt: new Date()
		}

		ChatMessages.insert(msgObj);
		return {err: false, msg: 'Message sent'}
	},
	addUserToRoom: function(room_id, name){
		console.log(name)
		if(Meteor.userId){			
			var name = Meteor.user().username;
		}else{
			var name = name;
		}
		var user = {
			userName: name,
			joined: new Date()
		}
		ChatRooms.update({'_id':room_id}, {$push:{'joined':user}})
	},
	removeUserFromAllRooms: function(name){
		if(Meteor.userId){			
			var name = Meteor.user().username;
		}else{
			var name = name;
		}
		var user = {
			userName: name,
			joined: new Date()
		}
		ChatRooms.update({'joined.userName': name}, {$pull:{joined:{userName: name}}});
	},
	removeAllUsersFromRooms: function(room_id){
		if(typeof room_id === 'undefined'){
			ChatRooms.update({'joined': {$exists: true}}, {$unset:{'joined':true}},{multi: true});
		}else{
			if(typeof room_id === 'undefined'){
			ChatRooms.update({'_id': room_id}, {$unset: {'joined':true}});
		}
		}
	},
	renameRoom: function(room_id, newName){
		ChatRooms.update({_id:room_id}, {$set:{roomName: newName}})
	},
	deleteRoom: function(room_id){
		ChatRooms.remove({_id: room_id})
	}
})
