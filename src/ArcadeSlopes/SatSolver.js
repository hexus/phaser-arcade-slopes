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
 * @param {Vector[]} points - The points to flatten.
 * @param {Vector}   normal - The unit vector axis to flatten on.
 * @param {number[]} result - An array. After calling this,
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
 * @param  {SAT.Polygon} a        - The first polygon.
 * @param  {SAT.Polygon} b        - The second polygon.
 * @param  {Vector}      axis     - The axis (unit sized) to test against.
 *                                  The points of both polygons are projected
 *                                  onto this axis.
 * @param  {Response}    response - The response to populate if the polygons are
 *                                  not separated by the given axis.
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
