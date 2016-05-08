/**
 * @author Chris Andrew <chris@hexus.io>
 * @copyright 2016 Chris Andrew
 * @license MIT
 */

/**
 * Restrains SAT tile collision handling based on their neighbouring tiles.
 *
 * Can separate on a tile's preferred axis if it has one.
 *
 * This is what keeps the sloped tiles fairly smooth for AABBs.
 * 
 * Think of it as the equivalent of the Arcade Physics tile face checks for all
 * of the sloped tiles and their possible neighbour combinations.
 *
 * Thanks to some painstaking heuristics, it allows a set of touching tiles to
 * behave more like a single shape.
 * 
 * TODO: Change all of these rules to work with the built in edge restraints.
 *       Will require checking all of these rules during tilemap convert.
 *       TileSlope specific edge flags would need to be set for this.
 *       See SatSolver.shouldSeparate(). That should deal with it.
 *       This would work because we're only trying to prevent
 *       axis-aligned overlap vectors, not anything else.
 *
 * TODO: Move away from these heuristics and start flagging edge visibility
 *       automatically, if that could at all work out as well as this.
 * 
 * @class Phaser.Plugin.ArcadeSlopes.SatRestrainer
 * @constructor
 */
Phaser.Plugin.ArcadeSlopes.SatRestrainer = function () {
	/**
	 * Restraint definitions for SAT collision handling.
	 *
	 * Each restraint is an array of rules, keyed by a tile slope type.
	 *
	 * Each rule defines a neighbour to check, overlap ranges to match and
	 * optionally neighbouring tile slope types to match (the same type is used
	 * otherwise). The separate property determines whether to attempt to
	 * collide on the tile's preferred axis, if there is one.
	 * 
	 * Schema:
	 *   [
	 *     {
	 *       neighbour: 'above'|'below'|'left'|'right'|'topLeft'|'topRight'|'bottomLeft'|'bottomRight'
	 *       overlapX:  {integer}|[{integer}, {integer}]
	 *       overlapY:  {integer}|[{integer}, {integer}]
	 *       types:     {array of neighbour TileSlope type constants}
	 *       separate:  {boolean}
	 *    },
	 *    {
	 *      ...
	 *    }
	 *  ]
	 *
	 * Shorthand schema:
	 *   [
	 *     {
	 *       neighbour: 'above'|'below'|'left'|'right'|'topLeft'|'topRight'|'bottomLeft'|'bottomRight'
	 *       direction: 'up'|'down'|'left'|'right'
	 *       types:     {array of neighbour TileSlope type constants}
	 *     },
	 *     {
	 *       ...
	 *     }
	 *   ]
	 *
	 * @property {object} restraints
	 */
	this.restraints = {};
	
	// Define all of the default restraints
	this.setDefaultRestraints();
};

/**
 * Restrain the given SAT body-tile collision context based on the set rules.
 * 
 * @method Phaser.Plugin.ArcadeSlopes.SatRestrainer#restrain
 * @param  {Phaser.Plugin.ArcadeSlopes.SatSolver} solver   - The SAT solver.
 * @param  {Phaser.Physics.Arcade.Body}           body     - The physics body.
 * @param  {Phaser.Tile}                          tile     - The tile.
 * @param  {SAT.Response}                         response - The initial collision response.
 * @return {boolean}                                       - Whether to continue collision handling.
 */
