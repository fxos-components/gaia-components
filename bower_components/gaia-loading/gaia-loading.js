;(function(define){define(function(require,exports,module){
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
  this.shadowStyleHack();
};

proto.shadowStyleHack = function() {
  var style = this.shadowRoot.querySelector('style').cloneNode(true);
  this.classList.add('-content', '-host');
  style.setAttribute('scoped', '');
  this.appendChild(style);
};

var template = `
<style>

/** Host
 ---------------------------------------------------------*/

.-host {
  position: relative;
  display: block;
  width: 40px;
  height: 40px;
  margin: var(--base-l, 24px) auto;
}

/** Circle
 ---------------------------------------------------------*/

.circle {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;

  animation-name: gaia-loading-animation;
  animation-iteration-count: infinite;
  animation-timing-function: cubic-bezier(0,.64,.46,.46);
  animation-duration: 2000ms;

  background:
    var(--highlight-color);
}

.circle-2 {
  animation-delay: 395ms;
}

</style>

<div class="circle circle-1"></div>
<div class="circle circle-2"></div>`;

// Currently @keyframe animation
// declarations have to be global.
// Defining them inside scoped/shadow
// stylesheets doesn't work.
(function() {
  var style = document.createElement('style');

  style.innerHTML = `
    @keyframes gaia-loading-animation {
      0% {
        transform: scale(0);
        opacity: 0.9;
      }
      40% {
        transform: scale(1.4);
        opacity: 0;
      }
      100% {
        transform: scale(2);
        opacity: 0;
      }
    }
  `;

  document.head.appendChild(style);
})();

// Register and return the constructor
module.exports = document.registerElement('gaia-loading', { prototype: proto });

});})(typeof define=='function'&&define.amd?define
:(function(n,w){'use strict';return typeof module=='object'?function(c){
c(require,exports,module);}:function(c){var m={exports:{}};c(function(n){
return w[n];},m.exports,m);w[n]=m.exports;};})('gaia-loading',this));
