(function(define){define(function(require,exports,module){
/*jshint esnext:true*/
'use strict';

/**
 * Prototype extends from
 * the HTMLElement.
 *
 * @type {Object}
 */
var proto = Object.create(HTMLElement.prototype);

proto.createdCallback = function() {
  this.createShadowRoot().innerHTML = template;
  this.styleHack();
};

proto.styleHack = function() {
  var style = this.shadowRoot.querySelector('style').cloneNode(true);
  style.setAttribute('scoped', '');
  this.appendChild(style);
};

var template = `
<style>

gaia-button {
  display: inline-block;
  box-sizing: border-box;
  height: 50px;
  font-style: italic;
  font-size: 17px;
  text-align: center;
  line-height: 50px;
  padding: 0 25px;
  text-align: center;
  margin: 0;
  border: 0;
  border-radius: 50px;
  cursor: pointer;
  transition: all 200ms 300ms;

  color:
    var(--button-color,
    var(--text-color,
    inherit));

  box-shadow:
    var(--button-box-shadow,
    var(--box-shadow,
    none));

  background:
    var(--button-background,
    var(--input-background,
    var(--background-plus,
    #fff)));
}

/**
 * [circular]
 */

gaia-button[circular] {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  padding: 0;
}

/**
 * :active
 */

gaia-button:active {
  color: var(--button-color-active, #fff);
  transition: none;

  background:
    var(--button-background-active,
    var(--highlight-color,
    #333));

  box-shadow:
    var(--button-box-shadow-active, none);
}

gaia-button:before {
  vertical-align: middle;
}

</style>
<content></content>`;

return document.registerElement('gaia-button', { prototype: proto });

});})((function(n,w){return typeof define=='function'&&define.amd?
define:typeof module=='object'?function(c){c(require,exports,module);}:function(c){
var m={exports:{}},r=function(n){return w[n];};w[n]=c(r,m.exports,m)||m.exports;};})('gaia-button',this));
