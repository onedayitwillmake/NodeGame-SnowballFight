/**
File:
	ClientGameController.js
Created By:
	Mario Gonzalez
Project	:
	Ogilvy Holiday Card 2010
Abstract:
	This class represents the client-side GameController.
	It contains a NetChannel instead of a Server, as well as a ClientGameView 
Basic Usage: 
	var gameController = new ClientGameController(HOST, PORT) 
*/

var init = function(Vector, NetChannel, GameView, Joystick, AbstractGame, TraitFactory)
{
	return new JS.Class(AbstractGame,
	{

		initialize: function(config)
		{
			this.callSuper();

			console.log('(AbstractClientGame)::intialize');
			this.netChannel = new NetChannel(config, this);

			this.view = new GameView(this, this.model );
			this.fieldController.createView( this.model );
			
			this.clientCharacter = null; // Special pointer to our own client character
			
			this.CMD_TO_FUNCTION = {};
			this.CMD_TO_FUNCTION[config.CMDS.PLAYER_DISCONNECT] = this.onRemoveClient;
			this.CMD_TO_FUNCTION[config.CMDS.PLAYER_MOVE] = this.genericCommand; // Not implemented yet
			this.CMD_TO_FUNCTION[config.CMDS.PLAYER_FIRE] = this.genericCommand;
			this.CMD_TO_FUNCTION[config.CMDS.END_GAME] = this.onEndGame;

			this.initializeCaat();
		},

		initializeCaat: function()
		{
			this.director = new CAAT.Director().initialize(900, 600);
			this.director.imagesCache = GAMECONFIG.CAAT.imagePreloader.images;
			this.scene = new CAAT.Scene().create();

			// Store
			GAMECONFIG.CAAT.DIRECTOR = this.director;
			GAMECONFIG.CAAT.SCENE = this.scene;


//			 ../img/global/bg-field.png
			$(this.director.canvas).appendTo(  this.fieldController.view.getElement() );

			this.director.addScene(this.scene);
			this.director.loop(55);
//			$(this.director.canvas).appendTo($('body'));
		},

		/**
		 * A connected browser client's 'main loop'
		 */
		tick: function()
		{
			this.callSuper();
			this.netChannel.tick( this.gameClock );
			this.renderAtTime(this.gameClock - ( this.config.CLIENT_SETTING.interp + this.config.CLIENT_SETTING.fakelag ) );

			// Continuously store information about our input
			if( this.clientCharacter != null )
			{
				var characterStatus = this.clientCharacter.constructEntityDescription();
				var newMessage = this.netChannel.composeCommand( this.config.CMDS.PLAYER_MOVE, characterStatus );

				// create a message with our characters updated information and send it off
				this.netChannel.addMessageToQueue( false, newMessage );
				this.view.update();
			}


//			this.fieldController.view.sortChildren();

//			this.director.render( this.clockActualTime - this.director.timeline );
//            this.director.timeline = this.clockActualTime;
		},

		/**
		 * Renders back in time between two previously received messages allowing for packet-loss, and a smooth simulation
		 * @param renderTime
		 */
		renderAtTime: function(renderTime)
		{
			var cmdBuffer = this.netChannel.incommingCmdBuffer,
				len = cmdBuffer.length;

			if( len < 2 ) return false; // Nothing to do!

			var newPosition = new Vector(0,0),
				newRotation = 0.0;

			// if the distance between prev and next is too great - don't interpolate
			var maxInterpolationDistance = 150,
				maxInterpolationDistanceSquared = maxInterpolationDistance*maxInterpolationDistance;

			// Store the next WED before and after the desired render time
			var nextWorldEDAfterRenderTime = null,
				previousWorldEDBeforeRenderTime = null;

			// Loop through the points, until we find the first one that has a timeValue which is greater than our renderTime
			// Knowing that then we know that the combined with the one before it - that passed our just check - we know we want to render ourselves somehwere between these two points
			var i = 0;
			while(++i < len)
			{
				var currentWorldEntityDescription = cmdBuffer[i];

				// We fall between this "currentWorldEntityDescription", and the last one we just checked
				if( currentWorldEntityDescription.gameClock >= renderTime ) {
					previousWorldEDBeforeRenderTime = cmdBuffer[i-1];
					nextWorldEDAfterRenderTime = currentWorldEntityDescription;
					break;
				}
			}

			// Could not find two points to render between
			if(nextWorldEDAfterRenderTime == null || previousWorldEDBeforeRenderTime == null) {
				return false;
			}

			/**
			 * More info: http://www.learningiphone.com/2010/09/consicely-animate-an-object-along-a-path-sensitive-to-time/
			 * Find T in the time value between the points:
			 *
			 * durationBetweenPoints: Amount of time between the timestamp in both points
			 * offset: Figure out what our time would be if we pretended the previousBeforeTime.time was 0.00 by subtracting it from us
			 * t: Now that we have a zero based offsetTime, and a maximum time that is also zero based (durationBetweenPoints)
			 * we can easily figure out what offsetTime / duration.
			 *
			 * Example values: timeValue = 5.0f, nextPointTime = 10.0f, lastPointTime = 4.0f
			 * result:
			 * duration = 6.0f
			 * offsetTime = 1.0f
			 * t = 0.16
			 */

			var durationBetweenPoints = (nextWorldEDAfterRenderTime.gameClock - previousWorldEDBeforeRenderTime.gameClock);
			var offsetTime = renderTime - previousWorldEDBeforeRenderTime.gameClock;
			var activeEntities = {};

			// T is where we fall between, as a function of these two points
			var t = offsetTime / durationBetweenPoints;
			if(t > 1.0)  t = 1.0;
			else if(t < 0) t = 0.0;

			// Note: We want to render at time "B", so grab the position at time "A" (previous), and time "C"(next)
			var entityPositionPast = new Vector(0,0),
				entityRotationPast = 0;

			var entityPositionFuture = new Vector(0,0),
				entityRotationFuture = 0;

			// Update players
			nextWorldEDAfterRenderTime.forEach(function(key, entityDesc)
			{
				// Catch garbage values
				var objectID = entityDesc.objectID;
				var entity = this.fieldController.getEntityWithObjectID( entityDesc.objectID );

				// We don't have this entity - create it!
				if( !entity )
				{
					var connectionID = entityDesc.clientID,
						isCharacter  = entityDesc.entityType == GAMECONFIG.ENTITY_MODEL.ENTITY_MAP.CHARACTER,
						isOwnedByMe = connectionID == this.netChannel.clientID;

					// Take care of the special things we have to do when adding a character
					if(isCharacter)
					{
						// This character actually belongs to us
						var aCharacter = this.shouldAddPlayer( objectID, connectionID, entityDesc, this.fieldController );

						// If this character is owned by the us, allow it to be controlled by the keyboard
						if(isOwnedByMe)
						{
							var clientControlledTrait = TraitFactory.createTraitWithName('ClientControlledTrait');
							aCharacter.addTraitAndExecute( new clientControlledTrait() );
							this.clientCharacter = aCharacter;
						}
					}
					else // Every other kind of entity - is just a glorified view as far as the client game is concerned
					{
						 this.fieldController.createAndAddEntityFromDescription(entityDesc);
					}

					// Place it where it will be
					newPosition.set(entityDesc.x, entityDesc.y);
					newRotation = entityDesc.rotation || 0;
				}
				else // We already have this entity - update it
				{
					var previousEntityDescription = previousWorldEDBeforeRenderTime.objectForKey(objectID);

					if(!previousEntityDescription) { // Couldn't find any info for this entity, will try again next render loop
						return;
					}
					// Store past and future positions to compare
					entityPositionPast.set(previousEntityDescription.x, previousEntityDescription.y);
					entityRotationPast = previousEntityDescription.rotation;

					entityPositionFuture.set(entityDesc.x, entityDesc.y);
					entityRotationFuture = entityDesc.rotation;

					// if the distance between prev and next is too great - don't interpolate
					if(entityPositionPast.distanceSquared(entityPositionFuture) > maxInterpolationDistanceSquared) {
						t = 1;
					}

					// Interpolate the objects position by multiplying the Delta times T, and adding the previous position
					newPosition.x = ( (entityPositionFuture.x - entityPositionPast.x) * t ) + entityPositionPast.x;
					newPosition.y = ( (entityPositionFuture.y - entityPositionPast.y) * t ) + entityPositionPast.y;
					newRotation =  ( (entityRotationFuture - entityRotationPast) * t ) + entityRotationPast;
				}

				// Update the entity with the new information, and insert it into the activeEntities array
				this.fieldController.updateEntity( objectID, newPosition, newRotation, entityDesc );
				activeEntities[objectID] = true;

			}, this);

			// Destroy removed entities
			this.fieldController.removeExpiredEntities( activeEntities );
		},



		createView: function()
		{
			this.view = new GameView(this);
		},

		/**
		 * ClientGameView delegate
		 */
		/**
		 * Called when the user has entered a name, and wants to join the match
		 * @param aNickName
		 */
		joinGame: function(aNickName, aCharacterTheme)
		{
			// Create the message to send to the server
			var message = this.netChannel.composeCommand( this.config.CMDS.PLAYER_JOINED, { theme: aCharacterTheme, nickname: aNickName } );

			// Tell the server!
			this.netChannel.addMessageToQueue( true, message );
		},

		onRemoveClient: function()
		{
			this.log( 'onRemoveClient: ', arguments );
		},

		onEndGame: function()
		{
			clearInterval(this.gameTickInterval);

			this.callSuper();
			this.netChannel.close();
			console.log("(AbstractClientGame) End Game" );
		},

		genericCommand: function()
		{
			this.log( 'genericCommand: ', arguments );
		},

		/**
		 * These methods When netchannel recieves and validates a message
		 * Anything we receive we can assume is valid
		 * This should be left more "low level" - so logic should not be added here other than mapping messages to functions
		 **/
		netChannelDidConnect: function (messageData)
		{
			// Copy the game properties from the server
			this.gameClock = messageData.gameClock;

			// we get a copy of the game model from the server to be extra efficient :-), so set it
			this.setModel( messageData.gameModel );

			this.view.showIntro();
		},

		netChannelDidReceiveMessage: function (messageData)
		{
			console.log( "received message: ", messageData );
			// TODO: Handle array of 'cmds'
			// TODO: prep for cmds: send only the client ID and the message data
			this.CMD_TO_FUNCTION[messageData.cmds.cmd].apply(this,[messageData.id, messageData.cmds.data]);
		},

		netChannelDidDisconnect: function (messageData)
		{
			if(this.view) // If the server was never online, then we never had a view to begin with
				this.view.serverOffline();
		}
	});
};


define(['lib/Vector',
	'network/NetChannel', 
	'view/GameView',
	'lib/Joystick',
	'controllers/AbstractGame',
	'factories/TraitFactory',
	'lib/caat',
	'lib/jsclass/core',], init);
