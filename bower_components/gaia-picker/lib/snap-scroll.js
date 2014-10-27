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

/**
 * Initialize a new `Scroll`
 *
 * Config:
 *
 *   - {Element} `list` - The container that should be transformed
 *   - {Boolean} `snap` (optional) - Make the list snap to items
 *   - {Boolean} `circular` (optional) - Make the list loop
 *   - {NodeList} `items` (optional) - The list items to snap to
 *   - {Element} `container` (optional) - The *real* light-dom items parent node.
 *
 * @param {Object} config
 */
function Scroll(config) {
  debug('initialize');
  this.config = config;
  this.els = config.els;
  this.scrollHeight = null;
  this.scrollTop = 0;
  this.last = {};

  this.heights = config.heights || {};

  this.els = {
    list: config.list,
    container: config.container || config.list
  };

  // Bind context
  this.onPointerUpInternal = this.onPointerUpInternal.bind(this);
  this.onPointerDown = this.onPointerDown.bind(this);
  this.onPointerMove = this.onPointerMove.bind(this);
  this.onPointerUp = this.onPointerUp.bind(this);
  this.updateSpeed = this.updateSpeed.bind(this);

  this.setup();
}

Scroll.prototype.setup = function() {
  debug('setup');
  this.els.list.addEventListener(pointer.down, this.onPointerDown);
  if (this.config.circular) { this.setupCircular(); }
};

Scroll.prototype.teardown = function() {
  this.els.list.removeEventListener(pointer.down, this.onPointerDown);
};

Scroll.prototype.setupCircular = function() {
  debug('setup circular');

  // Teardown old circular setup
  if (this.circularSetup) { this.teardownCircular(); }

  this.els.above = document.createElement('div');

  [].forEach.call(this.getItems(), function(item) {
    this.els.above.appendChild(item.cloneNode(true));
  }, this);

  this.els.above.style.transform = 'translateY(-100%)';
  this.els.above.style.position = 'absolute';
  this.els.above.style.width = '100%';
  this.els.above.style.left = 0;
  this.els.above.style.top = 0;

  this.els.below = this.els.above.cloneNode(true);
  this.els.below.style.transform = 'translateY(100%)';

  this.els.container.style.position = 'relative';
  this.els.container.appendChild(this.els.above);
  this.els.container.appendChild(this.els.below);
  this.config.circular = true;
  this.circularSetup = true;
  debug('circular setup');
};

Scroll.prototype.teardownCircular = function() {
  if (!this.circularSetup) { return; }
  this.els.above.remove();
  this.els.below.remove();
  this.els.container.style.position = '';
  this.els.above = null;
  this.els.below = null;
  this.circularSetup = false;
  debug('tore down circular');
};

Scroll.prototype.measure = function() {
  this.heights.item = this.heights.item || this.getItems()[0].clientHeight;
  this.heights.container = this.heights.container || this.els.list.parentNode.clientHeight;
  this.heights.list = this.heights.list || this.els.list.clientHeight;
  this.scrollHeight = Math.max(this.heights.list - this.heights.container, 0);
  this.measured = true;
  debug('measured listHeight: %s, scrollHeight: %s',
    this.heights.list, this.scrollHeight);
};

Scroll.prototype.onPointerDown = function(e) {
  debug('pointer down');
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
    debug('tapped');
    e.stopPropagation();
    e.preventDefault();
    this.removeListeners();
    this.dispatch('tap', { target: e.target });
    return;
  }
};

Scroll.prototype.addListeners = function() {
  debug('add listeners');
  this.els.container.addEventListener(pointer.up, this.onPointerUpInternal);
  addEventListener(pointer.move, this.onPointerMove);
  addEventListener(pointer.up, this.onPointerUp);
};

Scroll.prototype.removeListeners = function() {
  this.els.container.removeEventListener(pointer.up, this.onPointerUpInternal);
  removeEventListener(pointer.move, this.onPointerMove);
  removeEventListener(pointer.up, this.onPointerUp);
};

