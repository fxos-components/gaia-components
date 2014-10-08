;(function(umd){umd(function(require,exports,module){
'use strict';

/**
 * Extend from the `HTMLElement` prototype
 *
 * @type {Object}
 */
var proto = Object.create(HTMLElement.prototype);

/**
 * Runs when an instance of `GaiaTabs`
 * is first created.
 *
 * The initial value of the `select` attribute
 * is used to select a tab.
 *
 * @private
 */
proto.createdCallback = function() {
  this.createShadowRoot().innerHTML = template;

  this.els = {
    marker: this.shadowRoot.querySelector('.marker')
  };

  this.makeAccessible();
  this.addEventListener('click', this.onClick);
  this.select(this.getAttribute('selected'));
  this.styleHack();
  this.setupMarker();
};

proto.styleHack = function() {
  var style = this.shadowRoot.querySelector('style').cloneNode(true);
  this.classList.add('-content', '-host');
  style.setAttribute('scoped', '');
  this.appendChild(style);
};

proto.setupMarker = function() {
  var style = this.querySelector('style') ? 1 : 0;
  var items = this.children.length - style;
  this.els.marker.style.width = (1 / items * 100) + '%';
};

proto.setMarkerPosition = function(index) {
  this.els.marker.style.transform = 'translateX(' + index * 100 + '%)';
};

/**
 * Add necessary attributes to
 * improve accessibility.
 *
 * @private
 */
proto.makeAccessible = function() {
  this.setAttribute('role', 'tablist');
  for (var el = this.firstElementChild; el; el = el.nextElementSibling) {
    el.setAttribute('role', 'tab');
    el.tabIndex = 0;
  }
};

/**
 * Updates the selected tab when
 * the `selected` attribute changes.
 *
 * @param  {String} attr
 * @param  {String|null} oldVal
 * @param  {String|null} newVal [description]
 * @private
 */
proto.attributeChangedCallback = function(attr, oldVal, newVal) {
  if (attr === 'selected') { this.select(newVal); }
};

/**
 * Walks up the DOM from the `event.target`
 * until it finds an immediate child of the
 * element, then selects the index
 * of that element.
 *
 * @param  {Event} e
 * @private
 */
proto.onClick = function(e) {
  var el = e.target;
  var i;
  while (el) {
    i = [].indexOf.call(this.children, el);
    if (i > -1) { return this.select(i); }
    el = el.parentNode;
  }
};

/**
 * Select a tab by index.
 *
 * @param  {Number} index
 * @public
 */
proto.select = function(index) {
  if (index === null) { return; }

  // Make sure it's a number
  index = Number(index);

  var el = this.children[index];
  this.deselect(this.selected);
  this.setMarkerPosition(index);
  this.selectedChild = el;
  this.selected = index;

  el.setAttribute('aria-selected', 'true');
  el.classList.add('selected');

  var e = new CustomEvent('change');
  setTimeout(this.dispatchEvent.bind(this, e));
};

/**
 * Deselect a tab by index.
 * @param  {Number} index
 * @public
 */
proto.deselect = function(index) {
  var el = this.children[index];
  if (!el) { return; }
  el.removeAttribute('aria-selected');
  el.classList.remove('selected');
  if (this.current == el) {
    this.selectedChild = null;
    this.selected = null;
  }
};

var template = `
<style>

/** Host
 ---------------------------------------------------------*/

.-host {
  display: block;
  position: relative;
  border-top: 1px solid;

  border-color:
    var(--border-color,
    var(--background-plus))
}

/** Inner
 ---------------------------------------------------------*/

.inner {
  display: flex;
  height: 45px;
}

/** Direct Children
 ---------------------------------------------------------*/

.-content > * {
  position: relative;
  display: block;
  height: 100%;
  outline: 0;
  border: 0;
  flex: 1;
  font-size: 17px;
  line-height: 45px;
  text-align: center;
  font-style: italic;
  font-weight: lighter;
  background: none;
  cursor: pointer;
  color: inherit;

  transition:
    color,
    opacity 0.2s;

  transition-delay:  200ms;
}

/**
 * :active
 */

.-content > :active {
  transition: none;
  opacity: 0.3;
}

/**
 * .selected
 */

.-content > .selected {
  color: var(--highlight-color, #000);
}

/**
 * [disabled]
 */

.-content > [disabled] {
  transition: none;
  opacity: 0.3;
  pointer-events: none;
}

/** Style
 ---------------------------------------------------------*/

style {
  display: none !important;
}

/** Marker
 ---------------------------------------------------------*/

.marker {
  position: absolute;
  bottom: 0px;
  left: 0px;
  height: 3px;
  background: var(--highlight-color, #000);
  transition: transform 0.2s;
  transition-timing-function: cubic-bezier(0.175, 0.885, 0.320, 1.275);
}

</style>

<div class="inner">
  <content></content>
  <div class="marker"></div>
</div>`;

// Register and expose the constructor
module.exports = document.registerElement('gaia-tabs', { prototype: proto });

});})(typeof define=='function'&&define.amd?define
:(function(n,w){return typeof module=='object'?function(c){
c(require,exports,module);}:function(c){var m={exports:{}};c(function(n){
return w[n];},m.exports,m);w[n]=m.exports;};})('gaia-tabs',this));
