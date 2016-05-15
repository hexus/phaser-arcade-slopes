/**
 * @author Chris Andrew <chris@hexus.io>
 * @copyright 2016 Chris Andrew
 * @license MIT
 */

/**
 * Arcade Slopes provides sloped tile functionality for tilemaps that use
 * Phaser's Arcade physics engine.
 * 
 * TODO: Extract all the handy methods to the Facade class, and a new
 *       CollisionResolver/CollisionHandler class that stores all the solvers
 *       and a default solver type?
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
	 * The default collision solver type to use for sloped tiles.
	 * 
	 * @property {string} defaultSolver
	 * @default
	 */
	this.defaultSolver = defaultSolver || Phaser.Plugin.ArcadeSlopes.SAT;
	
	/**
	 * A tile slope factory.
	 * 
	 * @property {Phaser.Plugin.ArcadeSlopes.TileSlopeFactory} factory
	 */
	this.factory = new Phaser.Plugin.ArcadeSlopes.TileSlopeFactory();
	
	/**
	 * The collision solvers provided by the plugin.
	 * 
	 * Maps solver constants to their respective instances.
	 * 
	 * @property {object} solvers
	 */
	this.solvers = {};
	
	this.solvers[Phaser.Plugin.ArcadeSlopes.SAT] = new Phaser.Plugin.ArcadeSlopes.SatSolver();
};

Phaser.Plugin.ArcadeSlopes.prototype = Object.create(Phaser.Plugin.prototype);
Phaser.Plugin.ArcadeSlopes.prototype.constructor = Phaser.Plugin.ArcadeSlopes;

/**
 * The Arcade Slopes plugin version number.
 * 
 * @constant
 * @type {string}
 */
Phaser.Plugin.ArcadeSlopes.VERSION = '0.1.0-beta';

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
 * The Metroid collision solver type.
 * 
 * Inspired by and adapted from the source of a Metroid clone by Jan Geselle.
 * 
 * @constant
 * @type {string}
 */
Phaser.Plugin.ArcadeSlopes.METROID = 'metroid';

/**
 * Initializes the plugin.
 * 
 * @method Phaser.Plugin.ArcadeSlopes#init
 */
Phaser.Plugin.ArcadeSlopes.prototype.init = function () {
	// Give the game an Arcade Slopes facade
	this.game.slopes = this.game.slopes || this;
	
	// Keep a reference to the original collideSpriteVsTilemapLayer method
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
};

/**
 * Destroys the plugin and nulls its references. Restores any overriden methods.
 * 
 * @method Phaser.Plugin.ArcadeSlopes#destroy
 */
Phaser.Plugin.ArcadeSlopes.prototype.destroy = function () {
	// Null the game's reference to the facade.
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
	
	// Call the parent destroy method
	Phaser.Plugin.prototype.destroy.call(this);
};

/**
 * Enable the physics body of the given object for sloped tile interaction.
 *
 * @method Phaser.Plugin.ArcadeSlopes#enable
 * @param {Phaser.Sprite|Phaser.Group} object - The object to enable sloped tile physics for.
 */
Phaser.Plugin.ArcadeSlopes.prototype.enable = function (object) {
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
 * @method Phaser.Plugin.ArcadeSlopes#enableBody
 * @param {Phaser.Physics.Arcade.Body} body - The physics body to enable.
 */
Phaser.Plugin.ArcadeSlopes.prototype.enableBody = function (body) {
	// Create an SAT polygon from the body's bounding box
	body.polygon = new SAT.Box(
		new SAT.Vector(body.x, body.y),
		body.width,
		body.height
	).toPolygon();
	
	// Attach a new set of properties that configure the body's interaction
	// with sloped tiles (TODO: Formalize as a class?)
	body.slopes = {
		friction: new Phaser.Point(),
		preferY: false,
		sat: {
			response: null,
		},
		snapUp: 0,
		snapDown: 0,
		snapLeft: 0,
		snapRight: 0
	};
};

/**
 * Converts a layer of the given tilemap.
 * 
 * Attaches Phaser.Plugin.ArcadeSlopes.TileSlope objects that are used to define
 * how the tile should collide with a physics body.
 *
 * @method Phaser.Plugin.ArcadeSlopes#convertTilemap
 * @param  {Phaser.Tilemap}                    map      - The map containing the layer to convert.
 * @param  {number|string|Phaser.TileMapLayer} layer    - The layer of the map to convert.
 * @param  {object}                            slopeMap - A map of tilemap indexes to ArcadeSlope.TileSlope constants.
 * @return {Phaser.Tilemap}                             - The converted tilemap.
 */
Phaser.Plugin.ArcadeSlopes.prototype.convertTilemap = function (map, layer, slopeMap) {
	return this.factory.convertTilemap(map, layer, slopeMap);
};

/**
 * Converts a tilemap layer.
 *
 * @method Phaser.Plugin.ArcadeSlopes#convertTilemapLayer
 * @param  {Phaser.TilemapLayer}  layer    - The tilemap layer to convert.
 * @param  {object}               slopeMap - A map of tilemap indexes to ArcadeSlope.TileSlope constants.
 * @return {Phaser.TilemapLayer}           - The converted tilemap layer.
 */
Phaser.Plugin.ArcadeSlopes.prototype.convertTilemapLayer = function (layer, slopeMap) {
	return this.factory.convertTilemapLayer(layer, slopeMap);
};

/**
 * Collides a physics body against a tile.
 *
 * @method Phaser.Plugin.ArcadeSlopes#collide
 * @param  {integer}                    i           - The tile index.
 * @param  {Phaser.Physics.Arcade.Body} body        - The physics body.
 * @param  {Phaser.Tile}                tile        - The tile.
 * @param  {boolean}                    overlapOnly - Whether to only check for an overlap.
 * @return {boolean}                                - Whether the body was separated.
 */
Phaser.Plugin.ArcadeSlopes.prototype.collide = function (i, body, tile, overlapOnly) {
	if (tile.slope.solver && this.solvers.hasOwnProperty(tile.slope.solver)) {
		return this.solvers[tile.slope.solver].collide(i, body, tile, overlapOnly);
	}
	
	return this.solvers[this.defaultSolver].collide(i, body, tile, overlapOnly);
};
