/**
 * @author Chris Andrew <chris@hexus.io>
 * @copyright 2016-2017 Chris Andrew
 * @license MIT
 */

/**
 * A static class with override methods for Phaser's tilemap collisions and tile
 * neighbour checks.
 * 
 * @static
 * @class Phaser.Plugin.ArcadeSlopes.Override
 */
Phaser.Plugin.ArcadeSlopes.Overrides = {};

/**
 * Collide a sprite against a single tile.
 *
 * @method Phaser.Plugin.ArcadeSlopes.Overrides#collideSpriteVsTile
 * @param  {integer}             i               - The tile index.
 * @param  {Phaser.Sprite}       sprite          - The sprite to check.
 * @param  {Phaser.Tile}         tile            - The tile to check.
 * @param  {Phaser.TilemapLayer} tilemapLayer    - The tilemap layer the tile belongs to.
 * @param  {function}            collideCallback - An optional collision callback.
 * @param  {function}            processCallback - An optional overlap processing callback.
 * @param  {object}              callbackContext - The context in which to run the callbacks.
 * @param  {boolean}             overlapOnly     - Whether to only check for an overlap.
 * @return {boolean}                             - Whether a collision occurred.
 */
Phaser.Plugin.ArcadeSlopes.Overrides.collideSpriteVsTile = function (i, sprite, tile, tilemapLayer, collideCallback, processCallback, callbackContext, overlapOnly) {
	if (!sprite.body) {
		return false;
	}
	
	if (tile.hasOwnProperty('slope')) {
		if (this.game.slopes.collide(i, sprite.body, tile, tilemapLayer, overlapOnly)) {
			this._total++;
			
			if (collideCallback) {
				collideCallback.call(callbackContext, sprite, tile);
			}
			
			return true;
		}
	} else if (this.separateTile(i, sprite.body, tile, tilemapLayer, overlapOnly)) {
		this._total++;
		
		if (collideCallback) {
			collideCallback.call(callbackContext, sprite, tile);
		}
		
		return true;
	}
	
	return false;
};

/**
 * Collide a sprite against a set of tiles.
 *
 * @method Phaser.Plugin.ArcadeSlopes.Overrides#collideSpriteVsTiles
 * @param  {Phaser.Sprite}       sprite          - The sprite to check.
 * @param  {Phaser.Tile[]}       tiles           - The tiles to check.
 * @param  {Phaser.TilemapLayer} tilemapLayer    - The tilemap layer the tiles belong to.
 * @param  {function}            collideCallback - An optional collision callback.
 * @param  {function}            processCallback - An optional overlap processing callback.
 * @param  {object}              callbackContext - The context in which to run the callbacks.
 * @param  {boolean}             overlapOnly     - Whether to only check for an overlap.
 * @return {boolean}                             - Whether a collision occurred.
 */
Phaser.Plugin.ArcadeSlopes.Overrides.collideSpriteVsTiles = function (sprite, tiles, tilemapLayer, collideCallback, processCallback, callbackContext, overlapOnly) {
	var collided = false;
	
	if (!sprite.body) {
		return collided;
	}
	
	for (var i = 0; i < tiles.length; i++) {
		if (processCallback) {
			if (processCallback.call(callbackContext, sprite, tiles[i])) {
				collided = this.collideSpriteVsTile(i, sprite, tiles[i], tilemapLayer, collideCallback, processCallback, callbackContext, overlapOnly) || collided;
			}
		} else {
			collided = this.collideSpriteVsTile(i, sprite, tiles[i], tilemapLayer, collideCallback, processCallback, callbackContext, overlapOnly) || collided;
		}
	}
	
	return collided;
};

/**
 * Collide a sprite against a tile map layer.
 * 
 * This is used to override Phaser.Physics.Arcade.collideSpriteVsTilemapLayer().
 * 
 * @override Phaser.Physics.Arcade#collideSpriteVsTilemapLayer
 * @method Phaser.Plugin.ArcadeSlopes.Overrides#collideSpriteVsTilemapLayer
 * @param  {Phaser.Sprite}       sprite          - The sprite to check.
 * @param  {Phaser.TilemapLayer} tilemapLayer    - The tilemap layer to check.
 * @param  {function}            collideCallback - An optional collision callback.
 * @param  {function}            processCallback - An optional overlap processing callback.
 * @param  {object}              callbackContext - The context in which to run the callbacks.
 * @param  {boolean}             overlapOnly     - Whether to only check for an overlap.
 * @return {boolean}                             - Whether a collision occurred.
 */
