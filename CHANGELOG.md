# Arcade Slopes Change Log

## Unreleased
- Removed the snap feature (#34)
- Removed heuristics in favour of a custom SAT implementation that prevents
  internal edge collisions (#36, #38, #40)
- Implemented debug rendering for tile normals and ignored tile normals
- Implemented simple object pooling for less memory-hungry calculations (#42)
- Improved the consistency of SAT responses and overlap values set on physics
  bodies

## v0.2.1 - 1st August 2017
- Dropped bower in favour of npm to load in the SAT.js dependency.
- Added a banner to the minified distributive as part of the build process.
- No functional changes.

## v0.2.0 - 18th June 2017
- Added heuristics for square tiles to improve skipped collisions (#38) at the
  expense of some inconsistencies when bodies exit tiles from inside.
- Allowed physics bodies to disable and enable heuristics for themselves using
  `body.slopes.heuristics`. `null` uses default, `false` disables and `true`
  enables.

## v0.2.0-beta2 - 7th June 2017
- Implemented unintrusive support for an experimental Phaser CE fork.
- Added sprite scale support for AABB physics bodies.
- Included a reference to the plugin with the facade. This makes it easier to
  remove the plugin at runtime
  (`this.game.plugins.remove(this.game.slopes.plugin)`).
- Fixed multiple calls to `slopes.body.enable(sprite)` causing an error.
- Ensured that tilemap debug rendering only wraps if the layer has its `wrap`
  property set to `true`.
- Fixed wasTouching flags (#35).
- Added the last collided tile to `body.slopes.tile`.
- Fixed a heuristics mistake that's been around since May 2016 (4ee0d23c)! There
  are probably more...
- Fixed a wrapping issue with tilemap layer debug rendering.
- Added dynamic `heuristics` and `preferY` properties to the Facade, making it
  simpler to toggle these features globally (`game.slopes.heuristics`,
  `game.slopes.preferY`).
- Fixed SatSolver.collide() setting collision response properties on physics
  bodies before knowing whether the separation was successful.
- Fixed SatSolver.collideOnAxis() not setting collision response properties on
  physics bodies.
- Improved memory consumption by reusing SAT response objects for each body.

## v0.2.0-beta - 10th February 2017
- Supported tile collision flags when determining separation (#27, #28,
  thanks @kevinchau321).
- Fixed collision snapping running when it shouldn't (#21, thanks
  @michaeljcalkins).
- Implemented tile slope polygon debug rendering (#4).
- Added premade Arcade Slopes tilesets (#29).
- Implemented Arcade Slopes tileset mapping shortcut (#9).
- Implemented support for tile property type mapping (#9).

## v0.2.0-alpha2 - 8th February 2017
- Prevented separation if a body isn't moving into a tile (#14).
- Refactored the plugin class to attach the Facade to the Phaser game instead of
  itself.
- Extracted a separate roadmap file from the readme.
- Implemented automatic slope mapping for the Ninja Physics tileset.
- Added missing touching flags for physics bodies (#19, thanks @IkonOne).
- Implemented internal edge flagging (#18).
- Updated SAT.js dependency.
- Implemented support for offset tilemaps (#26).

## v0.2.0-alpha - 19th August 2016
- Initial circular physics body support.
- Typescript definitions (#12, #15, thanks @IkonOne).

## v0.1.1 - 26th June 2016
- Implemented corner collision pulling (#3).
- Fixed incompatibility with Phaser 2.4.9 and 2.5.0 (#5).
- Updated the readme regarding changes to physics body sizes before enabling
  slopes (#6).

## v0.1.0 - 22nd May 2016
- Collision pulling; an alternative approach to sticky slopes.

## v0.1.0-beta - 15th May 2016
- Friction for physics bodies and tiles
- Collision callback support, including `physics.arcade.collide()` calls,
  tile-specific callbacks and layer-level tile callbacks
- Initial sticky slopes functionality
- Arcade body properties that configure interaction with tiles
- Tile slope type name retrieval

## v0.1.0-alpha3 - 11th May 2016
- Further improved heuristics

## v0.1.0-alpha2 - 10th May 2016
- Fixed heuristics not working after disabling and re-enabling the plugin at
  runtime
- Fixed some heuristics rules

Lesson learned: Heuristics are unreliable!

## v0.1.0-alpha - 8th May 2016
- Initial functionality (in development since 19th April 2016)
  - 24 new tile types
  - SAT-driven collision solver using SAT.js
  - SAT restraints based on heuristics that prevent AABBs catching on hidden
    edges
  - Works with sprites, groups and particle emitters!
