/**
File:
	Character Controller.js
Created By:
	Mario Gonzalez
Project	:
	Ogilvy Holiday Card 2010
Abstract:  
	A generic character inside of our multiplayer game.
	Anything too interesting should go in a subclass of this.
	
	Contains a view which is grabbed by the GameController and placed into 
	the game controllers view
Basic Usage: 
		var newCharacter = new CharacterController(aClientID, this.fieldRect);
		
		// Is this the users character?
		if(messageData.id == this.netChannel.clientID)
		{
			this.clientCharacter = newCharacter;
			this.joystick = new Joystick();
			console.log("(ClientGameController)", this.joystick);
		}
		
		// Grab the view from the character and add it to our GameView
		this.view.addCharacter(newCharacter.initView());
*/

var init = function(Vector, Rectangle, FieldController, GameEntity, CharacterView)
{
	return new JS.Class(GameEntity,
	{
		initialize: function(anObjectID, aClientID, aFieldController)
		{
			this.callSuper();
			this.entityType = 'Character';

			// some defaults we use for position
			this.position = new Vector( Math.random() * this.fieldController.getWidth(), Math.random() * this.fieldController.getHeight() );

			// move constants
			// Apply to acceleration if keys pressed. Note, this number is high because it is applied multiplied by deltaTime
			this.moveSpeed = 0.7;

			// the fastest i can go
			this.maxVelocity = 3.5;

			// if the field we're being placed in has a field, then we'll go into it
			if( this.fieldController.view )
			{
				// init the view, pass ourselves as the controller
				this.view = new CharacterView( this, 'smash-tv' );
				this.fieldController.addPlayer( this )
			}
		},

		/**
		 * Handle keyboard Input
		 * Note we allow the user to all keys at the same time
		 */
		handleInput: function()
		{
			if( this.input )
			{
				// Horizontal acceleration
				if( this.input.isLeft() ) this.acceleration.x -= this.moveSpeed;
				if( this.input.isRight() ) this.acceleration.x += this.moveSpeed;

				// Vertical movement
				if( this.input.isUp() ) this.acceleration.y -= this.moveSpeed;
				if( this.input.isDown() ) this.acceleration.y += this.moveSpeed;
			}
		},

		tick: function(speedFactor)
		{
			this.handleInput();
			this.callSuper();
		},

//
//		deconstructFromEntityDescription: function(anEntityDescription)
//		{
//			throw("All GameEntity subclasses must override this method.");
//		},

		/**
		 * Accessors
		 */
		getNickName: function()
		{
			return this.nickName;
		},

		setNickName: function( aNickName )
		{
			this.nickName = aNickName;

			if(this.view)
				this.view.refresh();
		},

		setInput: function( anInnput )
		{
			this.input = anInnput;
		}
	});
};

if (typeof window === 'undefined')
{
	// We're in node!
	require('../../lib/jsclass/core.js');
	require('../../lib/Vector');
	require('../../lib/Rectangle');
//	require('../../view/CharacterView');
	require('../FieldController');
	require('./GameEntity')

	var sys = require('sys');
	Character = init(Vector, Rectangle, FieldController, GameEntity);
}
else
{
	// We're on the browser. 
	// Require.js will use this file's name (CharacterController.js), to create a new
	//	define(['lib/Vector', 'lib/Rectangle', 'controllers/FieldController', 'controllers/entities/GameEntity', 'view/CharacterView', 'lib/jsclass/core'], init);
	define(['lib/Vector', 'lib/Rectangle', 'controllers/FieldController', 'controllers/entities/GameEntity', 'view/CharacterView', 'lib/jsclass/core'], init);
}