Phaser.Plugin.ArcadeSlopes.Overrides.collideSpriteVsTilemapLayer = function (sprite, tilemapLayer, collideCallback, processCallback, callbackContext, overlapOnly) {
	if (!sprite.body) {
		return false;
	}
	
	var tiles = tilemapLayer.getTiles(
		sprite.body.position.x - sprite.body.tilePadding.x - tilemapLayer.getCollisionOffsetX(),
		sprite.body.position.y - sprite.body.tilePadding.y - tilemapLayer.getCollisionOffsetY(),
		sprite.body.width      + sprite.body.tilePadding.x,
		sprite.body.height     + sprite.body.tilePadding.y,
		false,
		false
	);
	
	if (tiles.length === 0) {
		return false;
	}
	
	var collided = this.collideSpriteVsTiles(sprite, tiles, tilemapLayer, collideCallback, processCallback, callbackContext, overlapOnly);
	
	if (!collided && !overlapOnly) {
		// TODO: This call is too hacky and solver-specific
		this.game.slopes.solvers.sat.snap(sprite.body, tiles, tilemapLayer);
	}
	
	return collided;
};

/**
 * Gets the tile to the top left of the coordinates given.
 *
 * @method Phaser.Plugin.ArcadeSlopes.Overrides#getTileTopLeft
 * @param  {integer} layer - The index of the layer to read the tile from.
 * @param  {integer} x     - The X coordinate, in tiles, to get the tile from.
 * @param  {integer} y     - The Y coordinate, in tiles, to get the tile from.
 * @return {Phaser.Tile}   - The tile found.
 */
Phaser.Plugin.ArcadeSlopes.Overrides.getTileTopLeft = function(layer, x, y) {
	if (x > 0 && y > 0) {
		return this.layers[layer].data[y - 1][x - 1];
	}
	
	return null;
};

/**
 * Gets the tile to the top right of the coordinates given.
 *
 * @method Phaser.Plugin.ArcadeSlopes.Overrides#getTileTopRight
 * @param  {integer} layer - The index of the layer to read the tile from.
 * @param  {integer} x     - The X coordinate, in tiles, to get the tile from.
 * @param  {integer} y     - The Y coordinate, in tiles, to get the tile from.
 * @return {Phaser.Tile}   - The tile found.
 */
Phaser.Plugin.ArcadeSlopes.Overrides.getTileTopRight = function(layer, x, y) {
	if (x < this.layers[layer].width - 1 && y > 0) {
		return this.layers[layer].data[y - 1][x + 1];
	}
	
	return null;
};

/**
 * Gets the tile to the bottom left of the coordinates given.
 *
 * @method Phaser.Plugin.ArcadeSlopes.Overrides#getTileBottomLeft
 * @param  {integer} layer - The index of the layer to read the tile from.
 * @param  {integer} x     - The X coordinate, in tiles, to get the tile from.
 * @param  {integer} y     - The Y coordinate, in tiles, to get the tile from.
 * @return {Phaser.Tile}   - The tile found.
 */
Phaser.Plugin.ArcadeSlopes.Overrides.getTileBottomLeft = function(layer, x, y) {
	if (x > 0 && y < this.layers[layer].height - 1) {
		return this.layers[layer].data[y + 1][x - 1];
	}
	
	return null;
};

/**
 * Gets the tile to the bottom right of the coordinates given.
 *
 * @method Phaser.Plugin.ArcadeSlopes.Overrides#getTileBottomRight
 * @param  {integer} layer - The index of the layer to read the tile from.
 * @param  {integer} x     - The X coordinate, in tiles, to get the tile from.
 * @param  {integer} y     - The Y coordinate, in tiles, to get the tile from.
 * @return {Phaser.Tile}   - The tile found.
 */
Phaser.Plugin.ArcadeSlopes.Overrides.getTileBottomRight = function(layer, x, y) {
	if (x < this.layers[layer].width - 1 && y < this.layers[layer].height - 1) {
		return this.layers[layer].data[y + 1][x + 1];
	}
	
	return null;
};

/**
 * Get the X axis collision offset for the tilemap layer.
 *
 * @method Phaser.Plugin.ArcadeSlopes.Overrides#getCollisionOffsetY
 * @return {number}
 */
Phaser.Plugin.ArcadeSlopes.Overrides.getCollisionOffsetX = function () {
	if (this.getTileOffsetX) {
		return this.getTileOffsetX();
	}
	
	return !this.fixedToCamera ? this.position.x : 0;
};

/**
 * Get the Y axis collision offset for the tilemap layer.
 *
 * @method Phaser.Plugin.ArcadeSlopes.Overrides#getCollisionOffsetY
 * @return {number}
 */
Phaser.Plugin.ArcadeSlopes.Overrides.getCollisionOffsetY = function () {
	if (this.getTileOffsetY) {
		return this.getTileOffsetY();
	}
	
	return !this.fixedToCamera ? this.position.y : 0;
};

