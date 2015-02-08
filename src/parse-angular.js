(function(window, undef){
	'use strict';

	var angular = window.angular;
	if (angular !== undef) {

		angular
			.module('parse-angular', [])
			.run(['$q', '$window', function($q, $window) {

				var Parse = $window.Parse;
				if (!angular.isUndefined(Parse) && angular.isObject(Parse)) {

					var methodsToUpdatePerParseObject = {
						'Object': {
							prototype: ['save', 'fetch', 'destroy'],
							static: ['saveAll', 'destroyAll']
						},
						'Collection': {
							prototype: ['fetch'],
							static: []
						},
						'Query': {
							prototype: ['find', 'first', 'count', 'get'],
							static: []
						},
						'Cloud': {
							prototype: [],
							static: ['run']
						},
						'User': {
							prototype: ['signUp'],
							static: ['requestPasswordReset', 'logIn']
						},
						'FacebookUtils': {
							prototype: [],
							static: ['logIn', 'link', 'unlink']
						}
					};

					Parse._.each(methodsToUpdatePerParseObject, function(currentObject, currentClass) {
						var prototypeMethods = {
							methods: currentObject.prototype,
							target: Parse[currentClass].prototype
						};
						var staticMethods = {
							methods: currentObject.static,
							target: Parse[currentClass]
						};

						Parse._.each([prototypeMethods, staticMethods], function(methodType) {
							methodType.methods.forEach(function(method) {
								var origMethod = methodType.target[method];
								// Overwrite original function by wrapping it with $q
								methodType.target[method] = function() {
									return origMethod.apply(this, arguments)
										.then(function(data){
											return $q.when(data);
										}, function(err){
											return $q.reject(err);
										});
								};
							});
						});
					});
				}
			}]);

			angular
				.module('parse-angular.enhance', ['parse-angular'])
				.run(['$q', '$window', function($q, $window) {

					var Parse = $window.Parse;
					if (!angular.isUndefined(Parse) && angular.isObject(Parse)) {

						/**
						 * Parse.Object
						 */

						/// Create a method to easily access our object
						/// Because Parse.Object("xxxx") is actually creating an object and we can't access static methods
						Parse.Object.getClass = function(className) {
							return Parse.Object._classMap[className];
						};

						///// Override orig extend
						var origObjectExtend = Parse.Object.extend;
						Parse.Object.extend = function(protoProps) {
							var newClass = origObjectExtend.apply(this, arguments);
							if (Parse._.isObject(protoProps) && Parse._.isArray(protoProps.attrs)) {
								var attrs = protoProps.attrs;

								/// Generate setters & getters
								Parse._.each(attrs, function(currentAttr){
									(function() {
										var propName = currentAttr;
										Object.defineProperty(newClass.prototype, propName, {
											get : function(){ return this.get(propName); },
											set : function(value){ this.set(propName, value); }
										});
									})();
								});

								/// Get angular bindable object
								newClass.prototype.getBindableParseObject = function() {
									return new BindableParseObject(this, attrs);
								};

								/// Add shortcut to create Parse.Query
								newClass.query = function() {
									return new Parse.Query(newClass);
								};
							}

							return newClass;
						};

						/**
						 * Parse.Collection
						 */

						/// Keep references & init collection class map
						Parse.Collection._classMap = {};

						var origExtend = Parse.Collection.extend;

						/// Enhance Collection 'extend' to store their subclass in a map
						Parse.Collection.extend = function(opts) {
							var extended = origExtend.apply(this, arguments);

							if (opts && opts.className) {
								Parse.Collection._classMap[opts.className] = extended;
							}

							return extended;
						};

						Parse.Collection.getClass = function(className) {
							return Parse.Collection._classMap[className];
						};

						/// Enhance Collection prototype
						Parse.Collection.prototype = angular.extend(Parse.Collection.prototype, {
							// Simple paginator
							loadMore: function(opts) {

								if (!angular.isUndefined(this.query)) {

									// Default Parse limit is 100
									var currentLimit = this.query._limit === -1 ? 100 : this.query._limit;
									var currentSkip = this.query._skip;

									currentSkip += currentLimit;

									this.query.skip(currentSkip);

									var self = this;

									return this.query.find().then(function(newModels) {
											if (!opts || opts.add !== false) { self.add(newModels); }
											if (newModels.length < currentLimit) { self.hasMoreToLoad = false; }
											return newModels;
										});
								}
							}
						});
					}
			}]);
		}

		function BindableParseObject(parseObject, attrs) {
			var self = this,
					_parseObject = parseObject;

			self.getParseObject = function() {
				return _parseObject;
			};

			Parse._.each(['save', 'fetch', 'destroy', 'clone'], function(method) {
				self[method] = function() {
					return _parseObject[method].apply(_parseObject, arguments);
				};
			});

			Object.defineProperty(self, 'id', {
				get : function(){ return _parseObject.id; }
			});

			Parse._.each(attrs, function(currentAttr) {
				var propName = currentAttr;
				Object.defineProperty(self, propName, {
					get : function(){ return _parseObject.get(propName); },
					set : function(value){ _parseObject.set(propName, value); }
				});
			});
		}

})(this);