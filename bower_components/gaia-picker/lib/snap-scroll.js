;(function(define){'use strict';define(function(require,exports,module){
/*jshint esnext:true*/
/*shint node:true*/

/**
 * Simple debug logger
 *
 * @param  {String} value
 */
var debug = !~location.search.indexOf('|snap-scroll|') ? function() {} : function() {
  arguments[0] = `[snap-scroll]  ` + arguments[0];
  console.log.apply(console, arguments);
};

/**
 * Pointer event abstraction to make
 * it work for touch and mouse.
 *
 * @type {Object}
 */
var pointer = [
  { down: 'touchstart', up: 'touchend', move: 'touchmove' },
  { down: 'mousedown', up: 'mouseup', move: 'mousemove' }
]['ontouchstart' in window ? 0 : 1];

// Alias
var raf = requestAnimationFrame;
var caf = cancelAnimationFrame;

/**
 * Exports
 */

module.exports = Scroll;

function Scroll(config) {
  this.config = config;
  this.el = config.el;
  this.scrollHeight = null;
  this.scrollTop = 0;
  this.last = {};

  // Bind context
  this.onPointerUpInternal = this.onPointerUpInternal.bind(this);
  this.onPointerDown = this.onPointerDown.bind(this);
  this.onPointerMove = this.onPointerMove.bind(this);
  this.onPointerUp = this.onPointerUp.bind(this);
  this.updateSpeed = this.updateSpeed.bind(this);

  this.el.addEventListener(pointer.down, this.onPointerDown);
}

Scroll.prototype.measure = function() {
  var itemHeight = this.config.itemHeight;
  var containerHeight = this.config.containerHeight || this.el.parentNode.clientHeight;
  var listHeight = this.config.listHeight || this.el.clientHeight;
  this.scrollHeight = Math.max(listHeight - containerHeight, 0);
  this.measured = true;
};

Scroll.prototype.onPointerDown = function(e) {
  e.stopPropagation();
  e.preventDefault();
  this.e = this.point = null;
  this.start = e;
  this.updatePoint(e);
  this.addListeners();
  this.measure();
  this.monitorSpeed = true;
  this.updateSpeed();
  this.pan({ silent: true });
};

Scroll.prototype.updatePoint = function(e) {
  var point = e.touches ? e.touches[0] : e;
  this.last.point = this.point || point;
  this.last.e = this.e || e;
  this.point = point;
  this.e = e;
};

Scroll.prototype.onPointerMove = function(e) {
  e.stopPropagation();
  e.preventDefault();
  this.updatePoint(e);
  caf(this.raf);
  this.pan();
};

Scroll.prototype.onPointerUp = function(e) {
  e.stopPropagation();
  e.preventDefault();
  this.scrollTo(this.speed * 90);
  this.monitorSpeed = false;
  this.removeListeners();
};

Scroll.prototype.onPointerUpInternal = function(e) {
  var tapped = (e.timeStamp - this.start.timeStamp) < 200;
  this.start = null;

  if (tapped) {
    e.stopPropagation();
    e.preventDefault();
    this.removeListeners();
    this.dispatch('tap', { target: e.target });
    return;
  }
};

Scroll.prototype.addListeners = function() {
  this.el.addEventListener(pointer.up, this.onPointerUpInternal);
  addEventListener(pointer.move, this.onPointerMove);
  addEventListener(pointer.up, this.onPointerUp);
};

Scroll.prototype.removeListeners = function() {
  this.el.removeEventListener(pointer.up, this.onPointerUpInternal);
  removeEventListener(pointer.move, this.onPointerMove);
  removeEventListener(pointer.up, this.onPointerUp);
};


Scroll.prototype.pan = function(options) {
  var silent = options && options.silent;
  this.cancelAnimate();

  this.frame = this.frame || raf(function() {
    this.frame = null;
    var delta = this.last.point.clientY - this.point.clientY;
    var scrollTop = this.scrollTop + delta;
    var changed = this.setScroll(scrollTop);
    if (!silent && changed) { this.dispatch('panning'); }
    debug('panned: %s', scrollTop, changed);
  }.bind(this));

};

Scroll.prototype.cancelPan = function() {
  caf(this.frame);
  this.frame = null;
};

Scroll.prototype.setScroll = function(value) {
  if (this.measured) { this.measure(); }
  var clamped = Math.min(Math.max(0, value), this.scrollHeight);
  if (clamped === this.scrollTop) { return false; }
  this.scrollTop = clamped;
  this.el.style.transform = 'translateY(' + (-this.scrollTop) + 'px)';
  debug('scroll set: %s', this.scrollTop);
  return true;
};

Scroll.prototype.refresh = function() {
  this.setScroll(this.scrollTop);
};

Scroll.prototype.dispatch = function(name, detail) {
  this.el.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
};

Scroll.prototype.getEndPoint = function(delta, options) {
  var itemHeight = this.config.itemHeight;
  var end = this.scrollTop + delta;

  this.measure();

  end = Math.min(Math.max(0,  end), this.scrollHeight);

  if (this.config.snap) {
    end = itemHeight * Math.round(end / itemHeight);
  }

  return end;
};

Scroll.prototype.scrollTo = function(delta, options) {
  debug('scroll to: %s', delta, options);
  options = options || {};

  // Cancel pending frames
  this.cancelAnimate();
  this.cancelPan();

  var animate = options && options.animate !== false;
  var to = this.getEndPoint(delta, options);
  var type = animate ? 'animate' : 'jump';

  this[type](to, options);
  debug('%s to: %s', to);
};

Scroll.prototype.jump = function(to, options) {
  debug('jump to: %s', to);

  var index = to / this.config.itemHeight;
  var silent = options && options.silent;
  var shouldSnap = this.config.snap;

  this.setScroll(to, options);

  if (shouldSnap && !silent) {
    this.dispatch('snapped', { index: index });
  }
};

Scroll.prototype.animate = function(to, options) {
  debug('animate to: %s', to);

  var timeConstant = (options && options.time) || 16;
  var silent = options && options.silent;
  var remaining = this.scrollTop - to;
  var index = to / this.config.itemHeight;
  var shouldSnap = this.config.snap;
  var self = this;

  if (!remaining) { return onComplete(); }
  if (!silent) { this.dispatch('scrolling'); }

  // Kick it off...
  this.raf = raf(loop);

  function loop() {
    var delta = remaining / timeConstant;
    var remaining_abs = Math.abs(remaining);
    var shouldSpeedUp = shouldSnap && remaining_abs < 30;

    // Speed up when close to end destination
    if (shouldSpeedUp) { timeConstant *= 0.8; }

    // Do the draw
    self.setScroll(self.scrollTop - delta);
    remaining -= delta;

    if (remaining_abs > 0.25) {
      self.raf = raf(loop);
      return;
    }

    onComplete();
  }

  function onComplete() {
    if (shouldSnap && !silent) {
      self.dispatch('snapped', { index: index });
    }
  }
};

Scroll.prototype.cancelAnimate = function() {
  caf(this.raf);
};

Scroll.prototype.updateSpeed = function() {
  if (!this.point) return;

  var last = this.last.speedCheck || 0;
  var distance =  last - this.point.clientY;
  var time = this.e.timeStamp - this.last.e.timeStamp;
  var speed = distance / time;
  var self = this;

  // Limit speed
  speed = Math.max(-7, Math.min(7, speed));

  this.last.speed = this.speed || 0;
  this.last.speedCheck = this.point.clientY;
  this.speed = speed;

  if (this.monitorSpeed) {
    raf(function() {
      raf(self.updateSpeed);
    });
  }
};

Scroll.prototype.scrollToIndex = function(index, options) {
  var offset = index * this.config.itemHeight;
  var delta = offset - this.scrollTop;
  options = options || {};
  options.time = 4;
  this.scrollTo(delta, options);
};

function inDOM(el) {
  return el ? el.parentNode === document.body || inDOM(el.parentNode || el.host) : false;
}

});})(typeof define=='function'&&define.amd?define
:(function(n,w){'use strict';return typeof module=='object'?function(c){
c(require,exports,module);}:function(c){var m={exports:{}};c(function(n){
return w[n];},m.exports,m);w[n]=m.exports;};})('snap-scroll',this));