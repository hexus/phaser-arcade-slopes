/**
 * @author Chris Andrew <chris@hexus.io>
 * @copyright 2016-2021 Chris Andrew
 * @license MIT
 */

/**
 * Arcade Slopes provides sloped tile functionality for tilemaps that use
 * Phaser's Arcade physics engine.
 * 
 * @class Phaser.Plugin.ArcadeSlopes
 * @constructor
 * @extends Phaser.Plugin
 * @param {Phaser.Game} game          - A reference to the game using this plugin.
 * @param {any}         parent        - The object that owns this plugin, usually a Phaser.PluginManager.
 * @param {integer}     defaultSolver - The default collision solver type to use for sloped tiles.
 */
Phaser.Plugin.ArcadeSlopes = function (game, parent, defaultSolver) {
	Phaser.Plugin.call(this, game, parent);
	
	/**
	 * The collision solvers provided by the plugin.
	 * 
	 * Maps solver constants to their respective instances.
	 * 
	 * @property {object} solvers
	 */
	var solvers = {};
	
	solvers[Phaser.Plugin.ArcadeSlopes.SAT] = new Phaser.Plugin.ArcadeSlopes.SatSolver();
	
	/**
	 * The Arcade Slopes facade.
	 *
	 * @property {Phaser.Plugin.ArcadeSlopes.Facade} facade
	 */
	this.facade = new Phaser.Plugin.ArcadeSlopes.Facade(
		new Phaser.Plugin.ArcadeSlopes.TileSlopeFactory(),
		solvers,
		defaultSolver || Phaser.Plugin.ArcadeSlopes.SAT
	);
	
	// Give the facade a reference to the plugin; this makes it easier to remove
	// it at runtime
	this.facade.plugin = this;
};

Phaser.Plugin.ArcadeSlopes.prototype = Object.create(Phaser.Plugin.prototype);
Phaser.Plugin.ArcadeSlopes.prototype.constructor = Phaser.Plugin.ArcadeSlopes;

/**
 * The Arcade Slopes plugin version number.
 * 
 * @constant
 * @type {string}
 */
Phaser.Plugin.ArcadeSlopes.VERSION = '0.3.2';

/**
 * The Separating Axis Theorem collision solver type.
 * 
 * Uses the excellent SAT.js library.
 * 
 * @constant
 * @type {string}
 */
Phaser.Plugin.ArcadeSlopes.SAT = 'sat';

/**
 * Initializes the plugin.
 * 
 * @method Phaser.Plugin.ArcadeSlopes#init
 */
Phaser.Plugin.ArcadeSlopes.prototype.init = function () {
	// Give the game an Arcade Slopes facade
	this.game.slopes = this.game.slopes || this.facade;
	
	// Keep a reference to the original Arcade.collideSpriteVsTilemapLayer method
	this.originalCollideSpriteVsTilemapLayer = Phaser.Physics.Arcade.prototype.collideSpriteVsTilemapLayer;
	
	// Replace the original method with the Arcade Slopes override, along with
	// some extra methods that break down the functionality a little more
	Phaser.Physics.Arcade.prototype.collideSpriteVsTile = Phaser.Plugin.ArcadeSlopes.Overrides.collideSpriteVsTile;
	Phaser.Physics.Arcade.prototype.collideSpriteVsTiles = Phaser.Plugin.ArcadeSlopes.Overrides.collideSpriteVsTiles;
	Phaser.Physics.Arcade.prototype.collideSpriteVsTilemapLayer = Phaser.Plugin.ArcadeSlopes.Overrides.collideSpriteVsTilemapLayer;
	
	// Add some extra neighbour methods to the Tilemap class
	Phaser.Tilemap.prototype.getTileTopLeft = Phaser.Plugin.ArcadeSlopes.Overrides.getTileTopLeft;
	Phaser.Tilemap.prototype.getTileTopRight = Phaser.Plugin.ArcadeSlopes.Overrides.getTileTopRight;
	Phaser.Tilemap.prototype.getTileBottomLeft = Phaser.Plugin.ArcadeSlopes.Overrides.getTileBottomLeft;
	Phaser.Tilemap.prototype.getTileBottomRight = Phaser.Plugin.ArcadeSlopes.Overrides.getTileBottomRight;
	
	// Keep a reference to the original TilemapLayer.renderDebug method
	this.originalRenderDebug = Phaser.TilemapLayer.prototype.renderDebug;
	
	// Add some overrides and helper methods to the TilemapLayer class
	Phaser.TilemapLayer.prototype.getCollisionOffsetX = Phaser.Plugin.ArcadeSlopes.Overrides.getCollisionOffsetX;
	Phaser.TilemapLayer.prototype.getCollisionOffsetY = Phaser.Plugin.ArcadeSlopes.Overrides.getCollisionOffsetY;
	Phaser.TilemapLayer.prototype.renderDebug = Phaser.Plugin.ArcadeSlopes.Overrides.renderDebug;
};

/**
 * Destroys the plugin and nulls its references. Restores any overriden methods.
 * 
 * @method Phaser.Plugin.ArcadeSlopes#destroy
 */
Phaser.Plugin.ArcadeSlopes.prototype.destroy = function () {
	// Null the game's reference to the facade
	this.game.slopes = null;
	
	// Restore the original collideSpriteVsTilemapLayer method and null the rest
	Phaser.Physics.Arcade.prototype.collideSpriteVsTile = null;
	Phaser.Physics.Arcade.prototype.collideSpriteVsTiles = null;
	Phaser.Physics.Arcade.prototype.collideSpriteVsTilemapLayer = this.originalCollideSpriteVsTilemapLayer;
	
	// Remove the extra neighbour methods from the Tilemap class
	Phaser.Tilemap.prototype.getTileTopLeft = null;
	Phaser.Tilemap.prototype.getTileTopRight = null;
	Phaser.Tilemap.prototype.getTileBottomLeft = null;
	Phaser.Tilemap.prototype.getTileBottomRight = null;
	
	// Remove the overrides and helper methods from the TilemapLayer class
	Phaser.TilemapLayer.prototype.getCollisionOffsetX = null;
	Phaser.TilemapLayer.prototype.getCollisionOffsetY = null;
	Phaser.TilemapLayer.prototype.renderDebug = this.originalRenderDebug;
	
	// Call the parent destroy method
	Phaser.Plugin.prototype.destroy.call(this);
};

/**
 * @author Chris Andrew <chris@hexus.io>
 * @copyright 2016-2021 Chris Andrew
 * @license MIT
 */

/**
 * A facade class to attach to a Phaser game.
 * 
 * @class Phaser.Plugin.ArcadeSlopes.Facade
 * @constructor
 * @param {Phaser.Plugin.ArcadeSlopes.TileSlopeFactory} factory       - A tile slope factory.
 * @param {object}                                      solvers       - A set of collision solvers.
 * @param {integer}                                     defaultSolver - The default collision solver type to use for sloped tiles.
 */
Phaser.Plugin.ArcadeSlopes.Facade = function (factory, solvers, defaultSolver) {
	/**
	 * A tile slope factory.
	 * 
	 * @property {Phaser.Plugin.ArcadeSlopes.TileSlopeFactory} factory
	 */
	this.factory = factory;
	
	/**
	 * A set of collision solvers.
	 * 
	 * Maps solver constants to their respective instances.
	 * 
	 * @property {object} solvers
	 */
	this.solvers = solvers;
	
	/**
	 * The default collision solver type to use for sloped tiles.
	 * 
	 * @property {string} defaultSolver
	 * @default
	 */
	this.defaultSolver = defaultSolver || Phaser.Plugin.ArcadeSlopes.SAT;
	
	/**
	 * The plugin this facade belongs to.
	 *
	 * @property {Phaser.Plugin.ArcadeSlopes} plugin
	 */
	this.plugin = null;
};

/**
 * Enable the physics body of the given object for sloped tile interaction.
 *
 * @method Phaser.Plugin.ArcadeSlopes.Facade#enable
 * @param {Phaser.Sprite|Phaser.Group} object - The object to enable sloped tile physics for.
 */
Phaser.Plugin.ArcadeSlopes.Facade.prototype.enable = function (object) {
	if (Array.isArray(object)) {
		for (var i = 0; i < object.length; i++) {
			this.enable(object[i]);
		}
	} else {
		if (object instanceof Phaser.Group) {
			this.enable(object.children);
		} else {
			if (object.hasOwnProperty('body')) {
				this.enableBody(object.body);
			}
			
			if (object.hasOwnProperty('children') && object.children.length > 0) {
				this.enable(object.children);
			}
		}
	}
};

/**
 * Enable the given physics body for sloped tile collisions.
 *
 * @method Phaser.Plugin.ArcadeSlopes.Facade#enableBody
 * @param {Phaser.Physics.Arcade.Body} body - The physics body to enable.
 */
Phaser.Plugin.ArcadeSlopes.Facade.prototype.enableBody = function (body) {
	// Create an SAT shape for the body
	// TODO: Rename body.polygon to body.shape or body.slopes.shape
	if  (body.isCircle) {
		body.polygon = new SAT.Circle(
			new SAT.Vector(
				body.x + body.halfWidth,
				body.y + body.halfHeight
			),
			body.radius
		);
	} else {
		body.polygon = new SAT.Box(
			new SAT.Vector(body.x, body.y),
			body.width * body.sprite.scale.x,
			body.height * body.sprite.scale.y
		).toPolygon();
	}
	
	// Attach a new set of properties that configure the body's interaction
	// with sloped tiles, if they don't exist (TODO: Formalize as a class)
	body.slopes = body.slopes || {
		debug: false,
		friction: new Phaser.Point(),
		preferY: false,
		pullUp: 0,
		pullDown: 0,
		pullLeft: 0,
		pullRight: 0,
		pullTopLeft: 0,
		pullTopRight: 0,
		pullBottomLeft: 0,
		pullBottomRight: 0,
		sat: {
			response: null,
		},
		skipFriction: false,
		tile: null,
		velocity: new SAT.Vector()
	};
};

/**
 * Converts a layer of the given tilemap.
 * 
 * Attaches Phaser.Plugin.ArcadeSlopes.TileSlope objects that are used to define
 * how the tile should collide with a physics body.
 *
 * @method Phaser.Plugin.ArcadeSlopes.Facade#convertTilemap
 * @param  {Phaser.Tilemap}                    map      - The map containing the layer to convert.
 * @param  {number|string|Phaser.TileMapLayer} layer    - The layer of the map to convert.
 * @param  {string|object}                     slopeMap - A mapping type string, or a map of tilemap indexes to ArcadeSlope.TileSlope constants.
 * @param  {integer}                           index    - An optional first tile index (firstgid).
 * @return {Phaser.Tilemap}                             - The converted tilemap.
 */
Phaser.Plugin.ArcadeSlopes.Facade.prototype.convertTilemap = function (map, layer, slopeMap, index) {
	return this.factory.convertTilemap(map, layer, slopeMap, index);
};

/**
 * Converts a tilemap layer.
 *
 * @method Phaser.Plugin.ArcadeSlopes.Facade#convertTilemapLayer
 * @param  {Phaser.TilemapLayer}  layer    - The tilemap layer to convert.
 * @param  {string|object}        slopeMap - A mapping type string, or a map of tilemap indexes to ArcadeSlope.TileSlope constants.
 * @param  {integer}              index    - An optional first tile index (firstgid).
 * @return {Phaser.TilemapLayer}           - The converted tilemap layer.
 */
Phaser.Plugin.ArcadeSlopes.Facade.prototype.convertTilemapLayer = function (layer, slopeMap, index) {
	return this.factory.convertTilemapLayer(layer, slopeMap, index);
};

/**
 * Collides a physics body against a tile.
 *
 * @method Phaser.Plugin.ArcadeSlopes.Facade#collide
 * @param  {integer}                    i            - The tile index.
 * @param  {Phaser.Physics.Arcade.Body} body         - The physics body.
 * @param  {Phaser.Tile}                tile         - The tile.
 * @param  {Phaser.TilemapLayer}        tilemapLayer - The tilemap layer.
 * @param  {boolean}                    overlapOnly  - Whether to only check for an overlap.
 * @return {boolean}                                 - Whether the body was separated.
 */
Phaser.Plugin.ArcadeSlopes.Facade.prototype.collide = function (i, body, tile, tilemapLayer, overlapOnly) {
	return this.solvers.sat.collide(i, body, tile, tilemapLayer, overlapOnly);
};

/**
 * Reset all the collision properties on a physics body.
 *
 * Resets body.touching, body.blocked, body.overlap*, body.slopes.sat.response.
 * 
 * Leaves wasTouching alone.
 * 
 * @method Phaser.Plugin.ArcadeSlopes.Facade#resetBodyFlags
 * @param  {Phaser.Physics.Arcade.Body} body - The physics body.
 */
Phaser.Plugin.ArcadeSlopes.Facade.prototype.resetCollision = function (body) {
	body.touching.none  = true;
	body.touching.up    = false;
	body.touching.down  = false;
	body.touching.left  = false;
	body.touching.right = false;
	
	body.blocked.none  = true;
	body.blocked.up    = false;
	body.blocked.down  = false;
	body.blocked.left  = false;
	body.blocked.right = false;
	
	body.overlapX = 0;
	body.overlapY = 0;
	
	if (!body.slopes) {
		return;
	}
	
	body.slopes.sat.response = null;
};

/**
 * Whether to prefer Y axis separation in an attempt to prevent physics bodies
 * from sliding down slopes when they are separated.
 *
 * Disabled by default. Only relevant in a game that uses gravity.
 *
 * @name Phaser.Plugin.ArcadeSlopes.Facade#preferY
 * @property {boolean} preferY
 */
Object.defineProperty(Phaser.Plugin.ArcadeSlopes.Facade.prototype, 'preferY', {
	get: function () {
		return this.solvers.sat.options.preferY;
	},
	set: function (enabled) {
		this.solvers.sat.options.preferY = !!enabled;
	}
});

/**
 * Whether to use heuristics to avoid collisions with the internal edges between
 * connected tiles.
 *
 * Enabled by default. Relevant to platformers.
 *
 * @name Phaser.Plugin.ArcadeSlopes.Facade#heuristics
 * @property {boolean} heuristics
 */
Object.defineProperty(Phaser.Plugin.ArcadeSlopes.Facade.prototype, 'heuristics', {
	get: function () {
		return this.solvers.sat.options.restrain;
	},
	set: function (enabled) {
		this.solvers.sat.options.restrain = !!enabled;
	}
});

/**
 * @author Chris Andrew <chris@hexus.io>
 * @copyright 2016-2021 Chris Andrew
 * @license MIT
 */

/**
 * A static class with override methods for Phaser's tilemap collisions and tile
 * neighbour checks.
 * 
 * @static
 * @class Phaser.Plugin.ArcadeSlopes.Override
 */
Phaser.Plugin.ArcadeSlopes.Overrides = {};

/**
 * Collide a sprite against a single tile.
 *
 * @method Phaser.Plugin.ArcadeSlopes.Overrides#collideSpriteVsTile
 * @param  {integer}             i                 - The tile index.
 * @param  {Phaser.Sprite}       sprite            - The sprite to check.
 * @param  {Phaser.Tile}         tile              - The tile to check.
 * @param  {Phaser.TilemapLayer} tilemapLayer      - The tilemap layer the tile belongs to.
 * @param  {function}            [collideCallback] - An optional collision callback.
 * @param  {function}            [processCallback] - An optional overlap processing callback.
 * @param  {object}              [callbackContext] - The context in which to run the callbacks.
 * @param  {boolean}             [overlapOnly]     - Whether to only check for an overlap.
 * @return {boolean}                               - Whether a collision occurred.
 */
Phaser.Plugin.ArcadeSlopes.Overrides.collideSpriteVsTile = function (i, sprite, tile, tilemapLayer, collideCallback, processCallback, callbackContext, overlapOnly) {
	if (!sprite.body || !tile || !tilemapLayer) {
		return false;
	}
	
	if (tile.hasOwnProperty('slope')) {
		if (this.game.slopes.collide(i, sprite.body, tile, tilemapLayer, overlapOnly)) {
			this._total++;
			
			if (collideCallback) {
				collideCallback.call(callbackContext, sprite, tile);
			}
			
			return true;
		}
	} else if (this.separateTile(i, sprite.body, tile, tilemapLayer, overlapOnly)) {
		this._total++;
		
		if (collideCallback) {
			collideCallback.call(callbackContext, sprite, tile);
		}
		
		return true;
	}
	
	return false;
};

/**
 * Collide a sprite against a set of tiles.
 *
 * @method Phaser.Plugin.ArcadeSlopes.Overrides#collideSpriteVsTiles
 * @param  {Phaser.Sprite}       sprite            - The sprite to check.
 * @param  {Phaser.Tile[]}       tiles             - The tiles to check.
 * @param  {Phaser.TilemapLayer} tilemapLayer      - The tilemap layer the tiles belong to.
 * @param  {function}            [collideCallback] - An optional collision callback.
 * @param  {function}            [processCallback] - An optional overlap processing callback.
 * @param  {object}              [callbackContext] - The context in which to run the callbacks.
 * @param  {boolean}             [overlapOnly]     - Whether to only check for an overlap.
 * @return {boolean}                               - Whether a collision occurred.
 */
Phaser.Plugin.ArcadeSlopes.Overrides.collideSpriteVsTiles = function (sprite, tiles, tilemapLayer, collideCallback, processCallback, callbackContext, overlapOnly) {
	if (!sprite.body || !tiles || !tiles.length || !tilemapLayer) {
		return false;
	}
	
	var collided = false;
	
	for (var i = 0; i < tiles.length; i++) {
		if (processCallback) {
			if (processCallback.call(callbackContext, sprite, tiles[i])) {
				collided = this.collideSpriteVsTile(i, sprite, tiles[i], tilemapLayer, collideCallback, processCallback, callbackContext, overlapOnly) || collided;
			}
		} else {
			collided = this.collideSpriteVsTile(i, sprite, tiles[i], tilemapLayer, collideCallback, processCallback, callbackContext, overlapOnly) || collided;
		}
	}
	
	return collided;
};

