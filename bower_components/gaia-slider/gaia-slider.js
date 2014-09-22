;(function(umd){umd(function(require,exports,module){
/*jshint esnext:true*/
'use strict';

/**
 * Extend from the `HTMLElement` prototype
 *
 * @type {Object}
 */
var proto = Object.create(HTMLElement.prototype);

proto.createdCallback = function() {
  this.createShadowRoot().innerHTML = template;
  this.els = {};
  this.styleHack();
};

proto.styleHack = function() {
  var style = this.shadowRoot.querySelector('style').cloneNode(true);
  this.classList.add('-content', '-host');
  style.setAttribute('scoped', '');
  this.appendChild(style);
};

var template = `
<style>

::-moz-focus-outer { border: 0; }

/** Host
 ---------------------------------------------------------*/

.-host {
  display: block;
}

/** Input
 ---------------------------------------------------------*/

input {
  width: 100%;
  margin: 0;
  padding: 0;
}

/** Progress
 ---------------------------------------------------------*/

input::-moz-range-progress {
  background: var(--highlight-color);
  height: 3px;
}

/** Track
 ---------------------------------------------------------*/

input::-moz-range-track {
  width: 100%;
  height: 3px;
  border: none;
  background:
    var(--slider-background,
    var(--border-color,
    var(--background-minus)))
}

/** Thumb
 ---------------------------------------------------------*/

input::-moz-range-thumb {
  width: 34px;
  height: 34px;
  border-radius: 17px;
  background: var(--input-background);
  box-sizing:border-box;
  border: 1px solid var(--highlight-color, #000);
  position: relative;
  z-index: 100;
  left: 50%;
  transition: all 0.2s;
  transition-delay:  var(--button-transition-delay);
}

/**
 * :active
 */

input::-moz-range-thumb:active {
  box-shadow: 0 0 0 16px rgba(0, 202, 242, 0.2);
  transform: scale(1.1);
}

</style>

<div class="inner" id="inner">
  <input type="range" />
</div>`;

// Register and return the constructor
module.exports = document.registerElement('gaia-slider', { prototype: proto });

},'gaia-slider',this);})(function(c,n,w){if(typeof define=='function'&&define.amd){
define(function(require,exports,module){c(require,exports,module);});
}else if(typeof module=='object'){c(require,exports,module);}else{
var m={exports:{}};w[n]=c(function(n){return w[n];},m.exports,m)||m.exports;}});
