(function (jQuery) {
	jQuery(function ($) {
		// Enable caching
		$.ajaxSetup({
			cache: true
		});
		
		// Acquire the select elements
		var phaserSelect = $('#phaser-version');
		var slopesSelect = $('#slopes-version');
		
		// URL parameters
		var parameters = new URLSearchParams(location.search.slice(1));
		
		// Grab the Phaser CE tags
		var phaserTagsRequest = $.ajax('https://api.github.com/repos/photonstorm/phaser-ce/tags', {
			headers: {
				'Authorization': 'token 2778360da02606e87e019346499a5d2f84801100'
			},
			complete: function (xhr) {
				if (!xhr.responseJSON)
					return;
				
				var tags = xhr.responseJSON;
				
				$.each(tags, function (index, tag) {
					phaserSelect.append($('<option>', {
						text: tag.name
					}));
				});
				
				var tag = parameters.get('phaser');
				
				if (tag) {
					phaserSelect.val(tag);
				}
			}
		});
		
		// Grab the Arcade Slopes tags
		var slopesTagsRequest = $.ajax('https://api.github.com/repos/hexus/phaser-arcade-slopes/tags', {
			headers: {
				'Authorization': 'token 2778360da02606e87e019346499a5d2f84801100'
			},
			complete: function (xhr) {
				if (!xhr.responseJSON)
					return;
				
				var tags = xhr.responseJSON;
				
				$.each(tags, function (index, tag) {
					slopesSelect.append($('<option>', {
						text: tag.name
					}));
				});
				
				var tag = parameters.get('slopes');
				
				if (tag) {
					slopesSelect.val(tag);
				}
			}
		});
		
		/**
		 * Update the currently running Phaser game by reloading all scripts.
		 */
		function updateState() {
			// Determine the script URLs to use
			var phaserVersion = phaserSelect.val();
			var slopesVersion = slopesSelect.val();
			
			var phaserUrl = 'https://cdn.rawgit.com/photonstorm/phaser-ce/{tag}/build/phaser.js'
				.replace('{tag}', phaserVersion);
			var slopesUrl = 'https://cdn.rawgit.com/hexus/phaser-arcade-slopes/{tag}/dist/phaser-arcade-slopes.js'
				.replace('{tag}', slopesVersion);
			var stateUrl = 'src/DemoState.js';
			
			// Destroy Phaser
			if (typeof game !== 'undefined') {
				game.destroy();
				game = undefined;
			}
			
			$('#phaser').html(null);
			
			// Reload the scripts and recreate the Phaser game
			$.when(
				$.getScript(phaserUrl)
				.then(function () {
					return $.getScript(slopesUrl)
				})
				.then(function () {
					return $.getScript(stateUrl)
				})
			).then(function () {
				state = new DemoState();
				game = new Phaser.Game(1280, 720, Phaser.CANVAS, 'phaser', state, null, false);
			});
		}
		
		// Update once tags are loaded or changed
		$.when(phaserTagsRequest, slopesTagsRequest).then(updateState);
		phaserSelect.change(updateState);
		slopesSelect.change(updateState);
	});
})(jQuery);