/**
 * Collide a sprite against a tile map layer.
 * 
 * This is used to override Phaser.Physics.Arcade.collideSpriteVsTilemapLayer().
 * 
 * @override Phaser.Physics.Arcade#collideSpriteVsTilemapLayer
 * @method Phaser.Plugin.ArcadeSlopes.Overrides#collideSpriteVsTilemapLayer
 * @param  {Phaser.Sprite}       sprite          - The sprite to check.
 * @param  {Phaser.TilemapLayer} tilemapLayer    - The tilemap layer to check.
 * @param  {function}            collideCallback - An optional collision callback.
 * @param  {function}            processCallback - An optional overlap processing callback.
 * @param  {object}              callbackContext - The context in which to run the callbacks.
 * @param  {boolean}             overlapOnly     - Whether to only check for an overlap.
 * @return {boolean}                             - Whether a collision occurred.
 */
Phaser.Plugin.ArcadeSlopes.Overrides.collideSpriteVsTilemapLayer = function (sprite, tilemapLayer, collideCallback, processCallback, callbackContext, overlapOnly) {
	if (!sprite.body || !tilemapLayer) {
		return false;
	}
	
	var tiles = tilemapLayer.getTiles(
		sprite.body.position.x - sprite.body.tilePadding.x - tilemapLayer.getCollisionOffsetX(),
		sprite.body.position.y - sprite.body.tilePadding.y - tilemapLayer.getCollisionOffsetY(),
		sprite.body.width      + sprite.body.tilePadding.x,
		sprite.body.height     + sprite.body.tilePadding.y,
		true,
		false
	);
	
	if (tiles.length === 0) {
		return false;
	}
	
	// TODO: Sort by distance from body center to tile center?
	
	var collided = this.collideSpriteVsTiles(sprite, tiles, tilemapLayer, collideCallback, processCallback, callbackContext, overlapOnly);
	
	return collided;
};

/**
 * Gets the tile to the top left of the coordinates given.
 *
 * @method Phaser.Plugin.ArcadeSlopes.Overrides#getTileTopLeft
 * @param  {integer} layer - The index of the layer to read the tile from.
 * @param  {integer} x     - The X coordinate, in tiles, to get the tile from.
 * @param  {integer} y     - The Y coordinate, in tiles, to get the tile from.
 * @return {Phaser.Tile}   - The tile found.
 */
Phaser.Plugin.ArcadeSlopes.Overrides.getTileTopLeft = function(layer, x, y) {
	if (x > 0 && y > 0) {
		return this.layers[layer].data[y - 1][x - 1];
	}
	
	return null;
};

/**
 * Gets the tile to the top right of the coordinates given.
 *
 * @method Phaser.Plugin.ArcadeSlopes.Overrides#getTileTopRight
 * @param  {integer} layer - The index of the layer to read the tile from.
 * @param  {integer} x     - The X coordinate, in tiles, to get the tile from.
 * @param  {integer} y     - The Y coordinate, in tiles, to get the tile from.
 * @return {Phaser.Tile}   - The tile found.
 */
Phaser.Plugin.ArcadeSlopes.Overrides.getTileTopRight = function(layer, x, y) {
	if (x < this.layers[layer].width - 1 && y > 0) {
		return this.layers[layer].data[y - 1][x + 1];
	}
	
	return null;
};

/**
 * Gets the tile to the bottom left of the coordinates given.
 *
 * @method Phaser.Plugin.ArcadeSlopes.Overrides#getTileBottomLeft
 * @param  {integer} layer - The index of the layer to read the tile from.
 * @param  {integer} x     - The X coordinate, in tiles, to get the tile from.
 * @param  {integer} y     - The Y coordinate, in tiles, to get the tile from.
 * @return {Phaser.Tile}   - The tile found.
 */
Phaser.Plugin.ArcadeSlopes.Overrides.getTileBottomLeft = function(layer, x, y) {
	if (x > 0 && y < this.layers[layer].height - 1) {
		return this.layers[layer].data[y + 1][x - 1];
	}
	
	return null;
};

/**
 * Gets the tile to the bottom right of the coordinates given.
 *
 * @method Phaser.Plugin.ArcadeSlopes.Overrides#getTileBottomRight
 * @param  {integer} layer - The index of the layer to read the tile from.
 * @param  {integer} x     - The X coordinate, in tiles, to get the tile from.
 * @param  {integer} y     - The Y coordinate, in tiles, to get the tile from.
 * @return {Phaser.Tile}   - The tile found.
 */
Phaser.Plugin.ArcadeSlopes.Overrides.getTileBottomRight = function(layer, x, y) {
	if (x < this.layers[layer].width - 1 && y < this.layers[layer].height - 1) {
		return this.layers[layer].data[y + 1][x + 1];
	}
	
	return null;
};

/**
 * Get the X axis collision offset for the tilemap layer.
 *
 * @method Phaser.Plugin.ArcadeSlopes.Overrides#getCollisionOffsetY
 * @return {number}
 */
Phaser.Plugin.ArcadeSlopes.Overrides.getCollisionOffsetX = function () {
	if (this.getTileOffsetX) {
		return this.getTileOffsetX();
	}
	
	return !this.fixedToCamera ? this.position.x : 0;
};

/**
 * Get the Y axis collision offset for the tilemap layer.
 *
 * @method Phaser.Plugin.ArcadeSlopes.Overrides#getCollisionOffsetY
 * @return {number}
 */
Phaser.Plugin.ArcadeSlopes.Overrides.getCollisionOffsetY = function () {
	if (this.getTileOffsetY) {
		return this.getTileOffsetY();
	}
	
	return !this.fixedToCamera ? this.position.y : 0;
};

/**
* Renders a tilemap debug overlay on-top of the canvas.
*
* Called automatically by render when `debug` is true.
*
* See `debugSettings` for assorted configuration options.
*
* This override renders extra information regarding Arcade Slopes collisions.
*
* @method Phaser.Plugin.ArcadeSlopes.Overrides#renderDebug
* @private
*/
Phaser.Plugin.ArcadeSlopes.Overrides.renderDebug = function () {
	var scrollX = this._mc.scrollX;
	var scrollY = this._mc.scrollY;
	
	var context = this.context;
	var renderW = this.canvas.width;
	var renderH = this.canvas.height;
	
	var scaleX = this.tileScale ? this.tileScale.x : 1.0 / this.scale.x;
	var scaleY = this.tileScale ? this.tileScale.y : 1.0 / this.scale.y;
	
	var width = this.layer.width;
	var height = this.layer.height;
	var tw = this._mc.tileWidth * scaleX;  // Tile width
	var th = this._mc.tileHeight * scaleY; // Tile height
	var htw = tw / 2; // Half-tile width
	var hth = th / 2; // Half-tile height
	var qtw = tw / 4; // Quarter-tile width
	var qth = th / 4; // Quarter-tile height
	var cw = this._mc.cw * scaleX;
	var ch = this._mc.ch * scaleY;
	var m = this._mc.edgeMidpoint;
	
	var left = Math.floor(scrollX / tw);
	var right = Math.floor((renderW - 1 + scrollX) / tw);
	var top = Math.floor(scrollY / th);
	var bottom = Math.floor((renderH - 1 + scrollY) / th);
	
	if (!this._wrap)
	{
		if (left <= right) {
			left = Math.max(0, left);
			right = Math.min(width - 1, right);
		}
		
		if (top <= bottom) {
			top = Math.max(0, top);
			bottom = Math.min(height - 1, bottom);
		}
	}
	
	var baseX = (left * tw) - scrollX;
	var baseY = (top * th) - scrollY;
	
	var normStartX = (left + ((1 << 20) * width)) % width;
	var normStartY = (top + ((1 << 20) * height)) % height;
	
	var tx, ty, x, y, xmax, ymax, polygon, i, j, a, b, norm, gx, gy, line;
	
	for (y = normStartY, ymax = bottom - top, ty = baseY; ymax >= 0; y++, ymax--, ty += th) {
		if (y >= height) {
			y -= height;
		}
		
		var row = this.layer.data[y];
		
		for (x = normStartX, xmax = right - left, tx = baseX; xmax >= 0; x++, xmax--, tx += tw) {
			if (x >= width) {
				x -= width;
			}
			
			var tile = row[x];
			
			if (!tile || tile.index < 0 || !tile.collides) {
				continue;
			}

			if (this.debugSettings.collidingTileOverfill) {
				context.fillStyle = this.debugSettings.collidingTileOverfill;
				context.fillRect(tx, ty, cw, ch);
			}

			if (this.debugSettings.facingEdgeStroke) {
				context.beginPath();
				
				context.lineWidth = 1;
				context.strokeStyle = this.debugSettings.facingEdgeStroke;
				
				if (tile.faceTop) {
					context.moveTo(tx, ty);
					context.lineTo(tx + cw, ty);
				}
				
				if (tile.faceBottom) {
					context.moveTo(tx, ty + ch);
					context.lineTo(tx + cw, ty + ch);
				}
				
				if (tile.faceLeft) {
					context.moveTo(tx, ty);
					context.lineTo(tx, ty + ch);
				}
				
				if (tile.faceRight) {
					context.moveTo(tx + cw, ty);
					context.lineTo(tx + cw, ty + ch);
				}
				
				context.closePath();
				
				context.stroke();
				
				// Render the tile slope polygons
				if (tile.slope) {
					// Fill polygons and stroke their edges
					if (this.debugSettings.slopeEdgeStroke || this.debugSettings.slopeFill) {
						context.beginPath();
						
						context.lineWidth = 1;
						
						polygon = tile.slope.polygon;
						
						// Move to the first vertex
						context.moveTo(tx + polygon.points[0].x * scaleX, ty + polygon.points[0].y * scaleY);
						
						// Draw a path through all vertices
						for (i = 0; i < polygon.points.length; i++) {
							j = (i + 1) % polygon.points.length;
							
							context.lineTo(tx + polygon.points[j].x * scaleX, ty + polygon.points[j].y * scaleY);
						}
						
						context.closePath();
						
						if (this.debugSettings.slopeEdgeStroke) {
							context.strokeStyle = this.debugSettings.slopeEdgeStroke;
							context.stroke();
						}
						
						if (this.debugSettings.slopeFill) {
							context.fillStyle = this.debugSettings.slopeFill;
							context.fill();
						}
					}
					
					// Stroke the colliding edges and edge normals
					if (this.debugSettings.slopeCollidingEdgeStroke) {
						// Colliding edges
						context.beginPath();
						
						context.lineWidth = this.debugSettings.slopeCollidingEdgeStrokeWidth || 1;
						context.strokeStyle = this.debugSettings.slopeCollidingEdgeStroke;
						
						polygon = tile.slope.polygon;
						
						for (i = 0; i < polygon.points.length; i++) {
							// Skip the edges with ignored normals
							if (polygon.normals[i].ignore) {
								continue;
							}
							
							j = (i + 1) % polygon.points.length;
							
							context.moveTo(tx + polygon.points[i].x * scaleX, ty + polygon.points[i].y * scaleY);
							context.lineTo(tx + polygon.points[j].x * scaleX, ty + polygon.points[j].y * scaleY);
						}
						
						context.closePath();
						
						context.stroke();
						
						// Edge normals
						for (i = 0; i < polygon.points.length; i++) {
							context.beginPath();
							
							if (polygon.normals[i].ignore) {
								context.lineWidth = this.debugSettings.slopeNormalStrokeWidth;
								context.strokeStyle = this.debugSettings.slopeNormalStroke;
							} else {
								context.lineWidth = this.debugSettings.slopeCollidingNormalStrokeWidth;
								context.strokeStyle = this.debugSettings.slopeCollidingNormalStroke;
							}
							
							j = (i + 1) % polygon.points.length;
							
							a = polygon.points[i];
							b = polygon.points[j];
							norm = polygon.normals[i];
							
							// Midpoint of the edge
							m.x = (a.x + b.x) / 2;
							m.y = (a.y + b.y) / 2;
							
							// Draw from the midpoint outwards using the normal
							context.moveTo(tx + m.x * scaleX, ty + m.y * scaleY);
							context.lineTo(tx + m.x * scaleX + norm.x * qtw, ty + m.y * scaleY + norm.y * qth);
							
							context.closePath();
							context.stroke();
						}
						
						// Ignormals
						if (tile.slope.ignormals) {
							for (i = 0; i < tile.slope.ignormals.length; i++) {
								context.beginPath();
								
								context.lineWidth = 1;
								context.strokeStyle = 'rgba(255, 0, 0, 1)';
								
								gx = tile.slope.ignormals[i].x;
								gy = tile.slope.ignormals[i].y;
								
								context.moveTo(tx + htw, ty + hth);
								context.lineTo(tx + htw + gx * qtw, ty + hth + gy * qth);
								
								context.closePath();
								context.stroke();
							}
						}
					}
					
					// Slope line segments
					if (this.debugSettings.slopeLineStroke && tile.slope.line) {
						line = tile.slope.line;

						context.beginPath();
						
						context.lineWidth = this.debugSettings.slopeLineWidth || 2;
						context.strokeStyle = this.debugSettings.slopeLineStroke;

						context.moveTo(line.start.x - scrollX, line.start.y - scrollY);
						context.lineTo(line.end.x - scrollX, line.end.y - scrollY);

						context.closePath();
						context.stroke();
					}
				}
			}
		}
	}
};

/**
 * @author Chris Andrew <chris@hexus.io>
 * @copyright 2016-2021 Chris Andrew
 * @license MIT
 */

/**
 * Solves tile collisions using the Separating Axis Theorem.
 * 
 * @class Phaser.Plugin.ArcadeSlopes.SatSolver
 * @constructor
 * @param {object} options - Options for the SAT solver.
 */
Phaser.Plugin.ArcadeSlopes.SatSolver = function (options) {
	/**
	 * Options for the SAT solver.
	 * 
	 * @property {object} options
	 */
	this.options = Phaser.Utils.mixin(options || {}, {
		// Whether to store debug data with all encountered physics bodies
		debug: false,
		
		// Whether to prefer the minimum Y offset over the smallest separation
		preferY: false
	});
	
	/**
	 * A pool of arrays to use for calculations.
	 * 
	 * @property {Array[]} arrayPool
	 */
	this.arrayPool = [];
	
	for (var i = 0; i < 10; i++) {
		this.arrayPool.push([]);
	}
	
	/**
	 * A pool of vectors to use for calculations.
	 * 
	 * @property {SAT.Vector[]} vectorPool
	 */
	this.vectorPool = [];
	
	for (i = 0; i < 20; i++) {
		this.vectorPool.push(new SAT.Vector());
	}
	
	/**
	 * A pool of responses to use for collision tests.
	 * 
	 * @property {SAT.Response[]} responsePool
	 */
	this.responsePool = [];
	
	for (i = 0; i < 20; i++) {
		this.responsePool.push(new SAT.Response());
	}
};

