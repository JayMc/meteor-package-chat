Package.describe({
  name: 'jaymc:chat',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'Chat addon for Meteor',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/JayMc/meteor-package-chat',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0');

  api.use([
    'templating',
    'reactive-var',
    'session'
  ]);

  api.addFiles([
    'chat.html',
    'chat.css',
    'chat.js'
  ], ['client','server']);

});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('jaymc:chat');
  api.addFiles('chat-tests.js');
});
