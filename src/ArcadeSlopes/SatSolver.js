/**
 * @author Chris Andrew <chris@hexus.io>
 * @copyright 2016-2017 Chris Andrew
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
		preferY: false,
		
		// Whether to restrain SAT collisions
		restrain: true
	});
	
	/**
	 * Objects that have the chance to process collisions themselves.
	 *
	 * They should expose a restrain() function.
	 *
	 * @property {object[]} restrainers
	 */
	this.restrainers = [
		new Phaser.Plugin.ArcadeSlopes.SatRestrainer()
	];
};

/**
 * Prepare the given SAT response by inverting the overlap vectors.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#prepareResponse
 * @param  {SAT.Response}
 * @return {SAT.Response}
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.prepareResponse = function(response) {
	// Invert our overlap vectors so that we have them facing outwards
	response.overlapV.scale(-1);
	response.overlapN.scale(-1);
	
	return response;
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
 * Determine whether two polygons intersect on a given axis.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#isSeparatingAxis
 * @param  {SAT.Polygon}  a        - The first polygon.
 * @param  {SAT.Polygon}  b        - The second polygon.
 * @param  {SAT.Vector}   axis     - The axis to test.
 * @param  {SAT.Response} response - The response to populate.
 * @return {boolean}               - Whether a separating axis was found.
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.isSeparatingAxis = function (a, b, axis, response) {
	var result = SAT.isSeparatingAxis(a.pos, b.pos, a.points, b.points, axis, response || null);
	
	if (response) {
		response.a = a;
		response.b = b;
		response.overlapV = response.overlapN.clone().scale(response.overlap);
	}
	
	return result;
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
	
	// Separate the body from the tile
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
	var bounce = body.slopes.velocity.clone().projectN(response.overlapN);
	
	// Then work out the surface vector (Vt)
	var friction = body.slopes.velocity.clone().sub(bounce);
	
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
 * Attempt to snap the body to a given set of tiles based on its slopes options.
 *
 * TODO: Maybe remove snapping altogether.
 * 
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#snap
 * @param  {Phaser.Physics.Arcade.Body} body         - The physics body.
 * @param  {Phaser.Tile[]}              tiles        - The tiles.
 * @param  {Phaser.TilemapLayer}        tilemapLayer - The tilemap layer.
 * @return {boolean}                                 - Whether the body was snapped to any tiles.
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.prototype.snap = function (body, tiles, tilemapLayer) {
	if (!body.slopes || (!body.slopes.snapUp && !body.slopes.snapDown && !body.slopes.snapLeft && !body.slopes.snapRight)) {
		return false;
	}
	
	// Keep the current body position to snap from
	// TODO: Get rid of the instantiation
	var current = new Phaser.Point(body.position.x, body.position.y);
	
	// Keep track of whether the body has snapped to a tile
	var snapped = false;
	
	// For each tile, move the body in each direction by the configured amount,
	// and try to collide, returning the body to its original position if no
	// collision occurs
	for (var t in tiles) {
		var tile = tiles[t];
		
		if (!tile.slope) {
			continue;
		}
		
		if (body.slopes.snapUp) {
			body.position.x = current.x;
			body.position.y = current.y - body.slopes.snapUp;
			
			if (this.snapCollide(body, tile, tilemapLayer, current)) {
				return true;
			}
		}
		
		if (body.slopes.snapDown) {
			body.position.x = current.x;
			body.position.y = current.y + body.slopes.snapDown;
			
			if (this.snapCollide(body, tile, tilemapLayer, current)) {
				return true;
			}
		}
		
		if (body.slopes.snapLeft) {
			body.position.x = current.x - body.slopes.snapLeft;
			body.position.y = current.y;
			
			if (this.snapCollide(body, tile, tilemapLayer, current)) {
				return true;
			}
		}
		
		if (body.slopes.snapRight) {
			body.position.x = current.x + body.slopes.snapRight;
			body.position.y = current.y;
			
			if (this.snapCollide(body, tile, tilemapLayer, current)) {
				return true;
			}
		}
	}
	
	return false;
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
 * Perform a snap collision between the given body and tile, setting the body
 * back to the given current position if it fails.
 *
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#snapCollide
 * @param  {Phaser.Physics.Arcade.Body} body         - The translated physics body.
 * @param  {Phaser.Tile}                tile         - The tile.
 * @param  {Phaser.TilemapLayer}        tilemapLayer - The tilemap layer.
 * @param  {Phaser.Point}               current      - The original position of the body.
 * @return {boolean}                                 - Whether the body snapped to the tile.
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.prototype.snapCollide = function (body, tile, tilemapLayer, current) {
	if (this.collide(0, body, tile, tilemapLayer)) {
		return true;
	}
	
	// There was no collision, so reset the body position
	body.position.x = current.x;
	body.position.y = current.y;
	
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
	
	var response = new SAT.Response();
	
	// Test for an overlap and bail if there isn't one
	if ((body.isCircle && !SAT.testCirclePolygon(body.polygon, tile.slope.polygon, response)) || (!body.isCircle && !SAT.testPolygonPolygon(body.polygon, tile.slope.polygon, response))) {
		return false;
	}
	
	// If we're only testing for the overlap, we can bail here
	if (overlapOnly) {
		return true;
	}
	
	// Invert our overlap vectors so that we have them facing outwards
	Phaser.Plugin.ArcadeSlopes.SatSolver.prepareResponse(response);
	
	// Update the overlap properties of the body
	body.overlapX = response.overlapV.x;
	body.overlapY = response.overlapV.y;
	body.slopes.sat.response = response;
	
	// Bail out if no separation occurred
	if (!this.separate(body, tile, response)) {
		return false;
	}
	
	// Set the tile that the body separated from
	body.slopes.tile = tile;
	
	// Apply any velocity changes as a result of the collision
	this.applyVelocity(body, tile, response);
	
	// Update the touching and blocked flags of the physics body
	this.updateFlags(body, response);
	
	return true;
};

/**
 * Collide a body with a tile on a specific axis.
 *
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#collideOnAxis
 * @param  {Phaser.Physics.Arcade.Body} body     - The physics body.
 * @param  {Phaser.Tile}                tile     - The tile.
 * @param  {SAT.Vector}                 axis     - The axis unit vector.
 * @param  {SAT.Response}               response - The SAT response to use.
 * @return {boolean}                             - Whether the body was separated.
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.prototype.collideOnAxis = function (body, tile, axis, response) {
	// Update the body's polygon position and velocity vector
	this.updateValues(body);
	
	// Bail out if we don't have everything we need
	if (!this.shouldCollide(body, tile)) {
		return false;
	}
	
	response = response || new SAT.Response();
	
	var separatingAxis = Phaser.Plugin.ArcadeSlopes.SatSolver.isSeparatingAxis(body.polygon, tile.slope.polygon, axis, response);
	
	if (separatingAxis) {
		return false;
	}
	
	Phaser.Plugin.ArcadeSlopes.SatSolver.prepareResponse(response);
	
	if (!this.separate(body, tile, response, true)) {
		return false;
	}
	
	this.applyVelocity(body, tile, response);
	this.updateFlags(body, response);
	
	return true;
};

/**
 * Run a constraint check for the given physics body, tile and response.
 *
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#restrain
 * @param  {Phaser.Physics.Arcade.Body} body     - The physics body.
 * @param  {Phaser.Tile}                tile     - The tile.
 * @param  {SAT.Response}               response - The initial collision response.
 * @return {boolean}                             - Whether the collision was restrained.
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.prototype.restrain = function (body, tile, response) {
	for (var r in this.restrainers) {
		var restrainer = this.restrainers[r];
		
		// Skip anything without a restrain function
		if (typeof restrainer.restrain !== 'function') {
			continue;
		}
		
		// Bail if the restrainer dealt with the collision by itself
		if (!restrainer.restrain(this, body, tile, response)) {
			return true;
		}
	}
	
	return false;
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
	
	// Ignore any non-colliding or internal edges
	if ((!tile.collideUp || tile.slope.edges.top === Phaser.Plugin.ArcadeSlopes.TileSlope.EMPTY) && response.overlapN.y < 0 && response.overlapN.x === 0) {
		return false;
	}
	
	if ((!tile.collideDown || tile.slope.edges.bottom === Phaser.Plugin.ArcadeSlopes.TileSlope.EMPTY) && response.overlapN.y > 0 && response.overlapN.x === 0) {
		return false;
	}
	
	if ((!tile.collideLeft || tile.slope.edges.left === Phaser.Plugin.ArcadeSlopes.TileSlope.EMPTY) && response.overlapN.x < 0 && response.overlapN.y === 0) {
		return false;
	}
	
	if ((!tile.collideRight || tile.slope.edges.right === Phaser.Plugin.ArcadeSlopes.TileSlope.EMPTY) && response.overlapN.x > 0 && response.overlapN.y === 0) {
		return false;
	}
	
	// Only separate if the body is moving into the tile
	if (response.overlapV.clone().scale(-1).dot(body.slopes.velocity) < 0) {
		return false;
	}
	
	// Skip restraints if they are disabled or the body is circular
	if (!this.options.restrain || body.isCircle) {
		return true;
	}
	
	// Run any separation restrainers
	if (this.restrain(body, tile, response)) {
		return false;
	}
	
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