/**
 * Prepare the given SAT response by inverting the overlap vectors.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#prepareResponse
 * @param  {SAT.Response} response
 * @return {SAT.Response}
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.prepareResponse = function (response) {
	// Invert our overlap vectors so that we have them facing outwards
	response.overlapV.scale(-1);
	response.overlapN.scale(-1);
	
	return response;
};

/**
 * Reset the given SAT response's properties to their default values.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#resetResponse
 * @param  {SAT.Response} response
 * @return {SAT.Response}
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.resetResponse = function (response) {
	response.overlapN.x = 0;
	response.overlapN.y = 0;
	response.overlapV.x = 0;
	response.overlapV.y = 0;
	response.clear();
	
	return response;
};

/**
 * Copy the values of one SAT response to another.
 * 
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#copyResponse
 * @param  {SAT.Response} a - The source response.
 * @param  {SAT.Response} b - The target response.
 * @return {SAT.Response}
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.copyResponse = function (a, b) {
	b.a = a.a;
	b.b = a.b;
	b.aInB = a.aInB;
	b.bInA = a.bInA;
	b.overlap = a.overlap;
	b.overlapN.copy(a.overlapN);
	b.overlapV.copy(a.overlapV);
	
	return b;
};

/**
 * Calculate the minimum X offset given an overlap vector.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#minimumOffsetX
 * @param  {SAT.Vector} vector - The overlap vector.
 * @return {integer}
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.minimumOffsetX = function (vector) {
	return ((vector.y * vector.y) / vector.x) + vector.x;
};

/**
 * Calculate the minimum Y offset given an overlap vector.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#minimumOffsetY
 * @param  {SAT.Vector} vector - The overlap vector.
 * @return {integer}
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.minimumOffsetY = function (vector) {
	return ((vector.x * vector.x) / vector.y) + vector.y;
};

/**
 * Determine whether the given body is moving against the overlap vector of the
 * given response on the Y axis.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#movingAgainstY
 * @param  {Phaser.Physics.Arcade.Body} body     - The physics body.
 * @param  {SAT.Response}               response - The SAT response.
 * @return {boolean}                             - Whether the body is moving against the overlap vector.
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.movingAgainstY = function (body, response) {
	return (response.overlapV.y < 0 && body.velocity.y > 0) || (response.overlapV.y > 0 && body.velocity.y < 0);
};

// TODO: shouldPreferX()

/**
 * Determine whether a body should be separated on the Y axis only, given an SAT
 * response.
 *
 * Returns true if options.preferY is true, the overlap vector is non-zero
 * for each axis and the body is moving against the overlap vector.
 *
 * TODO: Adapt for circle bodies, somehow. Disable for now?
 * TODO: Would be amazing to check to ensure that there are no other surrounding collisions.
 *
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#shouldPreferY
 * @param  {Phaser.Physics.Arcade.Body} body     - The physics body.
 * @param  {SAT.Response}               response - The SAT response.
 * @return {boolean}                             - Whether to separate on the Y axis only.
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.prototype.shouldPreferY = function (body, response) {
	return (this.options.preferY || body.slopes.preferY) &&                  // Enabled globally or on the body
		response.overlapV.y !== 0 && response.overlapV.x !== 0 &&            // There's an overlap on both axes
		Phaser.Plugin.ArcadeSlopes.SatSolver.movingAgainstY(body, response); // And we're moving into the shape
};

/**
 * Separate a body from a tile using the given SAT response.
 *
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#separate
 * @param  {Phaser.Physics.Arcade.Body} body     - The physics body.
 * @param  {Phaser.Tile}                tile     - The tile.
 * @param  {SAT.Response}               response - The SAT response.
 * @param  {boolean}                    force    - Whether to force separation.
 * @return {boolean}                             - Whether the body was separated.
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.prototype.separate = function (body, tile, response, force) {
	// Test whether we need to separate from the tile by checking its edge
	// properties and any separation constraints
	if (!force && !this.shouldSeparate(tile.index, body, tile, response)) {
		return false;
	}
	
	// Run any custom tile callbacks, with local callbacks taking priority over
	// layer level callbacks
	if (tile.collisionCallback && !tile.collisionCallback.call(tile.collisionCallbackContext, body.sprite, tile)) {
		return false;
	} else if (tile.layer.callbacks[tile.index] && !tile.layer.callbacks[tile.index].callback.call(tile.layer.callbacks[tile.index].callbackContext, body.sprite, tile)) {
		return false;
	}
	
	// Separate the body from the tile, using the minimum Y offset if preferred
	if (this.shouldPreferY(body, response)) {
		body.position.y += Phaser.Plugin.ArcadeSlopes.SatSolver.minimumOffsetY(response.overlapV);
	} else {
		body.position.x += response.overlapV.x;
		body.position.y += response.overlapV.y;
	}
	
	return true;
};

/**
 * Apply velocity changes (friction and bounce) to a body given a tile and
 * SAT collision response.
 * 
 * TODO: Optimize by pooling bounce and friction vectors.
 * 
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#applyVelocity
 * @param  {Phaser.Physics.Arcade.Body} body     - The physics body.
 * @param  {Phaser.Tile}                tile     - The tile.
 * @param  {SAT.Response}               response - The SAT response.
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.prototype.applyVelocity = function (body, tile, response) {
	// Project our velocity onto the overlap normal for the bounce vector (Vn)
	var bounce = this.vectorPool.pop().copy(body.slopes.velocity).projectN(response.overlapN);
	
	// Then work out the surface vector (Vt)
	var friction = this.vectorPool.pop().copy(body.slopes.velocity).sub(bounce);
	
	// Apply bounce coefficients
	bounce.x = bounce.x * (-body.bounce.x);
	bounce.y = bounce.y * (-body.bounce.y);
	
	// Apply friction coefficients
	friction.x = friction.x * (1 - body.slopes.friction.x - tile.slope.friction.x);
	friction.y = friction.y * (1 - body.slopes.friction.y - tile.slope.friction.y);
	
	// Now we can get our new velocity by adding the bounce and friction vectors
	body.velocity.x = bounce.x + friction.x;
	body.velocity.y = bounce.y + friction.y;
	
	// Process collision pulling
	this.pull(body, response);
	
	// Recycle the vectors we used for bounce and friction
	this.vectorPool.push(bounce, friction);
};

/**
 * Update the position and velocity values of the slopes body.
 *
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#updateValues
 * @param  {Phaser.Physics.Arcade.Body} body - The physics body.
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.prototype.updateValues = function (body) {
	// Update the body polygon position
	body.polygon.pos.x = body.x;
	body.polygon.pos.y = body.y;
	
	// Update the body's velocity vector
	body.slopes.velocity.x = body.velocity.x;
	body.slopes.velocity.y = body.velocity.y;
};

/**
 * Update the flags of a physics body using a given SAT response.
 *
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#updateFlags
 * @param  {Phaser.Physics.Arcade.Body} body     - The physics body.
 * @param  {SAT.Response}               response - The SAT response.
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.prototype.updateFlags = function (body, response) {
	// Set the touching values
	body.touching.up    = body.touching.up    || response.overlapV.y > 0;
	body.touching.down  = body.touching.down  || response.overlapV.y < 0;
	body.touching.left  = body.touching.left  || response.overlapV.x > 0;
	body.touching.right = body.touching.right || response.overlapV.x < 0;
	body.touching.none  = !body.touching.up && !body.touching.down && !body.touching.left && !body.touching.right;
	
	// Set the blocked values
	body.blocked.up    = body.blocked.up    || response.overlapV.x === 0 && response.overlapV.y > 0;
	body.blocked.down  = body.blocked.down  || response.overlapV.x === 0 && response.overlapV.y < 0;
	body.blocked.left  = body.blocked.left  || response.overlapV.y === 0 && response.overlapV.x > 0;
	body.blocked.right = body.blocked.right || response.overlapV.y === 0 && response.overlapV.x < 0;
};

/**
 * Pull the body into a collision response based on its slopes options.
 *
 * TODO: Don't return after any condition is met, accumulate values into a
 *       single SAT.Vector and apply at the end.
 * 
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#pull
 * @param  {Phaser.Physics.Arcade.Body} body     - The physics body.
 * @param  {SAT.Response}               response - The SAT response.
 * @return {boolean}                             - Whether the body was pulled.
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.prototype.pull = function (body, response) {
	if (!body.slopes.pullUp && !body.slopes.pullDown && !body.slopes.pullLeft && !body.slopes.pullRight &&
		!body.slopes.pullTopLeft && !body.slopes.pullTopRight && !body.slopes.pullBottomLeft && !body.slopes.pullBottomRight) {
		return false;
	}
	
	// Clone and flip the overlap normal so that it faces into the collision
	var overlapN = response.overlapN.clone().scale(-1);
	
	if (body.slopes.pullUp && overlapN.y < 0) {
		// Scale it by the configured amount
		pullUp = overlapN.clone().scale(body.slopes.pullUp);
		
		// Apply it to the body velocity
		body.velocity.x += pullUp.x;
		body.velocity.y += pullUp.y;
		
		return true;
	}
	
	if (body.slopes.pullDown && overlapN.y > 0) {
		pullDown = overlapN.clone().scale(body.slopes.pullDown);
		
		body.velocity.x += pullDown.x;
		body.velocity.y += pullDown.y;
		
		return true;
	}
	
	if (body.slopes.pullLeft && overlapN.x < 0) {
		pullLeft = overlapN.clone().scale(body.slopes.pullLeft);
		
		body.velocity.x += pullLeft.x;
		body.velocity.y += pullLeft.y;
		
		return true;
	}
	
	if (body.slopes.pullRight && overlapN.x > 0) {
		pullRight = overlapN.clone().scale(body.slopes.pullRight);
		
		body.velocity.x += pullRight.x;
		body.velocity.y += pullRight.y;
		
		return true;
	}
	
	if (body.slopes.pullTopLeft && overlapN.x < 0 && overlapN.y < 0) {
		pullUp = overlapN.clone().scale(body.slopes.pullTopLeft);
		
		body.velocity.x += pullUp.x;
		body.velocity.y += pullUp.y;
		
		return true;
	}
	
	if (body.slopes.pullTopRight && overlapN.x > 0 && overlapN.y < 0) {
		pullDown = overlapN.clone().scale(body.slopes.pullTopRight);
		
		body.velocity.x += pullDown.x;
		body.velocity.y += pullDown.y;
		
		return true;
	}
	
	if (body.slopes.pullBottomLeft && overlapN.x < 0 && overlapN.y > 0) {
		pullLeft = overlapN.clone().scale(body.slopes.pullBottomLeft);
		
		body.velocity.x += pullLeft.x;
		body.velocity.y += pullLeft.y;
		
		return true;
	}
	
	if (body.slopes.pullBottomRight && overlapN.x > 0 && overlapN.y > 0) {
		pullRight = overlapN.clone().scale(body.slopes.pullBottomRight);
		
		body.velocity.x += pullRight.x;
		body.velocity.y += pullRight.y;
		
		return true;
	}
	
	return false;
};

/**
 * Determine whether everything required to process a collision is available.
 *
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#shouldCollide
 * @param  {Phaser.Physics.Arcade.Body} body - The physics body.
 * @param  {Phaser.Tile}                tile - The tile.
 * @return {boolean}
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.prototype.shouldCollide = function (body, tile) {
	return body.enable && body.polygon && body.slopes && tile.collides && tile.slope && tile.slope.polygon;
};

/**
 * Flattens the specified array of points onto a unit vector axis,
 * resulting in a one dimensional range of the minimum and
 * maximum value on that axis.
 *
 * Copied verbatim from SAT.flattenPointsOn.
 * 
 * @see SAT.flattenPointsOn
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#flattenPointsOn
 * @param {SAT.Vector[]} points - The points to flatten.
 * @param {SAT.Vector}   normal - The unit vector axis to flatten on.
 * @param {number[]}     result - An array. After calling this,
 *   result[0] will be the minimum value,
 *   result[1] will be the maximum value.
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.flattenPointsOn = function (points, normal, result) {
	var min = Number.MAX_VALUE;
	var max = -Number.MAX_VALUE;
	var len = points.length;
	
	for (var i = 0; i < len; i++ ) {
		// The magnitude of the projection of the point onto the normal
		var dot = points[i].dot(normal);
		if (dot < min) { min = dot; }
		if (dot > max) { max = dot; }
	}
	
	result[0] = min; result[1] = max;
};

/**
 * Determine whether two polygons are separated by a given axis.
 *
 * Tailored to only push out in the direction of the given axis.
 * 
 * Adapted from SAT.isSeparatingAxis.
 *
 * @see    {SAT.isSeparatingAxis}
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#isSeparatingAxis
 * @param  {SAT.Polygon}  a        - The first polygon.
 * @param  {SAT.Polygon}  b        - The second polygon.
 * @param  {SAT.Vector}   axis     - The axis (unit sized) to test against.
 *                                   The points of both polygons are projected
 *                                   onto this axis.
 * @param  {SAT.Response} response - The response to populate if the polygons are
 *                                   not separated by the given axis.
 * @return {boolean} true if it is a separating axis, false otherwise. If false,
 *   and a response is passed in, information about how much overlap and
 *   the direction of the overlap will be populated.
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.prototype.isSeparatingAxis = function (a, b, axis, response) {
	var aPos = a.pos;
	var bPos = b.pos;
	var aPoints = a.calcPoints;
	var bPoints = b.calcPoints;
	
	var rangeA = this.arrayPool.pop();
	var rangeB = this.arrayPool.pop();
	
	// The magnitude of the offset between the two polygons
	var offsetV = this.vectorPool.pop().copy(bPos).sub(aPos);
	var projectedOffset = offsetV.dot(axis);
	
	// Project the polygons onto the axis.
	Phaser.Plugin.ArcadeSlopes.SatSolver.flattenPointsOn(aPoints, axis, rangeA);
	Phaser.Plugin.ArcadeSlopes.SatSolver.flattenPointsOn(bPoints, axis, rangeB);
	
	// Move B's range to its position relative to A.
	rangeB[0] += projectedOffset;
	rangeB[1] += projectedOffset;
	
	// Check if there is a gap. If there is, this is a separating axis and we can stop
	if (rangeA[0] >= rangeB[1] || rangeB[0] >= rangeA[1]) {
		this.vectorPool.push(offsetV);
		this.arrayPool.push(rangeA);
		this.arrayPool.push(rangeB);
		return true;
	}
	
	var option1, option2;
	
	// This is not a separating axis. If we're calculating a response, calculate
	// the overlap
	var overlap = 0;
	
	if (rangeA[0] < rangeB[0]) {
		// A starts further left than B
		response.aInB = false;
		
		if (rangeA[1] < rangeB[1]) {
			// A ends before B does. We have to pull A out of B
			//overlap = rangeA[1] - rangeB[0];
			response.bInA = false;
		}// else {
			// B is fully inside A. Pick the shortest way out.
			//option1 = rangeA[1] - rangeB[0];
			//option2 = rangeB[1] - rangeA[0];
			//overlap = option1 < option2 ? option1 : -option2;
		//}
	} else {
		// B starts further left than A
		response.bInA = false;
		
		if (rangeA[1] > rangeB[1]) {
			// B ends before A ends. We have to push A out of B
			overlap = rangeA[0] - rangeB[1];
			response.aInB = false;
		} else {
			// A is fully inside B.  Pick the shortest way out.
			option1 = rangeA[1] - rangeB[0];
			option2 = rangeB[1] - rangeA[0];
			//overlap = option1 < option2 ? option1 : -option2;
			
			if (option1 >= option2) {
				overlap = -option2;
			}
		}
	}
	
	// If this is the smallest amount of overlap we've seen so far, set it
	// as the minimum overlap.
	var absOverlap = Math.abs(overlap);
	
	if (absOverlap < response.overlap) {
		response.overlap = absOverlap;
		response.overlapN.copy(axis);
		
		if (overlap < 0) {
			response.overlapN.reverse();
		}
	}
	
	this.vectorPool.push(offsetV);
	this.arrayPool.push(rangeA);
	this.arrayPool.push(rangeB);
	
	return false;
};

/**
 * Test whether two polygons overlap.
 *
 * Takes a response object that will be populated with the shortest
 * viable separation vector. Ignores collision responses that don't oppose
 * velocity enough.
 * 
 * Returns true if there is a collision and false otherwise.
 *
 * Tailored to work with an AABB as the first polygon.
 * 
 * Adapted from SAT.testPolygonPolygon.
 * 
 * @see    {SAT.testPolygonPolygon}
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#testPolygonPolygon
 * @param  {SAT.Polygon}  a        - The first polygon.
 * @param  {SAT.Polygon}  b        - The second polygon.
 * @param  {SAT.Response} response - The response object to populate with overlap information.
 * @param  {SAT.Vector}   velocity - The velocity vector to ignore.
 * @param  {SAT.Vector[]} ignore   - The axes to ignore.
 * @return {boolean}               - Whether the the two polygons overlap.
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.prototype.testPolygonPolygon = function (a, b, response, velocity, ignore) {
	var aPoints = a.calcPoints;
	var aLen = aPoints.length;
	var bPoints = b.calcPoints;
	var bLen = bPoints.length;
	
	var i, j, k;
	var responses = this.arrayPool.pop();
	var axes = this.arrayPool.pop();
	
	responses.length = 0;
	axes.length = 0;
	
	// If any of the edge normals of A is a separating axis, no intersection
	for (i = 0; i < aLen; i++) {
		responses[i] = this.responsePool.pop();
		responses[i].clear();
		axes[i] = a.normals[i];
		
		if (this.isSeparatingAxis(a, b, a.normals[i], responses[i])) {
			for (k = 0; k < responses.length; k++) {
				this.responsePool.push(responses[k]);
			}
			
			this.arrayPool.push(responses, axes);
			
			return false;
		}
	}
	
	// If any of the edge normals of B is a separating axis, no intersection
	for (i = 0, j = aLen; i < bLen; i++, j++) {
		responses[j] = this.responsePool.pop();
		responses[j].clear();
		axes[j] = b.normals[i];
		
		if (this.isSeparatingAxis(a, b, b.normals[i], responses[j])) {
			for (k = 0; k < responses.length; k++) {
				this.responsePool.push(responses[k]);
			}
			
			this.arrayPool.push(responses, axes);
			
			return false;
		}
	}
	
	// Since none of the edge normals of A or B are a separating axis, there is
	// an intersection
	
	var viable = false;
	var ignored = false;
	var velocityTestVector = this.vectorPool.pop();
	
	// Determine the shortest desirable and viable separation from the responses
	for (i = 0; i < responses.length; i++) {
		// Is the overlap in the range we want?
		// TODO: Less than the max of tile width/height?
		if (!(responses[i].overlap > 0 && responses[i].overlap < Number.MAX_VALUE)) {
			continue;
		}
		
		// Is the overlap direction too close to that of the velocity direction?
		if (velocity && velocityTestVector.copy(responses[i].overlapN).scale(-1).dot(velocity) > 0) {
			continue;
		}
		
		ignored = false;
		
		// Is the axis of the overlap in the extra ignore list?
		for (j = 0; j < ignore.length; j++) {
			if (axes[i].x === ignore[j].x && axes[i].y === ignore[j].y) {
				ignored = true;
				
				break;
			}
		}
		
		// Skip this response if its normal is ignored
		if (ignored) {
			continue;
		}
		
		// Is this response's overlap shorter than that of the current?
		if (responses[i].overlap < response.overlap) {
			viable = true;
			response.aInB = responses[i].aInB;
			response.bInA = responses[i].bInA;
			response.overlap = responses[i].overlap;
			response.overlapN = responses[i].overlapN;
		}
	}
	
	// Set the polygons on the response and calculate the overlap vector
	if (viable) {
		response.a = a;
		response.b = b;
		response.overlapV.copy(response.overlapN).scale(response.overlap);
	}
	
	// Recycle the temporary responses, arrays and vectors used for calculations
	for (k = 0; k < responses.length; k++) {
		this.responsePool.push(responses[k]);
	}
	
	this.arrayPool.push(responses, axes);
	this.vectorPool.push(velocityTestVector);
	
	return viable;
};

/**
 * Separate the given body and tile from each other and apply any relevant
 * changes to the body's velocity.
 * 
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#collide
 * @param  {integer}                    i            - The tile index.
 * @param  {Phaser.Physics.Arcade.Body} body         - The physics body.
 * @param  {Phaser.Tile}                tile         - The tile.
 * @param  {Phaser.TilemapLayer}        tilemapLayer - The tilemap layer.
 * @param  {boolean}                    overlapOnly  - Whether to only check for an overlap.
 * @return {boolean}                                 - Whether the body was separated.
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.prototype.collide = function (i, body, tile, tilemapLayer, overlapOnly) {
	// Update the body's polygon position and velocity vector
	this.updateValues(body);
	
	// Bail out if we don't have everything we need
	if (!this.shouldCollide(body, tile)) {
		return false;
	}
	
	// Cater for SAT.js requiring center-origin circles
	if (body.isCircle) {
		body.polygon.pos.x += body.halfWidth;
		body.polygon.pos.y += body.halfHeight;
	}
	
	// Update the tile polygon position
	tile.slope.polygon.pos.x = tile.worldX + tilemapLayer.getCollisionOffsetX();
	tile.slope.polygon.pos.y = tile.worldY + tilemapLayer.getCollisionOffsetY();
	
	// Create the body's response if it doesn't have one
	body.slopes.sat.response = body.slopes.sat.response || new SAT.Response();
	
	// Acquire a temporary response from the pool
	var response = this.responsePool.pop();
	Phaser.Plugin.ArcadeSlopes.SatSolver.resetResponse(response);
	
	// Test for an overlap
	var circleOverlap = body.isCircle && SAT.testCirclePolygon(body.polygon, tile.slope.polygon, response);
	var polygonOverlap = !body.isCircle && this.testPolygonPolygon(body.polygon, tile.slope.polygon, response, body.slopes.velocity, tile.slope.ignormals);
	
	// Bail if there isn't one, leaving the body's response as is
	if (!circleOverlap && !polygonOverlap) {
		this.responsePool.push(response);
		
		return false;
	}
	
	// Invert our overlap vectors so that we have them facing outwards
	Phaser.Plugin.ArcadeSlopes.SatSolver.prepareResponse(response);
	
	// If we're only testing for the overlap, we can bail here
	if (overlapOnly) {
		Phaser.Plugin.ArcadeSlopes.SatSolver.copyResponse(response, body.slopes.sat.response);
		this.responsePool.push(response);
		
		return true;
	}
	
	// Bail out if no separation occurred
	if (!this.separate(body, tile, response)) {
		this.responsePool.push(response);
		
		return false;
	}
	
	// Copy the temporary response into the body's response, then recycle it
	Phaser.Plugin.ArcadeSlopes.SatSolver.copyResponse(response, body.slopes.sat.response);
	this.responsePool.push(response);
	
	response = body.slopes.sat.response;
	
	// Update the overlap properties of the body
	body.overlapX = response.overlapV.x;
	body.overlapY = response.overlapV.y;
	
	// Set the tile that the body separated from
	body.slopes.tile = tile;
	
	// Apply any velocity changes as a result of the collision
	this.applyVelocity(body, tile, response);
	
	// Update the touching and blocked flags of the physics body
	this.updateFlags(body, response);
	
	return true;
};

/**
 * Determine whether to separate a body from a tile, given an SAT response.
 *
 * Checks against the tile's collision flags and slope edge flags.
 * 
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#shouldSeparate
 * @param  {integer}                    i        - The tile index.
 * @param  {Phaser.Physics.Arcade.Body} body     - The physics body.
 * @param  {Phaser.Tile}                tile     - The tile.
 * @param  {SAT.Response}               response - The initial collision response.
 * @return {boolean}                             - Whether to pursue the narrow phase.
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.prototype.shouldSeparate = function (i, body, tile, response) {
	// Bail if the body is disabled or there is no overlap
	if (!(body.enable && response.overlap)) {
		return false;
	}
	
	// Only separate if the body is moving into the collision
	// if (response.overlapV.clone().scale(-1).dot(body.slopes.velocity) < 0) {
	// 	return false;
	// }
	
	// Otherwise we should separate normally
	return true;
};

/**
 * Render the given SAT response as a set of lines from the given position.
 * 
 * TODO: Actually maybe just collect the lines here for drawing later?
 *       Or, make this static and just something you can call in the
 *       context of a game, or game state.
 * 
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#debug
 * @param {Phaser.Point} position
 * @param {SAT.Response} response
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.prototype.debug = function (position, response) {
	// TODO: Implement.
};

/**
 * @author Chris Andrew <chris@hexus.io>
 * @copyright 2016-2021 Chris Andrew
 * @license MIT
 */

