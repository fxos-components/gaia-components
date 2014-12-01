;(function(define){'use strict';define(function(require,exports,module){
/*jshint esnext:true*/
/*shint node:true*/

/**
 * Dependencies
 */

var Scroll = require('snap-scroll');

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

/**
 * Hard code the item height
 * so that we don't need to
 * query the DOM.
 *
 * @type {Number}
 */
proto.itemHeight = 50;

// Test Hook
proto.doc = document;

/**
 * Called when the element is first created.
 *
 * Here we create the shadow-root and
 * inject our template into it.
 *
 * @private
 */
proto.createdCallback = function() {
  debug('created');

  this.createShadowRoot();
  this.shadowRoot.innerHTML = template;

  // Get els
  this.els = {
    inner: this.shadowRoot.querySelector('.gaia-picker-inner'),
    list: this.shadowRoot.querySelector('.list'),
    items: this.querySelectorAll('li')
  };

  this.setup = this.setup.bind(this);
  this.shadowStyleHack();
  this.itemsFromChildren();
  this.addListeners();

  this.circular = this.hasAttribute('circular');

  // Setup async to allow users chance select
  setTimeout(this.setup.bind(this));
  this.created = true;
};

proto.addListeners = function() {
  this.addEventListener('panning', this.onPanning.bind(this));
  this.addEventListener('scrolling', this.onPanning.bind(this));
  this.addEventListener('snapped', this.onSnapped.bind(this));
  this.addEventListener('tap', this.onListTap.bind(this));
  debug('listeners added');
};

proto.attachedCallback = function() {
  debug('attached');
  this.setup();
};

proto.detachedCallback = function() {
  debug('detached');
  this.teardown();
};

proto.itemsFromChildren = function() {
  if (!this.els.items.length) { return; }
  this.items = [].map.call(this.els.items, function(el) {
    el.remove();
    return el.textContent;
  });
};

proto.setupScroller = function() {
  if (!this.created) { return; }
  if (this.scroller) { return; }

  this.scroller = new Scroll({
    outer: this.els.inner,
    inner: this.els.list,
    length: this.items.length,
    circular: this.circular,
    snap: true,
    render: this.renderItem.bind(this),
    heights: {
      item: this.itemHeight,
      outer: this.height
    }
  });

  this.updateScrollHeight();
  debug('scroller setup', this.els.list.children);
};

/**
 * When the list is tapped, we get
 * the list item from the event target,
 * find the index of this item in its
 * parent container, and then select
 * that index.
 *
 * This logic copes with the case whereby
 * the item is a child of one of the
 * cloned containers used for circular
 * scrolling lists.
 *
 * @param  {Event} e
 * @private
 */
proto.onListTap = function(e) {
  debug('tapped index: %s', e.detail.index);
  this.select(e.detail.virtualIndex);
};

proto.renderItem = function(el, index) {
  el.firstChild.nodeValue = this.items[index] || '\u2009';
};

/**
 * Get the <li> from a descendent.
 *
 * @param  {Element} el
 * @return {Element|null}
 */
proto.itemFromTarget = function(el) {
  return el && (el.tagName === 'LI' ? el : this.itemFromTarget(el.parentNode));
};

proto.onPanning = function(e) {
  this.clear();
};

proto.onSnapped = function(e) {
  debug('snapped: %s', e.detail);

  var el = e.detail;
  var index = el.virtualIndex;
  var value = this.items[index];
  var self = this;

  this.selectItem(el);
  debug('changed', value, index);
  self.dispatch('changed', {
    value: value,
    selected: self.selected,
    index: index
  });
};

/**
 * Takes care of any configuration
 * and set's the picker's initial
 * selection.
 *
 * We need to take some measurements
 * from the component in order to
 * for the scroller to operate.
 *
 * By waiting until after the document
 * has loaded, we can minimise costly
 * 'reflows'.
 *
 * @private
 */
proto.setup = function() {
  debug('setup');

  if (this.isSetup) { return; }

  // We can't setup without DOM context
  if (!inDOM(this)) { return debug('not in dom'); }

  // Defer setup until document has loaded
  // if (this.doc.readyState !== 'complete') {
  //   addEventListener('load', this.setup);
  //   return debug('doc not loaded');
  // }

  this.setupScroller();
  this.isSetup = true;
  this.select(this.pendingSelect || 0, { animate: false });
  setTimeout(this.enableTransitions.bind(this));
  this.classList.add('setup');

  // Tidy up
  // removeEventListener('load', this.setup);
  delete this.pendingSelect;
};

proto.teardown = function() {
  debug('teardown');
  this.isSetup = false;
};

proto.select = function(index, options) {
  debug('select: %s', index);
  if (isNaN(index)) { return debug('invalid argument'); }
  if (!this.isSetup) {
    this.pendingSelect = index;
    debug('select queued: %s', index);
    return;
  }

  this.scroller.scrollToIndex(index, options);
};

proto.selectItem = function(el) {
  if (el === this.selected) { return; }
  this.clear();
  this.selected = el;
  this.index = el.virtualIndex;
  this.selected.classList.add('selected');
};

proto.clear = function() {
  if (!this.selected) return;
  this.selected.classList.remove('selected');
  this.selected = null;
  this.index = null;
};

proto.dispatch = function(name, detail) {
  this.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
};

proto.enableTransitions = function() {
  this.classList.add('transitions-on');
};

proto.disableTransitions = function() {
  this.classList.remove('transitions-on');
};

proto.shadowStyleHack = function() {
  if (hasShadowCSS) { return; }
  var style = this.shadowRoot.querySelector('style').cloneNode(true);
  this.classList.add('-content', '-host');
  style.setAttribute('scoped', '');
  this.appendChild(style);
  this._style = style;
};

proto.updateScrollHeight = function() {
  if (!this.scroller) { return; }
  this.scroller.setLength(this.items.length);
  this.scroller.heights.scroll += this.getBottomSpacing();
  debug('updated scroll height: %s', this.scroller.heights.scroll);
};

proto.getBottomSpacing = function() {
  return this.circular ? 0 : this.height - this.itemHeight;
};

proto.attrs = {
  height: {
    get: function() {
      return parseInt(this.style.height, 10) || this.clientHeight;
    }
  },

  value: {
    get: function() {
      return this.selected && this.selected.textContent;
    }
  },

  length: {
    get: function() { return this.items.length; }
  },

  circular: {
    get: function() { return this._circular; },
    set: function(value) {
      debug('set circular', value);
      var circular = !!value || value === '';
      this._circular = circular;
      if (!this.scroller) { return; }
      this.scroller.config.circular = circular;
      this.updateScrollHeight();
      // if (this.created) { this.scroller.refresh(); }
    }
  },

  items: {
    get: function() { return this._items || []; },
    set: function(items) {
      debug('set items', items);
      this._items = items;
      this.setupScroller();
      this.updateScrollHeight();
      // if (this.created) { this.scroller.refresh(); }
    }
  }
};

Object.defineProperties(proto, proto.attrs);

var template = `
<style>

:host {
  display: flex;
  position: relative;
  height: 200px; /* overide with !important */
  overflow: hidden;
  -moz-user-select: none;
  visibility: hidden;
}

:host.setup {
  visibility: visible;
}

/** Selected Background
 ---------------------------------------------------------*/

.selected-background {
  content: '';
  display: block;
  position: absolute;
  top: 50%; left: 0;
  z-index: 0;
  width: 100%;
  height: 50px;
  margin-top: -25px;
  background: var(--background-plus);
}

/** Inner
 ---------------------------------------------------------*/

.gaia-picker-inner {
  position: relative;
  width: 100%;
  color: var(--title-color);
}

/** Gradients
 ---------------------------------------------------------*/

.gaia-picker-inner:before,
.gaia-picker-inner:after {
  content: '';
  display: block;
  position: absolute;
  left: 0; top: 0;
  z-index: 1;
  width: 100%;
  height: 50px;
  pointer-events: none;
  background: linear-gradient(to bottom,
    var(--background) 0%,
    transparent 100%);
}

.gaia-picker-inner:after {
  top: auto; bottom: 0;
  background: linear-gradient(to top,
    var(--background) 0%,
    transparent 100%);
}

/** List
 ---------------------------------------------------------*/

.list {
  position: absolute;
  top: 50%; left: 0;
  width: 100%;
  margin-top: -25px;
  oveflow: hidden;
  will-change: transform;
}

/** List Items
 ---------------------------------------------------------*/

.list li {
  position: relative;
  height: 50px;
  padding: 0 16px;
  font-size: 18px;
  font-weight: normal;
  font-style: italic;
  line-height: 50px;
  text-align: center;
  list-style-type: none;
  cursor: pointer;
}

/**
 * .selected
 */

.list li.selected {
  color: var(--highlight-color);
  transition: transform 140ms linear;
  transform: scale(1.3);
}

.transitions-on li {
  // transition: transform 140ms linear;
}

</style>

<div class="gaia-picker-inner">
  <div class="selected-background"></div>
  <div class="list"></div>
</div>`;

// If the browser doesn't support shadow-css
// selectors yet, we update the template
// to use the shim classes instead.
if (!hasShadowCSS) {
  template = template
    .replace('::content', 'gaia-picker.-content', 'g')
    .replace(':host', 'gaia-picker.-host', 'g');
}

function inDOM(el) {
  return el ? el.parentNode === document.body || inDOM(el.parentNode || el.host) : false;
}

// Register and return the constructor
// and expose `protoype` (bug 1048339)
module.exports = document.registerElement('gaia-picker', { prototype: proto });
module.exports.proto = proto;

var debug;
module.exports.debug = function(enabled) {
  debug = enabled ? function() {
    arguments[0] = '[gaia-picker]  ' + arguments[0];
    console.log.apply(console, arguments);
  } : function(){};
};

module.exports.debug(DEBUG);

});})(typeof define=='function'&&define.amd?define
:(function(n,w){'use strict';return typeof module=='object'?function(c){
c(require,exports,module);}:function(c){var m={exports:{}};c(function(n){
return w[n];},m.exports,m);w[n]=m.exports;};})('gaia-picker',this));
