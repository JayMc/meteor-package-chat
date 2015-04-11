#Intro
This package adds simple chat features.
- create a chatroom
- select a chatroom
- send a message in a chat room

Options object allows editing css classes in templates and if anonymous (non-authenticated users) can chat

#Installation

meteor add jaymc:chat

#Usage
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

#Options
```
chat = {
	css: {	//defaulted for Bootstrap 3.0 but you can set your own classes here
		msgs: 'well msgs',

		btns: 'btn btn-default',
		btnGroup: 'input-group-btn',

		input: 'form-control',
		inputGroup: 'input-group',

		eachRoomName: '',

		eachMessage: '',
		eachMessageDate: 'msg-date',
		eachMessageUsername: 'msg-name',
		eachMessageli: 'msg-li'
	},
	options: {
		startingRoom_id: '', //default starting chatroom, this can be handy if you only want a single chatroom and not use the newRoom template
		allowAnon: true //first it tries to get the logged in user, if that fails they can either send as anonymous or be denied
		chatContainer_id: 'chatMsgBox' //where you messages are displayed in a scrollable chat window. Used for auto scrolling down after a message is sent.
	}
}
```

#Additional info
- A session holds the currently select chatroom. Only one chatroom at a time can be selected.
- Will use Meteor accounts if added, sending a chat message will check for userId and failing that if anonymous users can send messages.
- Uses reactive-var between template.helpers and events.
- Two Collections are utilised: chatRooms and chatMessages.

#TODO
- Anonymous to use sudo usernames
- list of users in the chatroom
- message text colours
- emojis?
- notify sound
- somesort of moderating
- bad word filter?