/**
 * Defines the slope of a tile.
 * 
 * @class Phaser.Plugin.ArcadeSlopes.TileSlope
 * @constructor
 * @param {integer}      type        - The type of the tile slope.
 * @param {Phaser.Tile}  tile        - The tile this slope definition belongs to.
 * @param {SAT.Polygon}  polygon     - The polygon representing the shape of the tile.
 * @param {Phaser.Line}  line        - The line representing the slope of the tile.
 * @param {object}       edges       - The flags for each edge of the tile.
 * @param {SAT.Vector}   axis        - The preferred axis for separating physics bodies.
 * @param {SAT.Vector[]} [ignormals] - An optional set of collision normals to ignore.
 */
Phaser.Plugin.ArcadeSlopes.TileSlope = function (type, tile, polygon, line, edges, axis, ignormals) {
	/**
	 * The type of the tile slope.
	 * 
	 * @property {integer} type
	 */
	this.type = type;
	
	/**
	 * The tile this slope definition is for.
	 * 
	 * @property {Phaser.Tile} tile
	 */
	this.tile = tile;
	
	/**
	 * The polygon representing the shape of the tile.
	 *
	 * @property {SAT.Polygon} polygon
	 */
	this.polygon = polygon;
	
	/**
	 * The line representing the slope of the tile.
	 *
	 * @property {Phaser.Tile} line
	 */
	this.line = line;
	
	/**
	 * The flags for each edge of the tile: empty, solid or interesting?
	 *
	 * @property {object} edges
	 */
	this.edges = Phaser.Utils.mixin(edges || {}, {
		top:    Phaser.Plugin.ArcadeSlopes.TileSlope.SOLID,
		bottom: Phaser.Plugin.ArcadeSlopes.TileSlope.SOLID,
		left:   Phaser.Plugin.ArcadeSlopes.TileSlope.SOLID,
		right:  Phaser.Plugin.ArcadeSlopes.TileSlope.SOLID
	});
	
	/**
	 * The preferred axis for separating physics bodies.
	 *
	 * @property {SAT.Vector} axis
	 */
	this.axis = axis || null;
	
	/**
	 * An optional set of collision normals to ignore.
	 * 
	 * @property {SAT.Vector[]} ignormals
	 */
	this.ignormals = ignormals || [];
	
	/**
	 * The preferred solver to use for this slope.
	 * 
	 * @property {string} solver
	 */
	this.solver = null;
	
	/**
	 * The friction of this slope.
	 *
	 * @property {Phaser.Point} friction
	 */
	this.friction = new Phaser.Point();
};

/**
 * Determine whether the start or end of one slope line meets the start or end
 * of another's.
 *
 * @param {Phaser.Plugin.ArcadeSlopes.TileSlope} slope - The tile slope to check intersection with.
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.prototype.meets = function (slope) {
	return this.line.start.equals(slope.line.end)
		|| this.line.end.equals(slope.line.start);
};

/**
 * Resolve a tile slope type constant from the given value.
 *
 * Returns any successfully parsed non-negative integers regardless of whether
 * they are valid slope tile types. This method is really for strings.
 *
 * @method Phaser.Plugin.ArcadeSlopes.TileSlope#resolveType
 * @param  {string|integer} type - The value to resolve.
 * @return {integer}             - The resolved tile slope type constant.
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.resolveType = function (type) {
	if (parseInt(type) >= 0) {
		return type;
	}
	
	if (typeof type === 'string') {
		type = type.toUpperCase();
	}
	
	if (Phaser.Plugin.ArcadeSlopes.TileSlope.hasOwnProperty(type)) {
		return Phaser.Plugin.ArcadeSlopes.TileSlope[type];
	}
	
	console.warn('Unknown slope type \'' + type + '\'');
	
	return Phaser.Plugin.ArcadeSlopes.TileSlope.UNKNOWN;
};

/**
 * The slope of the tile.
 *
 * @name Phaser.Plugin.ArcadeSlopes.TileSlope#slope
 * @property {number} slope
 */
Object.defineProperty(Phaser.Plugin.ArcadeSlopes.TileSlope.prototype, 'slope', {
	get: function () {
		if (!this.line) {
			return 0;
		}
		
		return (this.line.start.y - this.line.end.y) / (this.line.start.x - this.line.end.x);
	}
});

/**
 * The name of the tile slope type.
 *
 * @name Phaser.Plugin.ArcadeSlopes.TileSlope#typeName
 * @property {string} typeName
 */
Object.defineProperty(Phaser.Plugin.ArcadeSlopes.TileSlope.prototype, 'typeName', {
	get: function () {
		return Phaser.Plugin.ArcadeSlopes.TileSlope.resolveTypeName(this.type);
	},
	set: function (type) {
		this.type = Phaser.Plugin.ArcadeSlopes.TileSlope.resolveType(type);
	}
});

/**
 * Resolve a tile slope type name from the given type constant.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlope#resolveTypeName
 * @param  {integer} type - The type constant.
 * @return {integer}      - The type name.
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.resolveTypeName = function (type) {
	if (Phaser.Plugin.ArcadeSlopes.TileSlope.typeNames.hasOwnProperty(type)) {
		return Phaser.Plugin.ArcadeSlopes.TileSlope.typeNames[type];
	}
	
	return Phaser.Plugin.ArcadeSlopes.TileSlope.typeNames[-1];
};

/**
 * The map of tile slope types to their corresponding type names.
 *
 * @static
 * @property {object} typeNames
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.typeNames = {
	'-1': 'UNKNOWN',
	0:  'FULL',
	21: 'HALF_BOTTOM',
	22: 'HALF_TOP',
	23: 'HALF_LEFT',
	24: 'HALF_RIGHT',
	1:  'HALF_BOTTOM_LEFT',
	2:  'HALF_BOTTOM_RIGHT',
	3:  'HALF_TOP_LEFT',
	4:  'HALF_TOP_RIGHT',
	5:  'QUARTER_BOTTOM_LEFT_LOW',
	6:  'QUARTER_BOTTOM_LEFT_HIGH',
	7:  'QUARTER_BOTTOM_RIGHT_LOW',
	8:  'QUARTER_BOTTOM_RIGHT_HIGH',
	9:  'QUARTER_LEFT_BOTTOM_LOW',
	10: 'QUARTER_LEFT_BOTTOM_HIGH',
	11: 'QUARTER_RIGHT_BOTTOM_LOW',
	12: 'QUARTER_RIGHT_BOTTOM_HIGH',
	13: 'QUARTER_LEFT_TOP_LOW',
	14: 'QUARTER_LEFT_TOP_HIGH',
	15: 'QUARTER_RIGHT_TOP_LOW',
	16: 'QUARTER_RIGHT_TOP_HIGH',
	17: 'QUARTER_TOP_LEFT_LOW',
	18: 'QUARTER_TOP_LEFT_HIGH',
	19: 'QUARTER_TOP_RIGHT_LOW',
	20: 'QUARTER_TOP_RIGHT_HIGH',
};

// TODO: Misleading constants here - they aren't tile slope types, they're edges

/**
 * An empty tile edge.
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.EMPTY = 0;

/**
 * A solid tile edge.
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.SOLID = 1;

/**
 * An interesting tile edge.
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING = 2;

/**
 * An undefined tile slope type.
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.UNKNOWN = -1;

/**
 * A full square tile.
 * .___
 * |   |
 * |___|
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.FULL = 0;

/**
 * A half bottom tile.
 * .
 *  ___
 * |___|
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_BOTTOM = 21;

/**
 * A half top tile.
 * .___
 * |___|
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_TOP = 22;

/**
 * A half left tile.
 * ._
 * | |
 * |_|
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_LEFT = 23;

/**
 * A half right tile.
 * .  _
 *   | |
 *   |_|
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_RIGHT = 24;

/**
 * A 45 degree bottom left slope.
 *
 * |\
 * | \
 * |__\
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_BOTTOM_LEFT = 1;

/**
 * A 45 degree bottom right slope.
 *
 *   /|
 *  / |
 * /__|
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_BOTTOM_RIGHT = 2;

/**
 * A 45 degree top left slope.
 *  __
 * |  /
 * | /
 * |/
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_TOP_LEFT = 3;

/**
 * A 45 degree top right slope.
 *  __
 * \  |
 *  \ |
 *   \|
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_TOP_RIGHT = 4;

/**
 * |\
 * | | |\
 * |_| |_\ <--
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_BOTTOM_LEFT_LOW = 5;

/**
 *    |\
 *    | | |\
 * -->|_| |_\
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_BOTTOM_LEFT_HIGH = 6;

/**
 *         /|
 *     /| | |
 * -->/_| |_|
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_BOTTOM_RIGHT_LOW = 7;

/**
 *      /|
 *  /| | |
 * /_| |_|<--
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_BOTTOM_RIGHT_HIGH = 8;

/**
 * |\
 * |_\
 *  __
 * |  \ <--
 * |___\
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_LEFT_BOTTOM_LOW = 9;

/**
 * |\
 * |_\ <--
 *  __
 * |  \
 * |___\
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_LEFT_BOTTOM_HIGH = 10;

/**
 *    /|
 *   /_|
 *   __
 *  /  | <--
 * /___|
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_RIGHT_BOTTOM_LOW = 11;

/**
 *    /|
 *   /_| <--
 *   __
 *  /  |
 * /___|
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_RIGHT_BOTTOM_HIGH = 12;

/**
 *  ____
 * |    /
 * |___/
 *  __
 * | /  <--
 * |/
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_LEFT_TOP_LOW = 13;

/**
 *  ____
 * |    / <--
 * |___/
 *  __
 * | /
 * |/
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_LEFT_TOP_HIGH = 14;

/**
 *  ____
 * \    |
 *  \___|
 *    __
 *    \ | <--
 *     \|
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_RIGHT_TOP_LOW = 15;

/**
 *  ____
 * \    | <--
 *  \___|
 *    __
 *    \ |
 *     \|
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_RIGHT_TOP_HIGH = 16;

/**
 *  __    __
 * |  |  | / <--
 * |  |  |/
 * | /
 * |/
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_TOP_LEFT_LOW = 17;

/**
 *      __    __
 *     |  |  | /
 * --> |  |  |/
 *     | /
 *     |/
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_TOP_LEFT_HIGH = 18;

/**
 *    __   __
 *    \ | |  |
 * --> \| |  |
 *         \ |
 *          \|
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_TOP_RIGHT_LOW = 19;

/**
 * __   __
 * \ | |  |
 *  \| |  | <--
 *      \ |
 *       \|
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_TOP_RIGHT_HIGH = 20;

/**
 * @author Chris Andrew <chris@hexus.io>
 * @copyright 2016-2021 Chris Andrew
 * @license MIT
 */

/**
 * Builds TileSlope objects from a set of definition functions.
 * 
 * @class Phaser.Plugin.ArcadeSlopes.TileSlopeFactory
 * @constructor
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory = function () {
	/**
	 * A set of definition functions for the factory to use to build tile slopes
	 * of a given type.
	 * 
	 * Maps slope type constants to definition functions.
	 * 
	 * @property {object} definitions
	 */
	this.definitions = {};
	
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.FULL]                      = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createFull;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_BOTTOM]               = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createHalfBottom;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_TOP]                  = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createHalfTop;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_LEFT]                 = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createHalfLeft;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_RIGHT]                = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createHalfRight;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_BOTTOM_LEFT]          = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createHalfBottomLeft;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_BOTTOM_RIGHT]         = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createHalfBottomRight;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_TOP_LEFT]             = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createHalfTopLeft;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_TOP_RIGHT]            = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createHalfTopRight;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_BOTTOM_LEFT_LOW]   = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterBottomLeftLow;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_BOTTOM_LEFT_HIGH]  = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterBottomLeftHigh;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_BOTTOM_RIGHT_LOW]  = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterBottomRightLow;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_BOTTOM_RIGHT_HIGH] = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterBottomRightHigh;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_LEFT_BOTTOM_LOW]   = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterLeftBottomLow;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_LEFT_BOTTOM_HIGH]  = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterLeftBottomHigh;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_RIGHT_BOTTOM_LOW]  = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterRightBottomLow;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_RIGHT_BOTTOM_HIGH] = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterRightBottomHigh;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_LEFT_TOP_LOW]      = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterLeftTopLow;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_LEFT_TOP_HIGH]     = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterLeftTopHigh;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_RIGHT_TOP_LOW]     = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterRightTopLow;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_RIGHT_TOP_HIGH]    = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterRightTopHigh;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_TOP_LEFT_LOW]      = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterTopLeftLow;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_TOP_LEFT_HIGH]     = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterTopLeftHigh;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_TOP_RIGHT_LOW]     = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterTopRightLow;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_TOP_RIGHT_HIGH]    = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterTopRightHigh;
	
	/**
	 * A set of common slope mapping functions that can be used instead of an
	 * explicit map.
	 * 
	 * Maps TileSlopeFactory constants to mapping functions.
	 * 
	 * @property {object} mappings
	 */
	this.mappings = {};
	
	this.mappings[Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.ARCADESLOPES] = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.mapArcadeSlopes;
	this.mappings[Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.NINJA]        = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.mapNinjaPhysics;
	
	/**
	 * A pool of vectors.
	 * 
	 * @property {SAT.Vector[]} vectorPool
	 */
	this.vectorPool = [];
	
	for (var i = 0; i < 100; i++) {
		this.vectorPool.push(new SAT.Vector());
	}
};

Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.prototype.constructor = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory;

