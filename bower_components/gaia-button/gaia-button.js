(function(define){define(function(require,exports,module){
/*jshint esnext:true*/
'use strict';

/**
 * Dependencies
 */

var pressed = require('pressed');

/**
 * Prototype extends from
 * the HTMLElement.
 *
 * @type {Object}
 */
var proto = Object.create(HTMLButtonElement.prototype);

proto.createdCallback = function() {
  this.createShadowRoot().innerHTML = template;
  this.els = {
    inner: this.shadowRoot.querySelector('.inner'),
    content: this.shadowRoot.querySelector('.content')
  };

  this.circular = this.hasAttribute('circular');
  this.disabled = this.hasAttribute('disabled');
  this.setAttribute('role', 'button');
  this.tabIndex = 0;

  pressed(this.shadowRoot);
  this.styleHack();
};

proto.attributeChangedCallback = function(attr, from, to) {
  if (this.attrs[attr]) { this[attr] = to; }
};

proto.styleHack = function() {
  var style = this.shadowRoot.querySelector('style').cloneNode(true);
  this.classList.add('-host', '-content');
  style.setAttribute('scoped', '');
  this.appendChild(style);
};

proto.attrs = {
  circular: {
    get: function() { this.getAttribute('circular'); },
    set: function(value) {
      value = !!(value === '' || value);
      if (value) {
        this.setAttribute('circular', '');
        this.els.inner.setAttribute('circular', '');
      } else {
        this.removeAttribute('circular');
        this.els.inner.removeAttribute('circular');
      }
    }
  },

  disabled: {
    get: function() { this.getAttribute('disabled'); },
    set: function(value) {
      value = !!(value === '' || value);
      if (value) {
        this.setAttribute('disabled', '');
        this.els.inner.setAttribute('disabled', '');
      } else {
        this.removeAttribute('disabled');
        this.els.inner.removeAttribute('disabled');
      }
    }
  }
};

Object.defineProperties(proto, proto.attrs);

var template = `
<style>

.-host {
  display: inline-block;
  box-sizing: border-box;
  outline: 0;
}

/** Inner
 ---------------------------------------------------------*/

.inner {
  position: relative;
  height: 50px;
  border-radius: 50px;
  overflow: hidden;
  cursor: pointer;

  background:
    var(--button-background,
    var(--input-background,
    var(--background-plus,
    #fff)));

  color:
    var(--button-color,
    var(--text-color,
    inherit));

  box-shadow:
    var(--button-box-shadow,
    var(--box-shadow,
    none));
}

/**
 * [circular]
 */

.inner[circular] {
  width: 50px;
  height: 50px;
  border-radius: 50%;
}

/**
 * [disabled]
 */

.inner[disabled] {
  pointer-events: none;
  opacity: 0.5;
}

/**
 * .pressed
 */

.inner.pressed {
  color: var(--button-color-active, #fff);
  box-shadow: var(--button-box-shadow-active, none);
}

/** Background
 ---------------------------------------------------------*/

.background {
  content: '';
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;

  background:
    var(--button-background-active,
    var(--highlight-color,
    #333));
}

.pressed .background {
  opacity: 1;
}

.released .background {
  transition: opacity 200ms;
}

/** Content
 ---------------------------------------------------------*/

/**
 * 1. In some cases events seems to be getting
 *    swallowed by text-nodes. Ignoring pointer-
 *    events means we can listen on parent nodes
 *    instead.
 */

.content {
  position: relative;
  z-index: 2;
  padding: 0 25px;
  font-style: italic;
  font-size: 17px;
  text-align: center;
  line-height: 50px;
  text-align: center;
  pointer-events: none; /* 1 */
}

[circular] .content {
  padding: 0;
}

</style>
<div class="inner">
  <div class="background"></div>
  <div class="content"><content></content></div>
</div>`;

module.exports = document.registerElement('gaia-button', { prototype: proto });

});})((function(n,w){return typeof define=='function'&&define.amd?
define:typeof module=='object'?function(c){c(require,exports,module);}:function(c){
var m={exports:{}},r=function(n){return w[n];};w[n]=c(r,m.exports,m)||m.exports;};})('gaia-button',this));
