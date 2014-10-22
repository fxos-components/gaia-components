;(function(define,n){'use strict';define(function(require,exports,module){
/*jshint laxbreak:true*/
/*jshint esnext:true*/
/*shint node:true*/

require('gaia-picker');

/**
 * Element prototype, extends from HTMLElement
 *
 * @type {Object}
 */
var proto = Object.create(HTMLElement.prototype);

/**
 * Default max/min dates.
 *
 * @type {Object}
 */
var defaults = {
  min: new Date('1900', '0', '01'),
  max: new Date('2099', '11', '31')
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
  this.createShadowRoot();
  this.shadowRoot.innerHTML = template;
  this.shadowStyleHack();

  // Get els
  this.els = {
    inner: this.shadowRoot.querySelector('.inner'),
    pickers: {
      day: this.shadowRoot.querySelector('.days'),
      month: this.shadowRoot.querySelector('.months'),
      year: this.shadowRoot.querySelector('.years')
    }
  };

  this.setInitialValues();
  this.updatePickerOrder();
  this.setPickerHeights();
  this.updatePickers();
  this.created = true;

  // Bind listeners later to avoid strange
  // things happening during setup.
  setTimeout(this.addListeners.bind(this));
};

proto.attachedCallback = function() {
  debug('attached');
};

proto.detachedCallback = function() {
  debug('detached');
};

/**
 * Derives an initial value for the picker.
 *
 * Use `value` attribute if given.
 * Default to using today's date.
 *
 * @private
 */
proto.setInitialValues = function() {
  var value = this.getAttribute('value');
  var min = this.getAttribute('min');
  var max = this.getAttribute('max');

  this.min = min || defaults.min;
  this.max = max || defaults.max;

  this.value = value || new Date();
  debug('initial value: %s', this.value);
};

/**
 * Adds change listeners to allow
 * the date picker to respond when
 * pickers change.
 *
 * (Pickers change when users
 * interact with them)
 *
 * @private
 */
proto.addListeners = function() {
  var pickers = this.els.pickers;
  pickers.year.addEventListener('changed', this.onYearChanged.bind(this));
  pickers.month.addEventListener('changed', this.onMonthChanged.bind(this));
  pickers.day.addEventListener('changed', this.onDayChanged.bind(this));
};

/**
 * Sets the year to match the value
 * currently shown on the picker.
 *
 * @param  {Event} e
 * @private
 */
proto.onYearChanged = function(e) {
  debug('year changed: %s', e.detail.value);
  this.setYear(e.detail.value);
};

/**
 * Sets the month to match the value
 * currently shown on the picker.
 *
 * @param  {Event} e
 * @private
 */
proto.onMonthChanged = function(e) {
  debug('month changed: %s', e.detail.index);
  this.setMonth(this.monthIndexToValue(e.detail.index));
};

/**
 * Sets the day to match the value
 * currently shown on the picker.
 *
 * @param  {Event} e
 * @private
 */
proto.onDayChanged = function(e) {
  debug('day changed: %s', e.detail.index);
  this.setDay(this.dayIndexToValue(e.detail.index));
};

/**
 * Converts a given month picker
 * item index to month value.
 *
 * @param  {Number} index
 * @return {Number}
 */
proto.monthIndexToValue = function(index) {
  return this.isMinYear() ? (this.min.getMonth() + index) : index;
};

/**
 * Converts a given month value
 * to the picker item index.
 *
 * @param  {Number} value
 * @return {Number}
 */
proto.monthValueToIndex = function(value) {
  return this.isMinYear() ? (value - this.min.getMonth()) : value;
};

/**
 * Converts a given day picker
 * item index to day value.
 *
 * @param  {Number} index
 * @return {Number}
 */
proto.dayIndexToValue = function(index) {
  return this.isMinMonth() ? this.min.getDate() + index : (index + 1);
};

/**
 * Converts a given day value
 * to the picker item index.
 *
 * @param  {Number} value
 * @return {Number}
 */
proto.dayValueToIndex = function(value) {
  return this.isMinMonth() ? value - this.min.getDate() : value - 1;
};

/**
 * Set the date-picker to a given year.
 *
 * Changing the year has several dependencies.
 * We normalize the month and day values to
 * new values that fit within the context
 * of the new year.
 *
 * We manually update the year, month and
 * day values, then udate the pickers.
 *
 * The day and month pickers need to fully
 * updated as the list contents may have
 * changed due to entering max/min date
 * range year or leap year changing
 * number of days in the month.
 *
 * @param {Number} year
 * @public
 */
proto.setYear = function(year) {
  debug('set year: %s', year);
  year = this.normalizeYear(year);
  if (year === this.value.getFullYear()) { return debug('didn\'t change'); }
  var month = this.normalizeMonth(this.value.getMonth(), { year: year });
  var day = this.normalizeDay(this.value.getDate(), { month: month, year: year });
  this.value.setDate(day);
  this.value.setMonth(month);
  this.value.setFullYear(year);
  this.updateYearPickerValue();
  this.updateMonthPicker();
  this.updateDayPicker();
};

/**
 * Set the date-picker to a given month.
 *
 * The day picker is dependent on the month
 * value so we must normalize the current
 * day value to a value that fits into
 * the new date context.
 *
 * We then set the day first, followed by
 * the month. The order is important as
 * setting a day that doesn't exist will
 * cause the month to roll-over.
 *
 * @param {Number} month
 * @public
 */
proto.setMonth = function(month) {
  debug('set month: %s', month);
  month = this.normalizeMonth(month);
  if (month === this.value.getMonth()) { return debug('didn\'t change'); }
  var day = this.normalizeDay(this.value.getDate(), { month: month });
  this.value.setDate(day);
  this.value.setMonth(month);
  this.updateMonthPickerValue();
  this.updateDayPicker();
};

/**
 * Sets the underlying day value
 * and updates the day picker.
 *
 * If the day didn't change,
 * nothing is done.
 *
 * Normalizing the day prevents a day
 * being set that is either out of range
 * or doesn't exist in the calendar.
 *
 * @param {Number} day
 * @public
 */
proto.setDay = function(day) {
  debug('set day: %s');
  day = this.normalizeDay(day);
  if (day === this.value.getDate()) { return debug('didn\'t change'); }
  this.value.setDate(day);
  this.updateDayPickerValue();
};

/**
 * Normalizes value to a 'valid' year.
 *
 * A 'valid' year is a year within
 * the picker's date-range.
 *
 * @param  {Number} year
 * @return {Number}
 * @private
 */
proto.normalizeYear = function(year) {
  var max = this.max.getFullYear();
  var min = this.min.getFullYear();
  return Math.max(min, Math.min(max, Number(year)));
};

/**
 * Normalizes value to a 'valid' month.
 *
 * A 'valid' month is a month within the
 * current (or given) year, and be within
 * the picker's current date-range.
 *
 * Options:
 *
 *   - `year` {Number} - The year to normalize to
 *
 * @param  {Number} month
 * @param  {Object} options
 * @return {Number}
 * @private
 */
proto.normalizeMonth = function(month, options) {
  var year = options && options.year;
  month = Number(month);
  month = Math.min(11, Math.max(month, 0));
  if (this.isMinYear(year)) { month = Math.max(this.min.getMonth(), month); }
  if (this.isMaxYear(year)) { month = Math.min(this.max.getMonth(), month); }
  return month;
};

/**
 * Normalizes a value to a 'valid' day.
 *
 * A 'valid' day is a day that exist
 * in the current (or given) month of
 * the current (or given) year, and
 * within the picker's date-range.
 *
 * Options:
 *
 *   - `year` {Number} - The year to normalize to
 *   - `month` {Number} - The month to normalize to
 *
 * @param  {Number} day
 * @param  {Object} options
 * @return {Number}
 * @private
 */
proto.normalizeDay = function(day, options) {
  var year = (options && options.year) || this.value.getFullYear();
  var month = (options && options.month) || this.value.getMonth();
  var total = getDaysInMonth(year, month);
  day = Math.max(0, Math.min(Number(day), total));
  if (this.isMinMonth(month, year)) { day = Math.max(this.min.getDate(), day); }
  if (this.isMaxMonth(month, year)) { day = Math.min(this.max.getDate(), day); }
  return day;
};

/**
 * Update all the picker's content
 * and values to match the current
 * date-picker's date value.
 *
 * @private
 */
proto.updatePickers = function() {
  this.updateYearPicker();
  this.updateMonthPicker();
  this.updateDayPicker();
};

/**
 * Refreshes the year list based on
 * the current max/min dates, only
 * if it changed.
 *
 * @private
 */
proto.updateYearPicker = function() {
  debug('update years');
  if (!this.min || !this.max) { return; }
  var list = this.createYearList();
  var picker = this.els.pickers.year;
  var firstItem = picker.children[0];
  var firstItemVal = firstItem && firstItem.textContent;
  var changed = list.length !== picker.length
    || firstItemVal !== list[0];

  if (!changed) { return debug('didn\'t change'); }

  this.els.pickers.year.fill(list);
  this.updateYearPickerValue();
  debug('year picker updated', list);
};

/**
 * Create a list of month, fill the month
 * picker and update the picker value.
 *
 * We make an assumption that the list
 * didn't change if the length remains
 * the same as the picker's and the
 * `textContent` of the first item
 * is the same.
 *
 * @private
 */
proto.updateMonthPicker = function() {
  debug('update months picker');
  if (!this.value) { return; }
  var picker = this.els.pickers.month;
  var list = this.createMonthList();
  var firstItem = picker.children[0];
  var firstItemVal = firstItem && firstItem.textContent;
  var changed = list.length !== picker.length
    || firstItemVal !== list[0];

  if (!changed) { return debug('didn\'t change'); }

  picker.fill(list);
  this.updateMonthPickerValue();
  debug('months picker updated', list);
};

/**
 * Create a list of days, fill the day
 * picker and update the picker value.
 *
 * We make an assumption that the list
 * didn't change if the length remains
 * the same and the first value is the
 * same.
 *
 * @private
 */
proto.updateDayPicker = function() {
  debug('update days');
  if (!this.value) { return; }
  var picker = this.els.pickers.day;
  var list = this.createDayList();
  var firstItem = picker.children[0];
  var firstItemVal = firstItem && firstItem.textContent;
  var changed = list.length !== picker.length
    || firstItemVal !== list[0];

  if (!changed) { return debug('days didn\'t change'); }

  picker.fill(list);
  this.updateDayPickerValue();
  debug('day picker updated', list);
};

/**
 * Updates the year picker to match
 * the current year value.
 *
 * @private
 */
proto.updateYearPickerValue = function() {
  debug('update years');
  if (!this.value) { return; }
  var min = this.min.getFullYear();
  var index = this.value.getFullYear() - min;
  this.els.pickers.year.select(index);
  debug('year picker index updated: %s', index);
};

/**
 * Updates the month picker to match
 * the current month value.
 *
 * If the year is the min year, then Jan
 * may not be the first month, therefore
 * indexes need to be adjusted.
 *
 * @private
 */
proto.updateMonthPickerValue = function() {
  debug('update month picker value');
  if (!this.value) { return; }
  var value = this.value.getMonth();
  var index = this.monthValueToIndex(value);
  this.els.pickers.month.select(index);
  debug('month picker index updated: %s', index);
};

/**
 * Updates the month picker to match
 * the current month value.
 *
 * This won't do anything if triggered
 * from the 'changed' callback.
 *
 * @private
 */
proto.updateDayPickerValue = function() {
  if (!this.value) { return; }
  var value = this.value.getDate();
  var index = this.dayValueToIndex(value);
  this.els.pickers.day.select(index);
  debug('day picker index updated: %s', index);
};

/**
 * States if the current (or given) year
 * is the year of the min date-range.
 *
 * @param  {Number}  year (optional)
 * @return {Boolean}
 * @private
 */
proto.isMinYear = function(year) {
  return (year || this.value.getFullYear()) === this.min.getFullYear();
};

/**
 * States if the current (or given) year
 * is the year of the max date-range.
 *
 * @param  {Number}  year (optional)
 * @return {Boolean}
 * @private
 */
proto.isMaxYear = function(year) {
  return (year || this.value.getFullYear()) === this.max.getFullYear();
};

/**
 * States if the current (or given) month
 * is the month of the max date-range.
 *
 * @param  {Number}  month (optional)
 * @param  {Number}  year (optional)
 * @return {Boolean}
 * @private
 */
proto.isMinMonth = function(month, year) {
  return this.isMinYear(year) && (month || this.value.getMonth()) === this.min.getMonth();
};

/**
 * States if the current (or given) month
 * is the month of the max date-range.
 *
 * @param  {Number}  month (optional)
 * @param  {Number}  year (optional)
 * @return {Boolean}
 * @private
 */
proto.isMaxMonth = function(month, year) {
  return this.isMaxYear(year) && (month || this.value.getMonth()) === this.max.getMonth();
};

/**
 * Specifies if the given Date is
 * in the picker's date range.
 *
 * @param  {Date} date
 * @return {Boolean}
 */
proto.inRange = function(date) {
  var time = date.getTime();
  return time <= this.max.getTime() && time >= this.min.getTime();
};

/**
 * Create a list of year strings
 * based on the date-picker's current
 * date-range.
 *
 * @return {Array}  ['2000', '2001', '2002', ...]
 */
proto.createYearList = function() {
  var min = this.min.getFullYear();
  var max = this.max.getFullYear();
  var list = [];
  var date;

  for (var i = min; i <= max; i++) {
    date = new Date(i, 0, 1);
    list.push(localeFormat(date, '%Y'));
  }

  return list;
};

/**
 * Create a list of localized month strings
 * based on the date range of the current year.
 *
 * Usually this will be 12 months, unless
 * the year is currently the max/min year,
 * then not all the months will be available.
 *
 * @return {Array}  ['Jan', 'Feb', 'Mar', ...]
 */
proto.createMonthList = function() {
  var currentYear = this.value.getFullYear();
  var date = new Date(currentYear, 0, 1);
  var list = [];

  for (var i = 0; i < 12; i++) {
    date.setMonth(i);
    if (this.inRange(date)) {
      list.push(localeFormat(date, '%b'));
    }
  }

  return list;
};

/**
 * Create a list of day strings based
 * on the days available in the current
 * month and date-range.
 *
 * @return {Array}  ['1', '2', '3', ...]
 */
proto.createDayList = function() {
  var month = this.value.getMonth();
  var year = this.value.getFullYear();
  var last = this.isMaxMonth() ? this.max.getDate() : getDaysInMonth(year, month);
  var first = this.isMinMonth() ? this.min.getDate() : 1;
  var list = [];

  for (var i = first; i <= last; i++) {
    var date = new Date(year, month, i);
    list.push(localeFormat(date, '%d'));
  }

  return list;
};

/**
 * Explictly set's the picker heights based
 * on the `style.height` of the component.
 *
 * We give users an opportunity to define
 * an explicit height to optimize setup
 * so that we don't have to read
 * from the DOM.
 *
 * Example:
 *
 *   <gaia-picker-date style="height:300px">
 *
 * @private
 */
proto.setPickerHeights = function() {
  var height = parseInt(this.style.height, 10);
  if (!height) { return; }
  this.els.pickers.day.height = height;
  this.els.pickers.month.height = height;
  this.els.pickers.year.height = height;
  debug('set picker heights: %s', height);
};

/**
 * Updates the order of the three
 * pickers to reflect the current
 * date format.
 *
 * @private
 */
proto.updatePickerOrder = function() {
  var order = getDateComponentOrder();
  order.forEach(function(type, i) {
    this.els.pickers[type].style.order = i;
  }, this);
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

/**
 * Clamp's given date between
 * max/min date range.
 *
 * @param  {Date} date
 * @return {Date}
 * @private
 */
proto.clampDate = function(date) {
  if (date > this.max) { return new Date(this.max.getTime()); }
  else if (date < this.min) { return new Date(this.min.getTime()); }
  else { return date; }
};

/**
 * When an attribute changes, we check
 * to see if it was one of the component's
 * defined attributes, and then set it
 * to the newly changed value.
 *
 * @param  {String} key
 * @param  {String} from
 * @param  {String} to
 * @private
 */
proto.attributeChangedCallback = function(key, from, to) {
  if (attributes[key]) { this[key] = to; }
};

/**
 * List of public attributes.
 *
 * @type {Object}
 */
var attributes = {
  value: {
    get: function() { return this._value; },
    set: function(value) {
      if (!value) { return; }
      var date = typeof value === 'string' ? stringToDate(value) : value;
      var clamped = this.clampDate(date);
      this._value = clamped;

      // Only update pickers if fully created
      if (this.created) { this.updatePickers(); }
    }
  },

  min: {
    get: function() { return this._min; },
    set: function(value) {
      if (!value) { return; }
      var date = typeof value === 'string' ? stringToDate(value) : value;
      this._min = date;

      // Only update pickers if fully created
      if (this.created) { this.updatePickers(); }
    }
  },

  max: {
    get: function() { return this._max; },
    set: function(value) {
      if (!value) { return; }
      var date = typeof value === 'string' ? stringToDate(value) : value;
      this._max = date;

      // Only update pickers if fully created
      if (this.created) { this.updatePickers(); }
    }
  }
};

// Define the public attributes as properties
Object.defineProperties(proto, attributes);

proto.shadowStyleHack = function() {
  if (hasShadowCSS) { return; }
  var style = this.shadowRoot.querySelector('style').cloneNode(true);
  this.classList.add('-content', '-host');
  style.setAttribute('scoped', '');
  this.appendChild(style);
};

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

gaia-picker:after {
  content: '';
  position: absolute;
  left: 0; top: 0;
  z-index: -1;
  width: 1px;
  height: 100%;
  background: var(--border-color);
}

</style>

<div class="inner">
  <gaia-picker class="days"></gaia-picker>
  <gaia-picker class="months"></gaia-picker>
  <gaia-picker class="years"></gaia-picker>
</div>`;

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

// If the browser doesn't support shadow-css
// selectors yet, we update the template
// to use the shim classes instead.
if (!hasShadowCSS) {
  template = template
    .replace('::content', 'gaia-picker-date.-content', 'g')
    .replace(':host', 'gaia-picker-date.-host', 'g');
}

/**
 * Utils
 */

/**
 * Get the number of days in a month.
 *
 * @param  {Number} year   Full year
 * @param  {Number} month  Month index
 * @return {Number}
 */
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Format a `Date` based on the given token.
 *
 * `navigator.mozL10n.DateTimeFormat` is used
 * if available, falling back to simple en-us
 * solution.
 *
 * Example:
 *
 *   localeFormat(new Date(2014, 09, 21), '%A'); //=> Tuesday
 *   localeFormat(new Date(2014, 09, 21), '%b'); //=> Oct
 *
 * @param  {Date}   date
 * @param  {String} token ['%b','%A','%Y','%d']
 * @return {String}
 * @private
 */
function localeFormat(date, token) {
  return localeFormat.mozL10n(date, token)
    || localeFormat.fallback(date, token);
}

/**
 * Wrapper around `navigator.mozL10n.DateTimeFormat`
 *
 * @param  {Date}   date
 * @param  {String} token ['%b','%A','%Y','%d']
 * @return {String}
 * @private
 */
localeFormat.mozL10n = function(date, token) {
  var dateTimeFormat = navigator.mozL10n && navigator.mozL10n.DateTimeFormat;
  if (dateTimeFormat) { return dateTimeFormat().localeFormat(date, token); }
};

/**
 * A fallback for `navigator.mozL10n.DateTimeFormat`
 *
 * @param  {Date}   date
 * @param  {String} token ['%b','%A','%Y','%d']
 * @return {String}
 * @private
 */
localeFormat.fallback = function(date, token) {
  var strings = {
    days: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  };

  switch (token) {
    case '%b': return strings.months[date.getMonth()];
    case '%A': return strings.days[date.getDay()];
    case '%Y': return date.getFullYear();
    case '%d': return date.getDate();
  }
};

/**
 * Convert a string to a `Date` object.
 *
 * @param  {String} string  1970-01-01
 * @return {Date}
 */
function stringToDate(string) {
  if (!string) { return null; }
  var parts = string.split('-');
  var date = new Date(parts[0], parseInt(parts[1]) - 1, parts[2]);
  if (isNaN(date.getTime())) { date = null; }
  return date;
}

/**
 * Derives the date picker order based
 * on the current date format.
 *
 * @return {Array}
 */
function getDateComponentOrder() {
  var format = getDateTimeFormat();
  var tokens = format.match(/(%E.|%O.|%.)/g);
  var fallback = ['day', 'month', 'year'];
  var order = [];

  if (tokens) {
    tokens.forEach(function(token) {
      switch (token) {
        case '%Y':
        case '%y':
        case '%Oy':
        case 'Ey':
        case 'EY':
          order.push('year');
          break;
        case '%B':
        case '%b':
        case '%m':
        case '%Om':
          order.push('month');
          break;
        case '%d':
        case '%e':
        case '%Od':
        case '%Oe':
          order.push('day');
          break;
      }
    });
  }

  return order.length === 3 ? order : fallback;
}

function getDateTimeFormat() {
  return navigator.mozL10n && navigator.mozL10n.get('dateTimeFormat_%x') || '%m/%d/%Y';
}

/**
 * Simple debug logger
 *
 * @param  {String} value
 */
var debug = !~location.search.indexOf(n) ? function() {} : function() {
  arguments[0] = `[${n}]  ` + arguments[0];
  console.log.apply(console, arguments);
};

// Register and return the constructor
// and expose `protoype` (bug 1048339)
module.exports = document.registerElement('gaia-picker-date', { prototype: proto });
module.exports.proto = proto;

},n);})(typeof define=='function'&&define.amd?define
:(function(w){'use strict';return typeof module=='object'?function(c){
c(require,exports,module);}:function(c,n){var m={exports:{}};c(function(n){
return w[n];},m.exports,m);w[n]=m.exports;};})(this), 'gaia-picker-date');
