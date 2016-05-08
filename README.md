# Phaser Arcade Slopes Plugin :triangular_ruler:

**Arcade Slopes** brings sloped tile collision handling to Phaser's Arcade
Physics engine.

## Features

- 24 new tile types :tada:
- SAT-driven collision handling :ok_hand:
- Unobtrusive and cooperative integration with Arcade Physics :v:
- Heuristic SAT restraints that prevent AABBs catching on hidden edges :clap:
- Works with sprites :rocket:, groups :busts_in_silhouette: and particle emitters :sparkles:

## Usage

Grab a copy of the latest release from the **dist** directory in this repository
and include it after Phaser.

```html
<script src="phaser.min.js"></script>
<script src="phaser-arcade-slopes.min.js"></script>
```

Enable the plugin in the `create()` method of your Phaser state.

```js
game.plugins.add(Phaser.Plugin.ArcadeSlopes);
```

After you've created your tilemap, and have a collision layer that you want
to enable slopes for, you'll need run it through the Arcade Slopes converter.

This works similarly to Ninja Physics, but you provide an explicit mapping of
tile indexes to Arcade Slopes tile names instead of an array of integers.

Here's an example that maps the
[Ninja Physics debug tilesheets](https://github.com/photonstorm/phaser/tree/v2.4.7/resources/Ninja%20Physics%20Debug%20Tiles) ([32px](https://raw.githubusercontent.com/photonstorm/phaser/v2.4.7/resources/Ninja%20Physics%20Debug%20Tiles/32px/ninja-tiles32.png), [64px](https://raw.githubusercontent.com/photonstorm/phaser/v2.4.7/resources/Ninja%20Physics%20Debug%20Tiles/64px/ninja-tiles64.png)).

```js
map = game.add.tilemap('tilemap');
map.addTilesetImage('collision', 'ninja-tiles32');

ground = map.createLayer('collision');

game.slopes.convertTilemapLayer(ground, {
	2:  'FULL',
	3:  'HALF_BOTTOM_LEFT',
	4:  'HALF_BOTTOM_RIGHT',
	6:  'HALF_TOP_LEFT',
	5:  'HALF_TOP_RIGHT',
	15: 'QUARTER_BOTTOM_LEFT_LOW',
	16: 'QUARTER_BOTTOM_RIGHT_LOW',
	17: 'QUARTER_TOP_RIGHT_LOW',
	18: 'QUARTER_TOP_LEFT_LOW',
	19: 'QUARTER_BOTTOM_LEFT_HIGH',
	20: 'QUARTER_BOTTOM_RIGHT_HIGH',
	21: 'QUARTER_TOP_RIGHT_HIGH',
	22: 'QUARTER_TOP_LEFT_HIGH',
	23: 'QUARTER_LEFT_BOTTOM_HIGH',
	24: 'QUARTER_RIGHT_BOTTOM_HIGH',
	25: 'QUARTER_RIGHT_TOP_LOW',
	26: 'QUARTER_LEFT_TOP_LOW',
	27: 'QUARTER_LEFT_BOTTOM_LOW',
	28: 'QUARTER_RIGHT_BOTTOM_LOW',
	29: 'QUARTER_RIGHT_TOP_HIGH',
	30: 'QUARTER_LEFT_TOP_HIGH',
	31: 'HALF_BOTTOM',
	32: 'HALF_RIGHT',
	33: 'HALF_TOP',
	34: 'HALF_LEFT'
});
```

Now you need to enable slopes for any game entities you want to collide against
the tilemap.

```js
game.slopes.enable(player);
game.slopes.enable(emitter); // Call this after makeParticles()!
```

Now you can collide your player against the tilemap in the
`update()` method of your Phaser state, as you normally would, using Arcade
Physics. Voila!

```js
game.physics.arcade.collide(player, ground);
game.physics.arcade.collide(emitter, ground);
```

If you're making a platformer, your player has drag on the X axis, and you don't
want it to slide down slopes, try this on for size in your `create()` method:

```js
this.game.slopes.solvers.sat.options.preferY = true;
```

## Why not just use Ninja Physics?

The Ninja Physics engine provides the same tiles (in fact, a few more) but is
now deprecated and lacking in features that I was in need of, like robust
collision flags and a way to stop AABBs catching on tiles. So I built this.

## Roadmap

- [ ] An Arcade Slopes tilesheet
  - [ ] Image files
  - [ ] Automatic mapping from Tiled
- [ ] Keeping bodies on slopes
- [ ] Friction
- [ ] Debugging
  - [ ] Collision vectors
  - [ ] Tile face properties
  - [ ] Tile polygons
- [ ] Metroid collision solver :robot:
- [ ] More consistent naming
  - [ ] Tile slope type constants
  - [ ] Direction/neighbour names
- [ ] Swept intersection tests :comet:
- [ ] Automatically generated tile maps
- [ ] Memory consumption improvements

## Building

This plugin is built fairly simply and isn't properly modular, as I wanted it to
keep in line with Phaser's coding standards for the most part.

If you want to build the plugin yourself from source, install Bower, clone the
repository and run NPM, Bower and Gulp like so.

```
npm i -g bower
npm install
bower install
gulp build
```

## Thanks

My thanks go out to those made this Plugin possible.

- [Richard Davey](https://twitter.com/photonstorm) - for Phaser :rocket:; what an
  incredible framework
- [jriecken](https://github.com/jriecken) - [SAT.js](https://github.com/jriecken/sat-js) is awesome and saved me loads of time
- [Metanet](http://www.metanetsoftware.com/) - for their incredibly helpful
  tutorials involving SAT, as well as bounce and friction calculation
- [Oliver Renault](http://elancev.name/oliver/2D%20polygon.htm#tut4) - also for
  their tutorial on 2D polygon collision and response (from 2004!)
- Bethany - for listening to me blabber on about slopes for about a month
  :full_moon_with_face:
