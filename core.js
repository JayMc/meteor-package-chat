chat = {
	/**
	*	CSS
	*	Apply classes
	*/
	css: {
		msgs: 'well chatMsgBox msgs',
		joinedList: 'well joined-users',

		btn: 'btn btn-default',
		btnPrimary: 'btn btn-primary',
		btnDanger: 'btn btn-danger',
		btnDropdown: 'btn btn-info',

		input: 'form-control',
		inputGroup: 'input-group',
		btnGroup: 'input-group-btn',

		eachRoomName: '',

		eachMessage: '',
		eachMessageDate: 'msg-date',
		eachMessageUsername: 'msg-name',
		eachMessageAnonUsername: 'msg-name',
		eachMessageli: 'msg-li',
		eachMember: 'member-li'
	},

	/**
	*	Options
	*/
	options: {
		startingRoom_id: 'o4uYuTbrM2maNJZdz',
		// startingRoom_id: '',
		allowAnon: true,
		chatContainer_id: 'chatMsgBox',
		changeNamePastMessages: true, // When a user changes their name should it go back to previous messages and update the name
		delayTypingStatus: 250, //delay since last keypress before showing 'typing' status
		delayClearStatus: 3000, // if the user stops typing how long until their 'typing' status is removed
		getMessagesLimit: 100, //only show this many messages
		statuses: ['typing','deleting', 'na', 'away', 'online', 'offline', ''], //allowed user statuses

	},

	/*
	*	ReactiveVar Events	
	*	Easy Reactive Hooks for your app
	*/
	_sent: new ReactiveVar(''),
	sent: function(err, res){
		return this._sent.get()
	},

	_newRoom: new ReactiveVar(''),
	newRoom: function(err, res){
		return this._newRoom.get();
	},

	_currentRoom: new ReactiveVar({}),
	currentRoom: function(){
		// console.log(this._currentRoom.get())
		return this._currentRoom.get();
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

				//Update user last send message date
				Meteor.call('changeJoinedUserLastMsg', room_id, anon_id);

				//scroll down
				self.scrollBottom();

			    self.onSend(err, res);

			    // reactive var
			    self._sent.set(msg)
			    
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

			this._newRoom.set(res._id);

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
	*	Get all the joined users for a given room
	*/
	getJoined: function(room_id){

		if(typeof room_id === 'undefined'){
			room_id = Session.get('currentRoom_id');
		}

		if(typeof room_id !== 'undefined'){
			var joined = ChatRooms.findOne({'_id': Session.get('currentRoom_id')},{fields: {joined:1}});
			var joinedSorted = _.sortBy(joined.joined, function(j){
				return j.lastMsg;
			})
			var joinedSorted = _.filter(joinedSorted, function(j){
				var yesterday = new Date(new Date().setDate(new Date().getDate()-1));
				var lastMin = new Date(new Date().setMinutes(new Date().getMinutes()-5));
				var lastHour = new Date(new Date().setHours(new Date().getHours()-1));
				return j.joined > lastMin
			})

			return joinedSorted.reverse();
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
		var room = ChatRooms.findOne({_id: room_id});
		this._currentRoom.set(room);
	},

	/**
	*	If chat user wants to change their name, either Anon name or Meteor username
	*	This will update username occurrances in rooms and messages
	*/
	changeName: function(newName){

		Meteor.call('changeJoinedUserName', newName, Session.get('anon_id'));
		//change past messsages
		if(this.options.allowAnon){
			Session.set('anonName', newName);
		}
		if(this.options.changeNamePastMessages){
			Meteor.call('changeMessageUserName', newName, Session.get('anon_id'))
		}
		
	},

	/**
	*	Changes user status (typing, away)
	*/
	changeStatus: function(status){
		if(_.contains(this.options.statuses, status)){
			Meteor.call('changeJoinedUserStatus', Session.get('currentRoom_id'), Session.get('anonName'), Session.get('anon_id'), status);
		}
		// Meteor.call('changeUserStatus', Session.get('anonName'), Session.get('anon_id'), status);
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

	// changes status to typing/deleting
	_handleChangeTypingStatus: function(status){
		var self = this;
		Meteor.clearTimeout(this.debounce);
		this.debounce = Meteor.setTimeout(function(){
			self.changeStatus(status);
			self._clearTypingStatus();
		}, self.options.delayTypingStatus);
	},

	// Clear status if they stop typing/deleting for too long
	_clearTypingStatus: function(){
		var self = this;
		Meteor.clearTimeout(this.debounceClear);
		this.debounceClear = Meteor.setTimeout(function(){
			self.changeStatus('');
		}, self.options.delayClearStatus);
	}
}