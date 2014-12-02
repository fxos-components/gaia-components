;(function(define){define(function(require,exports,module){

var component = require('gaia-component');

module.exports = component.register('gaia-progress', {
  created: function() {
    this.createShadowRoot().innerHTML = this.template;

    this.els = {
      inner: this.shadowRoot.querySelector('.inner'),
      bar: this.shadowRoot.querySelector('.bar'),
    }

    this.value = this.getAttribute('value') || 0;
  },

  fillTime: 2000,

  attrs: {
    value: {
      get: function() { return this._value || 0; },
      set: function(value) {

        // Clamp it
        value = Math.min(100, Math.max(0, Number(value)));

        if (value) {
          var delta = Math.abs(this.value - value);
          var duration = (delta / 100) * this.fillTime;
          this.els.bar.style.transform = `translateX(${value}%)`;
          this.els.bar.style.transitionDuration = duration + 'ms';
        }

        this.els.inner.classList.toggle('no-value', !value);
        this._value = value;
      }
    }
  },

  template: `
    <style>

      :host {
        display: block;
        overflow: hidden;
        height: 4px;
      }

      .inner {
        height: 100%;
        background:
          var(--border-color,
          var(--background-plus))
      }

      .bar {
        position: relative;
        top: 0;
        left: -100%;

        width: 100%;
        height: 100%;

        background: var(--highlight-color);
        transition: transform 0ms linear;
      }

      .bar:after {
        position: absolute;
        left: 100%;
        top: -8px;

        display: block;
        content: '';
        width: 0;
        height: 0;

        border-top: 8px solid transparent;
        border-bottom: 8px solid transparent;
        border-left: 8px solid var(--highlight-color);
      }

      .no-value .bar {
        left: 0;

        width: calc(100% + 150px);
        animation: moving-backward 1500ms infinite linear;
        background: repeating-linear-gradient(
          135deg,
          var(--highlight-color),
          var(--highlight-color) 50px,
          var(--border-color, var(--background-plus)) 50px,
          var(--border-color, var(--background-plus)) 100px);
      }

    </style>

    <div class="inner">
      <div class="bar"></div>
    </div>
  `,

  globalCss: `
    @keyframes moving-backward {
      0% { transform: translateX(0); }
      100% { transform: translateX(-142px); }
    }
  `
});

});})(typeof define=='function'&&define.amd?define
:(function(n,w){'use strict';return typeof module=='object'?function(c){
c(require,exports,module);}:function(c){var m={exports:{}};c(function(n){
return w[n];},m.exports,m);w[n]=m.exports;};})('gaia-progress',this));