/**
 * Define a new tile slope type.
 *
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#define
 * @param  {integer}  type       - The slope type key.
 * @param  {function} definition - The slope type definition function.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.prototype.define = function (type, definition) {
	if (typeof definition !== 'function') {
		return;
	}
	
	this.definitions[type] = definition;
};

/**
 * Create a TileSlope of the given type for the given tile.
 *
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#create
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.prototype.create = function (type, tile) {
	var original = type;
	
	type = Phaser.Plugin.ArcadeSlopes.TileSlope.resolveType(original);
	
	if (!this.definitions.hasOwnProperty(type)) {
		console.warn('Slope type ' + original + ' not defined');
		
		return null;
	}
	
	if (typeof this.definitions[type] !== 'function') {
		console.warn('Slope type definition for type ' + original + ' is not a function');
		
		return null;
	}
	
	return this.definitions[type].call(this, type, tile);
};

/**
 * Convert a layer of the given tilemap.
 * 
 * Attaches Phaser.Plugin.ArcadeSlopes.TileSlope objects that are used to define
 * how the tile should collide with a physics body.
 *
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#convertTilemap
 * @param  {Phaser.Tilemap}                    map      - The map containing the layer to convert.
 * @param  {number|string|Phaser.TileMapLayer} layer    - The layer of the map to convert.
 * @param  {string|object}                     slopeMap - A mapping type string, or a map of tilemap indexes to ArcadeSlope.TileSlope constants.
 * @param  {integer}                           index    - An optional first tile index (firstgid).
 * @return {Phaser.Tilemap}                             - The converted tilemap.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.prototype.convertTilemap = function (map, layer, slopeMap, offset) {
	layer = map.getLayer(layer);
	
	this.convertTilemapLayer(layer, slopeMap, offset);
	
	return map;
};

/**
 * Convert a tilemap layer.
 *
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#convertTilemapLayer
 * @param  {Phaser.TilemapLayer} layer    - The tilemap layer to convert.
 * @param  {string|object}       slopeMap - A mapping type string, or a map of tilemap indexes to ArcadeSlope.TileSlope constants.
 * @param  {integer}             index    - An optional first tile index (firstgid).
 * @return {Phaser.TilemapLayer}          - The converted tilemap layer.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.prototype.convertTilemapLayer = function (layer, slopeMap, index) {
	var that = this;
	
	// Resolve a predefined slope map if a string is given
	if (typeof slopeMap === 'string') {
		var mappingType = this.resolveMappingType(slopeMap);
		
		if (!this.mappings[mappingType]) {
			console.warn('Tilemap could not be converted; mapping type \'' + slopeMap + '\' is unknown');
			
			return layer;
		}
		
		slopeMap = this.mappings[mappingType](index);
	}
	
	// Create the TileSlope objects for each relevant tile in the layer
	layer.layer.data.forEach(function (row) {
		row.forEach(function (tile) {
			var slope;
			
			// Try to resolve a slope from the tile's type property
			if (tile.properties.type) {
				slope = that.create(tile.properties.type, tile);
			}
			
			// Otherwise resolve a type from its index
			if (!slope && slopeMap.hasOwnProperty(tile.index)) {
				slope = that.create(slopeMap[tile.index], tile);
			}
			
			if (slope) {
				tile.slope = slope;
			}
			
			var x = tile.x;
			var y = tile.y;
			
			tile.neighbours = tile.neighbours || {};
			
			// Give each tile references to their eight neighbours
			tile.neighbours.above       = layer.map.getTileAbove(layer.index, x, y);
			tile.neighbours.below       = layer.map.getTileBelow(layer.index, x, y);
			tile.neighbours.left        = layer.map.getTileLeft(layer.index, x, y);
			tile.neighbours.right       = layer.map.getTileRight(layer.index, x, y);
			tile.neighbours.topLeft     = layer.map.getTileTopLeft(layer.index, x, y);
			tile.neighbours.topRight    = layer.map.getTileTopRight(layer.index, x, y);
			tile.neighbours.bottomLeft  = layer.map.getTileBottomLeft(layer.index, x, y);
			tile.neighbours.bottomRight = layer.map.getTileBottomRight(layer.index, x, y);
		});
	});
	
	// Calculate the edge flags for each tile in the layer
	this.calculateEdges(layer);
	
	// Add some extra properties to the layer's debug settings
	this.addDebugSettings(layer);
	
	return layer;
};

/**
 * Calculate the edge flags for each tile in the given tilemap layer.
 *
 * TODO: Allow this to work with an optional range of tile coordinates.
 * 
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#calculateEdges
 * @param {Phaser.TilemapLayer} layer - The tilemap layer to calculate edge flags for.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.prototype.calculateEdges = function (layer) {
	var x, y, h, w, tile, above, below, left, right;
	
	h = layer.layer.height;
	w = layer.layer.width;
	
	for (y = 0; y < h; y++) {
		for (x = 0; x < w; x++) {
			tile = layer.layer.data[y][x];
			
			if (tile && tile.hasOwnProperty('slope')) {
				// Compare edges and flag internal vertices
				above = layer.map.getTileAbove(layer.index, x, y);
				below = layer.map.getTileBelow(layer.index, x, y);
				left  = layer.map.getTileLeft(layer.index, x, y);
				right = layer.map.getTileRight(layer.index, x, y);
				
				if (above && above.hasOwnProperty('slope')) {
					tile.slope.edges.top = this.compareEdges(tile.slope.edges.top, above.slope.edges.bottom);
					tile.collideUp = tile.slope.edges.top !== Phaser.Plugin.ArcadeSlopes.TileSlope.EMPTY;
					this.flagInternalVertices(tile, above);
				}
				
				if (below && below.hasOwnProperty('slope')) {
					tile.slope.edges.bottom = this.compareEdges(tile.slope.edges.bottom, below.slope.edges.top);
					tile.collideDown = tile.slope.edges.bottom !== Phaser.Plugin.ArcadeSlopes.TileSlope.EMPTY;
					this.flagInternalVertices(tile, below);
				}
				
				if (left && left.hasOwnProperty('slope')) {
					tile.slope.edges.left = this.compareEdges(tile.slope.edges.left, left.slope.edges.right);
					tile.collideLeft = tile.slope.edges.left !== Phaser.Plugin.ArcadeSlopes.TileSlope.EMPTY;
					this.flagInternalVertices(tile, left);
				}
				
				if (right && right.hasOwnProperty('slope')) {
					tile.slope.edges.right = this.compareEdges(tile.slope.edges.right, right.slope.edges.left);
					tile.collideRight = tile.slope.edges.right !== Phaser.Plugin.ArcadeSlopes.TileSlope.EMPTY;
					this.flagInternalVertices(tile, right);
				}
			}
		}
	}
	
	// Flag further normals that we want to ignore for this tile, now that all
	// of the edges have been set
	for (y = 0; y < h; y++) {
		for (x = 0; x < w; x++) {
			tile = layer.layer.data[y][x];
			
			this.flagIgnormals(tile);
		}
	}
};

/**
 * Resolve the given flags of two contiguous tile edges.
 * 
 * Returns the new flag to use for the first edge after comparing it with the
 * second edge.
 * 
 * This compares AABB edges of each tile, not polygon edges.
 * 
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#compareEdges
 * @param  {integer} firstEdge  - The edge to resolve.
 * @param  {integer} secondEdge - The edge to compare against.
 * @return {integer}            - The resolved edge.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.prototype.compareEdges = function (firstEdge, secondEdge) {
	if (firstEdge === Phaser.Plugin.ArcadeSlopes.TileSlope.SOLID && secondEdge === Phaser.Plugin.ArcadeSlopes.TileSlope.SOLID) {
		return Phaser.Plugin.ArcadeSlopes.TileSlope.EMPTY;
	}
	
	if (firstEdge === Phaser.Plugin.ArcadeSlopes.TileSlope.SOLID && secondEdge === Phaser.Plugin.ArcadeSlopes.TileSlope.EMPTY) {
		return Phaser.Plugin.ArcadeSlopes.TileSlope.EMPTY;
	}
	
	return firstEdge;
};

/**
 * Compares the polygon edges of two tiles and flags those that match.
 * 
 * Because the polygons are represented by a set of points, instead of actual
 * edges, the first vector (assuming they are specified clockwise) of each
 * potential edge is flagged instead.
 *
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#flagInternalVertices
 * @param  {Phaser.Tile} firstTile  - The first tile to compare.
 * @param  {Phaser.Tile} secondTile - The second tile to compare.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.prototype.flagInternalVertices = function (firstTile, secondTile) {
	// Bail if either tile lacks a polygon
	if (!firstTile.slope.polygon || !secondTile.slope.polygon) {
		return;
	}
	
	// Access the tile polygons and grab some vectors from the pool
	var firstPolygon = firstTile.slope.polygon;
	var secondPolygon = secondTile.slope.polygon;
	var firstPosition = this.vectorPool.pop();
	var secondPosition = this.vectorPool.pop();
	var firstTileVertexOne = this.vectorPool.pop();
	var firstTileVertexTwo = this.vectorPool.pop();
	var secondTileVertexOne = this.vectorPool.pop();
	var secondTileVertexTwo = this.vectorPool.pop();
	var exactMatch;
	var inverseMatch;
	
	// TODO: Take into account tilemap offset...
	firstPosition.x = firstTile.worldX;
	firstPosition.y = firstTile.worldY;
	secondPosition.x = secondTile.worldX;
	secondPosition.y = secondTile.worldY;
	
	for (var i = 0; i < firstPolygon.points.length; i++) {
		firstTileVertexOne.copy(firstPolygon.points[i]).add(firstPosition);
		firstTileVertexTwo.copy(firstPolygon.points[(i + 1) % firstPolygon.points.length]).add(firstPosition);
		
		for (var j = 0; j < secondPolygon.points.length; j++) {
			secondTileVertexOne.copy(secondPolygon.points[j]).add(secondPosition);
			secondTileVertexTwo.copy(secondPolygon.points[(j + 1) % secondPolygon.points.length]).add(secondPosition);
			
			// Now we can compare vertices for an exact or inverse match
			exactMatch = firstTileVertexOne.x === secondTileVertexOne.x &&
				firstTileVertexOne.y === secondTileVertexOne.y &&
				firstTileVertexTwo.x === secondTileVertexTwo.x &&
				firstTileVertexTwo.y === secondTileVertexTwo.y;
			
			inverseMatch = firstTileVertexOne.x === secondTileVertexTwo.x &&
				firstTileVertexOne.y === secondTileVertexTwo.y &&
				firstTileVertexTwo.x === secondTileVertexOne.x &&
				firstTileVertexTwo.y === secondTileVertexOne.y;
			
			// Flag the first vertex and the normal of the internal edge
			if (exactMatch || inverseMatch) {
				firstPolygon.normals[i].ignore = true;
				secondPolygon.normals[j].ignore = true;
				
				firstTile.slope.ignormals.push(firstPolygon.normals[i]);
				secondTile.slope.ignormals.push(secondPolygon.normals[j]);
			}
		}
	}
	
	// Recycle the vectors we used
	this.vectorPool.push(
		firstPosition, secondPosition, firstTileVertexOne, firstTileVertexTwo,
		secondTileVertexOne, secondTileVertexTwo
	);
};

/**
 * Flag further normals to ignore to prevent unwanted collision responses.
 *
 * Simply observes Phaser's edge flags of neighbouring tiles to decide whether
 * axis-aligned collisions are desirable.
 *
 * Heuristics 2.0. Generalised instead of tile-specific.
 *
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#flagIgnormals
 * @param {Phaser.Tile} tile  - The tile to flag ignormals for.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.prototype.flagIgnormals = function (tile) {
	if (!tile.slope || !tile.slope.polygon) {
		return;
	}
	
	// Skip full and half blocks
	// TODO: Skip any tiles with purely axis-aligned edges
	if (tile.slope.type === Phaser.Plugin.ArcadeSlopes.TileSlope.FULL ||
		tile.slope.type === Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_TOP ||
		tile.slope.type === Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_BOTTOM ||
		tile.slope.type === Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_LEFT ||
		tile.slope.type === Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_RIGHT
	) {
		return;
	}
	
	// Define some shorthand variables to use in the conditions
	var empty       = Phaser.Plugin.ArcadeSlopes.TileSlope.EMPTY;
	var interesting = Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING;
	var solid       = Phaser.Plugin.ArcadeSlopes.TileSlope.SOLID;
	var slope       = tile.slope.slope;
	var above       = tile.neighbours.above;
	var below       = tile.neighbours.below;
	var left        = tile.neighbours.left;
	var right       = tile.neighbours.right;
	var topLeft     = tile.neighbours.topLeft;
	var topRight    = tile.neighbours.topRight;
	var bottomLeft  = tile.neighbours.bottomLeft;
	var bottomRight = tile.neighbours.bottomRight;
	
	// Skip neighbours without a TileSlope
	if (above && !above.hasOwnProperty('slope')) {
		above = null;
	}
	
	if (below && !below.hasOwnProperty('slope')) {
		below = null;
	}
	
	if (left && !left.hasOwnProperty('slope')) {
		left = null;
	}
	
	if (right && !right.hasOwnProperty('slope')) {
		right = null;
	}
	
	if (topLeft && !topLeft.hasOwnProperty('slope')) {
		topLeft = null;
	}
	
	if (topRight && !topRight.hasOwnProperty('slope')) {
		topRight = null;
	}
	
	if (bottomLeft && !bottomLeft.hasOwnProperty('slope')) {
		bottomLeft = null;
	}
	
	if (bottomRight && !bottomRight.hasOwnProperty('slope')) {
		bottomRight = null;
	}
	
	// Determine the interesting edges of the current tile
	var topInteresting    = tile.slope.edges.top === interesting;
	var bottomInteresting = tile.slope.edges.bottom === interesting;
	var leftInteresting   = tile.slope.edges.left === interesting;
	var rightInteresting  = tile.slope.edges.right === interesting;
	
	// Skip top collisions
	if (topInteresting && (
		(topLeft && topLeft.slope.edges.right === interesting && slope === topLeft.slope.slope && tile.slope.meets(topLeft.slope)) ||
		(topRight && topRight.slope.edges.left === interesting && slope === topRight.slope.slope && tile.slope.meets(topRight.slope)) ||
		(leftInteresting && rightInteresting && (
			(left && left.slope.edges.top !== solid && left.slope.edges.right === interesting && slope === left.slope.slope && tile.slope.meets(left.slope)) ||
			(right && right.slope.edges.top !== solid && right.slope.edges.left === interesting && slope === right.slope.slope && tile.slope.meets(right.slope))
		))
	)) {
		tile.slope.ignormals.push(new SAT.Vector(0, -1));
	}
	
	// Skip bottom collisions
	if (bottomInteresting && (
		(bottomLeft && bottomLeft.slope.edges.right === interesting && slope === bottomLeft.slope.slope && tile.slope.meets(bottomLeft.slope)) ||
		(bottomRight && bottomRight.slope.edges.left === interesting && slope === bottomRight.slope.slope && tile.slope.meets(bottomRight.slope)) ||
		(leftInteresting && rightInteresting && (
			(left && left.slope.edges.bottom !== solid && left.slope.edges.right === interesting && slope === left.slope.slope && tile.slope.meets(left.slope)) ||
			(right && right.slope.edges.bottom !== solid && right.slope.edges.left === interesting && slope === right.slope.slope && tile.slope.meets(right.slope))
		))
	)) {
		tile.slope.ignormals.push(new SAT.Vector(0, 1));
	}
	
	// Skip left collisions
	if (leftInteresting && (
		(topLeft && topLeft.slope.edges.bottom === interesting && slope === topLeft.slope.slope && tile.slope.meets(topLeft.slope)) ||
		(bottomLeft && bottomLeft.slope.edges.top === interesting && slope === bottomLeft.slope.slope && tile.slope.meets(bottomLeft.slope)) ||
		(topInteresting && bottomInteresting && (
			(above && above.slope.edges.left !== solid && above.slope.edges.bottom === interesting && slope === above.slope.slope && tile.slope.meets(above.slope)) ||
			(below && below.slope.edges.left !== solid && below.slope.edges.top === interesting && slope === below.slope.slope && tile.slope.meets(below.slope))
		))
	)) {
		tile.slope.ignormals.push(new SAT.Vector(-1, 0));
	}
	
	// Skip right collisions
	if (rightInteresting && (
		(topRight && topRight.slope.edges.bottom === interesting && slope === topRight.slope.slope && tile.slope.meets(topRight.slope)) ||
		(bottomRight && bottomRight.slope.edges.top === interesting && slope === bottomRight.slope.slope && tile.slope.meets(bottomRight.slope)) ||
		(topInteresting && bottomInteresting && (
			(above && above.slope.edges.right !== solid && above.slope.edges.bottom === interesting && slope === above.slope.slope && tile.slope.meets(above.slope)) ||
			(below && below.slope.edges.right !== solid && below.slope.edges.top === interesting && slope === below.slope.slope && tile.slope.meets(below.slope))
		))
	)) {
		tile.slope.ignormals.push(new SAT.Vector(1, 0));
	}
};

/**
 * Add some extra debug settings to a tilemap layer for debug rendering.
 *
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#addDebugSettings
 * @param {Phaser.TilemapLayer} layer - The tilemap layer.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.prototype.addDebugSettings = function (layer) {
	layer._mc.edgeMidpoint = new SAT.Vector();
	layer.debugSettings.slopeFill = 'rgba(255, 0, 255, 0.2)';
	layer.debugSettings.slopeEdgeStroke = 'rgba(255, 0, 255, 0.4)';
	layer.debugSettings.slopeLineStroke = 'rgba(255, 128, 128, 1)';
	layer.debugSettings.slopeCollidingEdgeStroke = 'rgba(255, 0, 255, 1)';
	layer.debugSettings.slopeCollidingEdgeStrokeWidth = 2;
	layer.debugSettings.slopeNormalStroke = 'rgba(0, 255, 255, 0.4)';
	layer.debugSettings.slopeNormalStrokeWidth = 1;
	layer.debugSettings.slopeCollidingNormalStroke = 'rgba(0, 255, 255, 1)';
	layer.debugSettings.slopeCollidingNormalStrokeWidth = 2;
};

/**
 * Resolve a tileset mapping constant from the given value.
 * 
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#resolveMapping
 * @param  {string}  type - The value to resolve a mapping from.
 * @return {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.prototype.resolveMappingType = function (type) {
	if (parseInt(type) >= 0) {
		return type;
	}
	
	if (typeof type === 'string') {
		type = type.toUpperCase();
	}
	
	if (Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.hasOwnProperty(type) &&
	    this.mappings[Phaser.Plugin.ArcadeSlopes.TileSlopeFactory[type]]
	) {
		return Phaser.Plugin.ArcadeSlopes.TileSlopeFactory[type];
	}
	
	console.warn('Unknown tileset mapping type \'' + type + '\'');
	
	return -1;
};

/**
 * Define a full square tile.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createFull
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createFull = function (type, tile) {
	var polygon = new SAT.Box(
		new SAT.Vector(tile.worldX, tile.worldY),
		tile.width,
		tile.height
	).toPolygon();
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon);
};

/**
 * Define a bottom half tile.
 * 
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createHalfBottom
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createHalfBottom = function (type, tile) {
	var halfHeight = tile.height / 2;
	
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, halfHeight),
		new SAT.Vector(tile.width, halfHeight),
		new SAT.Vector(tile.width, tile.height),
		new SAT.Vector(0, tile.height)
	]);
	
	var line = new Phaser.Line(tile.left, tile.top + tile.height / 2, tile.right, tile.top + tile.height / 2);
	
	var edges = {
		top:   Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		left:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		right: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges);
};

/**
 * Define a top half tile.
 * 
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createHalfTop
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createHalfTop = function (type, tile) {
	var halfHeight = tile.height / 2;
	
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, 0),
		new SAT.Vector(tile.width, 0),
		new SAT.Vector(tile.width, halfHeight),
		new SAT.Vector(0, halfHeight)
	]);
	
	var line = new Phaser.Line(tile.left, tile.top + tile.height / 2, tile.right, tile.top + tile.height / 2);
	
	var edges = {
		bottom: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		left:   Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		right:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges);
};

/**
 * Define a left half tile.
 * 
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createHalfLeft
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createHalfLeft = function (type, tile) {
	var halfWidth = tile.width / 2;
	
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, 0),
		new SAT.Vector(halfWidth, 0),
		new SAT.Vector(halfWidth, tile.height),
		new SAT.Vector(0, tile.height)
	]);
	
	var line = new Phaser.Line(tile.left + halfWidth, tile.top, tile.left + halfWidth, tile.bottom);
	
	var edges = {
		top:    Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		bottom: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		right:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges);
};

/**
 * Define a right half tile.
 * 
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createHalfRight
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createHalfRight = function (type, tile) {
	var halfWidth = tile.width / 2;
	
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(halfWidth, 0),
		new SAT.Vector(tile.width, 0),
		new SAT.Vector(tile.width, tile.height),
		new SAT.Vector(halfWidth, tile.height)
	]);
	
	var line = new Phaser.Line(tile.left + halfWidth, tile.top, tile.left + halfWidth, tile.bottom);
	
	var edges = {
		top:    Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		bottom: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		left:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges);
};

/**
 * Define a 45 degree bottom left slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createHalfBottomLeft
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createHalfBottomLeft = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, 0),                    // Top left
		new SAT.Vector(tile.width, tile.height), // Bottom right
		new SAT.Vector(0, tile.height)           // Bottom left
	]);
	
	var line = new Phaser.Line(tile.left, tile.top, tile.right, tile.bottom);
	
	var edges = {
		top:   Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		right: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(0.7071067811865475, -0.7071067811865475);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};

/**
 * Define a 45 degree bottom right slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createHalfBottomRight
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createHalfBottomRight = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(tile.width, 0),           // Top right
		new SAT.Vector(tile.width, tile.height), // Bottom right
		new SAT.Vector(0, tile.height)           // Bottom left
	]);
	
	var line = new Phaser.Line(tile.left, tile.bottom, tile.right, tile.top);
	
	var edges = {
		top:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		left: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(-0.707106781186548, -0.707106781186548);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};

/**
 * Define a 45 degree top left slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createHalfTopLeft
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createHalfTopLeft = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, 0),          // Top left
		new SAT.Vector(tile.width, 0), // Top right
		new SAT.Vector(0, tile.height) // Bottom right
	]);
	
	var line = new Phaser.Line(tile.right, tile.top, tile.left, tile.bottom);
	
	var edges = {
		bottom: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		right:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(0.7071067811865475, 0.7071067811865475);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};

/**
 * Define a 45 degree top left slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createHalfTopRight
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createHalfTopRight = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, 0),                   // Top left
		new SAT.Vector(tile.width, 0),          // Top right
		new SAT.Vector(tile.width, tile.height) // Bottom right
	]);
	
	var line = new Phaser.Line(tile.right, tile.bottom, tile.left, tile.top);
	
	var edges = {
		bottom: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		left:   Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(-0.7071067811865475, 0.7071067811865475);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};

/**
 * Define a lower 22.5 degree bottom left slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createQuarterBottomLeftLow
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterBottomLeftLow = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, tile.height / 2),      // Center left
		new SAT.Vector(tile.width, tile.height), // Bottom right
		new SAT.Vector(0, tile.height)           // Bottom left
	]);
	
	var line = new Phaser.Line(tile.left, tile.top + tile.height / 2, tile.right, tile.bottom);
	
	var edges = {
		top:   Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		left:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		right: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(0.4472135954999579, -0.8944271909999159);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};

/**
 * Define an upper 22.5 degree bottom left slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createQuarterBottomLeftHigh
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterBottomLeftHigh = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, 0),                        // Top left
		new SAT.Vector(tile.width, tile.height / 2), // Center right
		new SAT.Vector(tile.width, tile.height),     // Bottom right
		new SAT.Vector(0, tile.height)               // Bottom left
	]);
	
	var line = new Phaser.Line(tile.left, tile.top, tile.right, tile.top + tile.height / 2);
	
	var edges = {
		top:   Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		right: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(0.4472135954999579, -0.8944271909999159);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};

/**
 * Define a lower 22.5 degree bottom right slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createQuarterBottomRightLow
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterBottomRightLow = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(tile.width, tile.height / 2), // Center right
		new SAT.Vector(tile.width, tile.height),     // Bottom right
		new SAT.Vector(0, tile.height)               // Bottom left
	]);
	
	var line = new Phaser.Line(tile.left, tile.bottom, tile.right, tile.top + tile.height / 2);
	
	var edges = {
		top:   Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		left:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		right: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(-0.4472135954999579, -0.8944271909999159);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};

/**
 * Define an upper 22.5 degree bottom right slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createQuarterBottomRightHigh
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterBottomRightHigh = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, tile.height / 2),      // Center left
		new SAT.Vector(tile.width, 0),           // Top right
		new SAT.Vector(tile.width, tile.height), // Bottom right
		new SAT.Vector(0, tile.height)           // Bottom left
	]);
	
	var line = new Phaser.Line(tile.left, tile.top + tile.height / 2, tile.right, tile.top);
	
	var edges = {
		top:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		left: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(-0.4472135954999579, -0.8944271909999159);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};


/**
 * Define a lower 22.5 degree left bottom slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createQuarterLeftBottomLow
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterLeftBottomLow = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, 0),                    // Top left
		new SAT.Vector(tile.width / 2, 0),       // Top center
		new SAT.Vector(tile.width, tile.height), // Bottom right
		new SAT.Vector(0, tile.height)           // Bottom left
	]);
	
	var line = new Phaser.Line(tile.left + tile.width / 2, tile.top, tile.right, tile.bottom);
	
	var edges = {
		top:   Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		right: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(0.8944271909999159, -0.4472135954999579);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};

/**
 * Define an upper 22.5 degree left bottom slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createQuarterLeftBottomHigh
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterLeftBottomHigh = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, 0),                        // Top left
		new SAT.Vector(tile.width / 2, tile.height), // Bottom center
		new SAT.Vector(0, tile.height)               // Bottom left
	]);
	
	var line = new Phaser.Line(tile.left, tile.top, tile.left + tile.width / 2, tile.bottom);
	
	var edges = {
		top:    Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		bottom: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		right:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(0.8944271909999159, -0.4472135954999579);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};


/**
 * Define a lower 22.5 degree right bottom slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createQuarterRightBottomLow
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterRightBottomLow = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(tile.width / 2, 0),       // Top center
		new SAT.Vector(tile.width, 0),           // Top right
		new SAT.Vector(tile.width, tile.height), // Bottom right
		new SAT.Vector(0, tile.height)           // Bottom left
	]);
	
	var line = new Phaser.Line(tile.left, tile.bottom, tile.left + tile.width / 2, tile.top);
	
	var edges = {
		top:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		left: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(-0.8944271909999159, -0.4472135954999579);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};


/**
 * Define an upper 22.5 degree right bottom slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createQuarterRightBottomHigh
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterRightBottomHigh = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(tile.width, 0),              // Top right
		new SAT.Vector(tile.width, tile.height),    // Bottom right
		new SAT.Vector(tile.width / 2, tile.height) // Bottom center
	]);
	
	var line = new Phaser.Line(tile.left + tile.width / 2, tile.bottom, tile.right, tile.top);
	
	var edges = {
		top:    Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		bottom: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		left:   Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(-0.8944271909999159, -0.4472135954999579);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};

/**
 * Define a lower 22.5 degree left top slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createQuarterLeftTopLow
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterLeftTopLow = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, 0),              // Top left
		new SAT.Vector(tile.width / 2, 0), // Top center
		new SAT.Vector(0, tile.height)     // Bottom left
	]);
	
	var line = new Phaser.Line(tile.left, tile.bottom, tile.left + tile.width / 2, tile.top);
	
	var edges = {
		top:    Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		bottom: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		right:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(0.8944271909999159, 0.4472135954999579);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};

/**
 * Define an upper 22.5 degree left top slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createQuarterLeftTopHigh
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterLeftTopHigh = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, 0),                        // Top left
		new SAT.Vector(tile.width, 0),               // Top right
		new SAT.Vector(tile.width / 2, tile.height), // Bottom center
		new SAT.Vector(0, tile.height)               // Bottom left
	]);
	
	var line = new Phaser.Line(tile.left + tile.width / 2, tile.bottom, tile.right, tile.top);
	
	var edges = {
		bottom: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		right:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(0.8944271909999159, 0.4472135954999579);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};

/**
 * Define a lower 22.5 degree right top slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createQuarterRightTopLow
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterRightTopLow = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(tile.width / 2, 0),      // Top center
		new SAT.Vector(tile.width, 0),          // Top right
		new SAT.Vector(tile.width, tile.height) // Bottom right
	]);
	
	var line = new Phaser.Line(tile.left + tile.width / 2, tile.top, tile.right, tile.bottom);
	
	var edges = {
		top:    Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		bottom: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		left:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(-0.8944271909999159, 0.4472135954999579);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};

/**
 * Define an upper 22.5 degree right top slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createQuarterRightTopHigh
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterRightTopHigh = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, 0),                       // Top left
		new SAT.Vector(tile.width, 0),              // Top right
		new SAT.Vector(tile.width, tile.height),    // Bottom right
		new SAT.Vector(tile.width / 2, tile.height) // Bottom center
	]);
	
	var line = new Phaser.Line(tile.left, tile.top, tile.left + tile.width / 2, tile.bottom);
	
	var edges = {
		bottom: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		left:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(-0.8944271909999159, 0.4472135954999579);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};

/**
 * Define a lower 22.5 degree top left slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createQuarterTopLeftLow
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterTopLeftLow = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, 0),              // Top left
		new SAT.Vector(tile.width, 0),     // Top right
		new SAT.Vector(0, tile.height / 2) // Center left
	]);
	
	var line = new Phaser.Line(tile.left, tile.top + tile.height / 2, tile.right, tile.top);
	
	var edges = {
		bottom: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		left:   Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		right:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(0.4472135954999579, 0.8944271909999159);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};

/**
 * Define an upper 22.5 degree top left slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createQuarterTopLeftHigh
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterTopLeftHigh = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, 0),                        // Top left
		new SAT.Vector(tile.width, 0),               // Top right
		new SAT.Vector(tile.width, tile.height / 2), // Right center
		new SAT.Vector(0, tile.height)               // Bottom left
	]);
	
	var line = new Phaser.Line(tile.left, tile.bottom, tile.right, tile.top + tile.height / 2);
	
	var edges = {
		bottom: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		right:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(0.4472135954999579, 0.8944271909999159);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};

/**
 * Define a lower 22.5 degree top right slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createQuarterTopRightLow
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterTopRightLow = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, 0),                       // Top left
		new SAT.Vector(tile.width, 0),              // Top right
		new SAT.Vector(tile.width, tile.height / 2) // Right center
	]);
	
	var line = new Phaser.Line(tile.left, tile.top, tile.right, tile.top + tile.height / 2);
	
	var edges = {
		bottom: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		left:   Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		right:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(-0.4472135954999579, 0.8944271909999159);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};

/**
 * Define an upper 22.5 degree top right slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createQuarterTopRightHigh
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterTopRightHigh = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, 0),                    // Top left
		new SAT.Vector(tile.width, 0),           // Top right
		new SAT.Vector(tile.width, tile.height), // Bottom right
		new SAT.Vector(0, tile.height / 2)       // Left center
	]);
	
	var line = new Phaser.Line(tile.left, tile.top + tile.height / 2, tile.right, tile.top + tile.height);
	
	var edges = {
		bottom: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		left:   Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(-0.4472135954999579, 0.8944271909999159);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};

/**
 * Prepare a slope mapping offset from the given tile index.
 * 
 * An offset is just the first tile index - 1. Returns 0 if an integer can't be
 * parsed.
 * 
 * @static
 * @param  {integer} index - A tile index.
 * @return {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.prepareOffset = function (index) {
	var offset = parseInt(index);
	
	offset = !isNaN(offset) && typeof offset === 'number' ? offset - 1 : 0;
	
	return offset;
};

/**
 * Create a tile slope mapping for the Arcade Slopes tileset.
 *
 * @static
 * @param  {integer} index - An optional first tile index (firstgid).
 * @return {object}
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.mapArcadeSlopes = function (index) {
	offset = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.prepareOffset(index);
	
	var mapping = {};
	
	mapping[offset + 1]  = 'FULL';
	mapping[offset + 2]  = 'HALF_TOP';
	mapping[offset + 3]  = 'HALF_BOTTOM';
	mapping[offset + 4]  = 'HALF_LEFT';
	mapping[offset + 5]  = 'HALF_RIGHT';
	mapping[offset + 6]  = 'HALF_BOTTOM_LEFT';
	mapping[offset + 7]  = 'HALF_BOTTOM_RIGHT';
	mapping[offset + 8]  = 'HALF_TOP_LEFT';
	mapping[offset + 9]  = 'HALF_TOP_RIGHT';
	mapping[offset + 10] = 'QUARTER_TOP_LEFT_HIGH';
	mapping[offset + 11] = 'QUARTER_TOP_LEFT_LOW';
	mapping[offset + 12] = 'QUARTER_TOP_RIGHT_LOW';
	mapping[offset + 13] = 'QUARTER_TOP_RIGHT_HIGH';
	mapping[offset + 14] = 'QUARTER_BOTTOM_LEFT_HIGH';
	mapping[offset + 15] = 'QUARTER_BOTTOM_LEFT_LOW';
	mapping[offset + 16] = 'QUARTER_BOTTOM_RIGHT_LOW';
	mapping[offset + 17] = 'QUARTER_BOTTOM_RIGHT_HIGH';
	mapping[offset + 18] = 'QUARTER_LEFT_BOTTOM_HIGH';
	mapping[offset + 19] = 'QUARTER_RIGHT_BOTTOM_HIGH';
	mapping[offset + 20] = 'QUARTER_LEFT_TOP_HIGH';
	mapping[offset + 21] = 'QUARTER_RIGHT_TOP_HIGH';
	mapping[offset + 35] = 'QUARTER_LEFT_BOTTOM_LOW';
	mapping[offset + 36] = 'QUARTER_RIGHT_BOTTOM_LOW';
	mapping[offset + 37] = 'QUARTER_LEFT_TOP_LOW';
	mapping[offset + 38] = 'QUARTER_RIGHT_TOP_LOW';
	
	return mapping;
};

/**
 * Create a tile slope mapping for the Ninja Physics tileset.
 *
 * @static
 * @param  {integer} index - An optional first tile index (firstgid).
 * @return {object}
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.mapNinjaPhysics = function (index) {
	offset = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.prepareOffset(index);
	
	var mapping = {};
	
	mapping[offset + 2] =  'FULL';
	mapping[offset + 3] =  'HALF_BOTTOM_LEFT';
	mapping[offset + 4] =  'HALF_BOTTOM_RIGHT';
	mapping[offset + 6] =  'HALF_TOP_LEFT';
	mapping[offset + 5] =  'HALF_TOP_RIGHT';
	mapping[offset + 15] = 'QUARTER_BOTTOM_LEFT_LOW';
	mapping[offset + 16] = 'QUARTER_BOTTOM_RIGHT_LOW';
	mapping[offset + 17] = 'QUARTER_TOP_RIGHT_LOW';
	mapping[offset + 18] = 'QUARTER_TOP_LEFT_LOW';
	mapping[offset + 19] = 'QUARTER_BOTTOM_LEFT_HIGH';
	mapping[offset + 20] = 'QUARTER_BOTTOM_RIGHT_HIGH';
	mapping[offset + 21] = 'QUARTER_TOP_RIGHT_HIGH';
	mapping[offset + 22] = 'QUARTER_TOP_LEFT_HIGH';
	mapping[offset + 23] = 'QUARTER_LEFT_BOTTOM_HIGH';
	mapping[offset + 24] = 'QUARTER_RIGHT_BOTTOM_HIGH';
	mapping[offset + 25] = 'QUARTER_RIGHT_TOP_LOW';
	mapping[offset + 26] = 'QUARTER_LEFT_TOP_LOW';
	mapping[offset + 27] = 'QUARTER_LEFT_BOTTOM_LOW';
	mapping[offset + 28] = 'QUARTER_RIGHT_BOTTOM_LOW';
	mapping[offset + 29] = 'QUARTER_RIGHT_TOP_HIGH';
	mapping[offset + 30] = 'QUARTER_LEFT_TOP_HIGH';
	mapping[offset + 31] = 'HALF_BOTTOM';
	mapping[offset + 32] = 'HALF_RIGHT';
	mapping[offset + 33] = 'HALF_TOP';
	mapping[offset + 34] = 'HALF_LEFT';

	return mapping;
};

/**
 * The Ninja Physics tileset mapping.
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.ARCADESLOPES = 1;

/**
 * The Ninja Physics tileset mapping.
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.NINJA = 2;

// Version 0.6.0 - Copyright 2012 - 2016 -  Jim Riecken <jimr@jimr.ca>
//
// Released under the MIT License - https://github.com/jriecken/sat-js
//
// A simple library for determining intersections of circles and
// polygons using the Separating Axis Theorem.
/** @preserve SAT.js - Version 0.6.0 - Copyright 2012 - 2016 - Jim Riecken <jimr@jimr.ca> - released under the MIT License. https://github.com/jriecken/sat-js */

