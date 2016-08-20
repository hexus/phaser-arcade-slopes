# Phaser Arcade Slopes Plugin

**Arcade Slopes** brings sloped tile collision handling to
[Phaser](http://phaser.io)'s [Arcade
Physics](http://phaser.io/examples/v2/category/arcade-physics) engine.

## [Demo](http://hexus.github.io/phaser-arcade-slopes)

Check out the **[demo](http://hexus.github.io/phaser-arcade-slopes)**!

![Phaser Arcade Slopes](screenshot.gif)

## Features

- 24 new tile types :tada:
- SAT-driven collision handling :ok_hand:
- Unobtrusive and cooperative integration with Arcade Physics :v:
- Heuristic SAT restraints that prevent AABBs catching on hidden edges :clap:
- Supports sprites :rocket:, groups :busts_in_silhouette:, particle
  emitters :sparkles: and circular physics bodies :white_circle:

## Compatibility

| Phaser Version  | Arcade Slopes Version                                                        |
|-----------------|------------------------------------------------------------------------------|
| v2.4.1 - v2.4.8 | [v0.1.0](https://github.com/hexus/phaser-arcade-slopes/tree/v0.1.0)          |
| v2.5.0 - v2.6.1 | [v0.1.1](https://github.com/hexus/phaser-arcade-slopes/tree/v0.1.1) - v0.2.0 |

## Installation

Grab a copy of the latest release from the **dist** directory in this repository
and include it after Phaser.

```html
<script src="phaser.min.js"></script>
<script src="phaser-arcade-slopes.min.js"></script>
```

## Usage

Enable the plugin in the `create()` method of your Phaser state.

```js
game.plugins.add(Phaser.Plugin.ArcadeSlopes);
```

### Mapping tiles

After you've created your tilemap, and have a collision layer that you want
to enable slopes for, you'll need run it through the Arcade Slopes converter.

The plugin provides a built in mapping for the
[Ninja Physics debug tilesheets](https://github.com/photonstorm/phaser/tree/v2.4.7/resources/Ninja%20Physics%20Debug%20Tiles) ([32px](https://raw.githubusercontent.com/photonstorm/phaser/v2.4.7/resources/Ninja%20Physics%20Debug%20Tiles/32px/ninja-tiles32.png), [64px](https://raw.githubusercontent.com/photonstorm/phaser/v2.4.7/resources/Ninja%20Physics%20Debug%20Tiles/64px/ninja-tiles64.png)).

```js
map = game.add.tilemap('tilemap');
map.addTilesetImage('collision', 'ninja-tiles32');

ground = map.createLayer('collision');

game.slopes.convertTilemapLayer(ground, 'ninja');
```

If you need to offset the mapping, in the case that your first tile ID does not
begin with 1, you can provide a third argument.

```js
game.slopes.convertTilemapLayer(ground, 'ninja', 16);
```

### Enabling physics bodies

Now you need to enable slopes for any game entities you want to collide against
the tilemap. _For sprites, make sure you call `game.slopes.enable(object)` after
any changes to the **size** or **shape** of the physics body._

```js
game.physics.arcade.enable(player);

game.slopes.enable(player);  // Call this after any changes to the body's size
game.slopes.enable(emitter); // Call this after emitter.makeParticles()
```

You don't need to do anything special for circular physics bodies, just the
usual `sprite.body.setCircle(radius)`.

### Collision

Now you can collide your sprite against the tilemap in the `update()` method of
your Phaser state, as you normally would, using Arcade Physics. Voila!

```js
game.physics.arcade.collide(player, ground);
game.physics.arcade.collide(emitter, ground);
```

### Minimum Y Offset

If you're making a platformer, your player has drag on the X axis, and you don't
want it to slide down slopes, try this on for size in your `create()` method:

```js
// Prefer the minimum Y offset globally
game.slopes.solvers.sat.options.preferY = true;

// Or prefer the minimum Y offset only for a specific physics body
player.body.slopes.preferY = true;
```

## Building

If you want to build the plugin yourself from source, install Bower, clone the
repository and run NPM, Bower and Gulp like so.

```bash
npm i -g bower
npm install
bower install
gulp build
```

There's also a watch task that builds the plugin whenever you make changes
to the source.

```bash
gulp watch
```

## Thanks

My thanks go out to those who made this Plugin possible.

- [Richard Davey](https://twitter.com/photonstorm) - for Phaser :rocket:
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