Phaser.Plugin.ArcadeSlopes.SatRestrainer.prototype.restrain = function (solver, body, tile, response) {
	// Bail out if there's no overlap, no neighbours, or no tile type restraint
	if (!response.overlap || !tile.neighbours || !this.restraints.hasOwnProperty(tile.slope.type)) {
		return true;
	}

	for (var r in this.restraints[tile.slope.type]) {
		// TODO: restraint is actually a rule here, rename the variable
		var restraint = this.restraints[tile.slope.type][r];
		
		var neighbour = tile.neighbours[restraint.neighbour];
		
		if (!(neighbour && neighbour.slope)) {
			continue;
		}
		
		// Restrain based on the same tile type by default
		var condition = false;
		
		if (restraint.types) {
			condition = restraint.types.indexOf(neighbour.slope.type) > -1;
		} else {
			condition = neighbour.slope.type === tile.slope.type;
		}
		
		// Restrain based on the overlapN.x value
		if (restraint.hasOwnProperty('overlapX')) {
			if (typeof restraint.overlapX === 'number') {
				condition = condition && response.overlapN.x === restraint.overlapX;
			} else {
				condition = condition && response.overlapN.x >= restraint.overlapX[0] && response.overlapN.x <= restraint.overlapX[1];
			}
		}
		
		// Restrain based on the overlapN.y value
		if (restraint.hasOwnProperty('overlapY')) {
			if (typeof restraint.overlapY === 'number') {
				condition = condition && response.overlapN.y === restraint.overlapY;
			} else {
				condition = condition && response.overlapN.y >= restraint.overlapY[0] && response.overlapN.y <= restraint.overlapY[1];
			}
		}
		
		// Return false if the restraint condition has been matched
		if (condition) {
			// Collide on the tile's preferred axis if desired and available
			if (restraint.separate && tile.slope.axis) {
				solver.collideOnAxis(body, tile, tile.slope.axis);
			}
			
			return false;
		}
	}
	
	return true;
};

/**
 * Resolve overlapX and overlapY restraints from the given direction string.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.SatRestrainer#resolveOverlaps
 * @param  {string} direction
 * @return {object}
 */
Phaser.Plugin.ArcadeSlopes.SatRestrainer.resolveOverlaps = function (direction) {
	switch (direction) {
		case 'up':
			return {
				overlapX: 0,
				overlapY: [-1, 0]
			};
		case 'down':
			return {
				overlapX: 0,
				overlapY: [0, 1]
			};
		case 'left':
			return {
				overlapX: [-1, 0],
				overlapY: 0
			};
		case 'right':
			return {
				overlapX: [0, 1],
				overlapY: 0
			};
	}
	
	console.warn('Unknown overlap direction \'' + direction + '\'');
	
	return {};
};

/**
 * Formalizes the given informally defined restraints.
 *
 * Converts direction properties into overlapX and overlapY properties and
 * tile type strings into tile type constants.
 *
 * This simply allows for more convenient constraint definitions.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.SatRestrainer#createRestraints
 * @param  {object}        restraints - The restraints to prepare.
 * @return {object}                   - The prepared restraints.
 */
Phaser.Plugin.ArcadeSlopes.SatRestrainer.prepareRestraints = function(restraints) {
	var prepared = {};
	
	for (var type in restraints) {
		var restraint = restraints[type];
		
		// Resolve each rule in the restraint
		for (var r in restraint) {
			var rule = restraint[r];
			
			// Resolve overlapX and overlapY restraints from a direction
			if (rule.direction) {
				var resolved = Phaser.Plugin.ArcadeSlopes.SatRestrainer.resolveOverlaps(rule.direction);
				
				rule.overlapX = resolved.overlapX;
				rule.overlapY = resolved.overlapY;
			}
			
			// Resolve neighbour types from their string representations
			for (var nt in rule.types) {
				rule.types[nt] = Phaser.Plugin.ArcadeSlopes.TileSlope.resolveType(rule.types[nt]);
			}
			
			// Conveniently set separate to true unless it's already false
			if (rule.separate !== false) {
				rule.separate = true;
			}
		}
		
		var restraintType = Phaser.Plugin.ArcadeSlopes.TileSlope.resolveType(type);
		
		prepared[restraintType] = restraint;
	}
	
	return prepared;
};

/**
 * Set all of the default SAT collision handling restraints.
 *
 * These are the informally defined hueristics that get refined and utilised
 * above.
 *
 * They were cumbersome to write but they definitely pay off.
 *
 * @method Phaser.Plugin.ArcadeSlopes.SatRestrainer#setDefaultRestraints
 */
