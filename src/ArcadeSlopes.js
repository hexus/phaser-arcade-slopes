/**
 * @author Chris Andrew <chris@hexus.io>
 * @copyright 2016 Chris Andrew
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
};

Phaser.Plugin.ArcadeSlopes.prototype = Object.create(Phaser.Plugin.prototype);
Phaser.Plugin.ArcadeSlopes.prototype.constructor = Phaser.Plugin.ArcadeSlopes;

/**
 * The Arcade Slopes plugin version number.
 * 
 * @constant
 * @type {string}
 */
Phaser.Plugin.ArcadeSlopes.VERSION = '0.2.0-alpha2';

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
	
	// Call the parent destroy method
	Phaser.Plugin.prototype.destroy.call(this);
};
