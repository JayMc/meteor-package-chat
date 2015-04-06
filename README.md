#Intro
This package adds simple chat features.
- create a chatroom
- select a chatroom
- send a message in a chat room

Otions object allows editing css classes in templates and if anonymous (non-authenticated users) can chat

#Installation

meteor add jaymc:chat

#Usage
Use the follow templates

A list of chatrooms
```
{{> rooms}}
```

Currently selected chatroom with messages
```
{{> room}}
```

Create a new room
```
{{> newRoom}}
```

#Additional info
- A session holds the currently select chatroom. Only one chatroom at a time can be selected.
- Will use Meteor accounts if added
- Uses reactive-var between template.helpers and events

#TODO
- user text colours
- emojis?
- notify sound
- somesort of moderating
- bad word list?
