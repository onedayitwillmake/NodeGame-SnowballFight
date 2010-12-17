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
require('js/factories/TraitFactory');
require('js/model/ProjectileModel');
require('js/lib/SortedLookupTable');
require('js/lib/Vector');
SnowGame = (function()
{
	return new JS.Class(AbstractServerGame, {
		initialize: function(aServer, portNumber)
		{
			this.callSuper();
			var that = this;

			this.traitFactory = TraitFactory;

			// Listen for collisions
			var collisionManager = this.fieldController.getCollisionManager();
			collisionManager.eventEmitter.on('collision', function() { that.onCollision.apply(that, arguments) });

			// Create the worlds best level of anything ever
			this.createLevel();
			this.initializePresents();
		},

		initializePresents: function()
		{
			this.presentsActive = new SortedLookupTable();
			this.presentsTimer = 0;
			this.presentsTotalSpawned = 0;
			this.spawnPresents();
		},

		/**
		 * Initialization
		 */
		createLevel: function()
		{
//			this.createDummyPlayers();
			var aFieldEntity,
				aFieldEntityModel;

			var rand = 2;//Math.floor(Math.random() * 2) + 1;

			var entities = this['getBattlefield'+rand]();


 			for( var i = 0; i < entities.length; i++ ) {
				var nextEntity = entities[ i ];
				aFieldEntityModel = nextEntity.entityType;
				aFieldEntityModel.initialPosition = nextEntity.position;
				aFieldEntity = this.entityFactory.createFieldEntity(this.getNextEntityID(), 0, aFieldEntityModel, this.fieldController);

				 var animateInTrait = TraitFactory.createTraitWithName('EntityTraitAnimateIn');
				aFieldEntity.addTraitAndExecute( new animateInTrait() );

				this.fieldController.addEntity(aFieldEntity);
			}
		},

		/**
		 * Events
		 */
		onCollision: function(circleA, circleB, collisionNormal)
		{
			// Debug, friendly name for when debugging
			var tAFriendly = EntityModel.ENTITY_NAME_FRIENDLY[String(circleA.view.entityType)];
			var tBFriendly = EntityModel.ENTITY_NAME_FRIENDLY[String(circleB.view.entityType)];

			var tList = EntityModel.ENTITY_MAP;
			var tA = circleA.view.entityType;	// circleA entityType
			var tB = circleB.view.entityType;	// circleB entityType
			var tC = tA | tB;					// entityType of combined

			// [Character and Projectile]
			var character, projectile, fieldEntity;
			if(tC === (tList.CHARACTER | tList.PROJECTILE) )
			{
				character = (tA & tList.CHARACTER) ? circleA : circleB;
				projectile = (character === circleA)  ? circleB : circleA;


				// Give some points to the owner
				var projectileOwner = this.fieldController.getPlayerWithClientID(projectile.view.clientID);
				if(projectileOwner)
				{
					projectileOwner.score += this.server.gameConfig.SCORING.HIT;
					projectileOwner.scoreMultiplier = Math.min(projectileOwner.scoreMultiplier, this.server.gameConfig.SCORING.MAX_MULTIPLIER);

					// Reset the multiplier of the person who was hit
					character.scoreMultiplier = 1;

				} else { // It's a present, (which also means it's owned by the server
					projectile.view.transferredTraits = this.traitFactory.getRandomPresentTrait();
					projectile.view.clientID = -1; // Set to clientID -1, which will cause it to be removed by connected clients
					this.presentsActive.remove(projectile.view.objectID);
				}


				// Apply the projectile's trait(s) to the character that was hit
				var Trait = this.traitFactory.createTraitWithName(projectile.view.transferredTraits);
				character.view.addTraitAndExecute( new Trait(collisionNormal) );

				this.fieldController.removeEntity(projectile.view.objectID);
			}
			// [Projectile vs FIELD_ENTITY]
			else if(tC === (tList.FIELD_ENTITY | tList.PROJECTILE) )
			{

				fieldEntity = (tA & tList.FIELD_ENTITY) ? circleA : circleB;
				projectile = (fieldEntity === circleA)  ? circleB : circleA;
				this.fieldController.removeEntity(projectile.view.objectID);
			}
		},

		spawnPresents: function()
		{
			// restart the timer
			var that = this;
			var minTime = 1000;
			var timeRange = 6000;
			var chance = 0.25;
			clearTimeout(this.presentsTimer);
		 	this.presentsTimer = setTimeout( function() { that.spawnPresents()}, Math.random() * timeRange + minTime);

//			Try to create if possible and luck says so
			if(Math.random() < chance || this.presentsActive.count() >= GAMECONFIG.PRESENTS_SETTING.PRESENTS_MAX )
				return;

			// Presents are really just projectiles that don't move
			// For now always fire the regular snowball
			var projectileModel = ProjectileModel.present;
			projectileModel.force = 0 ; // TODO: Use force gauge
			projectileModel.initialPosition = this.fieldController.positionEntityAtRandomNonOverlappingLocation( 65 );
			projectileModel.angle = 0;

			// Seit to so that it goes to 1 of x random sprites in the sheet
			var numRows = GAMECONFIG.ENTITY_MODEL.CAAT_THEME_MAP[projectileModel.theme].rowCount-1;
			projectileModel.theme = 400 + Math.floor( Math.random() * numRows+1 );

			// Create the present
			var present = this.entityFactory.createProjectile(this.getNextEntityID(), 0, projectileModel, this);
			this.fieldController.addEntity(present);

			
			var animateInTrait = TraitFactory.createTraitWithName('EntityTraitAnimateIn');
			present.addTraitAndExecute( new animateInTrait() );

			
			// Add to our list
			this.presentsActive.setObjectForKey(present, present.objectID);
		},

		createDummyPlayers: function()
		{
			var allCharacterModels = [];
			for(var obj in GAMECONFIG.CHARACTER_MODEL) {
				var model = GAMECONFIG.CHARACTER_MODEL['snowman'];
				allCharacterModels.push(model);
			}

			for(var i = 0; i < 3; i++) {
				var index = Math.random() * allCharacterModels.length;
					index = Math.floor(index);

				var charModel = allCharacterModels[index];
				charModel.initialPosition = {x: Math.random() * this.model.width, y: Math.random() * this.model.height};

				var character = this.shouldAddPlayer(this.getNextEntityID(), 0, charModel);
				character.position.x = charModel.initialPosition.x;
				character.position.y = charModel.initialPosition.y;
			}
		},


		/**
		 * Levels
		 */
		getDevelopersLevel: function()
		{
			return [
				// { position: { x: 100, y: 100 }, entityType: FieldEntityModel.gingerBreadHouse },
				{ position: { x: 450, y: 250 }, entityType: FieldEntityModel.iceMountainOgilvyFlag },
				{ position: { x: 100, y: 100 }, entityType: FieldEntityModel.blockOfIce1 }
			];
		},

		getAllFieldEntitiesAsLevel: function()
		{
			return [
				{ position: { x: 100, y: 100 }, entityType: FieldEntityModel.gingerBreadHouse },
				{ position: { x: 250, y: 80 }, entityType: FieldEntityModel.blockOfIce1 },
				{ position: { x: 320, y: 80 }, entityType: FieldEntityModel.blockOfIce2 },
				{ position: { x: 380, y: 80 }, entityType: FieldEntityModel.blockOfIce3 },
				{ position: { x: 500, y: 80 }, entityType: FieldEntityModel.blockOfIce4 },
				{ position: { x: 620, y: 80 }, entityType: FieldEntityModel.blockOfIce5 },
				{ position: { x: 740, y: 80 }, entityType: FieldEntityModel.blockOfIce6 },
				{ position: { x: 100, y: 300 }, entityType: FieldEntityModel.iceMountainOgilvyFlag },
				{ position: { x: 300, y: 300 }, entityType: FieldEntityModel.iglooGreenFlag },
				{ position: { x: 550, y: 260 }, entityType: FieldEntityModel.lakeHorizontalBridge },
				{ position: { x: 760, y: 260 }, entityType: FieldEntityModel.lakeVerticalBridge },
				{ position: { x: 100, y: 500 }, entityType: FieldEntityModel.smallPond1 },
				{ position: { x: 230, y: 500 }, entityType: FieldEntityModel.smallPond2 },
				{ position: { x: 380, y: 500 }, entityType: FieldEntityModel.smallPond3 },
				{ position: { x: 580, y: 480 }, entityType: FieldEntityModel.largePond1 },
				{ position: { x: 780, y: 500 }, entityType: FieldEntityModel.iglooRedFlag }
			];
		},

		getBattlefield1: function()
		{
		  return [
				  { position: { x: 425, y: 120 }, entityType: FieldEntityModel.iceMountainOgilvyFlag },
				  { position: { x: 426, y: 15 }, entityType: FieldEntityModel.blockOfIce3 },
				  { position: { x: 326, y: 35 }, entityType: FieldEntityModel.blockOfIce3 },
				  { position: { x: 526, y: 35 }, entityType: FieldEntityModel.blockOfIce3 },
				  { position: { x: 50, y: 220 }, entityType: FieldEntityModel.blockOfIce1 },
				  { position: { x: 850, y: 300 }, entityType: FieldEntityModel.blockOfIce4 },
				  { position: { x: 226, y: 550 }, entityType: FieldEntityModel.blockOfIce2 },
				  { position: { x: 526, y: 350 }, entityType: FieldEntityModel.smallPond2 }
				  ];

		},

		getBattlefield2: function()
		{
		  return [
				  { position: { x: 450, y: 275 }, entityType: FieldEntityModel.iceMountainOgilvyFlag },
				  { position: { x: 350, y: 225 }, entityType: FieldEntityModel.blockOfIce3 },
				  { position: { x: 550, y: 225 }, entityType: FieldEntityModel.blockOfIce3 },
				  { position: { x: 100, y: 100 }, entityType: FieldEntityModel.iglooGreenFlag },
				  { position: { x: 450, y: 170 }, entityType: FieldEntityModel.blockOfIce6 },
				  { position: { x: 50, y: 320 }, entityType: FieldEntityModel.blockOfIce1 },
				  { position: { x: 805, y: 520 }, entityType: FieldEntityModel.blockOfIce4 },
				  { position: { x: 226, y: 550 }, entityType: FieldEntityModel.blockOfIce2 },
				  { position: { x: 450, y: 540 }, entityType: FieldEntityModel.smallPond2 },
				  { position: { x: 750, y: 80 }, entityType: FieldEntityModel.blockOfIce1 },
				  { position: { x: 810, y: 250 }, entityType: FieldEntityModel.iglooRedFlag },
				  ];

		}
	});
})();
