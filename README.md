# Phaser Arcade Slopes Plugin :triangular_ruler:

**Arcade Slopes** brings sloped tile collision handling to
[Phaser](http://phaser.io)'s [Arcade
Physics](http://phaser.io/examples/v2/category/arcade-physics) engine.

## [Demo](http://hexus.github.io/phaser-arcade-slopes)

Check out the **[demo](http://hexus.github.io/phaser-arcade-slopes)**!

## Features

- 24 new tile types :tada:
- SAT-driven collision handling :ok_hand:
- Unobtrusive and cooperative integration with Arcade Physics :v:
- Heuristic SAT restraints that prevent AABBs catching on hidden edges :clap:
- Works with sprites :rocket:, groups :busts_in_silhouette: and particle
  emitters :sparkles:

## Compatibility

This is a simple compatibility chart for different versions of the plugin. It
also conveniently provides links to each version.

| Phaser Version  | Arcade Slopes Version                                               |
|-----------------|---------------------------------------------------------------------|
| v2.4.1 - v2.4.8 | [v0.1.0](https://github.com/hexus/phaser-arcade-slopes/tree/v0.1.0) |
| v2.5.0          | [v0.1.1](https://github.com/hexus/phaser-arcade-slopes/tree/v0.1.1) |

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
the tilemap. *For sprites, make sure you call `game.slopes.enable(sprite)` after
any changes to the __size__ of the physics body.*

```js
game.physics.arcade.enable(player);

game.slopes.enable(player);  // Call this after any changes to the body's size
game.slopes.enable(emitter); // Call this after emitter.makeParticles()
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
// Prefer the minimum Y offset globally
game.slopes.solvers.sat.options.preferY = true;

// Or prefer the minimum Y offset only for a specific physics body
player.body.slopes.preferY = true;
```

## Why not just use Ninja Physics?

The Ninja Physics engine provides the same tiles (in fact, a few more) but is
now deprecated and lacking in features that I was in need of, like robust
collision flags and a way to stop AABBs catching on tiles.

The implementation also wasn't as concise or as well-divided as I'd have
liked. I wanted something that I could understand well, and what better way to
learn than to build something yourself?

## Roadmap

- [x] v0.1.0
  - [x] Full support for collision callbacks
    - [x] `physics.arcade.collide` callbacks
    - [x] Tile callbacks
  - [x] Sticky slopes
  - [x] Friction
  - [x] `body.slope` properties for friction, sticky slopes, preferred
    separation axis and last overlap response
- [x] v0.1.1
  - [x] Phaser 2.4.9/2.5.0 compatibility
  - [x] Corner collision pulling
- [ ] v0.2.0
  - [ ] Arcade Slopes tilesheet
    - [ ] Premade tilesheets
    - [ ] Tilesheet generator
  - [ ] Mapping shortcuts
    - [ ] Ninja Physics debug tilesheet
    - [ ] Arcade Slopes tilesheet
    - [ ] Tile properties (`tile.properties.type`)
  - [ ] Graphical debug output
    - [ ] Collision vectors
    - [ ] Tile face properties
    - [ ] Tile polygons
  - [ ] [Metroid collision solver](https://github.com/geselle-jan/Metroid/commit/9c213e9f5779df1dcd6f7d2bed2a9b676a9e3c6b#diff-467b4e6069f6692511fc5e60f3c426cc)
  - [ ] Clearer yet more in-depth readme
- [ ] v0.3.0
  - [ ] Custom SAT.js implementation that can prevent internal edge collisions
    ([like this](http://www.wildbunny.co.uk/blog/2012/10/31/2d-polygonal-collision-detection-and-internal-edges/comment-page-1/#comment-1978))
  - [ ] More consistent naming
    - [ ] Tile slope type constants
    - [ ] Direction/neighbour names
  - [ ] Swept intersection tests
  - [ ] Memory consumption improvements

## Building

This plugin is built fairly simply and isn't properly modular. I wanted it to
keep in line with Phaser's coding standards so that anyone familiar with its
source could understand this plugin with relative ease.

If you want to build the plugin yourself from source, install Bower, clone the
repository and run NPM, Bower and Gulp like so. I plan on making this simpler in
future.

```bash
npm i -g bower
npm install
bower install
gulp build
```

There's also a watch task that runs the build task whenever you make changes
to the source.

```bash
gulp watch
```

## Thanks

My thanks go out to those who made this Plugin possible.

- [Richard Davey](https://twitter.com/photonstorm) - for Phaser :rocket:; what
  an incredible framework
- [Jim Riecken](https://github.com/jriecken) - [SAT.js](https://github.com/jriecken/sat-js)
  is awesome and saved me loads of time
- [Metanet](http://www.metanetsoftware.com/) - for their incredibly helpful
  tutorials about [collision](http://www.metanetsoftware.com/technique/tutorialA.html)
  [detection](http://www.metanetsoftware.com/technique/tutorialB.html)
- [Oliver Renault](http://elancev.name/oliver/2D%20polygon.htm#tut4) - for their
  tutorial on 2D polygon collision and response (from 2004!)
- [Jan Geselle](https://github.com/geselle-jan) - for writing [a sloped tile
  implementation](https://github.com/geselle-jan/Metroid/commit/9c213e9f5779df1dcd6f7d2bed2a9b676a9e3c6b#diff-467b4e6069f6692511fc5e60f3c426ccR158)
  in Phaser that gave me the idea to write this plugin
- Bethany - for listening to me blabber on about slopes for well over a month
  :full_moon_with_face:
