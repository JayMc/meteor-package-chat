[![endorse](https://api.coderwall.com/jaymc/endorsecount.png)](https://coderwall.com/jaymc)
# Intro
This package adds simple chat features.
- create a chatroom
- select a chatroom
- send a message in a chat room
- view users in room
- message typing status

# Installation

meteor add jaymc:chat

# Usage
Use the follow templates

List all chatrooms
```
{{> rooms}}
```

Display the currently selected chatroom with messages and send message dialog
```
{{> room}}
```

Create a new chatroom
```
{{> newRoom}}
```

Management tasks
```
{{> chatManagement}}
```

# Options
```
chat = {
	css: {	//defaulted for Bootstrap 3.0 but you can set your own classes here
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
	options: {
		startingRoom_id: '', //default starting chatroom, this can be handy if you only want a single chatroom and not use the newRoom template
		allowAnon: true //first it tries to get the logged in user, if that fails they can either send as anonymous or be denied
		chatContainer_id: 'chatMsgBox' //where you messages are displayed in a scrollable chat window. Used for auto scrolling down after a message is sent.
		changeNamePastMessages: true, //if a user changes her username, update username for all past messages sent by this user
		debounceDelay: 400 //adjust the debonuce on new message typing. Lower value will be more responsive to key presses but with the down side of query the database more frequently.
		statuses: ['typing','deleting', 'na', 'away', 'online', 'offline'] //valid user status that are allowed to be displayed
	}
}
```

# User accounts
If you're not using Meteors accounts package. All users will be treated as anonymous by receiving a random username and id which is not persistant after they revist. 
If Meteors accounts package is used. The users id and username will be respected and used for all actions.

To get going with Meteors accounts package make sure you utilise username:
```
meteor add accounts-ui accounts-password

Accounts.ui.config({
  passwordSignupFields: "USERNAME_ONLY"
});
```

# Additional info
- A session holds the currently select chatroom. Only one chatroom at a time can be selected.
- Will use Meteor accounts if added, sending a chat message will check for userId and failing that if anonymous users can send messages.
- Uses reactive-var between template.helpers and events.
- Two Collections are utilised: chatRooms and chatMessages.

# TODO
- message text colours
- emojis?
- notify sound
- somesort of moderating
- bad word filter?