Phaser.Plugin.ArcadeSlopes.SatRestrainer.prototype.setDefaultRestraints = function () {
	var restraints = {};
	
	restraints.HALF_TOP = [
		{
			direction: 'left',
			neighbour: 'left',
			types: this.resolve('topRight', 'right'),
			separate: false
		},
		{
			direction: 'right',
			neighbour: 'right',
			types: this.resolve('topLeft', 'left'),
			separate: false
		}
	];

	restraints.HALF_BOTTOM = [
		{
			direction: 'left',
			neighbour: 'left',
			types: this.resolve('right', 'bottomRight'),
			separate: false
		},
		{
			direction: 'right',
			neighbour: 'right',
			types: this.resolve('left', 'bottomLeft'),
			separate: false
		}
	];

	restraints.HALF_LEFT = [
		{
			direction: 'up',
			neighbour: 'above',
			types: this.resolve('bottomLeft', 'bottom'),
			separate: false
		},
		{
			direction: 'down',
			neighbour: 'below',
			types: this.resolve('topLeft', 'top'),
			separate: false
		}
	];

	restraints.HALF_RIGHT = [
		{
			direction: 'up',
			neighbour: 'above',
			types: this.resolve('bottom', 'bottomRight'),
			separate: false
		},
		{
			direction: 'down',
			neighbour: 'below',
			types: this.resolve('top', 'topRight'),
			separate: false
		}
	];

	restraints.HALF_BOTTOM_LEFT = [
		{
			direction: 'right',
			neighbour: 'bottomRight',
			types: this.resolve('topLeft')
		},
		{
			direction: 'up',
			neighbour: 'topLeft',
			types: this.resolve('bottomRight')
		}
	];

	restraints.HALF_BOTTOM_RIGHT = [
		{
			direction: 'left',
			neighbour: 'bottomLeft',
			types: this.resolve('topRight'),
		},
		{
			direction: 'up',
			neighbour: 'topRight',
			types: this.resolve('bottomLeft')
		}
	];

	restraints.HALF_TOP_LEFT = [
		{
			direction: 'right',
			neighbour: 'topRight',
			types: this.resolve('bottomLeft')
		},
		{
			direction: 'down',
			neighbour: 'bottomLeft',
			types: this.resolve('topRight')
		}
	];

	restraints.HALF_TOP_RIGHT = [
		{
			direction: 'left',
			neighbour: 'topLeft',
			types: this.resolve('bottomRight')
		},
		{
			direction: 'down',
			neighbour: 'bottomRight',
			types: this.resolve('topLeft')
		}
	];

	restraints.QUARTER_BOTTOM_LEFT_LOW = [
		{
			direction: 'right',
			neighbour: 'bottomRight',
			types: this.resolve('topLeft')
		},
		{
			direction: 'up',
			neighbour: 'left',
			types: this.resolve('right', 'bottomRight')
		},
		{
			direction: 'left',
			neighbour: 'left',
			types: this.resolve('right', 'bottomRight')
		}
	];

	restraints.QUARTER_BOTTOM_LEFT_HIGH = [
		{
			direction: 'right',
			neighbour: 'right',
			types: this.resolve('left', 'bottomLeft')
		},
		{
			direction: 'up',
			neighbour: 'topLeft',
			types: this.resolve('bottomRight')
		}
	];

	restraints.QUARTER_BOTTOM_RIGHT_LOW = [
		{
			direction: 'left',
			neighbour: 'bottomLeft',
			types: this.resolve('topRight')
		},
		{
			direction: 'up',
			neighbour: 'right',
			types: this.resolve('left', 'bottomLeft')
		},
		{
			direction: 'right',
			neighbour: 'right',
			types: this.resolve('left', 'bottomLeft')
		}
	];

	restraints.QUARTER_BOTTOM_RIGHT_HIGH = [
		{
			direction: 'left',
			neighbour: 'left',
			types: this.resolve('right', 'bottomRight')
		},
		{
			direction: 'up',
			neighbour: 'topRight',
			types: this.resolve('bottomLeft')
		}
	];
	
	restraints.QUARTER_LEFT_BOTTOM_LOW = [
		{
			direction: 'up',
			neighbour: 'above',
			types: this.resolve('topLeft', 'left')
		},
		{
			direction: 'right',
			neighbour: 'bottomRight',
			types: this.resolve('topLeft')
		}
	];
	
	restraints.QUARTER_LEFT_BOTTOM_HIGH = [
		{
			direction: 'up',
			neighbour: 'topLeft',
			types: this.resolve('bottomRight')
		},
		{
			direction: 'down',
			neighbour: 'below',
			types: this.resolve('topLeft', 'top')
		},
		{
			direction: 'right',
			neighbour: 'below',
			types: this.resolve('topLeft', 'top')
		}
	];
	
	restraints.QUARTER_RIGHT_BOTTOM_LOW = [
		{
			direction: 'up',
			neighbour: 'above',
			types: this.resolve('bottom', 'bottomRight')
		},
		{
			direction: 'left',
			neighbour: 'bottomLeft',
			types: this.resolve('topRight')
		}
	];
	
	restraints.QUARTER_RIGHT_BOTTOM_HIGH = [
		{
			direction: 'up',
			neighbour: 'topRight',
			types: this.resolve('bottomLeft')
		},
		{
			direction: 'down',
			neighbour: 'below',
			types: this.resolve('top', 'topRight')
		},
		{
			direction: 'left',
			neighbour: 'below',
			types: this.resolve('top', 'topRight')
		}
	];
	
	restraints.QUARTER_LEFT_TOP_LOW = [
		{
			direction: 'up',
			neighbour: 'above',
			types: this.resolve('bottomLeft', 'bottom')
		},
		{
			direction: 'right',
			neighbour: 'above',
			types: this.resolve('bottomLeft', 'bottom')
		},
		{
			direction: 'down',
			neighbour: 'bottomLeft',
			types: this.resolve('topRight')
		}
	];
	
	restraints.QUARTER_LEFT_TOP_HIGH = [
		{
			direction: 'right',
			neighbour: 'topRight',
			types: this.resolve('bottomLeft')
		},
		{
			direction: 'down',
			neighbour: 'below',
			types: this.resolve('topLeft', 'top')
		}
	];
	
	restraints.QUARTER_RIGHT_TOP_LOW = [
		{
			direction: 'up',
			neighbour: 'above',
			types: this.resolve('bottom', 'bottomRight')
		},
		{
			direction: 'left',
			neighbour: 'above',
			types: this.resolve('bottom', 'bottomRight')
		},
		{
			direction: 'down',
			neighbour: 'bottomRight',
			types: this.resolve('topLeft')
		}
	];
	
	restraints.QUARTER_RIGHT_TOP_HIGH = [
		{
			direction: 'left',
			neighbour: 'topLeft',
			types: this.resolve('bottomRight')
		},
		{
			direction: 'left',
			neighbour: 'below',
			types: this.resolve('top', 'topRight')
		},
		{
			direction: 'down',
			neighbour: 'below',
			types: this.resolve('top', 'topRight')
		}
	];
	
	restraints.QUARTER_TOP_LEFT_LOW = [
		{
			direction: 'right',
			neighbour: 'topRight',
			types: this.resolve('bottomLeft')
		},
		{
			direction: 'left',
			neighbour: 'left',
			types: this.resolve('topRight', 'right')
		},
		{
			direction: 'down',
			neighbour: 'left',
			types: this.resolve('topRight', 'right')
		}
	];
	
	restraints.QUARTER_TOP_LEFT_HIGH = [
		{
			direction: 'right',
			neighbour: 'right',
			types: this.resolve('topLeft', 'left')
		},
		{
			direction: 'down',
			neighbour: 'bottomLeft',
			types: this.resolve('topRight')
		}
	];
	
	restraints.QUARTER_TOP_RIGHT_LOW = [
		{
			direction: 'left',
			neighbour: 'topLeft',
			types: this.resolve('bottomRight')
		},
		{
			direction: 'right',
			neighbour: 'right',
			types: this.resolve('topLeft', 'left')
		},
		{
			direction: 'down',
			neighbour: 'right',
			types: this.resolve('topLeft', 'left')
		}
	];
	
	restraints.QUARTER_TOP_RIGHT_HIGH = [
		{
			direction: 'left',
			neighbour: 'left',
			types: this.resolve('topRight', 'right')
		},
		{
			direction: 'down',
			neighbour: 'bottomRight',
			types: this.resolve('topLeft')
		}
	];
	
	// Keep a copy of the informal restraints for inspection
	this.informalRestraints = JSON.parse(JSON.stringify(restraints));
	
	this.restraints = Phaser.Plugin.ArcadeSlopes.SatRestrainer.prepareRestraints(restraints);
};

