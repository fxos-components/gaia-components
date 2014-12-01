;(function(define){define(function(require,exports,module){
/*jshint esnext:true*/

var component = require('gaia-component');

module.exports = component.register('gaia-value-selector', {
  created: function() {
    this.createShadowRoot().innerHTML = this.template;

    this.els = {
      inner: this.shadowRoot.querySelector('.inner'),
      bar: this.shadowRoot.querySelector('.bar'),
    };

    this.onSelectorChange = this.onSelectorChange.bind(this);
    this.value = this.getAttribute('value') || 0;
  },

  onSelectorChange: function(e) {
    var value = typeof e.detail.value != 'undefined' ? e.detail.value : e.target.value;
    this.textContent = value;
  },

  attrs: {
    selector: {
      get: function() { return this._selector; },
      set: function(selector) {
        if (this.selector) {
          this.selector.removeEventListener('change', this.onSelectorChange);
        }

        selector.addEventListener('change', this.onSelectorChange);
        this._selector = selector;
      }
    }
  },

  template: `
    <div class="inner">
      <content></content>
    </div>

    <style>
      :host {
        display: inline-block;
        padding: 0 var(--base-s, 18px);

        font-size: 16px;
        font-style: italic;
        font-weight: 400;
        color: var(--highlight-color);
        cursor: pointer;
      }

      .inner {
        position: relative;
        padding-right: 15px;
      }

      .inner:after {
        content: " ";
        position: absolute;
        width: 0;
        height: 0;
        bottom: 5px;
        right: 0;
        border-bottom: 9px solid;
        border-left: 9px solid transparent;
      }
    </style>`
});

});})(typeof define=='function'&&define.amd?define
:(function(n,w){'use strict';return typeof module=='object'?function(c){
c(require,exports,module);}:function(c){var m={exports:{}};c(function(n){
return w[n];},m.exports,m);w[n]=m.exports;};})('gaia-value-selector',this));