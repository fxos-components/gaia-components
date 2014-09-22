(function(define){define(function(require,exports,module){
/*jshint esnext:true*/
'use strict';

/**
 * Locals
 */

var baseComponents = window.COMPONENTS_BASE_URL || 'bower_components/';
var base = window.GAIA_CHECKBOX_BASE_URL || baseComponents + 'gaia-checkbox/';

// Load gaia-icons
require('gaia-icons')(baseComponents);

/**
 * Prototype extends from
 * the HTMLElement.
 *
 * @type {Object}
 */
var proto = Object.create(HTMLElement.prototype);

/**
 * Attributes supported
 * by this component.
 *
 * @type {Object}
 */
proto.attrs = {
  checked: true,
  danger: true,
  name: true
};

proto.createdCallback = function() {
  var tmpl = template.content.cloneNode(true);
  var shadow = this.createShadowRoot();

  this.els = { inner: tmpl.querySelector('.inner') };
  this.els.inner.addEventListener('click', this.onClick.bind(this));

  // Setup initial attributes
  this.checked = this.getAttribute('checked');
  this.danger = this.getAttribute('danger');
  this.name = this.getAttribute('name');

  // Make tabable
  this.tabIndex = 0;

  shadow.appendChild(tmpl);
};

proto.bindLabels = function() {
  if (!this.id) { return; }
  var fn = this.onClick.bind(this);
  var selector = 'label[for="' + this.id + '"]';
  var els = document.querySelectorAll(selector);
  [].forEach.call(els, function(el) { el.addEventListener('click', fn); });
};

proto.attributeChangedCallback = function(name, from, to) {
  if (this.attrs[name]) { this[name] = to; }
};

proto.onClick = function(e) {
  this.checked = !this.checked;
};

proto.toggle = function(value) {
  value = arguments.length ? value : !this.checked;
  if (value || value === '') { this.check(); }
  else { this.uncheck(); }
};

proto.check = function() {
  if (this.checked) { return; }
  this.els.inner.setAttribute('checked', '');
  this.setAttribute('checked', '');
  this._checked = true;
};

proto.uncheck = function() {
  if (!this.checked) { return; }
  this.els.inner.removeAttribute('checked');
  this.removeAttribute('checked');
  this._checked = false;
};

Object.defineProperties(proto, {
  checked: {
    get: function() { return !!this._checked; },
    set: proto.toggle
  },
  danger: {
    get: function() { return this._danger; },
    set: function(value) {
      if (value || value === '') { this.els.inner.setAttribute('danger', value); }
      else { this.els.inner.removeAttribute('danger'); }
      this._danger = value;
    }
  },
  name: {
    get: function() { return this._name; },
    set: function(value) {
      if (value === null) { this.els.inner.removeAttribute('name'); }
      else { this.els.inner.setAttribute('name', value); }
      this._name = value;
    }
  }
});

var template = document.createElement('template');
template.innerHTML = `
<style>

/** Reset
 ---------------------------------------------------------*/

* { box-sizing: border-box }

/** Host
 ---------------------------------------------------------*/

gaia-checkbox {
  position: relative;
  display: inline-block;
  width: 28px;
  height: 28px;
  cursor: pointer;
}

/** Inner
 ---------------------------------------------------------*/

.inner {
  display: block;
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid #a6a6a6;
  overflow: hidden;
  z-index: 0;

  border-color:
    var(--checkbox-border-color,
    var(--border-color,
    var(--background-minus)));

  background:
    var(--checkbox-background,
    var(--input-background,
    var(--button-background,
    var(--background-plus))));
}

/** Background
 ---------------------------------------------------------*/

.background {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  top: 0px;
  left: 0px;
  position: absolute;
  z-index: -1;
  transform: scale(0);
  transition: all 0.2s;
  transition-delay: 0.2s;

  background: var(--highlight-color, #000);
}

/**
 * :active
 */

.inner:active .background {
  transform: scale(1);
  transition: none;
}

/** Tick
 ---------------------------------------------------------*/

.tick {
  opacity: 0;
  color: var(--highlight-color, #000);
  text-align: center;
  line-height: 26px
}

/**
 * [checked]
 */

[checked] .tick {
  opacity: 1;
}

/** Icon
 ---------------------------------------------------------*/

.tick:before {
  font-family: 'gaia-icons';
  content: 'tick';
  font-style: normal;
  font-weight: 500;
  text-rendering: optimizeLegibility;
  font-size: 16px;
  line-height: 1;
}

</style>

<div class="inner">
  <div class="background"></div>
  <div class="tick"></div>
</div>`;


document.addEventListener('click', function(e) {
  var label = getLabel(e.target);
  var checkbox = getLinkedCheckbox(label);
  if (checkbox) { checkbox.toggle(); }
}, true);

function getLinkedCheckbox(label) {
  if (!label) { return; }
  var id = label.getAttribute('for');
  var checkbox = id && document.getElementById(id);
  return checkbox || label.querySelector('gaia-checkbox');
}

function getLabel(el) {
  return el && (el.tagName == 'LABEL' ? el : getLabel(el.parentNode));
}

addEventListener('keypress', function(e) {
  var isSpace = e.which === 32;
  var el = document.activeElement;
  var isCheckbox = el.tagName === 'GAIA-CHECKBOX';
  if (isSpace && isCheckbox) { el.toggle(); }
});


// Register and return the constructor
module.exports = document.registerElement('gaia-checkbox', { prototype: proto });

});})(typeof define=='function'&&define.amd?define
:(function(n,w){return typeof module=='object'?function(c){
c(require,exports,module);}:function(c){var m={exports:{}};c(function(n){
return w[n];},m.exports,m);w[n]=m.exports;};})('gaia-checkbox',this));