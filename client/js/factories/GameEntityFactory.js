/**
 File:
 	GameEntityFactory.js
 Created By:
	 Mario Gonzalez
 Project	:
	 Ogilvy Holiday Card 2010
 Abstract:
 	GameEntityFactory is in charge of creating GameEntities
 Basic Usage:
	 // TODO: FILL OUT
 */

var init = function(Vector, Rectangle, GameEntity, Character, Projectile)
{
	return new JS.Class(
	{
		/**
		 * Creates an instance of the GameEntityFactory
		 * @param aFieldController
		 */
		initialize: function(aFieldController)
		{
		    this.fieldController = aFieldController;

			this.entityTypes = new SortedLookupTable();
			this.entityTypes.setObjectForKey(GameEntity, 'GameEntity');
			this.entityTypes.setObjectForKey(Character, 'Character');
			this.entityTypes.setObjectForKey(Projectile, 'Projectile');

			this.collisionBitmask = {
				'None': 0,
				'Character':  1 << 0,
				'Projectile': 1 << 1,
				'CollidableLevelObject': 1 << 2
			};

		},

		createProjectile: function(anObjectID, aClientID, aProjectileModel, aFieldController)
		{
			//this.entityTypes.objectForKey(aCharacterType); // Retrieve class from sorted table
			var projectile = new Projectile(anObjectID, aClientID, aFieldController, aProjectileModel, 1);

			// Should snowballs collide with one another? 
			projectile.collisionBitfield = this.collisionBitmask.Character | this.collisionBitmask.CollidableLevelObject;

			return projectile;
		},

		createCharacter: function(anObjectID, aClientID, aFieldController)
		{
			var aNewCharacter = new Character(anObjectID, aClientID, aFieldController);

			// Collide against other characters, projectiles, and level objects
			aNewCharacter.collisionBitfield = this.collisionBitmask.Character | this.collisionBitmask.Projectile | this.collisionBitmask.CollidableLevelObject;
			return aNewCharacter;
		}
	});
};

if (typeof window === 'undefined')
{
	// We're in node!
	require('../lib/jsclass/core.js');
	require('../lib/Vector');
	require('../lib/Rectangle');
	require('../controllers/entities/GameEntity');
	require('../controllers/entities/Character');
	require('../controllers/entities/Projectile');
	
	GameEntityFactory = init(Vector, Rectangle, GameEntity, Character, Projectile);
}
else
{
	// We're on the browser.
	// Require.js will use this file's name (CharacterController.js), to create a new
	define(['lib/Vector',
		'lib/Rectangle',
		'controllers/entities/GameEntity',
		'controllers/entities/Character',
		'controllers/entities/Projectile',
		'lib/jsclass/core'], init);
}