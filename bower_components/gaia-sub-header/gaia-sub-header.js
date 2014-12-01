(function(define){'use strict';define(function(require,exports,module){
/*jshint esnext:true*/
/*jshint node:true*/
/*globals define*/

var pressed = require('pressed');

/**
 * Prototype extends from the HTMLElement.
 *
 * @type {Object}
 */
var proto = Object.create(HTMLElement.prototype);


proto.createdCallback = function() {
  this.createShadowRoot().innerHTML = template;
  this.styleHack();
  pressed(this);
};

proto.styleHack = function() {
  var style = this.shadowRoot.querySelector('style').cloneNode(true);
  this.classList.add('-content', '-host');
  style.setAttribute('scoped', '');
  this.appendChild(style);
};

var template = `
<style>

gaia-sub-header {
  display: flex;
  margin: 30px 0 16px;
  padding: 0 15px;
  align-items: center;
}

.line {
  position: relative;
  height: 2px;
  flex: 1;

  background:
    var(--border-color,
    var(--background-plus));
}

.middle {
  margin: 0 14px 0 14px;
  padding: 0;
  text-transform: uppercase;
  font-size: 14px;
  font-weight: normal;

  color:
    var(--color-zeta);
}

a,
button {
  position: relative;
  display: block;
  padding-right: 16px;
  font: inherit;
  cursor: pointer;

  color:
    var(--highlight-color);
}

/**
 * .pressed
 */

a.pressed,
button.pressed {
  opacity: 0.5;
}

a:after,
button:after {
  content: " ";
  position: absolute;
  width: 0px;
  height: 0px;
  top: 6px;
  right: 0px;
  border-bottom: 8px solid;
  border-left: 8px solid transparent;

  border-bottom-color:
    var(--highlight-color,
    var(--color-zeta))
}

</style>

<div class="line left"></div>
<div class="middle"><content></content></div>
<div class="line right"></div>`;

// Register and return the constructor
module.exports = document.registerElement('gaia-sub-header', { prototype: proto });

});})((function(n,w){'use strict';return typeof define=='function'&&define.amd?
define:typeof module=='object'?function(c){c(require,exports,module);}:
function(c){var m={exports:{}},r=function(n){return w[n];};
w[n]=c(r,m.exports,m)||m.exports;};})('gaia-sub-header',this));