/*global define: false, module: false*/
/*jshint shadow:true, sub:true, forin:true, noarg:true, noempty:true, 
  eqeqeq:true, bitwise:true, strict:true, undef:true, 
  curly:true, browser:true */

// Create a UMD wrapper for SAT. Works in:
//
//  - Plain browser via global SAT variable
//  - AMD loader (like require.js)
//  - Node.js
//
// The quoted properties all over the place are used so that the Closure Compiler
// does not mangle the exposed API in advanced mode.
/**
 * @param {*} root - The global scope
 * @param {Function} factory - Factory that creates SAT module
 */
(function (root, factory) {
  "use strict";
  if (typeof define === 'function' && define['amd']) {
    define(factory);
  } else if (typeof exports === 'object') {
    module['exports'] = factory();
  } else {
    root['SAT'] = factory();
  }
}(this, function () {
  "use strict";

  var SAT = {};

  //
  // ## Vector
  //
  // Represents a vector in two dimensions with `x` and `y` properties.


  // Create a new Vector, optionally passing in the `x` and `y` coordinates. If
  // a coordinate is not specified, it will be set to `0`
  /** 
   * @param {?number=} x The x position.
   * @param {?number=} y The y position.
   * @constructor
   */
  function Vector(x, y) {
    this['x'] = x || 0;
    this['y'] = y || 0;
  }
  SAT['Vector'] = Vector;
  // Alias `Vector` as `V`
  SAT['V'] = Vector;


  // Copy the values of another Vector into this one.
  /**
   * @param {Vector} other The other Vector.
   * @return {Vector} This for chaining.
   */
  Vector.prototype['copy'] = Vector.prototype.copy = function(other) {
    this['x'] = other['x'];
    this['y'] = other['y'];
    return this;
  };

  // Create a new vector with the same coordinates as this on.
  /**
   * @return {Vector} The new cloned vector
   */
  Vector.prototype['clone'] = Vector.prototype.clone = function() {
    return new Vector(this['x'], this['y']);
  };

  // Change this vector to be perpendicular to what it was before. (Effectively
  // roatates it 90 degrees in a clockwise direction)
  /**
   * @return {Vector} This for chaining.
   */
  Vector.prototype['perp'] = Vector.prototype.perp = function() {
    var x = this['x'];
    this['x'] = this['y'];
    this['y'] = -x;
    return this;
  };

  // Rotate this vector (counter-clockwise) by the specified angle (in radians).
  /**
   * @param {number} angle The angle to rotate (in radians)
   * @return {Vector} This for chaining.
   */
  Vector.prototype['rotate'] = Vector.prototype.rotate = function (angle) {
    var x = this['x'];
    var y = this['y'];
    this['x'] = x * Math.cos(angle) - y * Math.sin(angle);
    this['y'] = x * Math.sin(angle) + y * Math.cos(angle);
    return this;
  };

  // Reverse this vector.
  /**
   * @return {Vector} This for chaining.
   */
  Vector.prototype['reverse'] = Vector.prototype.reverse = function() {
    this['x'] = -this['x'];
    this['y'] = -this['y'];
    return this;
  };
  

  // Normalize this vector.  (make it have length of `1`)
  /**
   * @return {Vector} This for chaining.
   */
  Vector.prototype['normalize'] = Vector.prototype.normalize = function() {
    var d = this.len();
    if(d > 0) {
      this['x'] = this['x'] / d;
      this['y'] = this['y'] / d;
    }
    return this;
  };
  
  // Add another vector to this one.
  /**
   * @param {Vector} other The other Vector.
   * @return {Vector} This for chaining.
   */
  Vector.prototype['add'] = Vector.prototype.add = function(other) {
    this['x'] += other['x'];
    this['y'] += other['y'];
    return this;
  };
  
  // Subtract another vector from this one.
  /**
   * @param {Vector} other The other Vector.
   * @return {Vector} This for chaiing.
   */
  Vector.prototype['sub'] = Vector.prototype.sub = function(other) {
    this['x'] -= other['x'];
    this['y'] -= other['y'];
    return this;
  };
  
  // Scale this vector. An independant scaling factor can be provided
  // for each axis, or a single scaling factor that will scale both `x` and `y`.
  /**
   * @param {number} x The scaling factor in the x direction.
   * @param {?number=} y The scaling factor in the y direction.  If this
   *   is not specified, the x scaling factor will be used.
   * @return {Vector} This for chaining.
   */
  Vector.prototype['scale'] = Vector.prototype.scale = function(x,y) {
    this['x'] *= x;
    this['y'] *= y || x;
    return this; 
  };
  
  // Project this vector on to another vector.
  /**
   * @param {Vector} other The vector to project onto.
   * @return {Vector} This for chaining.
   */
  Vector.prototype['project'] = Vector.prototype.project = function(other) {
    var amt = this.dot(other) / other.len2();
    this['x'] = amt * other['x'];
    this['y'] = amt * other['y'];
    return this;
  };
  
  // Project this vector onto a vector of unit length. This is slightly more efficient
  // than `project` when dealing with unit vectors.
  /**
   * @param {Vector} other The unit vector to project onto.
   * @return {Vector} This for chaining.
   */
  Vector.prototype['projectN'] = Vector.prototype.projectN = function(other) {
    var amt = this.dot(other);
    this['x'] = amt * other['x'];
    this['y'] = amt * other['y'];
    return this;
  };
  
  // Reflect this vector on an arbitrary axis.
  /**
   * @param {Vector} axis The vector representing the axis.
   * @return {Vector} This for chaining.
   */
  Vector.prototype['reflect'] = Vector.prototype.reflect = function(axis) {
    var x = this['x'];
    var y = this['y'];
    this.project(axis).scale(2);
    this['x'] -= x;
    this['y'] -= y;
    return this;
  };
  
  // Reflect this vector on an arbitrary axis (represented by a unit vector). This is
  // slightly more efficient than `reflect` when dealing with an axis that is a unit vector.
  /**
   * @param {Vector} axis The unit vector representing the axis.
   * @return {Vector} This for chaining.
   */
  Vector.prototype['reflectN'] = Vector.prototype.reflectN = function(axis) {
    var x = this['x'];
    var y = this['y'];
    this.projectN(axis).scale(2);
    this['x'] -= x;
    this['y'] -= y;
    return this;
  };
  
  // Get the dot product of this vector and another.
  /**
   * @param {Vector}  other The vector to dot this one against.
   * @return {number} The dot product.
   */
  Vector.prototype['dot'] = Vector.prototype.dot = function(other) {
    return this['x'] * other['x'] + this['y'] * other['y'];
  };
  
  // Get the squared length of this vector.
  /**
   * @return {number} The length^2 of this vector.
   */
  Vector.prototype['len2'] = Vector.prototype.len2 = function() {
    return this.dot(this);
  };
  
  // Get the length of this vector.
  /**
   * @return {number} The length of this vector.
   */
  Vector.prototype['len'] = Vector.prototype.len = function() {
    return Math.sqrt(this.len2());
  };
  
  // ## Circle
  //
  // Represents a circle with a position and a radius.

  // Create a new circle, optionally passing in a position and/or radius. If no position
  // is given, the circle will be at `(0,0)`. If no radius is provided, the circle will
  // have a radius of `0`.
  /**
   * @param {Vector=} pos A vector representing the position of the center of the circle
   * @param {?number=} r The radius of the circle
   * @constructor
   */
  function Circle(pos, r) {
    this['pos'] = pos || new Vector();
    this['r'] = r || 0;
  }
  SAT['Circle'] = Circle;
  
  // Compute the axis-aligned bounding box (AABB) of this Circle.
  //
  // Note: Returns a _new_ `Polygon` each time you call this.
  /**
   * @return {Polygon} The AABB
   */
  Circle.prototype['getAABB'] = Circle.prototype.getAABB = function() {
    var r = this['r'];
    var corner = this["pos"].clone().sub(new Vector(r, r));
    return new Box(corner, r*2, r*2).toPolygon();
  };

  // ## Polygon
  //
  // Represents a *convex* polygon with any number of points (specified in counter-clockwise order)
  //
  // Note: Do _not_ manually change the `points`, `angle`, or `offset` properties. Use the
  // provided setters. Otherwise the calculated properties will not be updated correctly.
  //
  // `pos` can be changed directly.

  // Create a new polygon, passing in a position vector, and an array of points (represented
  // by vectors relative to the position vector). If no position is passed in, the position
  // of the polygon will be `(0,0)`.
  /**
   * @param {Vector=} pos A vector representing the origin of the polygon. (all other
   *   points are relative to this one)
   * @param {Array.<Vector>=} points An array of vectors representing the points in the polygon,
   *   in counter-clockwise order.
   * @constructor
   */
  function Polygon(pos, points) {
    this['pos'] = pos || new Vector();
    this['angle'] = 0;
    this['offset'] = new Vector();
    this.setPoints(points || []);
  }
  SAT['Polygon'] = Polygon;
  
  // Set the points of the polygon.
  //
  // Note: The points are counter-clockwise *with respect to the coordinate system*.
  // If you directly draw the points on a screen that has the origin at the top-left corner
  // it will _appear_ visually that the points are being specified clockwise. This is just
  // because of the inversion of the Y-axis when being displayed.
  /**
   * @param {Array.<Vector>=} points An array of vectors representing the points in the polygon,
   *   in counter-clockwise order.
   * @return {Polygon} This for chaining.
   */
  Polygon.prototype['setPoints'] = Polygon.prototype.setPoints = function(points) {
    // Only re-allocate if this is a new polygon or the number of points has changed.
    var lengthChanged = !this['points'] || this['points'].length !== points.length;
    if (lengthChanged) {
      var i;
      var calcPoints = this['calcPoints'] = [];
      var edges = this['edges'] = [];
      var normals = this['normals'] = [];
      // Allocate the vector arrays for the calculated properties
      for (i = 0; i < points.length; i++) {
        calcPoints.push(new Vector());
        edges.push(new Vector());
        normals.push(new Vector());
      }
    }
    this['points'] = points;
    this._recalc();
    return this;
  };

  // Set the current rotation angle of the polygon.
  /**
   * @param {number} angle The current rotation angle (in radians).
   * @return {Polygon} This for chaining.
   */
  Polygon.prototype['setAngle'] = Polygon.prototype.setAngle = function(angle) {
    this['angle'] = angle;
    this._recalc();
    return this;
  };

  // Set the current offset to apply to the `points` before applying the `angle` rotation.
  /**
   * @param {Vector} offset The new offset vector.
   * @return {Polygon} This for chaining.
   */
  Polygon.prototype['setOffset'] = Polygon.prototype.setOffset = function(offset) {
    this['offset'] = offset;
    this._recalc();
    return this;
  };

  // Rotates this polygon counter-clockwise around the origin of *its local coordinate system* (i.e. `pos`).
  //
  // Note: This changes the **original** points (so any `angle` will be applied on top of this rotation).
  /**
   * @param {number} angle The angle to rotate (in radians)
   * @return {Polygon} This for chaining.
   */
  Polygon.prototype['rotate'] = Polygon.prototype.rotate = function(angle) {
    var points = this['points'];
    var len = points.length;
    for (var i = 0; i < len; i++) {
      points[i].rotate(angle);
    }
    this._recalc();
    return this;
  };

  // Translates the points of this polygon by a specified amount relative to the origin of *its own coordinate
  // system* (i.e. `pos`).
  //
  // This is most useful to change the "center point" of a polygon. If you just want to move the whole polygon, change
  // the coordinates of `pos`.
  //
  // Note: This changes the **original** points (so any `offset` will be applied on top of this translation)
  /**
   * @param {number} x The horizontal amount to translate.
   * @param {number} y The vertical amount to translate.
   * @return {Polygon} This for chaining.
   */
  Polygon.prototype['translate'] = Polygon.prototype.translate = function (x, y) {
    var points = this['points'];
    var len = points.length;
    for (var i = 0; i < len; i++) {
      points[i].x += x;
      points[i].y += y;
    }
    this._recalc();
    return this;
  };


  // Computes the calculated collision polygon. Applies the `angle` and `offset` to the original points then recalculates the
  // edges and normals of the collision polygon.
  /**
   * @return {Polygon} This for chaining.
   */
  Polygon.prototype._recalc = function() {
    // Calculated points - this is what is used for underlying collisions and takes into account
    // the angle/offset set on the polygon.
    var calcPoints = this['calcPoints'];
    // The edges here are the direction of the `n`th edge of the polygon, relative to
    // the `n`th point. If you want to draw a given edge from the edge value, you must
    // first translate to the position of the starting point.
    var edges = this['edges'];
    // The normals here are the direction of the normal for the `n`th edge of the polygon, relative
    // to the position of the `n`th point. If you want to draw an edge normal, you must first
    // translate to the position of the starting point.
    var normals = this['normals'];
    // Copy the original points array and apply the offset/angle
    var points = this['points'];
    var offset = this['offset'];
    var angle = this['angle'];
    var len = points.length;
    var i;
    for (i = 0; i < len; i++) {
      var calcPoint = calcPoints[i].copy(points[i]);
      calcPoint.x += offset.x;
      calcPoint.y += offset.y;
      if (angle !== 0) {
        calcPoint.rotate(angle);
      }
    }
    // Calculate the edges/normals
    for (i = 0; i < len; i++) {
      var p1 = calcPoints[i];
      var p2 = i < len - 1 ? calcPoints[i + 1] : calcPoints[0];
      var e = edges[i].copy(p2).sub(p1);
      normals[i].copy(e).perp().normalize();
    }
    return this;
  };
  
  
  // Compute the axis-aligned bounding box. Any current state
  // (translations/rotations) will be applied before constructing the AABB.
  //
  // Note: Returns a _new_ `Polygon` each time you call this.
  /**
   * @return {Polygon} The AABB
   */
  Polygon.prototype["getAABB"] = Polygon.prototype.getAABB = function() {
    var points = this["calcPoints"];
    var len = points.length;
    var xMin = points[0]["x"];
    var yMin = points[0]["y"];
    var xMax = points[0]["x"];
    var yMax = points[0]["y"];
    for (var i = 1; i < len; i++) {
      var point = points[i];
      if (point["x"] < xMin) {
        xMin = point["x"];
      }
      else if (point["x"] > xMax) {
        xMax = point["x"];
      }
      if (point["y"] < yMin) {
        yMin = point["y"];
      }
      else if (point["y"] > yMax) {
        yMax = point["y"];
      }
    }
    return new Box(this["pos"].clone().add(new Vector(xMin, yMin)), xMax - xMin, yMax - yMin).toPolygon();
  };
  

  // ## Box
  //
  // Represents an axis-aligned box, with a width and height.


  // Create a new box, with the specified position, width, and height. If no position
  // is given, the position will be `(0,0)`. If no width or height are given, they will
  // be set to `0`.
  /**
   * @param {Vector=} pos A vector representing the bottom-left of the box (i.e. the smallest x and smallest y value).
   * @param {?number=} w The width of the box.
   * @param {?number=} h The height of the box.
   * @constructor
   */
  function Box(pos, w, h) {
    this['pos'] = pos || new Vector();
    this['w'] = w || 0;
    this['h'] = h || 0;
  }
  SAT['Box'] = Box;

  // Returns a polygon whose edges are the same as this box.
  /**
   * @return {Polygon} A new Polygon that represents this box.
   */
  Box.prototype['toPolygon'] = Box.prototype.toPolygon = function() {
    var pos = this['pos'];
    var w = this['w'];
    var h = this['h'];
    return new Polygon(new Vector(pos['x'], pos['y']), [
     new Vector(), new Vector(w, 0), 
     new Vector(w,h), new Vector(0,h)
    ]);
  };
  
  // ## Response
  //
  // An object representing the result of an intersection. Contains:
  //  - The two objects participating in the intersection
  //  - The vector representing the minimum change necessary to extract the first object
  //    from the second one (as well as a unit vector in that direction and the magnitude
  //    of the overlap)
  //  - Whether the first object is entirely inside the second, and vice versa.
  /**
   * @constructor
   */  
  function Response() {
    this['a'] = null;
    this['b'] = null;
    this['overlapN'] = new Vector();
    this['overlapV'] = new Vector();
    this.clear();
  }
  SAT['Response'] = Response;

  // Set some values of the response back to their defaults.  Call this between tests if
  // you are going to reuse a single Response object for multiple intersection tests (recommented
  // as it will avoid allcating extra memory)
  /**
   * @return {Response} This for chaining
   */
  Response.prototype['clear'] = Response.prototype.clear = function() {
    this['aInB'] = true;
    this['bInA'] = true;
    this['overlap'] = Number.MAX_VALUE;
    return this;
  };

  // ## Object Pools

  // A pool of `Vector` objects that are used in calculations to avoid
  // allocating memory.
  /**
   * @type {Array.<Vector>}
   */
  var T_VECTORS = [];
  for (var i = 0; i < 10; i++) { T_VECTORS.push(new Vector()); }
  
  // A pool of arrays of numbers used in calculations to avoid allocating
  // memory.
  /**
   * @type {Array.<Array.<number>>}
   */
  var T_ARRAYS = [];
  for (var i = 0; i < 5; i++) { T_ARRAYS.push([]); }

  // Temporary response used for polygon hit detection.
  /**
   * @type {Response}
   */
  var T_RESPONSE = new Response();

  // Tiny "point" polygon used for polygon hit detection.
  /**
   * @type {Polygon}
   */
  var TEST_POINT = new Box(new Vector(), 0.000001, 0.000001).toPolygon();

  // ## Helper Functions

  // Flattens the specified array of points onto a unit vector axis,
  // resulting in a one dimensional range of the minimum and
  // maximum value on that axis.
  /**
   * @param {Array.<Vector>} points The points to flatten.
   * @param {Vector} normal The unit vector axis to flatten on.
   * @param {Array.<number>} result An array.  After calling this function,
   *   result[0] will be the minimum value,
   *   result[1] will be the maximum value.
   */
  function flattenPointsOn(points, normal, result) {
    var min = Number.MAX_VALUE;
    var max = -Number.MAX_VALUE;
    var len = points.length;
    for (var i = 0; i < len; i++ ) {
      // The magnitude of the projection of the point onto the normal
      var dot = points[i].dot(normal);
      if (dot < min) { min = dot; }
      if (dot > max) { max = dot; }
    }
    result[0] = min; result[1] = max;
  }
  
  // Check whether two convex polygons are separated by the specified
  // axis (must be a unit vector).
  /**
   * @param {Vector} aPos The position of the first polygon.
   * @param {Vector} bPos The position of the second polygon.
   * @param {Array.<Vector>} aPoints The points in the first polygon.
   * @param {Array.<Vector>} bPoints The points in the second polygon.
   * @param {Vector} axis The axis (unit sized) to test against.  The points of both polygons
   *   will be projected onto this axis.
   * @param {Response=} response A Response object (optional) which will be populated
   *   if the axis is not a separating axis.
   * @return {boolean} true if it is a separating axis, false otherwise.  If false,
   *   and a response is passed in, information about how much overlap and
   *   the direction of the overlap will be populated.
   */
  function isSeparatingAxis(aPos, bPos, aPoints, bPoints, axis, response) {
    var rangeA = T_ARRAYS.pop();
    var rangeB = T_ARRAYS.pop();
    // The magnitude of the offset between the two polygons
    var offsetV = T_VECTORS.pop().copy(bPos).sub(aPos);
    var projectedOffset = offsetV.dot(axis);
    // Project the polygons onto the axis.
    flattenPointsOn(aPoints, axis, rangeA);
    flattenPointsOn(bPoints, axis, rangeB);
    // Move B's range to its position relative to A.
    rangeB[0] += projectedOffset;
    rangeB[1] += projectedOffset;
    // Check if there is a gap. If there is, this is a separating axis and we can stop
    if (rangeA[0] > rangeB[1] || rangeB[0] > rangeA[1]) {
      T_VECTORS.push(offsetV); 
      T_ARRAYS.push(rangeA); 
      T_ARRAYS.push(rangeB);
      return true;
    }
    // This is not a separating axis. If we're calculating a response, calculate the overlap.
    if (response) {
      var overlap = 0;
      // A starts further left than B
      if (rangeA[0] < rangeB[0]) {
        response['aInB'] = false;
        // A ends before B does. We have to pull A out of B
        if (rangeA[1] < rangeB[1]) { 
          overlap = rangeA[1] - rangeB[0];
          response['bInA'] = false;
        // B is fully inside A.  Pick the shortest way out.
        } else {
          var option1 = rangeA[1] - rangeB[0];
          var option2 = rangeB[1] - rangeA[0];
          overlap = option1 < option2 ? option1 : -option2;
        }
      // B starts further left than A
      } else {
        response['bInA'] = false;
        // B ends before A ends. We have to push A out of B
        if (rangeA[1] > rangeB[1]) { 
          overlap = rangeA[0] - rangeB[1];
          response['aInB'] = false;
        // A is fully inside B.  Pick the shortest way out.
        } else {
          var option1 = rangeA[1] - rangeB[0];
          var option2 = rangeB[1] - rangeA[0];
          overlap = option1 < option2 ? option1 : -option2;
        }
      }
      // If this is the smallest amount of overlap we've seen so far, set it as the minimum overlap.
      var absOverlap = Math.abs(overlap);
      if (absOverlap < response['overlap']) {
        response['overlap'] = absOverlap;
        response['overlapN'].copy(axis);
        if (overlap < 0) {
          response['overlapN'].reverse();
        }
      }      
    }
    T_VECTORS.push(offsetV); 
    T_ARRAYS.push(rangeA); 
    T_ARRAYS.push(rangeB);
    return false;
  }
  SAT['isSeparatingAxis'] = isSeparatingAxis;
  
  // Calculates which Voronoi region a point is on a line segment.
  // It is assumed that both the line and the point are relative to `(0,0)`
  //
  //            |       (0)      |
  //     (-1)  [S]--------------[E]  (1)
  //            |       (0)      |
  /**
   * @param {Vector} line The line segment.
   * @param {Vector} point The point.
   * @return  {number} LEFT_VORONOI_REGION (-1) if it is the left region,
   *          MIDDLE_VORONOI_REGION (0) if it is the middle region,
   *          RIGHT_VORONOI_REGION (1) if it is the right region.
   */
  function voronoiRegion(line, point) {
    var len2 = line.len2();
    var dp = point.dot(line);
    // If the point is beyond the start of the line, it is in the
    // left voronoi region.
    if (dp < 0) { return LEFT_VORONOI_REGION; }
    // If the point is beyond the end of the line, it is in the
    // right voronoi region.
    else if (dp > len2) { return RIGHT_VORONOI_REGION; }
    // Otherwise, it's in the middle one.
    else { return MIDDLE_VORONOI_REGION; }
  }
  // Constants for Voronoi regions
  /**
   * @const
   */
  var LEFT_VORONOI_REGION = -1;
  /**
   * @const
   */
  var MIDDLE_VORONOI_REGION = 0;
  /**
   * @const
   */
  var RIGHT_VORONOI_REGION = 1;
  
  // ## Collision Tests

  // Check if a point is inside a circle.
  /**
   * @param {Vector} p The point to test.
   * @param {Circle} c The circle to test.
   * @return {boolean} true if the point is inside the circle, false if it is not.
   */
  function pointInCircle(p, c) {
    var differenceV = T_VECTORS.pop().copy(p).sub(c['pos']);
    var radiusSq = c['r'] * c['r'];
    var distanceSq = differenceV.len2();
    T_VECTORS.push(differenceV);
    // If the distance between is smaller than the radius then the point is inside the circle.
    return distanceSq <= radiusSq;
  }
  SAT['pointInCircle'] = pointInCircle;

  // Check if a point is inside a convex polygon.
  /**
   * @param {Vector} p The point to test.
   * @param {Polygon} poly The polygon to test.
   * @return {boolean} true if the point is inside the polygon, false if it is not.
   */
  function pointInPolygon(p, poly) {
    TEST_POINT['pos'].copy(p);
    T_RESPONSE.clear();
    var result = testPolygonPolygon(TEST_POINT, poly, T_RESPONSE);
    if (result) {
      result = T_RESPONSE['aInB'];
    }
    return result;
  }
  SAT['pointInPolygon'] = pointInPolygon;

  // Check if two circles collide.
  /**
   * @param {Circle} a The first circle.
   * @param {Circle} b The second circle.
   * @param {Response=} response Response object (optional) that will be populated if
   *   the circles intersect.
   * @return {boolean} true if the circles intersect, false if they don't. 
   */
  function testCircleCircle(a, b, response) {
    // Check if the distance between the centers of the two
    // circles is greater than their combined radius.
    var differenceV = T_VECTORS.pop().copy(b['pos']).sub(a['pos']);
    var totalRadius = a['r'] + b['r'];
    var totalRadiusSq = totalRadius * totalRadius;
    var distanceSq = differenceV.len2();
    // If the distance is bigger than the combined radius, they don't intersect.
    if (distanceSq > totalRadiusSq) {
      T_VECTORS.push(differenceV);
      return false;
    }
    // They intersect.  If we're calculating a response, calculate the overlap.
    if (response) { 
      var dist = Math.sqrt(distanceSq);
      response['a'] = a;
      response['b'] = b;
      response['overlap'] = totalRadius - dist;
      response['overlapN'].copy(differenceV.normalize());
      response['overlapV'].copy(differenceV).scale(response['overlap']);
      response['aInB']= a['r'] <= b['r'] && dist <= b['r'] - a['r'];
      response['bInA'] = b['r'] <= a['r'] && dist <= a['r'] - b['r'];
    }
    T_VECTORS.push(differenceV);
    return true;
  }
  SAT['testCircleCircle'] = testCircleCircle;
  
  // Check if a polygon and a circle collide.
  /**
   * @param {Polygon} polygon The polygon.
   * @param {Circle} circle The circle.
   * @param {Response=} response Response object (optional) that will be populated if
   *   they interset.
   * @return {boolean} true if they intersect, false if they don't.
   */
  function testPolygonCircle(polygon, circle, response) {
    // Get the position of the circle relative to the polygon.
    var circlePos = T_VECTORS.pop().copy(circle['pos']).sub(polygon['pos']);
    var radius = circle['r'];
    var radius2 = radius * radius;
    var points = polygon['calcPoints'];
    var len = points.length;
    var edge = T_VECTORS.pop();
    var point = T_VECTORS.pop();
    
    // For each edge in the polygon:
    for (var i = 0; i < len; i++) {
      var next = i === len - 1 ? 0 : i + 1;
      var prev = i === 0 ? len - 1 : i - 1;
      var overlap = 0;
      var overlapN = null;
      
      // Get the edge.
      edge.copy(polygon['edges'][i]);
      // Calculate the center of the circle relative to the starting point of the edge.
      point.copy(circlePos).sub(points[i]);
      
      // If the distance between the center of the circle and the point
      // is bigger than the radius, the polygon is definitely not fully in
      // the circle.
      if (response && point.len2() > radius2) {
        response['aInB'] = false;
      }
      
      // Calculate which Voronoi region the center of the circle is in.
      var region = voronoiRegion(edge, point);
      // If it's the left region:
      if (region === LEFT_VORONOI_REGION) {
        // We need to make sure we're in the RIGHT_VORONOI_REGION of the previous edge.
        edge.copy(polygon['edges'][prev]);
        // Calculate the center of the circle relative the starting point of the previous edge
        var point2 = T_VECTORS.pop().copy(circlePos).sub(points[prev]);
        region = voronoiRegion(edge, point2);
        if (region === RIGHT_VORONOI_REGION) {
          // It's in the region we want.  Check if the circle intersects the point.
          var dist = point.len();
          if (dist > radius) {
            // No intersection
            T_VECTORS.push(circlePos); 
            T_VECTORS.push(edge);
            T_VECTORS.push(point); 
            T_VECTORS.push(point2);
            return false;
          } else if (response) {
            // It intersects, calculate the overlap.
            response['bInA'] = false;
            overlapN = point.normalize();
            overlap = radius - dist;
          }
        }
        T_VECTORS.push(point2);
      // If it's the right region:
      } else if (region === RIGHT_VORONOI_REGION) {
        // We need to make sure we're in the left region on the next edge
        edge.copy(polygon['edges'][next]);
        // Calculate the center of the circle relative to the starting point of the next edge.
        point.copy(circlePos).sub(points[next]);
        region = voronoiRegion(edge, point);
        if (region === LEFT_VORONOI_REGION) {
          // It's in the region we want.  Check if the circle intersects the point.
          var dist = point.len();
          if (dist > radius) {
            // No intersection
            T_VECTORS.push(circlePos); 
            T_VECTORS.push(edge); 
            T_VECTORS.push(point);
            return false;              
          } else if (response) {
            // It intersects, calculate the overlap.
            response['bInA'] = false;
            overlapN = point.normalize();
            overlap = radius - dist;
          }
        }
      // Otherwise, it's the middle region:
      } else {
        // Need to check if the circle is intersecting the edge,
        // Change the edge into its "edge normal".
        var normal = edge.perp().normalize();
        // Find the perpendicular distance between the center of the 
        // circle and the edge.
        var dist = point.dot(normal);
        var distAbs = Math.abs(dist);
        // If the circle is on the outside of the edge, there is no intersection.
        if (dist > 0 && distAbs > radius) {
          // No intersection
          T_VECTORS.push(circlePos); 
          T_VECTORS.push(normal); 
          T_VECTORS.push(point);
          return false;
        } else if (response) {
          // It intersects, calculate the overlap.
          overlapN = normal;
          overlap = radius - dist;
          // If the center of the circle is on the outside of the edge, or part of the
          // circle is on the outside, the circle is not fully inside the polygon.
          if (dist >= 0 || overlap < 2 * radius) {
            response['bInA'] = false;
          }
        }
      }
      
      // If this is the smallest overlap we've seen, keep it. 
      // (overlapN may be null if the circle was in the wrong Voronoi region).
      if (overlapN && response && Math.abs(overlap) < Math.abs(response['overlap'])) {
        response['overlap'] = overlap;
        response['overlapN'].copy(overlapN);
      }
    }
    
    // Calculate the final overlap vector - based on the smallest overlap.
    if (response) {
      response['a'] = polygon;
      response['b'] = circle;
      response['overlapV'].copy(response['overlapN']).scale(response['overlap']);
    }
    T_VECTORS.push(circlePos); 
    T_VECTORS.push(edge); 
    T_VECTORS.push(point);
    return true;
  }
  SAT['testPolygonCircle'] = testPolygonCircle;
  
  // Check if a circle and a polygon collide.
  //
  // **NOTE:** This is slightly less efficient than polygonCircle as it just
  // runs polygonCircle and reverses everything at the end.
  /**
   * @param {Circle} circle The circle.
   * @param {Polygon} polygon The polygon.
   * @param {Response=} response Response object (optional) that will be populated if
   *   they interset.
   * @return {boolean} true if they intersect, false if they don't.
   */
  function testCirclePolygon(circle, polygon, response) {
    // Test the polygon against the circle.
    var result = testPolygonCircle(polygon, circle, response);
    if (result && response) {
      // Swap A and B in the response.
      var a = response['a'];
      var aInB = response['aInB'];
      response['overlapN'].reverse();
      response['overlapV'].reverse();
      response['a'] = response['b'];
      response['b'] = a;
      response['aInB'] = response['bInA'];
      response['bInA'] = aInB;
    }
    return result;
  }
  SAT['testCirclePolygon'] = testCirclePolygon;
  
  // Checks whether polygons collide.
  /**
   * @param {Polygon} a The first polygon.
   * @param {Polygon} b The second polygon.
   * @param {Response=} response Response object (optional) that will be populated if
   *   they interset.
   * @return {boolean} true if they intersect, false if they don't.
   */
  function testPolygonPolygon(a, b, response) {
    var aPoints = a['calcPoints'];
    var aLen = aPoints.length;
    var bPoints = b['calcPoints'];
    var bLen = bPoints.length;
    // If any of the edge normals of A is a separating axis, no intersection.
    for (var i = 0; i < aLen; i++) {
      if (isSeparatingAxis(a['pos'], b['pos'], aPoints, bPoints, a['normals'][i], response)) {
        return false;
      }
    }
    // If any of the edge normals of B is a separating axis, no intersection.
    for (var i = 0;i < bLen; i++) {
      if (isSeparatingAxis(a['pos'], b['pos'], aPoints, bPoints, b['normals'][i], response)) {
        return false;
      }
    }
    // Since none of the edge normals of A or B are a separating axis, there is an intersection
    // and we've already calculated the smallest overlap (in isSeparatingAxis).  Calculate the
    // final overlap vector.
    if (response) {
      response['a'] = a;
      response['b'] = b;
      response['overlapV'].copy(response['overlapN']).scale(response['overlap']);
    }
    return true;
  }
  SAT['testPolygonPolygon'] = testPolygonPolygon;

  return SAT;
}));