/**
 * Compute the intersection of two arrays.
 * 
 * Returns a unique set of values that exist in both arrays.
 *
 * @method Phaser.Plugin.ArcadeSlopes.SatRestrainer#intersectArrays
 * @param  {array} a - The first array.
 * @param  {array} b - The second array.
 * @return {array}   - The unique set of values shared by both arrays.
 */
Phaser.Plugin.ArcadeSlopes.SatRestrainer.intersectArrays = function (a, b) {
	return a.filter(function (value) {
		return b.indexOf(value) !== -1;
	}).filter(function (value, index, array) {
		return array.indexOf(value) === index;
	});
};

/**
 * Resolve the types of all tiles with vertices in all of the given locations.
 *
 * Locations can be:
 *   'topLeft',    'top',       'topRight',
 *   'left',                       'right',
 *   'bottomLeft', 'bottom', 'bottomRight'
 * 
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#resolve
 * @param  {...string} locations - A set of AABB vertex locations as strings.
 * @return {array}               - The tile slope types with matching vertices.
 */
Phaser.Plugin.ArcadeSlopes.SatRestrainer.prototype.resolve = function () {
	var types = [];
	
	if (!arguments.length) {
		return types;
	}
	
	// Check the vertex maps of the given locations
	for (var l in arguments) {
		var location = arguments[l];
		
		if (!Phaser.Plugin.ArcadeSlopes.SatRestrainer.hasOwnProperty(location + 'Vertices')) {
			console.warn('Tried to resolve types from undefined vertex map location \'' + location + '\'');
			continue;
		}
		
		var vertexMap = Array.prototype.slice.call(Phaser.Plugin.ArcadeSlopes.SatRestrainer[location + 'Vertices']);
		
		// If we only have one location to match, we can return its vertex map
		if (arguments.length === 1) {
			return vertexMap;
		}
		
		// If we don't have any types yet, use this vertex map to start with,
		// otherwise intersect this vertex map with the current types
		if (!types.length) {
			types = vertexMap;
		} else {
			types = Phaser.Plugin.ArcadeSlopes.SatRestrainer.intersectArrays(types, vertexMap);
		}
	}
	
	return types;
};

