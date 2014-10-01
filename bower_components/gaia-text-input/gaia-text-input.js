(function(define){define(function(require,exports,module){
/*jshint esnext:true*/
'use strict';

// Load gaia-icons
require('gaia-icons');

/**
 * Extend from the `HTMLElement` prototype
 *
 * @type {Object}
 */
var proto = Object.create(HTMLElement.prototype);

proto.createdCallback = function() {
  var shadow = this.createShadowRoot();
  var tmpl = template.content.cloneNode(true);

  this.els = {
    textarea: tmpl.querySelector('textarea'),
    inner: tmpl.querySelector('.inner'),
    input: tmpl.querySelector('input'),
    clear: tmpl.querySelector('.clear')
  };

  //
  this.els.field = this.els.input;

  this.type = this.getAttribute('type');
  this.disabled = this.hasAttribute('disabled');
  this.placeholder = this.getAttribute('placeholder');
  this.required = this.getAttribute('required');
  this.value = this.getAttribute('value');

  // Don't take focus from the input field
  this.els.clear.addEventListener('mousedown', function(e) { e.preventDefault(); });
  this.els.clear.addEventListener('click', this.clear.bind(this));

  shadow.appendChild(tmpl);
  this.shadowStyleHack();
};

proto.attributeChangedCallback = function(attr, from, to) {
  if (this.attrs[attr]) { this[attr] = to; }
};

proto.shadowStyleHack = function() {
  var style = this.shadowRoot.querySelector('style');
  style.setAttribute('scoped', '');
  this.appendChild(style.cloneNode(true));
};

proto.configureField = function() {
  var previous = this.els.field;
  this.multiline = this.type == 'multiline';
  this.els.field = this.multiline ? this.els.textarea : this.els.input;
  if (!this.multiline) { this.els.field.type = this.type; }
  if (previous) { this.els.field.value = previous.value; }
};

proto.clear = function(e) {
  this.value = '';
};

proto.attrs = {
  type: {
    get: function() { return this.els.inner.getAttribute('type'); },
    set: function(value) {
      if (!value) { return; }
      this.els.inner.setAttribute('type', value);
      this.configureField();
    }
  },

  placeholder: {
    get: function() { return this.field.placeholder; },
    set: function(value) {
      if (!value && value !== '') { return; }
      this.els.textarea.placeholder = value;
      this.els.input.placeholder = value;
    }
  },

  value: {
    get: function() { return this.els.field.value; },
    set: function(value) { this.els.field.value = value; }
  },

  required: {
    get: function() { return this.els.field.required; },
    set: function(value) {
      this.els.textarea.required = value;
      this.els.input.required = value;
    }
  },

  disabled: {
    get: function() { return this.els.field.disabled; },
    set: function(value) {
      value = !!(value === '' || value);
      this.els.textarea.disabled = value;
      this.els.input.disabled = value;
    }
  }
};

Object.defineProperties(proto, proto.attrs);

// HACK: Create a <template> in memory at runtime.
// When the custom-element is created we clone
// this template and inject into the shadow-root.
// Prior to this we would have had to copy/paste
// the template into the <head> of every app that
// wanted to use <gaia-textinput>, this would make
// markup changes complicated, and could lead to
// things getting out of sync. This is a short-term
// hack until we can import entire custom-elements
// using HTML Imports (bug 877072).
var template = document.createElement('template');
template.innerHTML = `
<style>

/** Reset
 ---------------------------------------------------------*/

input,
button,
textarea {
  box-sizing: border-box;
  border: 0;
  margin: 0;
  padding: 0;
}

/** Host
 ---------------------------------------------------------*/

gaia-text-input {
  display: block;
  margin-bottom: 16px;
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

/**
 * [disbled]
 */

[disabled] label {
  opacity: 0.3;
}

/** Fields
 ---------------------------------------------------------*/

.fields {
  position: relative;
  width: 100%;
  height: 100%;

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
}

/**
 * [type='search']
 */

[type='search'] .fields {
  border-radius: 30px;
  overflow: hidden;
}

/**
 * [type='multiline']
 */

[type='multiline'] .single-line {
  display: none;
}

/** Input Field
 ---------------------------------------------------------*/

input,
textarea {
  display: block;
  width: 100%;
  height: 40px;
  font-size: inherit;
  border: none;
  padding: 0 16px;
  margin: 0;
  font: inherit;
  resize: none;

  color:
    var(--input-color, #000);

  background:
    var(--text-input-background,
    var(--input-background,
    var(--background-minus,
    #fff)));
}

/**
 * [disabled]
 */

input[disabled],
textarea[disabled] {
  background: transparent;
}

/** Placeholder Text
 ---------------------------------------------------------*/

::-moz-placeholder {
  font-style: italic;

  color:
    var(--input-placeholder-color, #909ca7);
}

/** Clear Button
 ---------------------------------------------------------*/

.clear {
  position: absolute;
  top: 12px;
  right: 10px;
  width: 17px;
  height: 17px;
  padding: 0;
  margin: 0;
  border-radius: 50%;
  opacity: 0;
  color: #fff;

  background:
    var(--input-clear-background, #999);
}

/**
 * input:focus
 */

input:focus ~ .clear {
  opacity: 1;
}

/** Clear Icon
 ---------------------------------------------------------*/

.clear:before {
  font-family: 'gaia-icons';
  content: 'close';
  display: block;
  font-style: normal;
  font-weight: 500;
  text-rendering: optimizeLegibility;
  font-size: 19px;
  line-height: 1;
  margin-top: -2px;
}

/** Focus Bar
 ---------------------------------------------------------*/

.focus {
  position: absolute;
  bottom: 0px;
  width: 100%;
  height: 3px;
  transition: all 200ms;
  transform: scaleX(0);
  visibility: hidden;
  background: var(--highlight-color, #000);
}

/**
 * input:focus
 */

:focus ~ .focus {
  transform: scaleX(1);
  transition-delay: 200ms;
  visibility: visible;
}

/** Textarea Container
 ---------------------------------------------------------*/

.multiline {
  display: none;
  height: 100%;
}

/**
 * [type='multiline']
 */

[type='multiline'] .multiline {
  display: block;
}

/** Textarea
 ---------------------------------------------------------*/

textarea {
  height: 100%;
  min-height: 86px;
  padding: 10px 16px;
}

</style>

<div class="inner">
  <content select="label"></content>
  <div class="fields">
    <div class="single-line">
      <input type="text"/>
      <button class="clear" tabindex="-1"></button>
      <div class="focus"></div>
    </div>
    <div class="multiline">
      <textarea></textarea>
      <div class="focus"></div>
    </div>
  </div>
</div>`;

// Register and return the constructor
module.exports = document.registerElement('gaia-text-input', { prototype: proto });

});})((function(n,w){return typeof define=='function'&&define.amd?
define:typeof module=='object'?function(c){c(require,exports,module);}:function(c){
var m={exports:{}},r=function(n){return w[n];};w[n]=c(r,m.exports,m)||m.exports;};})('gaia-text-input',this));