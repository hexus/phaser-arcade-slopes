/**
 * @author Chris Andrew <chris@hexus.io>
 * @copyright 2016-2017 Chris Andrew
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
	var above = null;
	var below = null;
	var left  = null;
	var right = null;
	
	for (var y = 0, h = layer.layer.height; y < h; y++) {
		for (var x = 0, w = layer.layer.width; x < w; x++) {
			var tile = layer.layer.data[y][x];
			
			if (tile && tile.hasOwnProperty('slope')) {
				// Compare edges, flag internal vertices, create ghost normals
				above = layer.map.getTileAbove(layer.index, x, y);
				below = layer.map.getTileBelow(layer.index, x, y);
				left  = layer.map.getTileLeft(layer.index, x, y);
				right = layer.map.getTileRight(layer.index, x, y);
				topLeft = layer.map.getTileTopLeft(layer.index, x, y);
				topRight = layer.map.getTileTopRight(layer.index, x, y);
				bottomLeft = layer.map.getTileBottomLeft(layer.index, x, y);
				bottomRight = layer.map.getTileBottomRight(layer.index, x, y);
				
				if (above && above.hasOwnProperty('slope')) {
					tile.slope.edges.top = this.compareEdges(tile.slope.edges.top, above.slope.edges.bottom);
					tile.collideUp = tile.slope.edges.top !== Phaser.Plugin.ArcadeSlopes.TileSlope.EMPTY;
					this.flagInternalVertices(tile, above);
					this.createGhostVertices(tile, above);
				}
				
				if (below && below.hasOwnProperty('slope')) {
					tile.slope.edges.bottom = this.compareEdges(tile.slope.edges.bottom, below.slope.edges.top);
					tile.collideDown = tile.slope.edges.bottom !== Phaser.Plugin.ArcadeSlopes.TileSlope.EMPTY;
					this.flagInternalVertices(tile, below);
					this.createGhostVertices(tile, below);
				}
				
				if (left && left.hasOwnProperty('slope')) {
					tile.slope.edges.left = this.compareEdges(tile.slope.edges.left, left.slope.edges.right);
					tile.collideLeft = tile.slope.edges.left !== Phaser.Plugin.ArcadeSlopes.TileSlope.EMPTY;
					this.flagInternalVertices(tile, left);
					this.createGhostVertices(tile, left);
				}
				
				if (right && right.hasOwnProperty('slope')) {
					tile.slope.edges.right = this.compareEdges(tile.slope.edges.right, right.slope.edges.left);
					tile.collideRight = tile.slope.edges.right !== Phaser.Plugin.ArcadeSlopes.TileSlope.EMPTY;
					this.flagInternalVertices(tile, right);
					this.createGhostVertices(tile, right);
				}
				
				if (topLeft && topLeft.hasOwnProperty('slope')) {
					this.createGhostVertices(tile, topLeft);
				}
				
				if (topRight && topRight.hasOwnProperty('slope')) {
					this.createGhostVertices(tile, topRight);
				}
				
				if (bottomLeft && bottomLeft.hasOwnProperty('slope')) {
					this.createGhostVertices(tile, bottomLeft);
				}
				
				if (bottomRight && bottomRight.hasOwnProperty('slope')) {
					this.createGhostVertices(tile, bottomRight);
				}
			}
		}
	}
};

/**
 * Resolve the given flags of two shared tile edges.
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
				firstPolygon.points[i].ignore = true;
				secondPolygon.points[j].ignore = true;
				firstPolygon.normals[i].ignore = true;
				secondPolygon.normals[j].ignore = true;
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
 * Create ghost vertices for the polygon of the given tiles.
 * 
 * Ghost vertices are used to further prevent internal edge collisions.
 *
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createGhostVertices
 * @param {Phaser.Tile} firstTile  - The first tile to compare.
 * @param {Phaser.Tile} secondTile - The second tile to compare.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.prototype.createGhostVertices = function (firstTile, secondTile) {
	// Bail if either tile lacks a polygon
	if (!firstTile.slope.polygon || !secondTile.slope.polygon) {
		return;
	}
	
	// Here are our polygons
	var firstPolygon = firstTile.slope.polygon;
	var secondPolygon = secondTile.slope.polygon;
	
	if (!firstPolygon.ghostNormals) {
		firstPolygon.ghostNormals = [];
		firstPolygon.ignormals = [];
	}
	
	if (!secondPolygon.ghostNormals) {
		secondPolygon.ghostNormals = [];
		secondPolygon.ignormals = [];
	}
	
	// Here are the vectors we'll need to test for a worthwhile ghost normal
	var firstPosition = this.vectorPool.pop();
	var secondPosition = this.vectorPool.pop();
	var firstTileVertexOne = this.vectorPool.pop();
	var firstTileVertexTwo = this.vectorPool.pop();
	var secondTileVertexOne = this.vectorPool.pop();
	var secondTileVertexTwo = this.vectorPool.pop();
	
	firstPosition.x = firstTile.worldX;
	firstPosition.y = firstTile.worldY;
	secondPosition.x = secondTile.worldX;
	secondPosition.y = secondTile.worldY;
	
	for (var i = 0; i < firstPolygon.points.length; i++) {
		if (firstPolygon.normals[i].ignore) {
			continue;
		}
		
		firstTileVertexOne.copy(firstPolygon.points[i]).add(firstPosition);
		firstTileVertexTwo.copy(firstPolygon.points[(i + 1) % firstPolygon.points.length]).add(firstPosition);
		
		for (var j = 0; j < secondPolygon.points.length; j++) {
			if (secondPolygon.normals[j].ignore) {
				continue;
			}
			
			secondTileVertexOne.copy(secondPolygon.points[j]).add(secondPosition);
			secondTileVertexTwo.copy(secondPolygon.points[(j + 1) % secondPolygon.points.length]).add(secondPosition);
			
			// First tile vertex one matches second tile vertex two;
			// Second tile edge leads into first tile edge
			if (firstTileVertexOne.x === secondTileVertexTwo.x && firstTileVertexOne.y === secondTileVertexTwo.y) {
				
				
				if (firstTileVertexOne.x >= firstTileVertexTwo.x && secondTileVertexOne.x > secondTileVertexTwo.x &&
					firstTileVertexOne.y < firstTileVertexTwo.y && secondTileVertexOne.y <= secondTileVertexTwo.y
				) {
					secondPolygon.ignormals.push(new SAT.Vector(1, 0));
				}
			}
			
			// First tile vertex two matches second tile vertex one;
			// First tile edge leads into second tile edge
			if (firstTileVertexTwo.x === secondTileVertexOne.x && firstTileVertexTwo.y === secondTileVertexTwo.y) {
				
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
 * Add some extra debug settings to a tilemap layer for debug rendering.
 *
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#addDebugSettings
 * @param {Phaser.TilemapLayer} layer - The tilemap layer.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.prototype.addDebugSettings = function (layer) {
	layer._mc.edgeMidpoint = new SAT.Vector();
	layer.debugSettings.slopeFill = 'rgba(255, 0, 255, 0.2)';
	layer.debugSettings.slopeEdgeStroke = 'rgba(255, 0, 255, 0.4)';
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
	
	var line = new Phaser.Line(tile.left, tile.top, tile.right, tile.top);
	
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
	
	var line = new Phaser.Line(tile.left, tile.bottom, tile.right, tile.top + tile.height / 2);
	
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
	
	var line = new Phaser.Line(0, tile.height, tile.width / 2, 0);
	
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
	
	var line = new Phaser.Line(tile.left + tile.width / 2, tile.bottom, tile.right, tile.bottom);
	
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
		right:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
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
		right:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
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