// TODO: Automate these definitions instead of relying on tedious heuristics.
//       Store them in a single vertexMaps property object, too.

/**
 * The set of tile slope types with a top center vertex.
 *
 * @static
 * @property {array} topVertices
 */
Phaser.Plugin.ArcadeSlopes.SatRestrainer.topVertices = [
	'HALF_LEFT',
	'HALF_RIGHT',
	'QUARTER_LEFT_TOP_LOW',
	'QUARTER_RIGHT_TOP_LOW',
	'QUARTER_LEFT_BOTTOM_LOW',
	'QUARTER_RIGHT_BOTTOM_LOW'
];

/**
 * The set of tile slope types with a bottom center vertex.
 *
 * @static
 * @property {array} bottomVertices
 */
Phaser.Plugin.ArcadeSlopes.SatRestrainer.bottomVertices = [
	'HALF_LEFT',
	'HALF_RIGHT',
	'QUARTER_LEFT_TOP_HIGH',
	'QUARTER_LEFT_BOTTOM_HIGH',
	'QUARTER_RIGHT_TOP_HIGH',
	'QUARTER_RIGHT_BOTTOM_HIGH'
];

/**
 * The set of tile slope types with a left center vertex.
 *
 * @static
 * @property {array} leftVertices
 */
Phaser.Plugin.ArcadeSlopes.SatRestrainer.leftVertices = [
	'HALF_TOP',
	'HALF_BOTTOM',
	'QUARTER_TOP_LEFT_LOW',
	'QUARTER_TOP_RIGHT_HIGH',
	'QUARTER_BOTTOM_LEFT_LOW',
	'QUARTER_BOTTOM_RIGHT_HIGH'
];

/**
 * The set of tile slope types with a right center vertex.
 *
 * @static
 * @property {array} rightVertices
 */
Phaser.Plugin.ArcadeSlopes.SatRestrainer.rightVertices = [
	'HALF_TOP',
	'HALF_BOTTOM',
	'QUARTER_TOP_LEFT_HIGH',
	'QUARTER_TOP_RIGHT_LOW',
	'QUARTER_BOTTOM_LEFT_HIGH',
	'QUARTER_BOTTOM_RIGHT_LOW',
];

