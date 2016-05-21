var ArcadeSlopesDemo = (function(Phaser) {
	
	var ArcadeSlopesDemo = function () {
		// Feature configuration values that we'll use to control our game state
		this.features = {
			acceleration: 2000,
			gravity: 1000,
			enableGravity: true,
			dragX: 1200,
			dragY: 0,
			bounceX: 0,
			bounceY: 0,
			frictionX: 0,
			frictionY: 0,
			jump: 500,
			wallJump: 350,
			minimumOffsetY: 1,
			pullUp: 0,
			pullDown: 0,
			pullLeft: 0,
			pullRight: 0,
			snapUp: 0,
			snapDown: 0,
			snapLeft: 0,
			snapRight: 0,
			particleSelfCollide: 0,
			slowMotion: 1,
			debug: 0,
		};
	};
	
	ArcadeSlopesDemo.prototype = {
		
		preload: function () {
			// Load our assets (a demo map and two tilesheet choices)
			this.load.tilemap('demo-tilemap', 'assets/maps/demo.json', null, Phaser.Tilemap.TILED_JSON);
			this.load.spritesheet('pink-collision-spritesheet', 'assets/tilesheets/ninja-tiles32-pink.png', 32, 32);
			this.load.spritesheet('purple-collision-spritesheet', 'assets/tilesheets/ninja-tiles32-purple.png', 32, 32);
		},
		
		create: function () {
			// I always have this on :)
			this.time.advancedTiming = true;
			
			// Start up Arcade Physics
			this.physics.startSystem(Phaser.Physics.ARCADE);
			
			// Give it a bit of a boost ;)
			this.game.plugins.add(Phaser.Plugin.ArcadeSlopes);
			
			// Set the stage background colour
			this.stage.backgroundColor = '#8d549b';
			
			// Add the demo tilemap and attach a tilesheet for its collision layer
			this.map = this.add.tilemap('demo-tilemap');
			this.map.addTilesetImage('collision', 'pink-collision-spritesheet');
			
			// Uncomment these lines for a lighter background and darker tiles
			//this.stage.backgroundColor = '#ae7bb8';
			//this.map.addTilesetImage('collision', 'purple-collision-spritesheet');
			
			// Create a TilemapLayer object from the collision layer of the map
			this.ground = this.map.createLayer('collision');
			this.ground.resizeWorld();
			
			// Map Arcade Slopes tile types to Ninja Physics debug tilesheets,
			// preparing slope data for each of tile in the layer
			this.game.slopes.convertTilemapLayer(this.ground, {
				2:  'FULL',
				3:  'HALF_BOTTOM_LEFT',
				4:  'HALF_BOTTOM_RIGHT',
				6:  'HALF_TOP_LEFT',
				5:  'HALF_TOP_RIGHT',
				15: 'QUARTER_BOTTOM_LEFT_LOW',
				16: 'QUARTER_BOTTOM_RIGHT_LOW',
				17: 'QUARTER_TOP_RIGHT_LOW',
				18: 'QUARTER_TOP_LEFT_LOW',
				19: 'QUARTER_BOTTOM_LEFT_HIGH',
				20: 'QUARTER_BOTTOM_RIGHT_HIGH',
				21: 'QUARTER_TOP_RIGHT_HIGH',
				22: 'QUARTER_TOP_LEFT_HIGH',
				23: 'QUARTER_LEFT_BOTTOM_HIGH',
				24: 'QUARTER_RIGHT_BOTTOM_HIGH',
				25: 'QUARTER_RIGHT_TOP_LOW',
				26: 'QUARTER_LEFT_TOP_LOW',
				27: 'QUARTER_LEFT_BOTTOM_LOW',
				28: 'QUARTER_RIGHT_BOTTOM_LOW',
				29: 'QUARTER_RIGHT_TOP_HIGH',
				30: 'QUARTER_LEFT_TOP_HIGH',
				31: 'HALF_BOTTOM',
				32: 'HALF_RIGHT',
				33: 'HALF_TOP',
				34: 'HALF_LEFT'
			});
			
			// Enable collision between tile indexes 2 and 34
			this.map.setCollisionBetween(2, 34, true, 'collision');
			
			// Player graphics
			var playerGraphics = new Phaser.Graphics(this)
				.beginFill(Phaser.Color.hexToRGB('#e3cce9'), 1)
				.drawRect(0, 0, 48, 96);
				//.drawCircle(0, 0, 50); // Soon...
				//.drawRect(0, 0, 20, 20); // Be small
				//.drawRect(0, 0, 100, 200); // Be huge!
			
			// Create a Pixi texture from the graphics
			var playerGraphicsTexture = playerGraphics.generateTexture();
			
			// Create a player sprite from the texture
			this.player = this.add.sprite(768, 2800, playerGraphicsTexture);
			
			this.physics.arcade.gravity.y = 1000;
			
			this.physics.arcade.enable(this.player);
			this.game.slopes.enable(this.player);
			
			// Just a touch of tile padding
			this.player.body.tilePadding.x = 1;
			this.player.body.tilePadding.y = 1;
			
			this.player.body.drag.x = this.features.dragX;
			this.player.body.bounce.x = this.features.bounceX;
			this.player.body.bounce.y = this.features.bounceY;
			this.player.body.slopes.friction.x = 0;
			this.player.body.slopes.friction.y = 0;
			this.player.body.maxVelocity.x = 500;
			this.player.body.maxVelocity.y = 1000;
			this.player.body.collideWorldBounds = true;
			
			// Position our player
			this.player.position.set(240, 2464);
			
			// Create a particle emitter and position it on the player
			this.emitter = this.add.emitter(this.player.x, this.player.y, 2000);
			
			// Particle graphics
			var particleGraphics = new Phaser.Graphics(this)
				.beginFill(Phaser.Color.hexToRGB('#fff'), 0.5)
				.drawCircle(0, 0, 16);
			
			// Cache the particle graphics as an image
			this.cache.addImage('particle', null, particleGraphics.generateTexture().baseTexture.source);
			
			// Create 2000 particles using our newly cached image
			this.emitter.makeParticles('particle', 0, 2000, true, true);
			
			// Attach Arcade Physics polygon data to the particle bodies
			this.game.slopes.enable(this.emitter);
			
			// Set some particle behaviours and properties
			this.emitter.gravity = -this.physics.arcade.gravity.y;
			this.emitter.bounce.set(1, 1);
			this.emitter.width = this.player.width;
			this.emitter.height = this.player.height;
			this.emitter.setAlpha(1, 0, 6000);
			this.emitter.setXSpeed(-500, 500);
			this.emitter.setYSpeed(-500, 500);
			
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
				'toggle': Phaser.KeyCode.K
			});
			
			// Follow the player with the camera
			this.camera.follow(this.player);
			
			// Words cannot describe how much I love having this built in
			this.camera.lerp.setTo(0.2, 0.2);
			
			var that = this;
			
			// Register a pointer input event handler that teleports the player
			this.input.onDown.add(function (pointer, mouseEvent) {
				that.player.position.x = pointer.worldX - that.player.width / 2;
				that.player.position.y = pointer.worldY - that.player.height / 2;
				
				// Reset the player's velocity
				that.player.body.velocity.set(0);
			});
			
			// Prevent the debug text from rendering with a shadow
			this.game.debug.renderShadow = false;
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
			
			// Update slow motion values; these two are great fun together
			// ( ͡° ͜ʖ ͡°)
			if (this.time.slowMotion !== features.slowMotion) {
				this.time.slowMotion = features.slowMotion;
				this.time.desiredFps = 60 + (features.slowMotion > 1 ? features.slowMotion * 20 : 0);
			}
			
			// Toggle camera follow
			if (controls.follow.justDown) {
				if (camera.target) {
					camera.unfollow();
				} else {
					camera.follow(this.player);
				}
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
			
			// Update player body properties
			body.drag.x = features.dragX;
			body.drag.y = features.dragY;
			body.bounce.x = features.bounceX;
			body.bounce.y = features.bounceY;
			
			// Update player body Arcade Slopes properties
			body.slopes.friction.x = features.frictionX;
			body.slopes.friction.y = features.frictionY;
			body.slopes.preferY    = this.features.minimumOffsetY;
			body.slopes.pullUp     = this.features.pullUp;
			body.slopes.pullDown   = this.features.pullDown;
			body.slopes.pullLeft   = this.features.pullLeft;
			body.slopes.pullRight  = this.features.pullRight;
			body.slopes.snapUp     = this.features.snapUp;
			body.slopes.snapDown   = this.features.snapDown;
			body.slopes.snapLeft   = this.features.snapLeft;
			body.slopes.snapRight  = this.features.snapRight;
			
			// Keep the particle emitter attached to the player (though there's
			// probably a better way than this)
			this.emitter.x = this.player.x + body.halfWidth;
			this.emitter.y = this.player.y + body.halfHeight;
			
			// Update particle lifespan
			this.emitter.lifespan = 3000 / this.time.slowMotion;
			
			// Ensure that all new particles defy gravity
			this.emitter.gravity = -this.physics.arcade.gravity.y;
			
			// Toggle particle flow
			if (controls.particles.justDown) {
				if (this.emitter.on) {
					this.emitter.kill();
				} else {
					this.emitter.flow(3000 / this.time.slowMotion, 1, 5);
				}
			}
			
			// Toggle the Arcade Slopes plugin itself
			if (controls.toggle.justDown) {
				if (this.game.slopes) {
					this.game.plugins.remove(this.game.slopes);
				} else {
					this.game.plugins.add(Phaser.Plugin.ArcadeSlopes);
				}
			}
			
			// Camera shake for the fun of it
			if (this.input.keyboard.isDown(Phaser.KeyCode.H)) {
				camera.shake(0.005, 50); // :sunglasses:
			}
			
			// Collide the player against the collision layer
			this.physics.arcade.collide(this.player, this.ground);
			
			// Collide the player against the particles
			//this.physics.arcade.collide(this.emitter, this.player);
			
			// Collide the particles against each other
			if (features.particleSelfCollide) {
				this.physics.arcade.collide(this.emitter);
			}
			
			// Collide the particles against the collision layer
			this.physics.arcade.collide(this.emitter, this.ground);

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
						body.velocity.y = -features.jump;
					}
					
					if (blocked.right || touching.right) {
						body.velocity.x = -features.wallJump;
						body.velocity.y = -features.jump;
					}
				}
			}
			
			// Stick to ceilings!
			//if (controls.up.isDown && blocked.up) {
			//	body.velocity.y = -50;
			//}
		},
		
		render: function () {
			// FPS counter
			this.game.debug.text(this.time.fps || '--', 4, 16, "#ffffff");
			
			// Render the keyboard controls
			if(this.controls.controls.isDown) {
				this.game.debug.start(32, 196, '#fff', 64);
				this.game.debug.line('WASD:', 'Move/jump');
				this.game.debug.line('F:', 'Toggle camera follow');
				this.game.debug.line('G:', 'Toggle gravity');
				this.game.debug.line('J:', 'Toggle particles');
				this.game.debug.line('K:', 'Toggle Arcade Slopes plugin');
				this.game.debug.line('C:', 'Show these controls');
				this.game.debug.stop();
			}
			
			// Render some debug information about the input, player and camera
			if (this.features.debug) {
				this.game.debug.inputInfo(320, 628);
				this.game.debug.bodyInfo(this.player, 32, 32);
				this.game.debug.cameraInfo(this.camera, 32, 628);
			}
			
			//if (this.features.debug > 1) {
				// Soon... collision polygons and vectors drawn before your eyes
			//}
		}
		
	};
	
	return ArcadeSlopesDemo;
})(Phaser);
