;(function(define){define(function(require,exports,module){
/*jshint esnext:true*/
'use strict';

/**
 * Dependencies
 */

var component = require('gaia-component');

module.exports = component.register('gaia-slider', {
  created: function() {
    this.setupShadowRoot();

    this.els = {
      input: this.shadowRoot.querySelector('input'),
      value: this.shadowRoot.querySelector('.value'),
      output: this.querySelector('output')
    };

    this.els.input.addEventListener('input', this.onChange.bind(this));

    this.updateOutput();
    this.shadowStyleHack();
  },

  onChange: function(e) {
    this.updateOutput();
  },

  updateOutput: function() {
    if (!this.els.output) { return; }
    this.els.output.textContent = this.els.input.value;
  },

  template: `
    <div class="inner">
      <div class="head">
        <content select="label,output"></content>
      </div>
      <input type="range"/>
    </div>
    <style>

    ::-moz-focus-outer { border: 0; }

    /** Host
     ---------------------------------------------------------*/

    :host {
      display: block;
      margin: var(--base-m, 18px);
    }

    /** Head
     ---------------------------------------------------------*/

    .head {
      position: relative;
      margin-bottom: 14px;
    }

    ::content label {
      display: block;
      line-height: 1;
      text-align: start;
    }

    ::content output {
      display: block;
      position: absolute;
      right: 0;
      bottom: 0;
      width: 100%;
      text-align: end;
      font-size: 17px;
      font-style: italic;
      font-weight: 400;
      line-height: 1;
      transition: transform 200ms;
      transform-origin: 100% 50%;

      color:
        var(--text-color);
    }

    ::content output:after {
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
      background: none;
      border: 0;
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
      border: 0;

      background:
        var(--slider-background,
        var(--border-color,
        var(--background-minus)));
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

    input:active::-moz-range-thumb {
      box-shadow: 0 0 0 16px rgba(0, 202, 242, 0.2);
      transform: scale(1.1);
    }

    </style>
  `
});

});})(typeof define=='function'&&define.amd?define
:(function(n,w){'use strict';return typeof module=='object'?function(c){
c(require,exports,module);}:function(c){var m={exports:{}};c(function(n){
return w[n];},m.exports,m);w[n]=m.exports;};})('gaia-slider',this));
