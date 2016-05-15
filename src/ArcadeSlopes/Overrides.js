/**
 * @author Chris Andrew <chris@hexus.io>
 * @copyright 2016 Chris Andrew
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
 * @param  {integer}             i                - The tile index.
 * @param  {Phaser.Sprite}       sprite           - The sprite to check.
 * @param  {Phaser.Tile}         tile             - The tile to check.
 * @param  {function}            collideCallback  - An optional collision callback.
 * @param  {function}            processCallback  - An optional overlap processing callback.
 * @param  {object}              callbackContext  - The context in which to run the callbacks.
 * @param  {boolean}             overlapOnly      - Whether to only check for an overlap.
 * @return {boolean}                              - Whether the sprite was separated.
 */
Phaser.Plugin.ArcadeSlopes.Overrides.collideSpriteVsTile = function (i, sprite, tile, collideCallback, processCallback, callbackContext, overlapOnly) {
	if (!sprite.body) {
		return false;
	}
	
	if (tile.hasOwnProperty('slope')) {
		if (this.game.slopes.collide(i, sprite.body, tile, overlapOnly)) {
			this._total++;
			
			if (collideCallback) {
				collideCallback.call(callbackContext, sprite, tile);
			}
			
			return true;
		}
	} else if (this.separateTile(i, sprite.body, tile, overlapOnly)) {
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
 * @param {Phaser.Sprite}       sprite           - The sprite to check.
 * @param {Phaser.Tile[]}       tiles            - The tiles to check.
 * @param {function}            collideCallback  - An optional collision callback.
 * @param {function}            processCallback  - An optional overlap processing callback.
 * @param {object}              callbackContext  - The context in which to run the callbacks.
 * @param {boolean}             overlapOnly      - Whether to only check for an overlap.
 */
Phaser.Plugin.ArcadeSlopes.Overrides.collideSpriteVsTiles = function (sprite, tiles, collideCallback, processCallback, callbackContext, overlapOnly) {
	var collided = false;
	
	for (var i = 0; i < tiles.length; i++) {
		if (processCallback) {
			if (processCallback.call(callbackContext, sprite, tiles[i])) {
				collided = collided || this.collideSpriteVsTile(i, sprite, tiles[i], collideCallback, processCallback, callbackContext, overlapOnly);
			}
		} else {
			collided = collided || this.collideSpriteVsTile(i, sprite, tiles[i], collideCallback, processCallback, callbackContext, overlapOnly);
		}
	}
	
	if (!collided && !overlapOnly) {
		this.game.slopes.solvers.sat.snap(sprite.body, tiles);
	}
};

/**
 * Collide a sprite against a tile map layer.
 * 
 * This is used to override Phaser.Physics.Arcade.collideSpriteVsTilemapLayer().
 *
 * TODO: Extract collideSpriteVsTile method. Attach it to Physics.Arcade too.
 * 
 * @override Phaser.Physics.Arcade#collideSpriteVsTilemapLayer
 * @method Phaser.Plugin.ArcadeSlopes.Overrides#collideSpriteVsTilemapLayer
 * @param {Phaser.Sprite}       sprite           - The sprite to check.
 * @param {Phaser.TilemapLayer} tilemapLayer     - The tilemap layer to check.
 * @param {function}            collideCallback  - An optional collision callback.
 * @param {function}            processCallback  - An optional overlap processing callback.
 * @param {object}              callbackContext  - The context in which to run the callbacks.
 * @param {boolean}             overlapOnly      - Whether to only check for an overlap.
 */
Phaser.Plugin.ArcadeSlopes.Overrides.collideSpriteVsTilemapLayer = function (sprite, tilemapLayer, collideCallback, processCallback, callbackContext, overlapOnly) {
	if (!sprite.body) {
		return;
	}
	
	var mapData = tilemapLayer.getTiles(
		sprite.body.position.x - sprite.body.tilePadding.x,
		sprite.body.position.y - sprite.body.tilePadding.y,
		sprite.body.width      + sprite.body.tilePadding.x,
		sprite.body.height     + sprite.body.tilePadding.y,
		false,
		false
	);
	
	if (mapData.length === 0) {
		return;
	}
	
	this.collideSpriteVsTiles(sprite, mapData, collideCallback, processCallback, callbackContext, overlapOnly);
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
