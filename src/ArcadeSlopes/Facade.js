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
