;(function(define){'use strict';define(function(require,exports,module){
/*jshint esnext:true*/
/*shint node:true*/

require('gaia-picker');

var DEBUG = 0;

/**
 * Detects presence of shadow-dom
 * CSS selectors.
 *
 * @return {Boolean}
 */
var hasShadowCSS = (function() {
  try { document.querySelector(':host'); return true; }
  catch (e) { return false; }
})();

/**
 * Element prototype, extends from HTMLElement
 *
 * @type {Object}
 */
var proto = Object.create(HTMLElement.prototype);

var on = function(el, name, fn, ctx) {
  el.addEventListener(name, fn.bind(ctx));
};

/**
 * Called when the element is first created.
 *
 * Here we create the shadow-root and
 * inject our template into it.
 *
 * @private
 */
proto.createdCallback = function() {
  var now = new Date();

  this.createShadowRoot();
  this.shadowRoot.innerHTML = template;
  this.shadowStyleHack();

  // Get els
  this.els = {
    inner: this.shadowRoot.querySelector('.inner'),
    pickers: {
      hours: this.shadowRoot.querySelector('.hours'),
      minutes: this.shadowRoot.querySelector('.minutes'),
      ampm: this.shadowRoot.querySelector('.ampm')
    }
  };

  this.setPickerHeights();
  this.format = this.getAttribute('format') || (navigator.mozHour12 ? '12hr' : '24hr');
  this.minutes = this.getAttribute('minutes') || now.getMinutes();
  this.hours = this.getAttribute('hours') || now.getHours();

  setTimeout(this.addListeners.bind(this));
};

proto.attributeChangedCallback = function(attr, from, to) {
  if (this.attrs[attr]) { this[attr] = to; }
};

proto.addListeners = function() {
  var pickers = this.els.pickers;
  on(pickers.minutes, 'changed', this.onMinutesChanged, this);
  on(pickers.hours, 'changed', this.onHoursChanged, this);
  on(pickers.ampm, 'changed', this.onAmPmChanged, this);
};

proto.onHoursChanged = function(e) {
  e.stopPropagation();
  this.hours = this.normalizeHours(e.detail.value);
};

proto.onMinutesChanged = function(e) {
  e.stopPropagation();
  this.minutes = e.detail.value;
};

proto.onAmPmChanged = function(e) {
  e.stopPropagation();
  if (!e.detail.value) { return; }
  this.ampm = e.detail.value === 'PM' ? 1 : 0;
  this.hours = this.normalizeHours(this.hours);
};

proto.setPickerHeights = function() {
  var height = this.style.height;
  this.els.pickers.hours.style.height = height;
  this.els.pickers.minutes.style.height = height;
  this.els.pickers.ampm.style.height = height;
  debug('set picker heights: %s', height);
};

/**
 * Populate the hour and minute
 * pickers based on the current
 * format.
 *
 * @private
 */
proto.populate = function() {
  var startHour = this.is12 ? 1 : 0;
  var endHour = this.is12 ? (startHour + 12) : (startHour + 12 * 2);
  this.els.pickers.hours.items = createList(startHour, endHour);
  this.els.pickers.minutes.items = createList(0, 60, function(value) {
    return value < 10 ? '0' + value : value;
  });
};

/**
 * Returns a zero padded, human
 * readable time string in 24hr
 * format.
 *
 * @return {String}
 * @public
 */
proto.getTimeValue = function() {
  return (this.hours < 10 ? '0' : '') + this.hours + ':' + this.minutes;
};

/**
 * Converts given number of hours
 * to 24hr format based on the
 * ampm value.
 *
 * @param  {String|Number} hours
 * @return {Number}
 * @private
 */
proto.normalizeHours = function(hours) {
  hours = Number(hours);
  if (!this.is12) { return hours; }
  var offset = hours % 12;
  hours = this.ampm ? offset + 12 : offset;
  return hours === 24 ? 0 : hours;
};

/**
 * Calulate the correct hour
 * index when in 12hr format.
 *
 * Example:
 *
 *   // 12hr
 *   this.hourIndex(1); => 0
 *   this.hourIndex(0); => 11
 *
 *   // 24hr (noop)
 *   this.hoursIndex(23); => 23
 *   this.hoursIndex(0); => 0
 *
 * @param  {Number|String} hours
 * @return {Number}
 * @private
 */
proto.hourIndex = function(hours) {
  hours = Number(hours);
  if (!this.is12) { return hours; }
  var hour = hours % 12;
  return (hour === 0 ? 12 : hour) - 1;
};

/**
 * It's useful to have attributes duplicated
 * on a node inside the shadow-dom so that
 * we can use them for style-hooks.
 *
 * @param {String} name
 * @param {String} value
 * @public
 */
proto.setAttribute = function(name, value) {
  this.els.inner.setAttribute.call(this, name, value);
  this.els.inner.setAttribute(name, value);
};

proto.shadowStyleHack = function() {
  if (hasShadowCSS) { return; }
  var style = this.shadowRoot.querySelector('style').cloneNode(true);
  this.classList.add('-content', '-host');
  style.setAttribute('scoped', '');
  this.appendChild(style);
};

proto.attrs = {
  hours: {
    get: function() { return this._hours; },
    set: function(value) {
      debug('set hours: %s', value, this.hours);
      value = Number(value);
      if (value === this.hours) { return; }

      this.ampm = value >= 12 ? 1 : 0;
      this._hours = value;

      // Update pickers last
      this.setAttribute('hours', value);
      this.els.pickers.hours.select(this.hourIndex(value));
      this.els.pickers.ampm.select(this.ampm);
    }
  },

  minutes: {
    get: function() { return this._minutes; },
    set: function(value) {
      debug('set minutes: %s', value);
      value = Number(value);
      if (value === this.minutes) { return; }
      this._minutes = value;
      this.els.pickers.minutes.select(value);
      this.setAttribute('minutes', value);
    }
  },

  format: {
    get: function() { return this._format; },
    set: function(value) {
      if (value == this.format) { return; }
      this.is12 = value === '12hr';
      this.populate();
      this.setAttribute('format', value);
      this._format = value;
    }
  }
};

Object.defineProperties(proto, proto.attrs);

var template = `
<style>

:host {
  display: block;
  position: relative;
  overflow: hidden;
  -moz-user-select: none;
}

.inner {
  display: flex;
  height: 100%;
}

gaia-picker {
  flex: 1;
}

gaia-picker:not(:first-child):after {
  content: '';
  position: absolute;
  left: 0; top: 0;
  z-index: -1;
  width: 1px;
  height: 100%;
  background: var(--border-color);
}

[format='24hr'] .ampm {
  display: none;
}

.colon {
  position: absolute;
  left: 33.33%;
  top: 50%;
  z-index: 3;
  width: 10px;
  height: 50px;
  font-size: 30px;
  font-weight: 500;
  font-style: italic;
  line-height: 48px;
  margin-top: -25px;
  margin-left: -5px;
  text-align: center;
  color: var(--highlight-color);
}

[format='24hr'] .colon {
  left: 50%;
}

</style>

<div class="inner">
  <gaia-picker class="hours" circular></gaia-picker>
  <div class="colon">:</div>
  <gaia-picker class="minutes" circular></gaia-picker>
  <gaia-picker class="ampm">
    <li>AM</li>
    <li>PM</li>
  </gaia-picker>
</div>`;

// If the browser doesn't support shadow-css
// selectors yet, we update the template
// to use the shim classes instead.
if (!hasShadowCSS) {
  template = template
    .replace('::content', 'gaia-picker-time.-content', 'g')
    .replace(':host', 'gaia-picker-time.-host', 'g');
}

function createList(min, max, format) {
  var list = [];
  for (var i = min; i < max; ++i) {
    list.push(format ? format(i) : i);
  }
  return list;
}

// Register and return the constructor
// and expose `protoype` (bug 1048339)
module.exports = document.registerElement('gaia-picker-time', { prototype: proto });
module.exports.protoype = module.exports.protoype || proto;

var debug;

module.exports.debug = function(enabled) {
  debug = enabled ? function() {
    arguments[0] = '[gaia-picker-time]  ' + arguments[0];
    console.log.apply(console, arguments);
  } : function(){};
};

module.exports.debug(DEBUG);

});})(typeof define=='function'&&define.amd?define
:(function(n,w){'use strict';return typeof module=='object'?function(c){
c(require,exports,module);}:function(c){var m={exports:{}};c(function(n){
return w[n];},m.exports,m);w[n]=m.exports;};})('gaia-picker-time',this));
