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
  margin: var(--dim-small) 0 0 0;
  padding: 0 var(--dim-small) 0 var(--dim-small);
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
  color: var(--color-zeta);
  margin: 0 var(--dim-small) 0 var(--dim-small);
  padding: 0;
  text-transform: uppercase;
  font-size: 14px;
  font-weight: normal;
}

a,
button {
  position: relative;
  display: block;
  padding-right: var(--dim-small);
  font: inherit;
  color: var(--highlight-color);
  cursor: pointer;
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
  top: 3px;
  right: 0px;
  border-bottom: 10px solid var(--highlight-color, var(--color-zeta));
  border-left: 10px solid transparent;
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
