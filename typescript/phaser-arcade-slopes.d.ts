declare module Phaser {
	interface Game {
		slopes:Phaser.Plugin.ArcadeSlopes;
	}

	module Physics.Arcade {
		interface Body {
			slopes:Phaser.Plugin.ArcadeSlopes.BodySlopes;
		}
	}

	module Plugin {
		class ArcadeSlopes extends Phaser.Plugin {
			constructor(game:Phaser.Game, parent:any, defaultSolver:number);

			solvers:Object;
			facade:Phaser.Plugin.ArcadeSlopes.Facade;

			static VERSION:string;
			static SAT:string;
		}

		module ArcadeSlopes {

			class Facade {
				constructor(factory:Phaser.Plugin.ArcadeSlopes.TileSlopeFactory, solvers:Object, defaultSolver:number);

				factory:Phaser.Plugin.ArcadeSlopes.TileSlopeFactory;
				solvers:Object;
				defaultSover:string;
				plugin:Phaser.Plugin.ArcadeSlopes;

				enable(obj:Phaser.Sprite | Phaser.Group):void;
				enableBody(body:Phaser.Physics.Arcade.Body):void;
				convertTilemap(map:Phaser.Tilemap, layer:number | string | Phaser.TilemapLayer, slopeMap:string | Object, index:number):Phaser.Tilemap;
				convertTilemapLayer(layer:Phaser.TilemapLayer, slopeMap:string | Object, index:number):Phaser.TilemapLayer;
				collide(i:number, body:Phaser.Physics.Arcade.Body, tile:Phaser.Tile, tilemapLayer:Phaser.TilemapLayer, overlapOnly:boolean):boolean;
			}

			class Overrides {
				static collideSpriteVsTile(i:number, sprite:Phaser.Sprite, tile:Phaser.Tile, tilemapLayer:Phaser.TilemapLayer, collideCallback:any, processCallback:any, callbackContext:Object, overlapOnly:boolean):boolean;
				static collideSpriteVsTiles(sprite:Phaser.Sprite, tiles:Phaser.Tile[], tilemapLayer:Phaser.TilemapLayer, collideCallback:any, processCallback:any, callbackContext:Object, overlapOnly:boolean):boolean;
				static collideSpriteVsTilemaplayer(sprite:Phaser.Sprite, tilemapLayer:Phaser.TilemapLayer, collideCallback:any, processCallback:any, callbackContext:Object, overlapOnly:boolean):boolean;
				static getTileTopLeft(layer:number, x:number, y:number):Phaser.Tile;
				static getTileTopRight(layer:number, x:number, y:number):Phaser.Tile;
				static getTileBottomLeft(layer:number, x:number, y:number):Phaser.Tile;
				static getTileBottomRight(layer:number, x:number, y:number):Phaser.Tile;
				static getCollisionOffsetX():number;
				static getCollisionOffsetY():number;
				static renderDebug():void;
			}

			class SatRestainer {
				restraints:Object;

				restrain(solver:Phaser.Plugin.ArcadeSlopes.SatSolver, body:Phaser.Physics.Arcade.Body, tile:Phaser.Tile, response:SAT.Response):boolean;
				resolveOverlaps(direction:string):Object;
				prepareRestraints(restraints:Object):Object;
				setDefaultRestraints():void;
				intersectArrays(a:any[], b:any[]):any[];
				resolve();

				static topVerticies:string[];
				static bottomVerticies:string[];
				static leftVerticies:string[];
				static rightVerticies:string[];
				static topLeftVerticies:string[];
				static topRightVerticies:string[];
				static bottomLeftVerticies:string[];
				static bottomRightVerticies:string[];
			}

			class SatSolver {
				constructor(options:Phaser.Plugin.ArcadeSlopes.SatSolverOptions);

				options:Phaser.Plugin.ArcadeSlopes.SatSolverOptions;
				restrainers:Phaser.Plugin.ArcadeSlopes.SatRestainer;

				static prepareResponse(response:SAT.Response):SAT.Response;
				static minimumOffsetX(vector:SAT.Vector):number;
				static minimumOffsetY(vector:SAT.Vector):number;
				static movingAgainstY(body:Phaser.Physics.Arcade.Body, response:SAT.Response):boolean;
				static shouldPreferY(body:Phaser.Physics.Arcade.Body, response:SAT.Response):boolean;
				static isSeparatingAxis(a:SAT.Polygon, b:SAT.Polygon, axis:SAT.Vector, response:SAT.Response):boolean;
				separate(body:Phaser.Physics.Arcade.Body, tile:Phaser.Tile, response:SAT.Response, force:boolean):boolean;
				applyVelocity(body:Phaser.Physics.Arcade.Body, tile:Phaser.Tile, response:SAT.Response):void;
				updateValues(body:Phaser.Physics.Arcade.Body):void;
				updateFlags(body:Phaser.Physics.Arcade.Body, response:SAT.Response):void;
				snap(body:Phaser.Physics.Arcade.Body, tiles:Phaser.Tile[], tilemapLayer:Phaser.TilemapLayer):boolean;
				pull(body:Phaser.Physics.Arcade.Body, response:SAT.Response):boolean;
				snapCollide(body:Phaser.Physics.Arcade.Body, tile:Phaser.Tile, tilemapLayer:Phaser.TilemapLayer, current:Phaser.Point):boolean;
				shouldCollide(body:Phaser.Physics.Arcade.Body, tile:Phaser.Tile):boolean;
				collide(i:number, body:Phaser.Physics.Arcade.Body, tile:Phaser.Tile, tilemapLayer:Phaser.TilemapLayer, overlapOnly:boolean):boolean;
				collideOnAxis(body:Phaser.Physics.Arcade.Body, tile:Phaser.Tile, axis:SAT.Vector, response:SAT.Response):boolean;
				restrain(body:Phaser.Physics.Arcade.Body, tile:Phaser.Tile, response:SAT.Response):boolean;
				shouldSeparate(i:number, body:Phaser.Physics.Arcade.Body, tile:Phaser.Tile, response:SAT.Response):boolean;
				debug(position:Phaser.Point, response:SAT.Response):void;
			}

			interface SatSolverOptions {
				debug:boolean;
				preferY:boolean;
				restrain:boolean;
			}

			class TileSlope {
				constructor(type:number, tile:Phaser.Tile, polygon:SAT.Polygon, line:Phaser.Line, edges:Object, axis:SAT.Vector);
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
				definitions:object;
				mappings:object;

				define(type:number, definition:any):void;
				create(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				convertTilemap(tilemap:Phaser.Tilemap, layer:number | string | Phaser.TilemapLayer, slopeMap:string | Object, index:number):Phaser.Tilemap;
				convertTilemapLayer(layer:Phaser.TilemapLayer, slopeMap:string | Object, index:number):Phaser.TilemapLayer;
				calculateEdges(layer:Phaser.TilemapLayer):void;
				compareEdges(firstEdge:number, secondEdge:number):number;
				flagInternalVerticies(firstTile:Phaser.Tile, secondTile:Phaser.Tile):void;
				addDebugSettings(layer:Phaser.TilemapLayer):void;
				resolveMappingType(type:string):number;
				
				static createFull(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				static createHalfBottom(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				static createHalfTop(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				static createHalfLeft(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				static createHalfRight(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				static createHalfBottomLeft(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				static createHalfBottomRight(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				static createHalfTopLeft(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				static createHalfTopRight(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				static createQuarterBottomLeftLow(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				static createQuarterBottomLeftHigh(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				static createQuarterBottomRightLow(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				static createQuarterBottomRightHigh(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				static createQuarterLeftBottomLow(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				static createQuarterLeftBottomHigh(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				static createQuarterRightBottomLow(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				static createQuarterRightBottomHigh(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				static createQuarterLeftTopLow(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				static createQuarterLeftTopHigh(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				static createQuarterRightTopLow(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				static createQuarterRightTopHigh(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				static createQuarterTopLeftLow(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				static createQuarterTopLeftHigh(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				static createQuarterTopRightLow(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				static createQuarterTopRightHigh(type:number, tile:Phaser.Tile):Phaser.Plugin.ArcadeSlopes.TileSlope;
				
				static prepareOffset(index:number):number;
				static mapArcadeSlopes(index:number):Object;
				static mapNinjaPhysics(offset:number):Object;
				
				static ARCADESLOPES:number;
				static NINJA:number;
			}

			interface BodySlopes {
				debug:boolean;
				friction:Phaser.Point;
				preferY:boolean;
				pullUp:number;
				pullDown:number;
				pullLeft:number;
				pullRight:number;
				pullTopLeft:number;
				pullTopRight:number;
				pullBottomLeft:number;
				pullBottomRight:number;
				sat:Phaser.Plugin.ArcadeSlopes.BodySlopesSat;
				skipFriction:boolean;
				snapUp:number;
				snapDown:number;
				snapLeft:number;
				snapRight:number;
				tile:Phaser.Tile;
				velocity:SAT.Vector;
			}

			interface BodySlopesSat {
				response:SAT.Response;
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
