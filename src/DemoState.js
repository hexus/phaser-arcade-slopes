var DemoState = (function (Phaser) {
	
	/**
	 * @augments {Phaser.State}
	 */
	var DemoState = function () {
		var state = this;
		
		// Feature configuration values that we'll use to control our game state
		this.features = {
			// Arcade slopes
			slopes: true,
			heuristics: true,
			minimumOffsetY: false,
			pullUp: 0,
			pullDown: 0,
			pullLeft: 0,
			pullRight: 0,
			snapUp: 0,
			snapDown: 0,
			snapLeft: 0,
			snapRight: 0,
			
			// Camera controls
			cameraZoom: 1.0,
			cameraMicroZoom: 0.0,
			cameraRotation: 0.0,
			cameraMicroRotation: 0.0,
			cameraLerp: 0.1,
			cameraFollow: true,
			cameraRoundPixels: true,
			cameraSpeed: 20,
			
			// Collision controls
			particleSelfCollide: 0,
			
			// Feature detection
			supports: {
				circleBody: !!Phaser.Physics.Arcade.Body.prototype.setCircle,
			},
			
			// Debug controls
			debugStepMode: function () {
				if (state.game.stepping) {
					state.game.disableStep();
				} else {
					state.game.enableStep();
				}
			},
			debugStep: function () {
				state.game.step();
			},
			debugLayers: false,
			debugLayersFullRedraw: true,
			debugPlayerBody: false,
			debugPlayerBodyInfo: false,
			debugParticleBodies: false,
			debugCameraInfo: false,
			debugInputInfo: false,
			
			// Player controls
			playerHeuristics: true,
			playerMinimumOffsetY: true,
			acceleration: 2000,
			dragX: 1200,
			dragY: 0,
			bounceX: 0,
			bounceY: 0,
			frictionX: 0,
			frictionY: 0,
			jump: 500,
			wallJump: 350,
			shape: 'aabb',
			size: 96,
			anchorX: 0.5,
			anchorY: 0.5,
			
			// Particle controls
			particleFlow: false,
			particleGravity: true,
			particleSelfCollide : false,
			particleMinX: -500,
			particleMaxX: 500,
			particleMinY: -500,
			particleMaxY: 500,
			particleShape: 'circle',
			particleSize: 16,
			particleFrequency: 20,
			particleQuantity: 5,
			emitterWidth: 0.8,
			emitterHeight: 0.8,
			fireParticle: function () {
				state.emitter.emitParticle();
			},
			
			// Tilemaps
			tilemapOffsetX1: 0,
			tilemapOffsetY1: 0,
			tilemapOffsetX2: 0,
			tilemapOffsetY2: 0,
			
			// World
			gravity: 1000,
			enableGravity: true,
			
			// Fun
			slowMotion: 1,
			debug: 0,
		};
	};
	
	DemoState.prototype = {
		
		preload: function () {
			// Load our assets (a demo map and two tilesets)
			this.load.tilemap('demo-tilemap', 'assets/maps/demo2.json', null, Phaser.Tilemap.TILED_JSON);
			this.load.spritesheet('arcade-slopes-spritesheet', 'assets/tilesets/arcade-slopes-32-white-8.png', 32, 32);
		},
		
		create: function () {
			// I always have this on :)
			this.time.advancedTiming = true;
			
			// Start up Arcade Physics
			this.physics.startSystem(Phaser.Physics.ARCADE);
			
			// Give it a bit of a boost ;)
			this.game.arcadeSlopesPlugin = this.game.plugins.add(Phaser.Plugin.ArcadeSlopes);
			
			// Set the stage background colour
			this.stage.backgroundColor = '#8d549b';
			
			// Create the tilemap object from the map JSON data
			this.map = this.add.tilemap('demo-tilemap');
			
			// Attach the tileset images to the tilesets defined in the tilemap
			this.map.addTilesetImage('arcade-slopes-32-white-8', 'arcade-slopes-spritesheet');
			
			// Create TilemapLayer objects from the collision layers of the map
			this.ground = this.map.createLayer('collision');
			this.ground2 = this.map.createLayer('collision2');
			this.ground.resizeWorld();
			
			// Enable collision between the appropriate tile indices for each
			// layer in the map
			this.map.setCollisionBetween(1, 38, true, 'collision');
			this.map.setCollisionBetween(1, 38, true, 'collision2');
			
			var newSlopesVersion = compareVersions(Phaser.Plugin.ArcadeSlopes.VERSION, '0.2.0-beta') >= 0;
			var slopeMap = newSlopesVersion ? 'arcadeslopes' : {
				1: 'FULL',
				2: 'HALF_TOP',
				3: 'HALF_BOTTOM',
				4: 'HALF_LEFT',
				5: 'HALF_RIGHT',
				6: 'HALF_BOTTOM_LEFT',
				7: 'HALF_BOTTOM_RIGHT',
				8: 'HALF_TOP_LEFT',
				9: 'HALF_TOP_RIGHT',
				10: 'QUARTER_TOP_LEFT_HIGH',
				11: 'QUARTER_TOP_LEFT_LOW',
				12: 'QUARTER_TOP_RIGHT_LOW',
				13: 'QUARTER_TOP_RIGHT_HIGH',
				14: 'QUARTER_BOTTOM_LEFT_HIGH',
				15: 'QUARTER_BOTTOM_LEFT_LOW',
				16: 'QUARTER_BOTTOM_RIGHT_LOW',
				17: 'QUARTER_BOTTOM_RIGHT_HIGH',
				18: 'QUARTER_LEFT_BOTTOM_HIGH',
				19: 'QUARTER_RIGHT_BOTTOM_HIGH',
				20: 'QUARTER_LEFT_TOP_HIGH',
				21: 'QUARTER_RIGHT_TOP_HIGH',
				35: 'QUARTER_LEFT_BOTTOM_LOW',
				36: 'QUARTER_RIGHT_BOTTOM_LOW',
				37: 'QUARTER_LEFT_TOP_LOW',
				38: 'QUARTER_RIGHT_TOP_LOW'
			};
			
			// Map Arcade Slopes tile types to the correct tilesets, preparing
			// slope data for each tile in the layers
			this.game.slopes.convertTilemapLayer(this.ground, slopeMap);
			this.game.slopes.convertTilemapLayer(this.ground2, slopeMap);
			
			// Create a player sprite
			this.player = this.add.sprite(925, 360);
			this.player.name = 'player';
			
			// Create a graphics object for the player
			this.playerGraphics = new Phaser.Graphics(this.game);
			
			// Generate a texture for the player and give it a physics body
			this.updatePlayer(this.player);
			
			// Set the gravity
			this.physics.arcade.gravity.y = 1000;
			
			// Add a touch of tile padding for the collision detection
			this.player.body.tilePadding.x = 1;
			this.player.body.tilePadding.y = 1;
			
			// Set the initial properties of the player's physics body
			this.player.body.drag.x = this.features.dragX;
			this.player.body.bounce.x = this.features.bounceX;
			this.player.body.bounce.y = this.features.bounceY;
			this.player.body.slopes.friction.x = this.features.frictionX;
			this.player.body.slopes.friction.y = this.features.frictionY;
			this.player.body.maxVelocity.x = 500;
			this.player.body.maxVelocity.y = 1000;
			this.player.body.collideWorldBounds = true;
			
			// Create a particle emitter and position it on the player
			this.emitter = this.add.emitter(this.player.x, this.player.y, 2000);
			
			// Particle graphics
			this.particleGraphics = new Phaser.Graphics(this.game)
				.beginFill(Phaser.Color.hexToRGB('#fff'), 0.5)
				.drawCircle(0, 0, 16);
			
			// Cache the particle graphics as an image
			this.cache.addImage('particle', null, this.particleGraphics.generateTexture().baseTexture.source);
			
			// Create 2000 particles using our newly cached image
			this.emitter.makeParticles('particle', 0, 2000, true, true);
			
			// Give each particle a circular collision body
			if (this.features.supports.circleBody) {
				this.emitter.forEach(function (particle) {
					particle.body.setCircle(8);
				});
			} else {
				this.emitter.forEach(function (particle) {
					particle.body.setSize(8, 8);
				});
			}
			
			// Attach Arcade Physics polygon data to the particle bodies
			this.game.slopes.enable(this.emitter);
			
			// Set some particle behaviours and properties
			this.emitter.gravity.y = -this.physics.arcade.gravity.y;
			this.emitter.bounce.set(1, 1);
			this.emitter.width = this.player.width;
			this.emitter.height = this.player.height;
			this.emitter.setAlpha(1, 0, 6000);
			this.emitter.setRotation(0, 0);
			this.emitter.setXSpeed(500, 500);
			this.emitter.setYSpeed(0, 0);
			this.emitter._flowTotal = -1;
			
			// Map some keys for use in our update() loop
			this.controls = this.input.keyboard.addKeys({
				'up': Phaser.KeyCode.W,
				'down': Phaser.KeyCode.S,
				'left': Phaser.KeyCode.A,
				'right': Phaser.KeyCode.D,
				'follow': Phaser.KeyCode.F,
				'gravity': Phaser.KeyCode.G,
				'controls': Phaser.KeyCode.C,
				'particles': Phaser.KeyCode.J,
				'toggle': Phaser.KeyCode.K,
				'pause': Phaser.KeyCode.SPACEBAR,
				'cameraUp': Phaser.KeyCode.UP,
				'cameraDown': Phaser.KeyCode.DOWN,
				'cameraLeft': Phaser.KeyCode.LEFT,
				'cameraRight': Phaser.KeyCode.RIGHT
			});
			
			// Follow the player with the camera
			this.camera.follow(this.player);
			
			// Smooth out the camera movement with linear interpolation (lerp)
			this.camera.lerp.setTo(this.features.cameraLerp);
			
			var that = this;
			
			// Register a pointer input event handler that teleports the player
			this.input.onDown.add(function (pointer, mouseEvent) {
				that.player.position.x = pointer.worldX;
				that.player.position.y = pointer.worldY;
				
				// Reset the player's velocity
				that.player.body.velocity.set(0);
			});
			
			// Register a pause handler for Arcade Physics
			this.controls.pause.onDown.add(function () {
				this.physics.arcade.isPaused = !this.physics.arcade.isPaused;
			}, this);
			
			// Register a particle toggle handler
			this.controls.particles.onDown.add(function () {
				that.features.particleFlow = !that.features.particleFlow;
			});
			
			// Prevent the debug text from rendering with a shadow
			this.game.debug.renderShadow = false;
		},
		
		updatePlayer: function (player) {
			var features = this.features;
			var graphics = this.playerGraphics;
			var size = features.size;
			var halfSize = Math.floor(features.size * 0.5);
			
			// Update the player's anchor
			player.anchor.set(features.anchorX, features.anchorY);
			
			// Determine whether we need to update the player
			if (player.body && player.body.height === features.size && ((player.body.isCircle && features.shape === 'circle') || (!player.body.isCircle && features.shape === 'aabb'))) {
				// If the player has a body, and the body's height and shape
				// haven't changed, we don't need to update it
				return;
			}
			
			// Enable physics for the player (give it a physics body)
			this.physics.arcade.enable(player);
			
			// Start the graphics instructions
			graphics.clear();
			graphics._currentBounds = null; // Get Phaser to behave
			graphics.beginFill(Phaser.Color.hexToRGB('#e3cce9'), 1);
			
			// Set a circular physics body
			if (features.shape == 'circle') {
				player.body.setCircle(halfSize);
				graphics.drawCircle(0, 0, features.size);
			}
			
			// Set an AABB physics body
			if (features.shape === 'aabb') {
				player.body.setSize(halfSize, size);
				graphics.drawRect(0, 0, halfSize, size);
			}
			
			// Create a Pixi texture from the graphics and give it to the player
			player.setTexture(graphics.generateTexture(), true);
			
			// We don't have to update the player sprite size, but it's good to
			if (features.shape === 'aabb') {
				player.width = halfSize;
				player.height = size;
			}
			
			if (features.shape === 'circle') {
				player.width = size;
				player.height = size;
			}
			
			// Enable Arcade Slopes physics
			if (this.game.slopes) {
				this.game.slopes.enable(player);
			}
		},
		
		updateEmitter: function (emitter) {
			if (!emitter.children.length) {
				return;
			}
			
			var features = this.features;
			var graphics = this.particleGraphics;
			var size = features.particleSize;
			var halfSize = size / 2;
			var quarterSize = halfSize / 2;
			var firstParticle = emitter.children[0];
			
			// Update the speed range allowed for particles
			this.emitter.setXSpeed(features.particleMinX, features.particleMaxX);
			this.emitter.setYSpeed(features.particleMinY, features.particleMaxY);
			
			// If the particle size option hasn't changed we can finish here
			if (firstParticle.body.height === size && ((firstParticle.body.isCircle && features.shape === 'circle') || (!firstParticle.body.isCircle && features.shape === 'aabb'))) {
				return;
			}
			
			// Draw the particle graphics
			graphics.clear();
			graphics._currentBounds = null; // Get Phaser to behave
			
			graphics.beginFill(Phaser.Color.hexToRGB('#fff'), 0.5)
			
			if (features.particleShape === 'circle') {
				graphics.drawCircle(0, 0, size)
			}
			
			if (features.particleShape === 'aabb') {
				graphics.drawRect(0, 0, size, size)
			}
			
			graphics.updateLocalBounds();
			
			// Cache the graphics as a texture to our particle image cache key
			this.cache.addImage('particle', null, graphics.generateTexture().baseTexture.source);
			
			// Update the body and texture of every particle in the emitter
			emitter.forEach(function (particle) {
				if (features.particleShape === 'circle') {
					particle.body.setCircle(halfSize);
					features.particleShape = 'aabb';
				}
				
				if (features.particleShape === 'aabb') {
					particle.body.setSize(size, size);
				}
				
				particle.loadTexture('particle');
			});
			
			if (this.game.slopes) {
				this.game.slopes.enable(emitter);
			}
		},
		
		update: function () {
			// Define some shortcuts to some useful objects
			var body = this.player.body;
			var camera = this.camera;
			var gravity = this.physics.arcade.gravity;
			var blocked = body.blocked;
			var touching = body.touching;
			var controls = this.controls;
			var features = this.features;
			
			// Phaser feature detection fallbacks
			features.shape = features.shape === 'circle' && !features.supports.circleBody ? 'aabb' : features.shape;
			features.particleShape = features.particleShape === 'circle' && !features.supports.circleBody ? 'aabb' : features.particleShape;
			
			// Update the player
			this.updatePlayer(this.player);
			
			// Update the particle emitter
			this.updateEmitter(this.emitter);
			
			// Update slow motion values; these two are great fun together
			// ( ͡° ͜ʖ ͡°)
			if (this.time.slowMotion !== features.slowMotion) {
				this.time.slowMotion = features.slowMotion;
				this.time.desiredFps = 60 + (features.slowMotion > 1 ? features.slowMotion * 20 : 0);
			}
			
			// Update camera zoom and rotation
			camera.scale.set(
				features.cameraZoom + features.cameraMicroZoom
			);
			camera.rotation = Phaser.Math.degToRad(
				features.cameraRotation + features.cameraMicroRotation
			);
			// this.game.input.scale.set(
			// 	1.0 / (features.cameraZoom + features.cameraMicroZoom)
			// );
			
			// Update camera linear interpolation and pixel rounding
			camera.lerp.set(features.cameraLerp);
			camera.roundPx = features.cameraRoundPixels;
			this.game.renderer.renderSession.roundPixels = features.cameraRoundPixels;
			
			// Toggle camera follow
			if (features.cameraFollow && !camera.target) {
				camera.follow(this.player);
				camera.lerp.set(0.2);
			}
			
			if (!features.cameraFollow && camera.target) {
				camera.unfollow();
			}
			
			// Toggle gravity
			if (controls.gravity.justDown) {
				features.enableGravity = !features.enableGravity;
			}
			
			// Update gravity
			if (features.enableGravity) {
				gravity.y = features.gravity;
			} else {
				gravity.y = 0;
			}
			
			// Update global Arcade Slopes options
			if (this.game.slopes) {
				this.game.slopes.preferY    = features.minimumOffsetY;
				this.game.slopes.heuristics = features.heuristics;
			}
			
			// Update player body properties
			body.drag.x = features.dragX;
			body.drag.y = features.dragY;
			body.bounce.x = features.bounceX;
			body.bounce.y = features.bounceY;
			
			// Update player body Arcade Slopes properties
			body.slopes.friction.x = features.frictionX;
			body.slopes.friction.y = features.frictionY;
			body.slopes.preferY    = features.playerMinimumOffsetY;
			body.slopes.heuristics = features.playerHeuristics;
			body.slopes.pullUp     = features.pullUp;
			body.slopes.pullDown   = features.pullDown;
			body.slopes.pullLeft   = features.pullLeft;
			body.slopes.pullRight  = features.pullRight;
			body.slopes.snapUp     = features.snapUp;
			body.slopes.snapDown   = features.snapDown;
			body.slopes.snapLeft   = features.snapLeft;
			body.slopes.snapRight  = features.snapRight;
			
			// Offset the tilemap layers
			if (this.ground.tileOffset) {
				this.ground.tileOffset.x = features.tilemapOffsetX1;
				this.ground.tileOffset.y = features.tilemapOffsetY1;
				this.ground2.tileOffset.x = features.tilemapOffsetX2;
				this.ground2.tileOffset.y = features.tilemapOffsetY2;
			}
			
			// Debug rendering for the tilemaps
			this.ground.debug = features.debugLayers;
			this.ground2.debug = this.ground.debug;
			
			// Full redraw for the tilemaps
			this.ground.debugSettings.dirty = features.debugLayersFullRedraw;
			this.ground2.debugSettings.dirty = features.debugLayersFullRedraw;
			this.ground.debugSettings.forceFullRedraw = features.debugLayersFullRedraw;
			this.ground2.debugSettings.forceFullRedraw = features.debugLayersFullRedraw;
			
			// Keep the particle emitter attached to the player (though there's
			// probably a better way than this)
			this.emitter.x = this.player.x;
			this.emitter.y = this.player.y;
			this.emitter.width = this.player.width * features.emitterWidth;
			this.emitter.height = this.player.height * features.emitterHeight;
			
			// Update particle lifespan
			this.emitter.lifespan = 3000 / this.time.slowMotion;
			
			// This provides a much better slow motion effect for particles, but
			// because this only affects newly spawned particles, old particles
			// can take ages to die after returning to normal timing
			// TODO: Try updating the lifespan of every particle when slowmotion
			//       changes, in set intervals to avoid it being super slow
			//this.emitter.lifespan = 3000 * this.time.slowMotion;
			//this.emitter.frequency = 1 * this.time.slowMotion;
			//this.emitter.setAlpha(1, 0, 3000 * this.time.slowMotion);
			
			// Ensure that all new particles defy gravity
			if (!features.particleGravity) {
				this.emitter.gravity.y = -this.physics.arcade.gravity.y;
			} else {
				this.emitter.gravity.y = 0;
			}
			
			// Toggle particle flow
			this.emitter.on = !!features.particleFlow;
			this.emitter.lifespan = 3000 / this.time.slowMotion;
			this.emitter.frequency = features.particleFrequency;
			
			if (this.emitter._flowQuantity !== features.particleQuantity) {
				this.emitter._flowQuantity = features.particleQuantity;
				this.emitter._counter = 0;
				this.emitter._timer = this.game.time.time + this.emitter.frequency * this.game.time.slowMotion;
			}
			
			// Toggle the Arcade Slopes plugin itself
			if (features.slopes && !this.game.slopes) {
				this.game.arcadeSlopesPlugin = this.game.plugins.add(Phaser.Plugin.ArcadeSlopes);
			}
			
			if (!features.slopes && this.game.slopes) {
				this.game.plugins.remove(this.game.arcadeSlopesPlugin);
				this.game.arcadeSlopes = null;
			}
			
			// Camera shake for the fun of it
			if (this.input.keyboard.isDown(Phaser.KeyCode.H)) {
				camera.shake(0.005, 50); // :sunglasses:
			}
			
			// Collide the player against the collision layer
			this.physics.arcade.collide(this.player, this.ground);
			this.physics.arcade.collide(this.player, this.ground2);
			
			// Collide the player against the particles
			//this.physics.arcade.collide(this.emitter, this.player);
			
			// Collide the particles against each other
			if (features.particleSelfCollide) {
				this.physics.arcade.collide(this.emitter);
			}
			
			// Collide the particles against the collision layer
			this.physics.arcade.collide(this.emitter, this.ground, function (particle, tile) {
				//console.log(particle.body.slopes);
			});
			
			// Move the camera
			if (controls.cameraUp.isDown) {
				camera.y -= features.cameraSpeed;
			}
			
			if (controls.cameraDown.isDown) {
				camera.y += features.cameraSpeed;
			}
			
			if (controls.cameraLeft.isDown) {
				camera.x -= features.cameraSpeed;
			}
			
			if (controls.cameraRight.isDown) {
				camera.x += features.cameraSpeed;
			}
			
			// Reset the player acceleration
			body.acceleration.x = 0;
			body.acceleration.y = 0;
			
			// Accelerate left
			if (controls.left.isDown) {
				body.acceleration.x = -features.acceleration;
			}
			
			// Accelerate right
			if (controls.right.isDown) {
				body.acceleration.x = features.acceleration;
			}
			
			// Accelerate or jump up
			if (controls.up.isDown) {
				if (features.jump) {
					if (gravity.y > 0 && (blocked.down || touching.down)) {
						body.velocity.y = -features.jump;
					}
				}
				
				if (!features.jump || gravity.y <= 0){
					body.acceleration.y = -Math.abs(gravity.y) - features.acceleration;
				}
			}
			
			// Accelerate down or jump down
			if (controls.down.isDown) {
				if (features.jump) {
					if (gravity.y < 0 && (blocked.up || touching.up)) {
						body.velocity.y = features.jump;
					}
				}
				
				if (!features.jump || gravity.y >= 0){
					body.acceleration.y = Math.abs(gravity.y) + features.acceleration;
				}
			}
			
			// Wall jump
			if (features.wallJump && (controls.up.isDown && gravity.y > 0) || (controls.down.isDown && gravity.y < 0)) {
				if (!(blocked.down || blocked.up || touching.up)) {
					// Would be even better to use collision normals here
					if (blocked.left || touching.left) {
						body.velocity.x = features.wallJump;
						body.velocity.y = gravity.y < 0 ? features.jump : -features.jump;
					}
					
					if (blocked.right || touching.right) {
						body.velocity.x = -features.wallJump;
						body.velocity.y = gravity.y < 0 ? features.jump : -features.jump;
					}
				}
			}
			
			// Stick to ceilings!
			//if (controls.up.isDown && blocked.up) {
			//	body.velocity.y = -50;
			//}
		},
		
		render: function () {
			var debug = this.game.debug;
			var controls = this.controls;
			var features = this.features;
			
			// Render the frame rate
			debug.text(this.time.fps || '--', 4, 16, "#ffffff");
			
			// Render the keyboard controls
			if (controls.controls.isDown) {
				debug.start(32, 196, '#fff', 64);
				debug.line('Click:', 'Teleport');
				debug.line('WASD:', 'Move/jump');
				debug.line('Arrows:', 'Move the camera');
				debug.line('Space:', 'Pause physics');
				debug.line('F:', 'Toggle camera follow');
				debug.line('G:', 'Toggle gravity');
				debug.line('J:', 'Toggle particles');
				debug.line('K:', 'Toggle Arcade Slopes plugin');
				debug.line('C:', 'Show these controls');
				debug.stop();
			}
			
			// Render some debug information about the input, player and camera
			if (features.debugPlayerBody) {
				debug.body(this.player);
			}
			
			if (features.debugPlayerBodyInfo) {
				debug.bodyInfo(this.player, 32, 32);
			}
			
			if (features.debugCameraInfo) {
				debug.cameraInfo(this.camera, 32, 550);
			}
			
			if (features.debugInputInfo) {
				debug.inputInfo(540, 550);
			}
			
			if (features.debugParticleBodies) {
				this.emitter.forEachAlive(function (particle) {
					debug.body(particle);
				});
			}
		}
		
	};
	
	return DemoState;
})(Phaser);
