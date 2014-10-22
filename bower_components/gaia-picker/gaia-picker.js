;(function(define){'use strict';define(function(require,exports,module){
/*jshint esnext:true*/
/*shint node:true*/

/**
 * Dependencies
 */

var Scroll = require('snap-scroll');

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
 * Simple debug logger
 *
 * @param  {String} value
 */
var debug = !~location.search.indexOf('|gaia-picker|') ? function() {} : function() {
  arguments[0] = `[gaia-picker]  ` + arguments[0];
  console.log.apply(console, arguments);
};

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

  this.scroll = new Scroll({
    el: this.els.list,
    itemHeight: this.itemHeight,
    containerHeight: this.height,
    snap: true
  });

  this.height = this.getAttribute('height');

  // Bind listeners later to avoid callbacks
  // firing during user configuration stage.
  setTimeout(this.addListeners.bind(this), 500);
  setTimeout(this.setup.bind(this));
};

proto.addListeners = function() {
  this.els.list.addEventListener('panning', this.onPanning.bind(this));
  this.els.list.addEventListener('snapped', this.onSnapped.bind(this));
  this.els.list.addEventListener('tap', this.onListTap.bind(this));
};

proto.attachedCallback = function() {
  debug('attached');
  this.setup();
};

proto.detachedCallback = function() {
  debug('detached');
  this.teardown();
};

proto.onListTap = function(e) {
  var el = this.getChild(e.detail.target);
  var index = [].indexOf.call(this.els.items, el);
  this.select(index);
};

proto.onPanning = function(e) {
  this.clear();
};

proto.onSnapped = function(e) {
  debug('snapped: %s', e.detail.index);
  this.selectItem(e.detail.index);
  this.dispatch('changed', {
    value: this.value,
    selected: this.selected,
    index: this.index
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

  // We can't setup without DOM context
  if (!inDOM(this)) { return debug('not in dom'); }

  // Defer setup until document has loaded
  if (this.doc.readyState !== 'complete') {
    addEventListener('load', this.setup);
    return debug('doc not loaded');
  }

  this.isSetup = true;
  this.reflow();
  this.select(this.pendingSelect || 0, { animate: false });
  this.classList.add('setup');
  setTimeout(this.enableTransitions.bind(this));

  // Tidy up
  removeEventListener('load', this.setup);
  delete this.pendingSelect;
};

proto.teardown = function() {
  debug('teardown');
  this.isSetup = false;
};

/**
 * Sets the required button-padding
 * on the list to account for the
 * y-offset.
 *
 * We also take this opportunity to
 * pass some more measurements to
 * the scroller if the user has
 * defined a 'hight' attribute.
 *
 * This means the scroller doens't
 * have to do the measuring itself,
 * which can be expensive.
 *
 * @private
 */
proto.reflow = function() {
  debug('reflow');

  if (!this.isSetup) { return; }

  var container = this.height || this.els.inner.clientHeight;
  var padding = container - this.itemHeight;
  this.els.list.style.paddingBottom = padding + 'px';

  // Optimize scroller
  if (this.height) {
    this.scroll.config.listHeight = this.els.items.length * this.itemHeight;
    this.scroll.config.listHeight += padding;
  }

  this.scroll.refresh();
  debug('reflowed');
};


/**
 * 1. Shouldn't scroll if not setup
 * 2. Shouldn't fire the 'changed' event
 */

proto.select = function(index, options) {
  debug('select: %s', index, this);

  if (!this.isSetup) {
    this.pendingSelect = index;
    debug('queuedSelect');
    return;
  }

  var changed = index !== this.index;
  var exists = this.els.items[index];

  if (!changed || !exists) { return debug('didn\'t change'); }

  this.selectItem(index);
  this.scroll.scrollToIndex(index, options);
};

proto.selectItem = function(index) {
  if (index === this.index) { return; }
  this.clear();
  this.selected = this.els.items[index];
  this.selected.classList.add('selected');
  this.index = index;
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

proto.fill = function(list, options) {
  var select = options && options.select;
  var els = [];

  this.disableTransitions();

  this._style.remove();
  this.innerHTML = '';

  list.forEach(function(item) {
    var el = document.createElement('li');
    el.textContent = item;
    this.appendChild(el);
    els.push(el);
  }, this);

  this.els.items = els;
  this.appendChild(this._style);
  this.reflow();
  this.clear();

  // Disable transitions for a short
  // peroid of time to prevent reselection
  // after new content fill looking glitchy

  setTimeout(this.enableTransitions.bind(this), 4000);
};

proto.enableTransitions = function() {
  this.classList.add('transitions-on');
};

proto.disableTransitions = function() {
  this.classList.remove('transitions-on');
};

proto.getChild = function(el) {
  return el && (el.parentNode === this ? el : this.getChild(el.parentNode));
};

proto.shadowStyleHack = function() {
  if (hasShadowCSS) { return; }
  var style = this.shadowRoot.querySelector('style').cloneNode(true);
  this.classList.add('-content', '-host');
  style.setAttribute('scoped', '');
  this.appendChild(style);
  this._style = style;
};

proto.attrs = {
  height: {
    get: function() { return this._height; },
    set: function(value) {
      value = Number(value);
      this.scroll.config.containerHeight = value;
      this._height = value;
    }
  },

  value: {
    get: function() {
      return this.selected && this.selected.textContent;
    }
  },

  children: {
    get: function() {
      return this.els.items || [];
    }
  },

  length: {
    get: function() {
      return this.els.items.length || 0;
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
    mask: url(#m1);
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
    rgba(244,244,244,1) 0%,
    rgba(244,244,244,0) 100%);
}

.gaia-picker-inner:after {
  top: auto; bottom: 0;
  background: linear-gradient(to top,
    rgba(244,244,244,1) 0%,
    rgba(244,244,244,0) 100%);
}

/** List
 ---------------------------------------------------------*/

.list {
  position: absolute;
  top: 50%; left: 0;
  width: 100%;
  margin-top: -25px;
}

/** List Items
 ---------------------------------------------------------*/

::content li {
  position: relative;
  height: 50px;
  padding: 0 16px;
  font-size: 18px;
  font-weight: normal;
  line-height: 50px;
  text-align: center;
  list-style-type: none;
  cursor: pointer;
}

/**
 * .selected
 */

::content li.selected {
  color: var(--highlight-color);
  transform: scale(1.5);
}

.transitions-on li {
  transition: transform 140ms linear;
}

</style>

<div class="gaia-picker-inner">
  <div class="selected-background"></div>
  <div class="list"><content></content></div>
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

});})(typeof define=='function'&&define.amd?define
:(function(n,w){'use strict';return typeof module=='object'?function(c){
c(require,exports,module);}:function(c){var m={exports:{}};c(function(n){
return w[n];},m.exports,m);w[n]=m.exports;};})('gaia-picker',this));
