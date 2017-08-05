# Roadmap

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
- [x] v0.2.0
  - [x] Premade Arcade Slopes tilesets
  - [x] Mapping shortcuts
    - [x] Ninja Physics debug tileset
    - [x] Arcade Slopes tileset
    - [x] Tile properties (`tile.properties.type`)
  - [x] Debug rendering
    - [x] ~~Collision vectors~~
    - [x] Tile face properties
    - [x] Tile polygons
  - [x] Flag internal polygon edges
  - [x] Offset tilemap layer support
  - [x] Circular physics body support
  - [x] Tile collision direction flags
  - [x] Clearer yet more in-depth readme
- [ ] v0.3.0
  - [x] Custom SAT.js implementation that can prevent internal edge collisions
    ([like this](http://www.wildbunny.co.uk/blog/2012/10/31/2d-polygonal-collision-detection-and-internal-edges/comment-page-1/#comment-1978))
  - [x] Debug rendering
    - [x] Tile edge collision normals
  - [x] Memory consumption improvements
- [ ] v0.4.0
  - [ ] Tunnelling solutions
    - [ ] Swept intersection tests
    - [ ] Raycasting
  - [ ] Automatic sprite rotation
    - [ ] Omni-directional
    - [ ] Selective
- [ ] v0.5.0
  - [ ] Raycasting for sticky slopes
  - [ ] Dynamic tilemap support
- [ ] v1.0.0
  - [ ] More consistent naming
    - [ ] Tile slope type constants
    - [ ] Direction/neighbour names

## Ideas

- [ ] AABB collision margins