/**
 * The set of tile slope types with a top left vertex.
 *
 * @static
 * @property {array} topLeftVertices
 */
Phaser.Plugin.ArcadeSlopes.SatRestrainer.topLeftVertices = [
	'FULL',
	'HALF_TOP',
	'HALF_LEFT',
	'HALF_TOP_LEFT',
	'HALF_TOP_RIGHT',
	'HALF_BOTTOM_LEFT',
	'QUARTER_TOP_LEFT_LOW',
	'QUARTER_TOP_LEFT_HIGH',
	'QUARTER_TOP_RIGHT_HIGH',
	'QUARTER_BOTTOM_LEFT_HIGH',
	'QUARTER_LEFT_TOP_LOW',
	'QUARTER_LEFT_TOP_HIGH',
	'QUARTER_LEFT_BOTTOM_LOW',
	'QUARTER_LEFT_BOTTOM_HIGH',
	'QUARTER_RIGHT_TOP_HIGH'
];

/**
 * The set of tile slope types with a top right vertex.
 *
 * @static
 * @property {array} topRightVertices
 */
Phaser.Plugin.ArcadeSlopes.SatRestrainer.topRightVertices = [
	'FULL',
	'HALF_TOP',
	'HALF_RIGHT',
	'HALF_TOP_LEFT',
	'HALF_TOP_RIGHT',
	'HALF_BOTTOM_RIGHT',
	'QUARTER_TOP_LEFT_LOW',
	'QUARTER_TOP_LEFT_HIGH',
	'QUARTER_TOP_RIGHT_LOW',
	'QUARTER_TOP_RIGHT_HIGH',
	'QUARTER_BOTTOM_RIGHT_HIGH',
	'QUARTER_LEFT_TOP_HIGH',
	'QUARTER_RIGHT_TOP_LOW',
	'QUARTER_RIGHT_TOP_HIGH',
	'QUARTER_RIGHT_BOTTOM_LOW',
	'QUARTER_RIGHT_BOTTOM_HIGH'
];

/**
 * The set of tile slope types with a bottom left vertex.
 *
 * @static
 * @property {array} bottomLeftVertices
 */
Phaser.Plugin.ArcadeSlopes.SatRestrainer.bottomLeftVertices = [
	'FULL',
	'HALF_LEFT',
	'HALF_BOTTOM',
	'HALF_TOP_LEFT',
	'HALF_BOTTOM_LEFT',
	'HALF_BOTTOM_RIGHT',
	'QUARTER_TOP_LEFT_HIGH',
	'QUARTER_BOTTOM_LEFT_LOW',
	'QUARTER_BOTTOM_LEFT_HIGH',
	'QUARTER_BOTTOM_RIGHT_LOW',
	'QUARTER_BOTTOM_RIGHT_HIGH',
	'QUARTER_LEFT_TOP_HIGH',
	'QUARTER_LEFT_BOTTOM_LOW',
	'QUARTER_LEFT_BOTTOM_HIGH'
];

/**
 * The set of tile slope types with a bottom right vertex.
 *
 * @static
 * @property {array} bottomRightVertices
 */
Phaser.Plugin.ArcadeSlopes.SatRestrainer.bottomRightVertices = [
	'FULL',
	'HALF_RIGHT',
	'HALF_BOTTOM',
	'HALF_TOP_RIGHT',
	'HALF_BOTTOM_LEFT',
	'HALF_BOTTOM_RIGHT',
	'QUARTER_TOP_RIGHT_HIGH',
	'QUARTER_BOTTOM_LEFT_LOW',
	'QUARTER_BOTTOM_LEFT_HIGH',
	'QUARTER_BOTTOM_RIGHT_LOW',
	'QUARTER_BOTTOM_RIGHT_HIGH',
	'QUARTER_LEFT_BOTTOM_LOW',
	'QUARTER_RIGHT_TOP_HIGH',
	'QUARTER_RIGHT_BOTTOM_LOW',
	'QUARTER_RIGHT_BOTTOM_HIGH'
];
