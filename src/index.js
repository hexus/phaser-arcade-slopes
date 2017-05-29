(function (Phaser, DemoState) {
	// Arcade Slopes Demo
	var state = new DemoState();
	var game = new Phaser.Game(1280, 720, Phaser.CANVAS, 'phaser', state, null, false);

	// Open up the state globally so we can access it at run time for debugging
	window.state = state;

	document.addEventListener('DOMContentLoaded', function () {
		// Dat gui tho ( ͡° ͜ʖ ͡°)
		var features = state.features;
		var gui = new dat.GUI({
			width: 300
		});
		
		// Arcade Slopes
		gui.slopesFolder = gui.addFolder('Arcade Slopes');
		gui.slopesFolder.add(features, 'slopes').name('Enable');
		gui.slopesFolder.add(features, 'heuristics').name('Heuristics');
		gui.slopesFolder.add(features, 'minimumOffsetY').name('Minimum Y Offset');
		
		// Camera
		gui.cameraFolder = gui.addFolder('Camera');
		gui.cameraFolder.add(features, 'cameraZoom').min(0.5).max(3.0).name('Zoom');
		gui.cameraFolder.add(features, 'cameraMicroZoom').min(-0.1).max(0.1).name('Micro-zoom');
		gui.cameraFolder.add(features, 'cameraRotation').min(-180).max(180).name('Rotation');
		gui.cameraFolder.add(features, 'cameraMicroRotation').min(-1.0).max(1.0).step(0.01).name('Micro-rotation');
		gui.cameraFolder.add(features, 'cameraLerp').min(0.1).max(1.0).name('Linear Interpolation');
		gui.cameraFolder.add(features, 'cameraFollow').name('Follow');
		gui.cameraFolder.add(features, 'cameraRoundPixels').name('Round Pixels');
		gui.cameraFolder.add(features, 'cameraSpeed').min(1).max(20).name('Camera Speed');
		//gui.cameraFolder.open();
		
		// Player
		gui.playerFolder = gui.addFolder('Player');
		gui.playerFolder.add(features, 'playerHeuristics').name('Heuristics');
		gui.playerFolder.add(features, 'playerMinimumOffsetY').name('Minimum Y Offset');
		gui.playerFolder.add(features, 'shape', {
			'Rectangle (AABB)': 'aabb',
			'Circle':           'circle'
		}).name('Shape');
		gui.playerFolder.add(features, 'size').min(16).max(256).step(1).name('Size');
		gui.playerFolder.add(features, 'acceleration').min(100).max(5000).name('Acceleration');
		gui.playerFolder.add(features, 'jump').min(0).max(1000).step(50).name('Jump');
		gui.playerFolder.add(features, 'wallJump').min(0).max(1000).step(50).name('Wall jump');
		gui.playerFolder.anchorFolder = gui.playerFolder.addFolder('Anchor');
		gui.playerFolder.anchorFolder.add(features, 'anchorX').min(0).max(1).step(0.1).name('X');
		gui.playerFolder.anchorFolder.add(features, 'anchorY').min(0).max(1).step(0.1).name('Y');
		gui.playerFolder.dragFolder = gui.playerFolder.addFolder('Drag');
		gui.playerFolder.dragFolder.add(features, 'dragX').min(0).max(2000).step(50).name('X');
		gui.playerFolder.dragFolder.add(features, 'dragY').min(0).max(2000).step(50).name('Y');
		gui.playerFolder.bounceFolder = gui.playerFolder.addFolder('Bounce');
		gui.playerFolder.bounceFolder.add(features, 'bounceX').min(0).max(1).step(0.05).name('X');
		gui.playerFolder.bounceFolder.add(features, 'bounceY').min(0).max(1).step(0.05).name('Y');
		gui.playerFolder.frictionFolder = gui.playerFolder.addFolder('Friction');
		gui.playerFolder.frictionFolder.add(features, 'frictionX').min(0).max(0.5).step(0.01).name('X');
		gui.playerFolder.frictionFolder.add(features, 'frictionY').min(0).max(0.5).step(0.01).name('Y');
		
		// Particles
		gui.particleFolder = gui.addFolder('Particles');
		gui.particleFolder.add(features, 'fireParticle').name('Fire Particle');
		gui.particleFolder.add(features, 'particleFlow').name('Enable');
		gui.particleFolder.add(features, 'particleGravity').name('Gravity');
		gui.particleFolder.add(features, 'particleSelfCollide').name('Self-collision');
		gui.particleFolder.add(features, 'particleShape', {
			'Square': 'aabb',
			'Circle': 'circle'
		}).name('Shape');
		gui.particleFolder.add(features, 'particleSize').min(2).max(32).step(1).name('Size');
		gui.particleFolder.add(features, 'particleFrequency').min(1).max(250).step(1).name('Frequency');
		gui.particleFolder.add(features, 'particleQuantity').min(1).max(10).step(1).name('Quantity');
		gui.particleFolder.add(features, 'particleMinX').min(-500).max(500).name('Minimum X Speed');
		gui.particleFolder.add(features, 'particleMaxX').min(-500).max(500).name('Maximum X Speed');
		gui.particleFolder.add(features, 'particleMinY').min(-500).max(500).name('Minimum Y Speed');
		gui.particleFolder.add(features, 'particleMaxY').min(-500).max(500).name('Maximum Y Speed');
		gui.particleFolder.add(features, 'emitterWidth').min(0).max(1).step(0.01).name('Emitter Width');
		gui.particleFolder.add(features, 'emitterHeight').min(0).max(1).step(0.01).name('Emitter Height');
		gui.particleFolder.open();
		
		// World
		gui.worldFolder = gui.addFolder('World');
		gui.worldFolder.add(features, 'gravity').min(-2000).max(2000).step(50).name('Gravity');
		gui.worldFolder.add(features, 'slowMotion').min(1).max(16).step(1).name('Slow Motion');
		gui.worldFolder.tilemapFolder = gui.worldFolder.addFolder('Tilemap Layers');
		gui.worldFolder.tilemapFolder.layerOneFolder = gui.worldFolder.tilemapFolder.addFolder('Layer 1');
		gui.worldFolder.tilemapFolder.layerOneFolder.add(features, 'tilemapOffsetX1').name('Offset X');
		gui.worldFolder.tilemapFolder.layerOneFolder.add(features, 'tilemapOffsetY1').name('Offset Y');
		gui.worldFolder.tilemapFolder.layerOneFolder.open();
		gui.worldFolder.tilemapFolder.layerTwoFolder = gui.worldFolder.tilemapFolder.addFolder('Layer 2');
		gui.worldFolder.tilemapFolder.layerTwoFolder.add(features, 'tilemapOffsetX2').name('Offset X');
		gui.worldFolder.tilemapFolder.layerTwoFolder.add(features, 'tilemapOffsetY2').name('Offset Y');
		gui.worldFolder.tilemapFolder.layerTwoFolder.open();
		
		// Debug
		gui.debugFolder = gui.addFolder('Debug');
		gui.debugFolder.add(features, 'debugStep').name('Step');
		gui.debugFolder.add(features, 'debugStepMode').name('Toggle Step Mode');
		gui.debugFolder.add(features, 'debugLayers').name('Tilemap Layers');
		gui.debugFolder.add(features, 'debugLayersFullRedraw').name('Full Layer Redraw');
		gui.debugFolder.add(features, 'debugPlayerBody').name('Player Body');
		gui.debugFolder.add(features, 'debugPlayerBodyInfo').name('Player Body Info');
		gui.debugFolder.add(features, 'debugParticleBodies').name('Particle Bodies');
		gui.debugFolder.add(features, 'debugCameraInfo').name('Camera Info');
		gui.debugFolder.add(features, 'debugInputInfo').name('Input Info');
		gui.debugFolder.open();
	});
})(Phaser, DemoState);
