;(function(define){define(function(require,exports,module){
/*jshint esnext:true*/
'use strict';

/**
 * Dependencies
 */

var GaiaDialog = require('gaia-dialog');

/**
 * Extend from the `HTMLElement` prototype
 *
 * @type {Object}
 */
var proto = Object.create(GaiaDialog.proto);
var removeAttribute = HTMLElement.prototype.removeAttribute;
var setAttribute = HTMLElement.prototype.setAttribute;

/**
 * Runs when an instance of `GaiaTabs`
 * is first created.
 *
 * The initial value of the `select` attribute
 * is used to select a tab.
 *
 * @private
 */
proto.createdCallback = function() {
  this.createShadowRoot().innerHTML = template;

  this.els = {
    dialog: this.shadowRoot.querySelector('gaia-dialog'),
    submit: this.shadowRoot.querySelector('.submit')
  };

  this.els.submit.addEventListener('click', this.submit.bind(this));
  this.setupAnimationListeners();
  this.styleHack();
};

proto.submit = function() {
  this.open = false;
};

proto.setAttribute = function(attr, value) {
  this.els.dialog.setAttribute(attr, value);
  setAttribute.call(this, attr, value);
};

proto.removeAttribute = function(attr) {
  this.els.dialog.removeAttribute(attr);
  removeAttribute.call(this, attr);
};

var template = `
<style>
.shadow-host {
  display: none;
}

.shadow-host[open],
.shadow-host.animating {
  display: block;
  position: fixed;
  width: 100%;
  height: 100%;
}
</style>

<gaia-dialog>
  <section>
    <content></content>
  </section>
  <div>
    <button class="submit">Ok</button>
  </div>
</gaia-dialog>`;

// Register and expose the constructor
module.exports = document.registerElement('gaia-dialog-alert', { prototype: proto });
module.exports.proto = proto;

});})(typeof define=='function'&&define.amd?define
:(function(n,w){'use strict';return typeof module=='object'?function(c){
c(require,exports,module);}:function(c){var m={exports:{}};c(function(n){
return w[n];},m.exports,m);w[n]=m.exports;};})('gaia-dialog-alert',this));
