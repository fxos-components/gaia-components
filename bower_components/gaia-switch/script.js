(function(define){define(function(require,exports,module){
'use strict';

var utils = require('gaia-component-utils');

// Extend from the HTMLElement prototype
var proto = Object.create(HTMLElement.prototype);

// Allow baseurl to be overridden (used for demo page)
var packagesBaseUrl = window.packagesBaseUrl || '/bower_components/';
var baseUrl = window.GaiaSwitchBaseUrl || packagesBaseUrl + 'gaia-switch/';

var stylesheets = [
  { url: baseUrl + 'style.css', scoped: true }
];

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

  this.inner = tmpl.firstElementChild;

  this.checked = this.hasAttribute('checked');
  this.inner.addEventListener('click', this.onClick.bind(this));

  shadow.appendChild(tmpl);
  utils.style.call(this, stylesheets);

  // Bind label listeners in the next turn
  // to make sure that HTML has been parsed.
  setTimeout(this.bindLabels.bind(this));
};

proto.bindLabels = function() {
  if (!this.id) { return; }
  var fn = this.onClick.bind(this);
  var selector = 'label[for="' + this.id + '"]';
  var els = document.querySelectorAll(selector);
  [].forEach.call(els, function(el) { el.addEventListener('click', fn); });
};

proto.toggle = function(value) {
  this.checked = !arguments.length ? !this.hasAttribute('checked') : value;
};

proto.setChecked = function(value) {
  value = !!value;

  if (this._checked === value) { return; }

  var changed = this._checked !== undefined;
  this._checked = value;

  if (value) {
    this.setAttribute('checked', '');
    this.inner.setAttribute('checked', '');
  } else {
    this.removeAttribute('checked');
    this.inner.removeAttribute('checked');
  }

  if (changed) {
    var event = new CustomEvent('change');
    setTimeout(this.dispatchEvent.bind(this, event));
  }
};

proto.attributeChangedCallback = function(attr, oldVal, newVal) {
  if (attr === 'checked') {
    this.checked = newVal !== null;
  }
};

proto.onClick = function(e) {
  this.checked = !this.checked;

  // Dispatch a click event to any listeners to the app.
  // We should be able to remove this when bug 887541 lands.
  this.dispatchEvent(new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true
  }));
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
template.innerHTML = '<button class="inner">' +
    '<div class="track"></div>' +
    '<div class="handle"></div>' +
  '</button>';

// Register and return the constructor
return document.registerElement('gaia-switch', { prototype: proto });

});})((function(n,w){return typeof define=='function'&&define.amd?
define:typeof module=='object'?function(c){c(require,exports,module);}:function(c){
var m={exports:{}},r=function(n){return w[n];};w[n]=c(r,m.exports,m)||m.exports;};})('gaia-switch',this));