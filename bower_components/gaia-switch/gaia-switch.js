(function(define){define(function(require,exports,module){
/* jshint esnext:true */
'use strict';

/**
 * Dependencies
 */

var Drag = require('drag');

/**
 * Locals
 */

// Extend from the HTMLElement prototype
var proto = Object.create(HTMLElement.prototype);
var baseComponents = window.COMPONENTS_BASE_URL || 'bower_components/';
var base = window.GAIA_SWITCH_BASE_URL || baseComponents + 'gaia-switch/';

/**
 * Attributes supported
 * by this component.
 *
 * @type {Object}
 */
proto.attrs = {
  checked: true
};

proto.createdCallback = function() {
  var tmpl = template.content.cloneNode(true);
  var shadow = this.createShadowRoot();

  this.els = {
    inner: tmpl.querySelector('.js-inner'),
    track: tmpl.querySelector('.js-track'),
    handle: tmpl.querySelector('.js-handle')
  };

  // Bind context
  this.toggle = this.toggle.bind(this);
  this.onSnapped = this.onSnapped.bind(this);

  // Configure
  this.checked = this.hasAttribute('checked');
  this.tabIndex = 0;

  shadow.appendChild(tmpl);
  this.styleHack();
  this.setupDrag();

  setTimeout(this.activateTransitions.bind(this));
};

proto.styleHack = function() {
  var style = this.shadowRoot.querySelector('style').cloneNode(true);
  style.setAttribute('scoped', '');
  this.appendChild(style);
};

proto.setupDrag = function() {
  this.drag = new Drag({
    handle: this.els.handle,
    container: this.els.track
  });

  this.drag.on('ended', this.drag.snapToClosestEdge);
  this.drag.on('snapped', this.onSnapped);
  this.drag.on('tapped', this.toggle);
};

proto.activateTransitions = function() {
  this.els.inner.classList.add('transitions-on');
};

/**
 * Sets the switch as `checked` depending
 * on whether it snapped to the right.
 *
 * We remove all styling Drag applied
 * during the drag so that our CSS
 * can take over.
 *
 * @param  {Event} e
 * @private
 */
proto.onSnapped = function(e) {
  this.checked = e.x === 'right';
  this.els.handle.style.transform = '';
  this.els.handle.style.transition = '';
};

proto.toggle = function(value) {
  this.checked = typeof value !== 'boolean' ? !this.hasAttribute('checked') : value;
};

proto.setChecked = function(value) {
  value = !!value;

  if (this._checked === value) { return; }

  var changed = this._checked !== undefined;
  this._checked = value;

  if (value) {
    this.setAttribute('checked', '');
    this.els.inner.setAttribute('checked', '');
  } else {
    this.removeAttribute('checked');
    this.els.inner.removeAttribute('checked');
  }

  if (changed) {
    this.dispatchEvent(new CustomEvent('change'));
  }
};

proto.attributeChangedCallback = function(attr, oldVal, newVal) {
  if (attr === 'checked') {
    this.checked = newVal !== null;
  }
};

/**
 * Proxy the checked property to the input element.
 */
Object.defineProperty(proto, 'checked', {
  get: function() { return this._checked; },
  set: function(value) { this.setChecked(value); }
});

// HACK: Create a <template> in memory at runtime.
// When the custom-element is created we clone
// this template and inject into the shadow-root.
// Prior to this we would have had to copy/paste
// the template into the <head> of every app that
// wanted to use <gaia-switch>, this would make
// markup changes complicated, and could lead to
// things getting out of sync. This is a short-term
// hack until we can import entire custom-elements
// using HTML Imports (bug 877072).
var template = document.createElement('template');
template.innerHTML = `
<style>

gaia-switch {
  display: inline-block;
  position: relative;
}

/** Inner
 ---------------------------------------------------------*/

.inner {
  display: block;
  width: 50px;
  height: 32px;
}

/** Track
 ---------------------------------------------------------*/

.track {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 18px;

  /* Themeable */

  background:
    var(--switch-background,
    var(--background-minus,
    var(--background-plus,
    rgba(0,0,0,0.2))));
}

/** Track Background
 ---------------------------------------------------------*/

.track:after {
  content: " ";
  display: block;
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  border-radius: 25px;
  transform: scale(0);
  transition: transform 200ms ease;
  transition-delay: 300ms;

  /* Theamable */

  background-color:
    var(--highlight-color, #000)
}

/**
 * [checked]
 */

[checked] .track:after {
  transform: scale(1);
}

/** Handle
 ---------------------------------------------------------*/

.handle {
  position: relative;
  z-index: 1;
  width: 32px;
  height: 32px;
}

/**
 * transitions-on
 */

.transitions-on .handle {
  transition: transform 160ms linear;
}

/**
 * [checked]
 */

[checked] .handle {
  transform: translateX(18px)
}

/** Handle Head
 ---------------------------------------------------------*/

.handle-head {
  display: flex;
  box-sizing: border-box;
  width: 36px;
  height: 36px;
  position: relative;
  top: -2px;
  left: -2px;
  border-radius: 50%;
  border: 1px solid;
  cursor: pointer;
  align-items: center;
  justify-content: center;

  /* Themable */

  background:
    var(--switch-head-background,
    var(--input-background,
    var(--button-background,
    var(--background-plus,
    #fff))));

  border-color:
    var(--switch-head-border-color,
    var(--switch-background,
    var(--border-color,
    var(--background-minus,
    rgba(0,0,0,0.2)))));
}

/** Handle Head Circle
 ---------------------------------------------------------*/

.handle-head:after {
  content: "";
  display: block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  transform: scale(0);
  transition: transform 300ms ease;
  transition-delay: 600ms;

  /* Themeable */

  background:
    var(--highlight-color, #000)
}

/**
 * [checked]
 */

[checked] .handle-head:after {
  transform: scale(1);
}

</style>
<div class="inner js-inner">
  <div class="track js-track">
    <div class="handle js-handle">
      <div class="handle-head"></div>
    </div>
  </div>
</div>`;

addEventListener('keypress', function(e) {
  var isSpaceKey = e.which === 32;
  var el = document.activeElement;
  var isGaiaSwitch = el.tagName === 'GAIA-SWITCH';
  if (isSpaceKey && isGaiaSwitch) { el.toggle(); }
});

// Register and return the constructor
module.exports = document.registerElement('gaia-switch', { prototype: proto });

});})((function(n,w){return typeof define=='function'&&define.amd?
define:typeof module=='object'?function(c){c(require,exports,module);}:function(c){
var m={exports:{}},r=function(n){return w[n];};w[n]=c(r,m.exports,m)||m.exports;};})('gaia-switch',this));