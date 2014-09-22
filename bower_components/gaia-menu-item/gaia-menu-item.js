;(function(define){'use strict';define(function(require,exports,module){
/*jshint esnext:true*/

/**
 * Dependencies
 */

require('gaia-icons');

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

// console.log(hasShadowCSS);

/**
 * Element prototype, extends from HTMLElement
 *
 * @type {Object}
 */
var proto = Object.create(HTMLElement.prototype);

/**
 * Called when the element is first created.
 *
 * Here we create the shadow-root and
 * inject our template into it.
 *
 * @private
 */
proto.createdCallback = function() {
  this.createShadowRoot().innerHTML = template;

  // Get els
  this.els = {
    inner: this.shadowRoot.querySelector('.inner')
  };

  this.addEventListener('mousedown', this.onClick.bind(this));
  this.addEventListener('touchstart', this.onClick.bind(this));
  this.tabIndex = 0;

  this.shadowStyleHack();
};

proto.shadowStyleHack = function() {
  if (hasShadowCSS) { return; }
  var style = this.shadowRoot.querySelector('style').cloneNode(true);
  this.classList.add('-content', '-host');
  style.setAttribute('scoped', '');
  this.appendChild(style);
};

proto.attachedCallback = function() {
  this.restyleShadowDom();
  this.rerunFontFit();
};

/**
 * Workaround for bug 1056783.
 *
 * Fixes shadow-dom stylesheets not applying
 * when shadow host node is detached on
 * shadow-root creation.
 *
 * TODO: Needs abstraction
 *
 * @private
 */
proto.restyleShadowDom = function() {
  var style = this.shadowRoot.querySelector('style');
  this.shadowRoot.removeChild(style);
  this.shadowRoot.appendChild(style);
};

proto.onClick = function(e) {
  var el = document.createElement('div');
  var pos = this.getBoundingClientRect();
  var offset = {
    x: e.clientX - pos.left,
    y: e.clientY - pos.top
  };

  el.className = 'ripple';
  el.style.left = offset.x + 'px';
  el.style.top = offset.y + 'px';
  el.addEventListener('animationend', el.remove.bind(el));
  this.appendChild(el);
};

var template = `
<style>

:host {
  display: block;
  position: relative;
  padding: 0 16px;
  font-size: 17px;
  overflow: hidden;
}

/** Inner
 ---------------------------------------------------------*/

.inner,
::content a {
  position: relative;
  display: flex;
  align-items: center;
  padding: 18px 0;
  font-style: normal;
}

/** Border
 ---------------------------------------------------------*/

.inner:before {
  content: '';
  position: absolute;
  bottom: 0px;
  left: 0;
  right: 0;
  height: 1px;
  background:
    var(--border-color,
    var(--text-color));
}

/** Forward Icon
 ---------------------------------------------------------*/

.inner:after {
  content: 'forward';
  display: block;
  position: absolute;
  top: 50%;
  right: 0;
  margin-top: -14px;
  font-family: 'gaia-icons';
  font-size: 28px;
  font-style: normal;
  text-rendering: optimizeLegibility;
  font-weight: 500;
  line-height: 1;
  color: var(--text-color-minus);
}

/** Anchors
 ---------------------------------------------------------*/

::content a {
  width: 100%;
  margin: -16px 0;
  color: var(--text-color);
}

/** Icon
 ---------------------------------------------------------*/

::content i {
  display: block;
  width: 40px;
}

::content i:before {
  display: block;
}

/** Ripple
 ---------------------------------------------------------*/

.ripple {
  background: var(--color-epsilon);
  position: absolute;
  left: 0;
  top: 0;
  width: 30px;
  height: 30px;
  margin: -15px;
  border-radius: 50%;
  animation: gaia-menu-item-ripple 400ms linear;
  animation-fill-mode: forwards;
  will-change: transform, opacity;
}

</style>

<div class="inner"><content></content></div>`;

// If the browser doesn't support shadow-css
// selectors yet, we update the template
// to use the shim classes instead.
if (!hasShadowCSS) {
  template = template
    .replace('::content', '.-content', 'g')
    .replace(':host', '.-host', 'g');
}



(function() {
  var style = document.createElement('style');

  style.innerHTML = `
    @keyframes gaia-menu-item-ripple {
      0% {
        opacity: 0.6;
        transform: scale(1);
      }
      100% {
        opacity: 0.2;
        transform: scale(50);
      }
    }`;

  document.head.appendChild(style);
})();


addEventListener('keypress', function(e) {
  var isSpace = e.which === 32;
  var el = document.activeElement;
  var isCheckbox = el.tagName === 'GAIA-MENU-ITEM';
  if (isSpace && isCheckbox) { el.click(); }
});

// Register and return the constructor
// and expose `protoype` (bug 1048339)
module.exports = document.registerElement('gaia-menu-item', { prototype: proto });
module.exports.proto = proto;

});})(typeof define=='function'&&define.amd?define
:(function(n,w){'use strict';return typeof module=='object'?function(c){
c(require,exports,module);}:function(c){var m={exports:{}};c(function(n){
return w[n];},m.exports,m);w[n]=m.exports;};})('gaia-menu-item',this));
