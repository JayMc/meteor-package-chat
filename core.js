chat = {
	/**
	*	Properties
	*
	*/
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
		// startingRoom_id: '',
		allowAnon: true,
		chatContainer_id: 'chatMsgBox',
		changeNamePastMessages: true,
		debounceDelay: 400
	},

	/*
	*	Events	
	*	User customisable events that can be redefined
	*	ie: chat.onSend(function(err, res){
	*		console.log(err.reason)
	*	})
	*/
	onSend: function(err, res){
		return 
	},
	onNewRoom: function(err, res){
		return
	},
	onChangeRoom: function(room_id){
		return
	},
	onChangeName: function(newName){
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

		if(this.options.allowAnon){
			Session.set('anonName', 'Anonymous'+Random.id(3));
			Session.set('anon_id', Random.id());
		}

		//check if the user is logged in, if not and we allow anonyous users make up a username
		Accounts.onLogin(function(){
			console.log(Meteor.user());

			if(Meteor.userId()){			
				// Session.set('anonName', null);
				// Session.set('anon_id', null);				
			}else if(this.options.allowAnon){
				Session.set('anonName', 'Anonymous'+Random.id(3));
				Session.set('anon_id', Random.id());
			}		
		})

		var self = this;
		Meteor.logout(function(){
			console.log(self)
			if(self.options.allowAnon){
				Session.set('anonName', 'Anonymous'+Random.id(3));
				Session.set('anon_id', Random.id());
			}		
		})

		if(this.options.startingRoom_id !== ''){
			Session.set('currentRoom_id', this.options.startingRoom_id);
			this.selectRoom(this.options.startingRoom_id);
		}
	},

	/*
	*	Methods
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

			    self.onSend(err, res);
			    
			    //bubble up
			    callback(err, res)
			})
		}
	},

	/**
	*	Create a new room
	*	
	*/
	createNewRoom: function(newRoomName, callback){
		var self = this;
		Meteor.call('createNewRoom', newRoomName, function(err, res){

			// if(!res.err){
			// 	roomName_element.value = '';
			// }

			self.onNewRoom(err, res);

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
		Meteor.call('addUserToRoom', room_id, Session.get('anonName'), Session.get('anon_id'));		
		Session.set('currentRoom_id', room_id);
		this.onChangeRoom(room_id);
	},

	/**
	*	If chat user wants to change their name, either Anon name or Meteor username
	*	This will update username occurrances in rooms and messages
	*/
	changeName: function(newName){

		Meteor.call('changeJoinedUserName', Session.get('anonName'), Session.get('anon_id'))
		//change past messsages
		if(this.options.changeNamePastMessages){
			Meteor.call('changeMessageUserName', Session.get('anonName'), Session.get('anon_id'))
		}
		if(this.options.allowAnon){
			Session.set('anonName', newName);
		}
		this.onChangeName(newName);
	},

	/**
	*	Changes user status (typing, away)
	*/
	changeStatus: function(){
		Meteor.call('changeJoinedUserStatus', Session.get('anonName'), Session.get('anon_id'))
	},

	/**
	*	Monitors the message while user is typing
	*	For notifying others the user is typing
	*/
	newMessageActivity: function(msgTxt, lastKeyCode){
		if(lastKeyCode === 8 || lastKeyCode === 46){
			this._handleChangeTypingStatus('deleting');
		}else{
			this._handleChangeTypingStatus('typing');
		}
	},

	_handleChangeTypingStatus: function(status){
		var self = this;
		Meteor.clearTimeout(this.debounce);
		this.debounce = Meteor.setTimeout(function(){
			console.log(status)
		}, self.options.debounceDelay);
	}
}