/**
* Renders a tilemap debug overlay on-top of the canvas.
*
* Called automatically by render when `debug` is true.
*
* See `debugSettings` for assorted configuration options.
*
* This override renders extra information regarding Arcade Slopes collisions.
*
* @method Phaser.Plugin.ArcadeSlopes.Overrides#renderDebug
* @private
*/
Phaser.Plugin.ArcadeSlopes.Overrides.renderDebug = function () {
	var scrollX = this._mc.scrollX;
	var scrollY = this._mc.scrollY;
	
	var context = this.context;
	var renderW = this.canvas.width;
	var renderH = this.canvas.height;
	
	var scaleX = this.tileScale ? this.tileScale.x : 1.0 / this.scale.x;
	var scaleY = this.tileScale ? this.tileScale.y : 1.0 / this.scale.y;
	
	var width = this.layer.width;
	var height = this.layer.height;
	var tw = this._mc.tileWidth * scaleX;
	var th = this._mc.tileHeight * scaleY;
	var cw = this._mc.cw * scaleX;
	var ch = this._mc.ch * scaleY;
	
	var left = Math.floor(scrollX / tw);
	var right = Math.floor((renderW - 1 + scrollX) / tw);
	var top = Math.floor(scrollY / th);
	var bottom = Math.floor((renderH - 1 + scrollY) / th);
	
	if (!this._wrap)
	{
		if (left <= right) {
			left = Math.max(0, left);
			right = Math.min(width - 1, right);
		}
		
		if (top <= bottom) {
			top = Math.max(0, top);
			bottom = Math.min(height - 1, bottom);
		}
	}
	
	var baseX = (left * tw) - scrollX;
	var baseY = (top * th) - scrollY;
	
	var normStartX = (left + ((1 << 20) * width)) % width;
	var normStartY = (top + ((1 << 20) * height)) % height;
	
	var tx, ty, x, y, xmax, ymax, polygon, i, j;
	
	for (y = normStartY, ymax = bottom - top, ty = baseY; ymax >= 0; y++, ymax--, ty += th) {
		if (y >= height) {
			y -= height;
		}
		
		var row = this.layer.data[y];
		
		for (x = normStartX, xmax = right - left, tx = baseX; xmax >= 0; x++, xmax--, tx += tw) {
			if (x >= width) {
				x -= width;
			}
			
			var tile = row[x];
			
			if (!tile || tile.index < 0 || !tile.collides) {
				continue;
			}

			if (this.debugSettings.collidingTileOverfill) {
				context.fillStyle = this.debugSettings.collidingTileOverfill;
				context.fillRect(tx, ty, cw, ch);
			}

			if (this.debugSettings.facingEdgeStroke) {
				context.beginPath();
				
				context.lineWidth = 1;
				context.strokeStyle = this.debugSettings.facingEdgeStroke;
				
				if (tile.faceTop) {
					context.moveTo(tx, ty);
					context.lineTo(tx + cw, ty);
				}
				
				if (tile.faceBottom) {
					context.moveTo(tx, ty + ch);
					context.lineTo(tx + cw, ty + ch);
				}
				
				if (tile.faceLeft) {
					context.moveTo(tx, ty);
					context.lineTo(tx, ty + ch);
				}
				
				if (tile.faceRight) {
					context.moveTo(tx + cw, ty);
					context.lineTo(tx + cw, ty + ch);
				}
				
				context.closePath();
				
				context.stroke();
				
				// Render the tile slope polygons
				if (tile.slope) {
					// Fill polygons and stroke their edges
					if (this.debugSettings.slopeEdgeStroke || this.debugSettings.slopeFill) {
						context.beginPath();
						
						context.lineWidth = 1;
						
						polygon = tile.slope.polygon;
						
						// Move to the first vertex
						context.moveTo(tx + polygon.points[0].x * scaleX, ty + polygon.points[0].y * scaleY);
						
						// Draw a path through all vertices
						for (i = 0; i < polygon.points.length; i++) {
							j = (i + 1) % polygon.points.length;
							
							context.lineTo(tx + polygon.points[j].x * scaleX, ty + polygon.points[j].y * scaleY);
						}
						
						context.closePath();
						
						if (this.debugSettings.slopeEdgeStroke) {
							context.strokeStyle = this.debugSettings.slopeEdgeStroke;
							context.stroke();
						}
						
						if (this.debugSettings.slopeFill) {
							context.fillStyle = this.debugSettings.slopeFill;
							context.fill();
						}
					}
					
					// Stroke the colliding edges
					if (this.debugSettings.slopeCollidingEdgeStroke) {
						context.beginPath();
						
						context.lineWidth = this.debugSettings.slopeCollidingEdgeStrokeWidth || 1;
						context.strokeStyle = this.debugSettings.slopeCollidingEdgeStroke;
						
						polygon = tile.slope.polygon;
						
						for (i = 0; i < polygon.points.length; i++) {
							j = (i + 1) % polygon.points.length;
							
							// Skip internal edges
							if (polygon.points[i].internal)
								continue;
							
							context.moveTo(tx + polygon.points[i].x * scaleX, ty + polygon.points[i].y * scaleY);
							context.lineTo(tx + polygon.points[j].x * scaleX, ty + polygon.points[j].y * scaleY);
						}
						
						context.closePath();
						
						context.stroke();
					}
				}
			}
		}
	}
};
