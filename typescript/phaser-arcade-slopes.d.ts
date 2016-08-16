declare module Phaser {
	interface Game {
		slopes:Phaser.Plugin.ArcadeSlopes;
	}

	module Physics.Arcade {
		interface Body {
			slopes:Phaser.Plugin.ArcadeSlopes;
		}
	}

	module Plugin {
		class ArcadeSlopes extends Phaser.Plugin {
			static SAT:string;
			static METROID:string;
			enable(obj:Phaser.Sprite | Phaser.Group):void;
			enableBody(body:Phaser.Physics.Arcade.Body):void;
			convertTilemap(map:Phaser.Tilemap, layer:number | string | Phaser.TilemapLayer, slopeMap:Object):Phaser.Tilemap;
			convertTilemapLayer(layer:Phaser.TilemapLayer, slopeMap:Object):Phaser.TilemapLayer;
			collide(i:number, body:Phaser.Physics.Arcade.Body, tile:Phaser.Tile, overlapOnly:boolean):boolean;
		}

		module ArcadeSlopes {


			class Facade {
				factory:Phaser.Plugin.ArcadeSlopes.TileSlopeFactory;
				solvers:Object;
				defaultSover:number;
				enable(obj:Phaser.Sprite | Phaser.Group):void;
				enableBody(body:Phaser.Physics.Arcade.Body):void;
				convertTilemap(map:Phaser.Tilemap, layer:number | string | Phaser.TilemapLayer, slopeMap:Object):Phaser.Tilemap;
				convertTilemapLayer(layer:Phaser.TilemapLayer, slopeMap:Object):Phaser.TilemapLayer;
				collide(i:number, body:Phaser.Physics.Arcade.Body, tile:Phaser.Tile, overlapOnly:boolean):boolean;
			}

			class Overrides {
				collideSpriteVsTile(i:number, sprite:Phaser.Sprite, tile:Phaser.Tile, tilemapLayer:Phaser.TilemapLayer, collideCallback:any, processCallback:any, callbackContext:Object, overlapOnly:boolean):boolean;
				collideSpriteVsTiles(i:number, sprite:Phaser.Sprite, tiles:Phaser.Tile[], tilemapLayer:Phaser.TilemapLayer, collideCallback:any, processCallback:any, callbackContext:Object, overlapOnly:boolean):boolean;
				collideSpriteVsTilemaplayer(sprite:Phaser.Sprite, tilemapLayer:Phaser.TilemapLayer, collideCallback:any, processCallback:any, callbackContext:Object, overlapOnly:boolean):boolean;
				getTileTopLeft(layer:number, x:number, y:number):Phaser.Tile;
				getTileTopRight(layer:number, x:number, y:number):Phaser.Tile;
				getTileBottomLeft(layer:number, x:number, y:number):Phaser.Tile;
				getTileBottomRight(layer:number, x:number, y:number):Phaser.Tile;
			}

			class SatRestainer {
				restraints:Object;
				topVerticies:string[];
				bottomVerticies:string[];
				leftVerticies:string[];
				rightVerticies:string[];
				topLeftVerticies:string[];
				topRightVerticies:string[];
				bottomLeftVerticies:string[];
				bottomRightVerticies:string[];
				restrain(solver:Phaser.Plugin.ArcadeSlopes.SatSolver, body:Phaser.Physics.Arcade.Body, tile:Phaser.Tile, response:SAT.Response):boolean;
				resolveOverlaps(direction:string):Object;
				prepareRestraints(restraints:Object):Object;
				setDefaultRestraints():void;
				intersectArrays(a:any[], b:any[]):any[];
				resolve();
			}

			class SatSolver {
				options:Phaser.Plugin.ArcadeSlopes.SatSolverOptions;
				restrainers:Phaser.Plugin.ArcadeSlopes.SatRestainer;
				prepareResponse(response:SAT.Response):SAT.Response;
				putOnSlopeX(body:Phaser.Physics.Arcade.Body, tile:Phaser.Tile):void;
				putOnSlopeY(body:Phaser.Physics.Arcade.Body, tile:Phaser.Tile):void;
				minimumOffsetX(vector:SAT.Vector):number;
				minimumOffsetY(vector:SAT.Vector):number;
				movingAgainstY(body:Phaser.Physics.Arcade.Body, response:SAT.Response):boolean;
				shouldPreferY(body:Phaser.Physics.Arcade.Body, response:SAT.Response):boolean;
				isSeparatingAxis(a:SAT.Polygon, b:SAT.Polygon, axis:SAT.Vector, response:SAT.Response):boolean;
				separate(body:Phaser.Physics.Arcade.Body, tile:Phaser.Tile, response:SAT.Response, force:boolean):boolean;
				applyVelocity(body:Phaser.Physics.Arcade.Body, tile:Phaser.Tile, response:SAT.Response):void;
				updateFlags(body:Phaser.Physics.Arcade.Body, response:SAT.Response):void;
				snap(body:Phaser.Physics.Arcade.Body, tiles:Phaser.Tile[]):boolean;
				pull(body:Phaser.Physics.Arcade.Body, response:SAT.Response):boolean;
				snapCollide(body:Phaser.Physics.Arcade.Body, tile:Phaser.Tile, current:Phaser.Point):boolean;
				shouldCollide(body:Phaser.Physics.Arcade.Body, tile:Phaser.Tile):boolean;
				collide(i:number, body:Phaser.Physics.Arcade.Body, tile:Phaser.Tile, overlapOnly:boolean):boolean;
				collideOnAxis(body:Phaser.Physics.Arcade.Body, tile:Phaser.Tile, axis:SAT.Vector, response:SAT.Response):boolean;
				shouldSeparate(i:number, body:Phaser.Physics.Arcade.Body, tile:Phaser.Tile, response:SAT.Response):boolean;
				debug(position:Phaser.Point, response:SAT.Response):void;
			}

			class SatSolverOptions {
				preferY:boolean;
				stick:Phaser.Point;
				restrain:boolean;
			}

			class TileSlope {
				type:number;
				tile:Phaser.Tile;
				polygon:SAT.Polygon;
				line:Phaser.Tile;
				edges:Object;
				axis:SAT.Vector;
				solver:string;
				friction:Phaser.Point;
				slope:number;
				typeName:string;
				typeNames:Object;
				resolveType(type:string | number):number;
				resolveTypeName(type:number):number;

				static EMPTY:number;
				static SOLID:number;
				static INTERESTING:number;
				static UNKNOWN:number;
				static FULL:number;
				static HALF_BOTTOM:number;
				static HALF_TOP:number;
				static HALF_LEFT:number;
				static HALF_RIGHT:number;
				static HALF_BOTTOM_LEFT:number;
				static HALF_BOTTOM_RIGHT:number;
				static HALF_TOP_LEFT:number;
				static HALF_TOP_RIGHT:number;
				static QUARTER_BOTTOM_LEFT_LOW:number;
				static QUARTER_BOTTOM_LEFT_HIGH:number;
				static QUARTER_BOTTOM_RIGHT_LOW:number;
				static QUARTER_BOTTOM_RIGHT_HIGH:number;
				static QUARTER_LEFT_BOTTOM_LOW:number;
				static QUARTER_LEFT_BOTTOM_HIGH:number;
				static QUARTER_RIGHT_BOTTOM_LOW:number;
				static QUARTER_RIGHT_BOTTOM_HIGH:number;
				static QUARTER_LEFT_TOP_LOW:number;
				static QUARTER_LEFT_TOP_HIGH:number;
				static QUARTER_RIGHT_TOP_LOW:number;
				static QUARTER_RIGHT_TOP_HIGH:number;
				static QUARTER_TOP_LEFT_LOW:number;
				static QUARTER_TOP_LEFT_HIGH:number;
				static QUARTER_TOP_RIGHT_LOW:number;
				static QUARTER_TOP_RIGHT_HIGH:number;
			}

			class TileSlopeFactory {
				define(type:number, definition:any):void;
				create(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				convertTilemap(tilemap:Phaser.Tilemap, layer:number | string | Phaser.TilemapLayer, slopeMap:Object):Phaser.Tilemap;
				convertTilemapLayer(layer:Phaser.TilemapLayer, slopeMap:Object):Phaser.TilemapLayer;
				calculateEdges(layer:Phaser.TilemapLayer):void;
				compareEdges(firstEdge:number, secondEdge:number):number;
				createFull(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				createHalfBottom(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				createHalfTop(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				createHalfLeft(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				createHalfRight(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				createHalfBottomLeft(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				createHalfBottomRight(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				createHalfTopLeft(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				createHalfTopRight(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				createQuarterBottomLeftLow(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				createQuarterBottomLeftHigh(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				createQuarterBottomRightLow(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				createQuarterBottomRightHigh(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				createQuarterLeftBottomLow(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				createQuarterLeftBottomHigh(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				createQuarterRightBottomLow(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				createQuarterRightBottomHigh(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				createQuarterLeftTopLow(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				createQuarterLeftTopHigh(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				createQuarterRightTopLow(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				createQuarterRightTopHigh(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				createQuarterTopLeftLow(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				createQuarterTopLeftHigh(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				createQuarterTopRightLow(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				createQuarterTopRightHigh(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
			}
		}
	}
}

declare module SAT {
	interface Response {
		a:SAT.Polygon;
		b:SAT.Polygon;
		aInB:boolean;
		bInA:boolean;
		overlap:number;
		overlapV:SAT.Vector;
		overlapN:SAT.Vector;
		clear();

	}

	interface Vector {
		x:number;
		y:number;

		copy(other:SAT.Vector):SAT.Vector;
		clone():SAT.Vector;
		perp():SAT.Vector;
		rotate(angle:number):SAT.Vector;
		reverse():SAT.Vector;
		normalize():SAT.Vector;
		add(othre:SAT.Vector):SAT.Vector;
		sub(other:SAT.Vector):SAT.Vector;
		scale(x:number, y:number):SAT.Vector;
		project(other:SAT.Vector):SAT.Vector;
		projectN(other:SAT.Vector):SAT.Vector;
		reflect(axis:SAT.Vector):SAT.Vector;
		reflectN(axis:SAT.Vector):SAT.Vector;
		dot(other:SAT.Vector):SAT.Vector;
		len2():SAT.Vector;
		len():SAT.Vector;
	}

	interface Circle {
		pos:SAT.Vector;
		r:number;
		getAABB():SAT.Box;
	}

	interface Polygon {
		setPoints(points:SAT.Vector[]):SAT.Polygon;
		setAngle(angle:number):SAT.Polygon;
		setOffset(offset:SAT.Vector):SAT.Polygon;
		rotate(angle:number):SAT.Vector;
		translate(x:number, y:number):SAT.Polygon;
		_recalc():SAT.Polygon;
		getAABB():SAT.Box;
	}

	interface Box {
		pos:SAT.Vector;
		w:number;
		h:number;
		toPolygon:SAT.Polygon;
	}

}

declare class SAT {
	static T_VECTORS:SAT.Vector[];
	static T_ARRAYS:number[];
	static T_RESPONSE:SAT.Response[];
	static T_POLYGONS:SAT.Polygon[];

	static UNIT_SQUARE:SAT.Polygon;

	static LEFT_VORONOI_REGION:number;
	static MIDDLE_VORONOI_REGION:number;
	static RIGHT_VORONOI_REGION:number;

	static flattenPointsOn(points:SAT.Vector[], normal:SAT.Vector, result:number[]):void;
	static isSeparatingAxis(aPos:SAT.Vector, bPos:SAT.Vector, aPoints:SAT.Vector[], bPoints:SAT.Vector[], axis:SAT.Vector, response:SAT.Response):boolean;
	static voronoiRegion(line:SAT.Vector, point:SAT.Vector):number;
	static pointInCircle(p:SAT.Vector, c:SAT.Circle):boolean;
	static pointInPolygon(p:SAT.Vector, poly:SAT.Polygon):boolean;
	static testCircleCircle(a:SAT.Circle, b:SAT.Circle, response:SAT.Response):boolean;
	static testPolygonCircle(polygon:SAT.Polygon, circle:SAT.Circle, response:SAT.Response):boolean;
	static testCirclePolygon(circle:SAT.Circle, polygon:SAT.Polygon, response:SAT.Response):boolean;
	static testPolygonPolygon(a:SAT.Polygon, b:SAT.Polygon, response:SAT.Response):boolean;
}
