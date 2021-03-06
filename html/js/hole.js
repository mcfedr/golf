define([
	'jquery',
	'underscore',
	'routie',
	'db',
	'loading',
	'hgn!templates/hole',
	'hgn!templates/hole/waypoint',
	'hgn!templates/hole/waypointEdit',
	'partials',
	'image-chooser',
	'location-chooser',
	'async',
	'gmaps',
	'error',
	'bootstrapModal'
], function($, _, routie, db, loading, holeT, waypointT, waypointEditT, partials, imageChooserPartials, locationChooserPartials, async, gmaps, ERR) {
	return function() {
		
		var holePartials = _.extend({
			waypoint: waypointT.template,
		}, partials);
		
		var waypointEditPartials = _.extend({}, imageChooserPartials, locationChooserPartials);
		
		routie('edit/courses/:slug/holes/new', function(slug) {
			loading(function(stopLoading) {
				db.course.get(slug, function(err, course) {
					if(ERR(err)) return;
					var number = course.holes.length + 1,
						id = course.nextId++,
						hole = {
							id: id,
							number: number,
							name: 'Hole #' + number,
							par: 3,
							waypoints: [{
								name: 'Start',
								id: course.nextId++,
								noDelete: true
							}, {
								name: 'Finish',
								id: course.nextId++,
								noDelete: true
							}]
						};
					course.holes.push(hole);
					db.course.save(course, function(err) {
						stopLoading();
						routie('edit/courses/' + slug + '/holes/' + id);
					});
				});
			});
		});
		
		routie('edit/courses/:slug/holes/:id', function(slug, id) {
			loading(function(stopLoading) {
				db.hole.get(slug, id, function(err, hole, course) {
					if(ERR(err)) return;
					var $finishWaypoint,
						$waypointsBody;
					
					$('#app').html(holeT(_.extend({
						nav: {
							edit: true
						},
						slug: slug
					}, gmaps, hole), holePartials));
					
					_.each(hole.waypoints, loadWaypointImage);
					
					$waypointsBody = $('#waypoints tbody');
					$finishWaypoint = $waypointsBody.find('tr:last-child');
					
					$('#add-waypoint').on('click', function() {
						var waypoint = {
							id: course.nextId++,
							name: 'Waypoint #' + (hole.waypoints.length - 1)
						};
						hole.waypoints.splice(hole.waypoints.length - 1, 0, waypoint);
						$finishWaypoint.before(waypointT(waypoint));
					});
					
					$waypointsBody.on('click', 'tr', function(e) {
						var $tr = $(this),
							waypointId = $tr.attr('data-waypoint-id'),
							waypoint = _.find(hole.waypoints, function(waypoint) {
								return waypoint.id == waypointId;
							}),
							$modal,
							imageChooser,
							locationChooser;

						e.preventDefault();
						$(document.body).append(waypointEditT(waypoint, waypointEditPartials));
						
						$modal = $('#edit-waypoint');
						imageChooser = $modal.find('[data-image-chooser]').imageChooser(waypoint.id, course);
						
						$modal.on('submit', function(e) {
							var position = locationChooser();
							e.preventDefault();
							if(position) {
								waypoint.position = position;
							}
							waypoint.name = $modal.find('[name=name]').val();
							waypoint.description = $modal.find('[name=description]').val();
							loading(function(stopLoading) {
								db.course.save(course, function(err, res) {
									var file;
									if(ERR(err)) {
										stopLoading();
										return;
									}
									course._rev = res.rev;
									file = imageChooser();
									if(file == 'clear') {
										db.course.removeImage(waypoint.id, course, done);
									}
									else if(file) {
										db.course.saveImage(waypoint.id, course, file, done);
									}
									else {
										done();
									}
									function done(err, res) {
										$modal.modal('hide');
										stopLoading();
										if(ERR(err)) return;
										if(res) {
											course._rev = res.rev;
										}
										$tr.replaceWith(waypointT(_.extend({}, gmaps, waypoint)));
										loadWaypointImage(waypoint);
									}
								});
							});
						});
						
						$modal.on('shown', function() {
							locationChooser = $modal.find('[data-location-chooser]').locationChooser(waypoint.position);
						});
						
						$modal.on('hidden', function() {
							$modal.remove();
						});
						
						$modal.modal('show');
					});
					
					$waypointsBody.on('click', '[data-waypoint-delete]', function(e) {
						var $this = $(this);
							waypointId = $this.attr('data-waypoint-delete');
						e.preventDefault();
						hole.waypoints = _.filter(hole.waypoints, function(waypoint) {
							return waypoint.id != waypointId;
						});
						$this.parents('tr').remove();
					});
					
					$('#hole').on('submit', function(e) {
						var $this = $(this);
						e.preventDefault();
						hole.name = $this.find('[name=name]').val();
						hole.par = $this.find('[name=par]').val();
						loading(function(stopLoading) {
							db.course.save(course, function(err) {
								stopLoading();
								if(ERR(err)) return;
								routie('edit/courses/' + slug);
							});
						});
					});
					
					stopLoading();
					
					function loadWaypointImage(waypoint) {
						db.course.getImageURL(waypoint.id, course, function(err, url) {
							var $holder, $img;
							if(ERR(err, true)) return;
							$img = $(document.createElement('img'));
							$holder = $waypointsBody.find('[data-waypoint-image=' + waypoint.id + ']');
							$holder.html('');
							$holder.append($img);
							$img.one('load', function() {
								db.course.releaseURL(url);
							});
							$img.attr('src', url);
							$img.attr('class', 'img-polaroid');
						});
					}
				});
			});
		});
	}
});