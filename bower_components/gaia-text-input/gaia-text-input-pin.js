(function(define){define(function(require,exports,module){
/*jshint esnext:true*/
'use strict';

/**
 * Dependencies
 */

var GaiaInput = require('gaia-text-input');

var DEFAULT_LENGTH = 4;

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
 * Extend from the `HTMLElement` prototype
 *
 * @type {Object}
 */
var proto = Object.create(HTMLElement.prototype);

proto.createdCallback = function() {
  this.createShadowRoot().innerHTML = template;

  this.els = {
    inner: this.shadowRoot.querySelector('.inner'),
    fields: this.shadowRoot.querySelector('.fields'),
    input: this.shadowRoot.querySelector('input')
  };

  this.disabled = this.hasAttribute('disabled');
  this.length = this.getAttribute('length') || DEFAULT_LENGTH;

  this.addEventListener('focus', () => this.onFocus());
  this.addEventListener('keyup', () => this.updateCells());

  shadowStyleHack(this);
};

proto.onFocus = function() {
  this.els.input.focus();
  this.updateCells();
};

proto.updateCells = function() {
  var l = this.els.input.value.length;
  this.els.cells.forEach((cell, i) => {
    cell.classList.toggle('populated', i < l);
    cell.classList.toggle('focused', i == l);
  });
};

proto.onBackspace = function(e) {
  var input = e.target;
  var empty = !input.value;
  var previous = input.previousElementSibling;

  if (!empty && previous) {
    previous.clear();
    previous.focus();
  } else if (empty && previous) {
    previous.focus();
  }
};

proto.setupFields = function() {
  this.els.fields.innerHTML = '';
  this.els.cells = [];

  for (var i = 0, l = this.length; i < l; i++) {
    var el = document.createElement('div');
    el.className = 'cell';
    this.els.fields.appendChild(el);
    this.els.cells.push(el);
  }
};

proto.attributeChangedCallback = function(attr, from, to) {
  if (attrs[attr]) { this[attr] = to; }
};

proto.clear = function(e) {
  this.value = '';
};

/**
 * Attributes
 */

var attrs = {
  length: {
    get: function() { return this._length; },
    set: function(value) {
      value = Number(value);
      this._length = value;
      this.els.input.setAttribute('maxlength', this.length);
      this.setupFields();
    }
  },

  value: {
    get: function() { return this.els.input.value; },
    set: function(value) { this.els.input.value = value; }
  },

  disabled: {
    get: function() { return this.els.input.disabled; },
    set: function(value) {
      value = !!(value === '' || value);
      this.els.input.disabled = value;
    }
  }
};

Object.defineProperties(proto, attrs);

/**
 * Shadow Template
 */

var template = `
<style>

/** Host
 ---------------------------------------------------------*/

:host {
  display: block;
  height: 40px;
  margin: var(--base-m, 18px);
  font-size: 40px;
}

/** Inner
 ---------------------------------------------------------*/

.inner {
  height: 100%;
}

/** Label
 ---------------------------------------------------------*/

label {
  font-size: 14px;
  display: block;
  margin: 0 0 4px 16px;
}

/** Input (hidden)
 ---------------------------------------------------------*/

input {
  opacity: 0;
  position: absolute;
}

/** Fields
 ---------------------------------------------------------*/

.fields {
  display: flex;
  position: relative;
  height: 100%;
  margin-left: -1rem;
}

/**
 * [disbled]
 */

[disabled] + .fields {
  pointer-events: none;
}

/** Cell
 ---------------------------------------------------------*/

.cell {
  position: relative;
  height: 100%;
  margin-left: 1rem;
  flex: 1;

  /* dynamic */

  --gi-border-color:
    var(--input-border-color,
    var(--border-color,
    var(--background-plus,
    #e7e7e7)));

  border-color:
    var(--gi-border-color);

  border:
    var(--input-border,
    var(--border,
    1px solid var(--gi-border-color)));

  background:
    var(--text-input-background,
    var(--input-background,
    var(--background-minus,
    #fff)));
}

/**
 * [disbled]
 */

[disabled] + .fields .cell {
  background: none;
}

/** Dot
 ---------------------------------------------------------*/

.cell::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 14px;
  height: 14px;
  margin: -7px;
  border-radius: 50%;
  opacity: 0;

  /* dynamic */

  background:
    var(--text-color);
}

/**
 * .populated
 */

.cell.populated::after {
  opacity: 1;
}

.cell::before {
  content: '';
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 3px;
  visibility: hidden;
  background: var(--highlight-color, #000);
}

/**
 * input:focus
 */

input:focus + .fields .cell::before {
  visibility: visible;
}

</style>

<div class="inner">
  <content select="label"></content>
  <input tabindex="-1"/>
  <div class="fields" tabindex="0"></div>
</div>`;

// If the browser doesn't support shadow-css
// selectors yet, we update the template
// to use the shim classes instead.
if (!hasShadowCSS) {
  template = template
    .replace('::content', 'gaia-text-input-pin', 'g')
    .replace(':host', 'gaia-text-input-pin', 'g');
}

function shadowStyleHack(el) {
  if (hasShadowCSS) { return; }
  var style = el.shadowRoot.querySelector('style').cloneNode(true);
  style.setAttribute('scoped', '');
  el.appendChild(style);
}

// Register and return the constructor
module.exports = document.registerElement('gaia-text-input-pin', { prototype: proto });

});})((function(n,w){return typeof define=='function'&&define.amd?
define:typeof module=='object'?function(c){c(require,exports,module);}:function(c){
var m={exports:{}},r=function(n){return w[n];};w[n]=c(r,m.exports,m)||m.exports;};})('gaia-text-input-pin',this));