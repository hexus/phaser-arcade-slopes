# Arcade Slopes Change Log

## Unreleased
- Collision callback support, including `physics.arcade.collide()` calls,
  tile-specific callbacks and layer-level tile callbacks
- Tile slope type name retrieval
- Arcade body properties that configure the body's interaction with tiles
- Initial sticky slopes functionality

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
