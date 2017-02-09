/**
 * @author Chris Andrew <chris@hexus.io>
 * @copyright 2016 Chris Andrew
 * @license MIT
 */

/**
 * A facade class to attach to a Phaser game.
 *
 * TODO: Extract a CollisionHandler/CollisionResolver class that stores solvers
 *       and defaultSolver that the facade can just forward calls to.
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
 * Enable the given physics body for sloped tile interaction.
 * 
 * TODO: Circle body support, when it's released.
 *
 * @method Phaser.Plugin.ArcadeSlopes.Facade#enableBody
 * @param {Phaser.Physics.Arcade.Body} body - The physics body to enable.
 */
Phaser.Plugin.ArcadeSlopes.Facade.prototype.enableBody = function (body) {
	// Create an SAT polygon from the body's bounding box
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
			body.width,
			body.height
		).toPolygon();
	}
	
	// Attach a new set of properties that configure the body's interaction
	// with sloped tiles (TODO: Formalize as a class?)
	body.slopes = Phaser.Utils.mixin(body.slopes || {}, {
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
		snapUp: 0,
		snapDown: 0,
		snapLeft: 0,
		snapRight: 0,
		velocity: new SAT.Vector()
	});
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
	if (tile.slope.solver && this.solvers.hasOwnProperty(tile.slope.solver)) {
		return this.solvers[tile.slope.solver].collide(i, body, tile, tilemapLayer, overlapOnly);
	}
	
	return this.solvers[this.defaultSolver].collide(i, body, tile, tilemapLayer, overlapOnly);
};
