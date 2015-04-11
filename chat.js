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
		startingRoom_id: 'o4uYuTbrM2maNJZdz',
		allowAnon: true,
		chatContainer_id: 'chatMsgBox',
		changeNamePastMessages: true
	},

	/*
	*	User customisable events that can be redefined
	*	ie: chat.onSend(funtion(){
	*		
	*	})
	*/
	onSend: function(res){
		return 
	},
	onNewRoom: function(){
		return
	},
	scrollBottom: function(){
		var element = document.getElementById(this.options.chatContainer_id);
		element.scrollTop = element.scrollHeight;
	},

	/**
	*	Constructor? auto joins room
	*/
	init: function(){

		//check if the user is logged in, if not and we allow anonyous users make up a username
		if(Meteor.userId){			
			var name = Meteor.user().username;
		}else if(this.options.allowAnon){
			Session.set('anonName', 'Anonymous'+Random.id(3));
			Session.set('anon_id', Random.id());
		}		

		if(this.options.startingRoom_id !== ''){
			Session.set('currentRoom_id', this.options.startingRoom_id);
			this.selectRoom(this.options.startingRoom_id);
		}
	},

	/*
	*	Sends a message into a room
	*	
	*	optional room_id, if not supplied uses users current room
	*/
	sendMessage: function(msg, room_id, callback){
		var self = this;

		if(typeof room_id === 'undefined' || room_id === ''){
			room_id = Session.get('currentRoom_id');
		}

		//in case we have these, otherwise they wont be used
		//server side wont have access to Session
		var anonName = Session.get('anonName');
		var anon_id = Session.get('anon_id');

		if(Session.get('currentRoom_id') !== ''){

			Meteor.call('sendChatMessage', msg, room_id, anonName, anon_id, function(err, res){
				//scroll down
				self.scrollBottom();
			    
			    self.onSend(res);
			    
			    //bubble up
			    callback(err, res)
			})
		}
	},

	/**
	*	Create a new room
	*	
	*/
	createNewRoom: function(roomName_element, callback){
		var self = this;
		Meteor.call('createNewRoom', roomName_element.value, function(err, res){

			if(!res.err){
				roomName_element.value = '';
			}

			self.onNewRoom();

			callback(err, res);

		});		
	},

	/**
	*	Get a list of messages
	*	displays chat messages
	*/
	getMessages: function(room_id){

		if(typeof room_id === 'undefined'){
			room_id = Session.get('currentRoom_id');
		}

		if(typeof room_id !== 'undefined'){
			return ChatMessages.find({'room_id': room_id});
		}else{
			return;
		}
	},

	/**
	*	Get a single room.
	*	room_id is optional if you wanted to specify one that the has not joined
	*	The users current room is stored in session.
	*/
	getRoom: function(room_id){

		if(typeof room_id === 'undefined'){
			room_id = Session.get('currentRoom_id');
		}

		if(typeof room_id !== 'undefined'){
			return ChatRooms.findOne({'_id': Session.get('currentRoom_id')});
		}else{
			return;
		}
	},

	/**
	*	Get a list of all rooms
	*
	*/
	getRooms: function(){
		return ChatRooms.find();
	},

	/**
	*	User can be a member of only one room at a time
	*	selecting a room adds the room_id to user session and adds username to room joined list
	*/
	selectRoom: function(room_id){
		Meteor.call('removeUserFromAllRooms', Session.get('anon_id'));
		Session.set('currentRoom_id', room_id);
		Meteor.call('addUserToRoom', room_id, Session.get('anonName'), Session.get('anon_id'));		
	},

	changeAnonName: function(newName){
		if(this.options.allowAnon){
			Session.set('anonName', newName);
		}
		Meteor.call('changeJoinedUserName', Session.get('anonName'), Session.get('anon_id'))

		//change past messsages
		if(this.options.changeNamePastMessages){
			Meteor.call('changeMessageUserName', Session.get('anonName'), Session.get('anon_id'))
		}
	}
}

if(Meteor.isClient){

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
			chat.createNewRoom(event.target.newRoomName, function(){

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
			chat.changeAnonName(e.target.AnonName.value)
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
		}
	})

	Template.room.helpers({
		data: function(){
			return chat.getRoom(Session.get('currentRoom_id'))
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
				}
				// console.log(err)
				console.log(res)
			});

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
			return chat.getRooms();
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
	sendChatMessage: function(msg, room_id, anonName, anon_id){
		if(Meteor.userId){			
			var user = {
				_id: Meteor.userId,
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

		var newMsg_id = ChatMessages.insert(msgObj);
		return {msg: 'Message sent', id: newMsg_id}
	},
	addUserToRoom: function(room_id, anonName, anon_id){
		if(Meteor.userId){			
			var user = {
				_id: Meteor.userId,
				name: Meteor.user().username,
				anon: false,
				joined: new Date()
			}
		}else if(chat.options.allowAnon){
			var user = {
				_id: anon_id,
				name: anonName,
				anon: true,
				joined: new Date()
			}
		}
		ChatRooms.update({'_id':room_id}, {$push:{'joined':user}})
	},
	removeUserFromAllRooms: function(anon_id){
		if(Meteor.userId){			
			var user_id = Meteor.userId;
		}else{
			var user_id = anon_id;
		}

		ChatRooms.update({'joined._id': user_id}, {$pull:{joined:{_id: user_id}}});
	},
	changeJoinedUserName: function(anonName, anon_id){
		if(Meteor.userId){			
			var newName = Meteor.user().username;
			var user_id = Meteor.userId;
		}else{
			var newName = anonName;
			var user_id = anon_id;
		}
		ChatRooms.update({'joined._id': user_id}, {$set:{'joined.$.name': newName}}, {multi: true})
	},
	changeMessageUserName: function(anonName, anon_id){
		if(Meteor.userId){			
			var newName = Meteor.user().username;
			var user_id = Meteor.userId;
		}else{
			var newName = anonName;
			var user_id = anon_id;
		}
		ChatMessages.update({'user._id': user_id}, {$set:{'user.name': newName}}, {multi: true})
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
