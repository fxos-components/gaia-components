;(function(define){define(function(require,exports,module){
/*jshint esnext:true*/
'use strict';

/**
 * Dependencies
 */

var pressed = require('pressed');

/**
 * Extend from the `HTMLElement` prototype
 *
 * @type {Object}
 */
var proto = Object.create(HTMLElement.prototype);

proto.createdCallback = function() {
  this.createShadowRoot().innerHTML = template;

  this.els = {
    input: this.shadowRoot.querySelector('input'),
    value: this.shadowRoot.querySelector('.value'),
    output: this.querySelector('output')
  };

  this.els.input.addEventListener('input', this.onChange.bind(this));
  pressed(this);

  this.updateOutput();
  this.shadowStyleHack();
};

proto.shadowStyleHack = function() {
  var style = this.shadowRoot.querySelector('style').cloneNode(true);
  this.classList.add('-content', '-host');
  style.setAttribute('scoped', '');
  this.appendChild(style);
};

proto.onChange = function(e) {
  this.updateOutput();
};

proto.updateOutput = function() {
  if (!this.els.output) { return; }
  this.els.output.textContent = this.els.input.value;
};

var template = `
<style>

::-moz-focus-outer { border: 0; }

/** Host
 ---------------------------------------------------------*/

.-host {
  display: block;
}

/** Head
 ---------------------------------------------------------*/

.head {
  position: relative;
  margin-bottom: 14px;
}

.-content label {
  display: block;
  line-height: 1;
}


.-content output {
  display: block;
  position: absolute;
  right: 0; bottom: 0;
  text-align: right;
  font-size: 17px;
  font-style: italic;
  font-weight: 400;
  line-height: 1;
  transition: transform 200ms;
  transform-origin: 100% 50%;

  color:
    var(--text-color);
}

.-content output:after {
  content: '%';
}

.pressed output {
  transform: scale(1.25);
  color: var(--highlight-color);
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

::-moz-range-progress {
  background: var(--highlight-color);
  height: 3px;
}

/** Track
 ---------------------------------------------------------*/

::-moz-range-track {
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

::-moz-range-thumb {
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

::-moz-range-thumb:active {
  box-shadow: 0 0 0 16px rgba(0, 202, 242, 0.2);
  transform: scale(1.1);
}

</style>

<div class="inner">
  <div class="head">
    <content select="label,output"></content>
  </div>
  <input type="range"/>
</div>`;

// Register and return the constructor
module.exports = document.registerElement('gaia-slider', { prototype: proto });

});})(typeof define=='function'&&define.amd?define
:(function(n,w){'use strict';return typeof module=='object'?function(c){
c(require,exports,module);}:function(c){var m={exports:{}};c(function(n){
return w[n];},m.exports,m);w[n]=m.exports;};})('gaia-slider',this));
