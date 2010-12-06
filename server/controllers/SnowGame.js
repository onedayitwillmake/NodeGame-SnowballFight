/**
File:
	ServerGameController.js
Created By:
	Mario Gonzalez
Project:
	Ogilvy Holiday Card 2010
Abstract:
 	This is the servers version of AbstractGame.js / it contains and controls the parts that any ServerGame instance would need in order to function
Basic Usage: 
	var gameController = new ServerGameController({
	    'port': Math.abs(ArgHelper.getArgumentByNameOrSetDefault('port', 28785)),
	    'status': false,
	    'recordFile': './../record[date].js',
	    'record': false,
	    'server': null
	});
	gameController.run();
	
Version:
	1.0
*/

require('controllers/AbstractServerGame');
SnowGame = (function()
{
	return new JS.Class(AbstractServerGame, {
		initialize: function(aServer)
		{
			this.callSuper();
			var collisionManager = this.fieldController.getCollisionManager();
			collisionManager.eventEmitter.on('collision', this.onCollision);
		},

		onCollision: function(circleA, circleB, collisionNormal)
		{
			//console.log("YO!");
			// Messy for now, but call proper function on collision
//
//			var player = null,
//				projectile = null;
//
//			if(circleA.view.entityType === EntityModel.CHARACTER
		}
	});
})();
