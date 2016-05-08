/**
 * @author Chris Andrew <chris@hexus.io>
 * @copyright 2016 Chris Andrew
 * @license MIT
 */

/**
 * Defines the slope of a tile.
 * 
 * @class Phaser.Plugin.ArcadeSlopes.TileSlope
 * @constructor
 * @param {integer}     type    - The type of the tile slope.
 * @param {Phaser.Tile} tile    - The tile this slope definition belongs to.
 * @param {SAT.Polygon} polygon - The polygon representing the shape of the tile.
 * @param {Phaser.Line} line    - The line representing the slope of the tile.
 * @param {object}      edges   - The flags for each edge of the tile.
 * @param {SAT.Vector}  axis    - The preferred axis for separating physics bodies.
 */
Phaser.Plugin.ArcadeSlopes.TileSlope = function (type, tile, polygon, line, edges, axis) {
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
	 * The flags for each edge of the tile; empty, solid or interesting?
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
 * Resolve a tile slope type constant from the given value.
 *
 * Returns any successfully parsed non-zero integers regardless of whether they
 * are valid slope tile types. This method is really for strings.
 *
 * @method Phaser.Plugin.ArcadeSlopes.TileSlope#resolveType
 * @param  {string|integer} type - The value to resolve.
 * @return {integer}             - The resolved tile slope type constant.
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.resolveType = function(type, fallback) {
	if (parseInt(type) > -1) {
		return type;
	}
	
	if (Phaser.Plugin.ArcadeSlopes.TileSlope.hasOwnProperty(type)) {
		return Phaser.Plugin.ArcadeSlopes.TileSlope[type];
	}
	
	console.warn('Unresolved slope type \'' + type + '\'');
	
	return -1;
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
