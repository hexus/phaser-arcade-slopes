/**
 * @author Chris Andrew <chris@hexus.io>
 * @copyright 2016 Chris Andrew
 * @license MIT
 */

/**
 * A facade class to attach to a Phaser game.
 *
 * Not yet in use, but will be when the plugin methods are moved here.
 * 
 * @class Phaser.Plugin.ArcadeSlopes.Facade
 * @constructor
 * @param {Phaser.Plugin.ArcadeSlopes.TileSlopeFactory} factory - A tile slope factory.
 */
Phaser.Plugin.ArcadeSlopes.Facade = function (factory) {
	/**
	 * A tile slope factory.
	 * 
	 * @property {Phaser.Plugin.ArcadeSlopes.TileSlopeFactory} factory
	 */
	this.factory = factory;
};

// TODO: Tile conversion methods, collision methods, body enable etc.
