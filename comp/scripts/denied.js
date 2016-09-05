/**
 * The access denied scene.
 * @param {number} w The width of the screen buffer for this scene.
 * @param {number} h The height of the screen buffer for this scene.
 * @param {string} name The name of this node in the state machine.
 * @param {string} success The name of the node to transition too after the
 *     access denied animation.
 * @implements {Scene}
 * @constructor
 */
DeniedScene = function(w, h, name, success) {
  /**
   * The function to invoke when transitioning to a new state.
   * @private {Function}
   */
  this.transitionFunc = null;

  /**
   * Whether the access denied text is visible or not.
   * @private {boolean}
   */
  this.textOn_ = true;

  /**
   * Animation timer for this scene visit.
   * @private {number}
   */
  this.count_ = 0;

  /**
   * Large animation time that ticks every 10 times that count_ animation
   * timer is incremented.
   * @private {number}
   */
  this.largeCount_ = 10;

  /**
   * The state name of this state. Making this parameterizable so that
   * multiple access denied states can be added to the state machine.
   * @private {string}
   */
  this.name_ = name;

  /**
   * The name of the node to transition too after the access denied animation.
   * Making this parameterizable so that multiple access denied states can be
   * added to the state machine.
   * @private {string}
   */
  this.success_ = success;

  /**
   * The drawing buffer. Each scene is responsible for updating it's
   * drawing buffer.
   * @private {!HTMLCanvasElement}
   */
  this.bufferCanvas_ = document.createElement('canvas');
  this.bufferCanvas_.width = w;
  this.bufferCanvas_.height = h;
  this.bufferCanvas_.imageSmoothingEnabled_ = false;
};


/**
 * @override
 */
DeniedScene.prototype.getName = function() {
   return this.name_;
};


/**
 * @override
 */
DeniedScene.prototype.handleInterval = function() {
  this.count_++;
  if (this.count_ >= 5) {
    this.textOn_ = !this.textOn_;
    // The cursor changed regenerate the image.
    this.drawInternal_();
    this.count_ = 0;

    // Handle transition.
    this.largeCount_ -= 1;
    if (this.largeCount_ < 0) {
      this.transitionFunc(this.success_);
      this.largeCount_ = 10;
    }
  }
};


/**
 * @override
 */
DeniedScene.prototype.handleKeyDown = function(e) {
  return true;
};


/**
 * @override
 */
DeniedScene.prototype.draw = function() {
  return this.bufferCanvas_;
};


/**
 * Helper to refresh the scene.
 * @private
 */
DeniedScene.prototype.drawInternal_ = function() {
  var ctx = this.bufferCanvas_.getContext('2d');
  var w = this.bufferCanvas_.width;
  var h = this.bufferCanvas_.height;
  ctx.clearRect(0, 0, w, h);

  ctx.font = Constants.DEFAULT_FONT;
  ctx.fillStyle = Constants.DEFAULT_FILL;

  // Draw the text box with the blinking text inside.
  var r = '###################';
  var s = '##               ##';
  var t = '   ACCESS DENIED   ';
  ctx.fillText(r, 100 + 1, 7 * 10 + 9);
  ctx.fillText(s, 100 + 1, 8 * 10 + 9);
  ctx.fillText(s, 100 + 1, 9 * 10 + 9);
  ctx.fillText(s, 100 + 1, 10 * 10 + 9);
  ctx.fillText(r, 100 + 1, 11 * 10 + 9);
  if (this.textOn_) {
    ctx.fillText(t, 100 + 1, 9 * 10 + 9);
  }
};
