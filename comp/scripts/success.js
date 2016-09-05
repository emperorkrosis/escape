/**
 * The success scene.
 * @param {number} w The width of the screen buffer for this scene.
 * @param {number} h The height of the screen buffer for this scene.
 * @implements {Scene}
 * @constructor
 */
SuccessScene = function(w, h, startStateName) {
  /**
   * The function to invoke when transitioning to a new state.
   * @private {Function}
   */
  this.transitionFunc = null;

  /**
   * The drawing buffer. Each scene is responsible for updating it's
   * drawing buffer.
   * @private {!HTMLCanvasElement}
   */
  this.bufferCanvas_ = document.createElement('canvas');
  this.bufferCanvas_.width = w;
  this.bufferCanvas_.height = h;
  this.bufferCanvas_.imageSmoothingEnabled_ = false;

  /**
   * The name of the start state to return to.
   * @private {string}
   */
  this.startStateName_ = startStateName;

  /**
   * Human image of the dossier.
   * @private {HTMLImageElement}
   */
  this.humanImg_ = document.createElement('img');
  var self = this;
  this.humanImg_.onload = function() {
    self.drawInternal_();
  };
  this.humanImg_.src = 'images/human.png';
};


/**
 * @override
 */
SuccessScene.prototype.getName = function() {
  return 'success';
};


/**
 * @override
 */
SuccessScene.prototype.handleInterval = function() {
};


/**
 * @override
 */
SuccessScene.prototype.handleKeyDown = function(e) {
  // Adding reset key '\' to return to the start state.
  var charCode = (typeof e.which == 'number') ? e.which : e.keyCode;
  if (charCode == 220) {
    this.transitionFunc(this.startStateName_);
    this.drawInternal_();
  }
  return true;
};


/**
 * @override
 */
SuccessScene.prototype.draw = function() {
  return this.bufferCanvas_;
};


/**
 * Helper to refresh the scene.
 * @private
 */
SuccessScene.prototype.drawInternal_ = function() {
  var ctx = this.bufferCanvas_.getContext('2d');
  var w = this.bufferCanvas_.width;
  var h = this.bufferCanvas_.height;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(this.humanImg_, 0, 0);
};
