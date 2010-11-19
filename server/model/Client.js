/**
File:
	Client.js
Created By:
	Mario Gonzalez
Project	:
	Ogilvy Holiday Card 2010
Abstract:
	Stores information about a connection to a client
Basic Usage: 
	var aNewClient = new Client(this, connection, false);
	
	// Add to our list of connected users
	this.clients[clientID] = aNewClient;
	
	// broadcast message to all clients
	for( var clientID in this.clients ) {
		this.clients[clientID].sendMessage(encodedMessage);
	}
	
*/
(function(){
	exports.Class = Class.extend(
	{
		init: function( aServer, aConnection, aRecord )
		{
			this.conn = aConnection;
			this.record = aRecord;
			this.$ = aServer;
			
		},
		onMessage: function(msg) { },
		
		sendMessage: function( anEncodedMessage ) 
		{
			this.conn.send( anEncodedMessage );
		},
	}); // close extend
})(); // close anon function