Scroll.prototype.pan = function(options) {
  debug('pan');

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
  debug('set scroll');
  if (this.measured) { this.measure(); }
  var clamped = this.clamp(value);
  if (clamped === this.scrollTop) { return false; }

  clamped = this.circularCorrection(clamped);

  this.scrollTop = clamped;
  this.els.list.style.transform = 'translateY(' + (-this.scrollTop) + 'px)';
  return true;
};

Scroll.prototype.clamp = function(scrollTop) {
  return this.config.circular ? scrollTop : Math.min(Math.max(0,  scrollTop), this.scrollHeight);
};

Scroll.prototype.circularCorrection = function(scrollTop) {
  if (!this.config.circular) { return scrollTop; }
  if (scrollTop < 0) { scrollTop += this.heights.list; }
  else if (scrollTop >= this.heights.list) { scrollTop -= this.heights.list; }
  return scrollTop;
};

Scroll.prototype.refresh = function() {
  if (this.config.circular) { this.setupCircular(); }
  else { this.teardownCircular(); }
  this.setScroll(this.scrollTop);
};

Scroll.prototype.dispatch = function(name, detail) {
  this.els.container.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
};

Scroll.prototype.getEndPoint = function(delta, options) {
  var itemHeight = this.heights.item;
  var end = this.scrollTop + delta;

  this.measure();

  end = this.clamp(end);

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
  debug('%s to: %s', this.scrollTop, to);
};

Scroll.prototype.jump = function(to, options) {
  debug('jump to: %s', to);

  var silent = options && options.silent;
  var shouldSnap = this.config.snap;

  this.setScroll(to, options);

  var index = this.scrollTop / this.heights.item;

  if (shouldSnap && !silent) {
    this.dispatch('snapped', { index: index });
  }
};

Scroll.prototype.animate = function(to, options) {
  debug('animate to: %s', to);

  var timeConstant = (options && options.time) || 16;
  var silent = options && options.silent;
  var remaining = this.scrollTop - to;
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
    var scrollTop = self.scrollTop - delta;

    // Speed up when close to end destination
    if (shouldSpeedUp) { timeConstant *= 0.8; }

    // Do the draw
    self.setScroll(scrollTop);
    remaining -= delta;

    if (remaining_abs > 0.25) {
      self.raf = raf(loop);
      return;
    }

    // One last draw snapped to exact pixel
    self.setScroll(Math.round(scrollTop));
    onComplete();
  }

  function onComplete() {
    if (shouldSnap && !silent) {
      var index = self.scrollTop / self.heights.item;
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

Scroll.prototype.getItems = function() {
  return this.els.container.children;
};

Scroll.prototype.scrollToIndex = function(index, options) {
  debug('scroll to index: %s', index);
  var delta = this.getClosestIndex(index) * this.heights.item;
  options = options || {};
  options.time = 0.06 * Math.abs(delta);
  this.scrollTo(delta, options);
};

Scroll.prototype.getClosestIndex = function(index) {
  var length = this.getItems().length;
  var currentIndex = this.scrollTop / this.heights.item;
  var deltaInternal = index - currentIndex;

  if (!this.config.circular) { return deltaInternal; }

  var deltaForward = (length - currentIndex) + index;
  var deltaBack = (-currentIndex) - (length - index);
  var deltas = [deltaForward, deltaBack, deltaInternal];

  return smallestDelta(deltas);
};

function smallestDelta(list) {
  return list.reduce(function(smallest, current) {
    return Math.abs(current) < Math.abs(smallest) ? current : smallest;
  }, list[0]);
}

function inDOM(el) {
  return el ? el.parentNode === document.body || inDOM(el.parentNode || el.host) : false;
}

});})(typeof define=='function'&&define.amd?define
:(function(n,w){'use strict';return typeof module=='object'?function(c){
c(require,exports,module);}:function(c){var m={exports:{}};c(function(n){
return w[n];},m.exports,m);w[n]=m.exports;};})('snap-scroll',this));