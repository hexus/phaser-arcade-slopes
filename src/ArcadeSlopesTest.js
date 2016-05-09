var ArcadeSlopesDemo = (function(Phaser) {
	
	var ArcadeSlopesDemo = function () {
		
	};
	
	ArcadeSlopesDemo.prototype = {
		
		preload: function () {
			// Load our assets (a demo map and two tilesheet choices)
			this.load.tilemap('demo-tilemap', 'assets/maps/demo.json', null, Phaser.Tilemap.TILED_JSON);
			this.load.spritesheet('pink-collision-spritesheet', 'assets/tilesheets/ninja-tiles32-pink.png', 32, 32);
			this.load.spritesheet('pink-collision-spritesheet', 'assets/tilesheets/ninja-tiles32-purple.png', 32, 32);
		},
		
		create: function () {
			// I always have this on :)
			this.time.advancedTiming = true;
			
			// These two are great fun together ( ͡° ͜ʖ ͡°)
			//this.time.slowMotion = 6;
			//this.time.desiredFps = 200;
			
			// Start up Arcade Physics
			this.physics.startSystem(Phaser.Physics.ARCADE);
			
			// Give it a bit of a boost ;)
			this.game.plugins.add(Phaser.Plugin.ArcadeSlopes);
			
			this.stage.backgroundColor = '#8d549b';
			
			// Add the demo tilemap and attach a tilesheet for its collision layer
			this.map = this.add.tilemap('demo-tilemap');
			this.map.addTilesetImage('collision', 'pink-collision-spritesheet');
			
			// Uncomment this for a lighter background and darker tiles
			//this.stage.backgroundColor = '#ae7bb8'; // with 'purple-collision-spritesheet'
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
			this.game.slopes.solvers.sat.options.preferY = true;
			
			this.player.body.drag.x = 1200;
			this.player.body.bounce.x = 0;
			this.player.body.bounce.y = 0;
			//this.player.body.friction.x = 1; // Not yet supported by ArcadeSlopes (may even become body.slopes.friction)
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
			
			 // Attaches Arcade Physics polygon data to the particle bodies
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
				'particles': Phaser.KeyCode.J,
				'toggle': Phaser.KeyCode.K
			});
			
			// Follow the player with the camera
			this.camera.follow(this.player);
			
			// Words cannot describe how much I love this little feature
			this.camera.lerp.setTo(0.2, 0.2);
			
			var that = this;
			
			// Add an input event handler that teleport the player on pointer input
			this.input.onDown.add(function (pointer, mouseEvent) {
				that.player.position.x = pointer.worldX - that.player.width / 2;
				that.player.position.y = pointer.worldY - that.player.height / 2;
				
				// Reset the velocity for repeatable results after clicking
				that.player.body.velocity.x = 0;
				that.player.body.velocity.y = 0;
			});
			
			// Prevent debug text rendering with a shadow
			this.game.debug.renderShadow = false;
		},
		
		update: function () {
			// Keep the particle emitter attached to the player (probably a better way)
			this.emitter.x = this.player.x + this.player.body.halfWidth;
			this.emitter.y = this.player.y + this.player.body.halfHeight;
			
			if (this.controls.gravity.justDown) {
				if (this.physics.arcade.gravity.y) {
					this.physics.arcade.gravity.y = 0;
					this.player.body.drag.y = 1200;
				} else {
					this.physics.arcade.gravity.y = 1000;
					this.player.body.drag.y = 0;
				}
				//this.physics.arcade.gravity.y = -this.physics.arcade.gravity.y;
			}
			
			if (this.controls.follow.justDown) {
				if (this.camera.target) {
					this.camera.unfollow();
				} else {
					this.camera.follow(this.player);
				}
			}
			
			if (this.controls.particles.justDown) {
				if (this.emitter.on) {
					this.emitter.kill();
				} else {
					this.emitter.flow(3000 / this.time.slowMotion, 1, 5);
				}
			}
			
			if (this.controls.toggle.justDown) {
				if (this.game.slopes) {
					this.game.plugins.remove(this.game.slopes);
				} else {
					this.game.plugins.add(Phaser.Plugin.ArcadeSlopes);
					this.game.slopes.solvers.sat.options.preferY = true;
				}
			}
			
			// Camera shake for the fun of it
			if (this.input.keyboard.isDown(Phaser.KeyCode.H)) {
				this.camera.shake(0.005, 50); // Very cool
			}
			
			// Collide the player against the collision layer
			this.physics.arcade.collide(this.player, this.ground);
			//this.physics.arcade.collide(this.emitter, this.player);
			//this.physics.arcade.collide(this.emitter, this.emitter); // This kills performance, haha
			
			// Collide the particles against the collision layer
			this.physics.arcade.collide(this.emitter, this.ground);
			
			// Set some shortcuts to some useful objects
			var body = this.player.body;
			var controls = this.controls;
			var blocked = this.player.body.blocked;
			var touching = this.player.body.touching;

			// Reset the player acceleration
			body.acceleration.x = 0;
			body.acceleration.y = 0;
			
			// Move left
			if (controls.left.isDown) {
				body.acceleration.x = -2500;
			}
			
			// Move right
			if (controls.right.isDown) {
				body.acceleration.x = 2500;
			}
			
			// Move down
			if (controls.down.isDown) {
				body.acceleration.y = Math.abs(this.physics.arcade.gravity.y) + 1000;
			}
			
			// Jump, and wall jump
			if (controls.up.isDown) {
				if (!(blocked.down || blocked.up || touching.up)) {
					// Would be even better to use collision normals here
					if (blocked.left || touching.left) {
						body.velocity.x = 300;
						body.velocity.y = -500;
					}
					
					if (blocked.right || touching.right) {
						body.velocity.x = -250;
						body.velocity.y = -500;
					}
				}
				
				if (blocked.down || touching.down || !this.physics.arcade.gravity.y) {
					body.velocity.y = -500;
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
			
			// Render some debug information about the input, player and camera
			this.game.debug.inputInfo(320, 628);
			this.game.debug.bodyInfo(this.player, 32, 32);
			this.game.debug.cameraInfo(this.camera, 32, 628);
		}
		
	};
	
	return ArcadeSlopesDemo;
})(Phaser);
