!function(t,e){"use strict";function n(t,e){var n=this,r=t;n.getParseObject=function(){return r},Parse._.each(["save","fetch","destroy","clone","deepClone"],function(t){n[t]=function(){return r[t].apply(r,arguments)}}),Object.defineProperty(n,"id",{get:function(){return r.id}}),Parse._.each(e,function(t){var e=t;Object.defineProperty(n,e,{get:function(){return r.get(e)},set:function(t){r.set(e,t)}})})}var r=t.angular;r!==e&&(r.module("parse-angular",[]).run(["$q","$window",function(t,e){var n=e.Parse;if(!r.isUndefined(n)&&r.isObject(n)){var o={Object:{prototype:["save","fetch","destroy"],"static":["saveAll","destroyAll"]},Collection:{prototype:["fetch"],"static":[]},Query:{prototype:["find","first","count","get"],"static":[]},Cloud:{prototype:[],"static":["run"]},User:{prototype:["signUp"],"static":["requestPasswordReset","logIn"]},FacebookUtils:{prototype:[],"static":["logIn","link","unlink"]}};n._.each(o,function(e,r){var o={methods:e.prototype,target:n[r].prototype},i={methods:e["static"],target:n[r]};n._.each([o,i],function(e){e.methods.forEach(function(n){var r=e.target[n];e.target[n]=function(){return r.apply(this,arguments).then(function(e){return t.when(e)},function(e){return t.reject(e)})}})})})}}]),r.module("parse-angular.enhance",["parse-angular"]).run(["$q","$window",function(t,e){var o=e.Parse;if(!r.isUndefined(o)&&r.isObject(o)){o.Object.getClass=function(t){return o.Object._classMap[t]};var i=o.Object.extend;o.Object.extend=function(t){var e=i.apply(this,arguments);if(o._.isObject(t)&&o._.isArray(t.attrs)){var r=t.attrs;o._.each(r,function(t){!function(){var n=t;Object.defineProperty(e.prototype,n,{get:function(){return this.get(n)},set:function(t){this.set(n,t)}})}()}),e.prototype.getBindableParseObject=function(){return new n(this,r)},e.prototype.deepClone=function(e){e=e||t.relations;var n=this,r=n.clone();return o._.isObject(e)&&o._.each(e,function(t,e){var n=r.get(e);if(o._.isArray(n)){var i=[];o._.each(n,function(t){o._.isObject(t)&&o._.isFunction(t.deepClone)&&i.push(t.deepClone())}),r.set(e,i)}else o._.isObject(n)&&o._.isFunction(n.deepClone)&&r.set(e,n.deepClone())}),r},e.query=function(){return new o.Query(e)}}return e},o.Collection._classMap={};var s=o.Collection.extend;o.Collection.extend=function(t){var e=s.apply(this,arguments);return t&&t.className&&(o.Collection._classMap[t.className]=e),e},o.Collection.getClass=function(t){return o.Collection._classMap[t]},o.Collection.prototype=r.extend(o.Collection.prototype,{loadMore:function(t){if(!r.isUndefined(this.query)){var e=-1===this.query._limit?100:this.query._limit,n=this.query._skip;n+=e,this.query.skip(n);var o=this;return this.query.find().then(function(n){return t&&t.add===!1||o.add(n),n.length<e&&(o.hasMoreToLoad=!1),n})}}})}}]))}(this);