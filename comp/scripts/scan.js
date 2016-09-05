/**
 * The retinal scan prompt screen scene.
 * @param {number} w The width of the screen buffer for this scene.
 * @param {number} h The height of the screen buffer for this scene.
 * @param {Function} tFunc Transition function to call to change states.
 * @implements {Scene}
 * @constructor
 */
ScanScene = function(w, h, tFunc) {
  /**
   * The function to invoke when transitioning to a new state.
   * @private {Function}
   */
  this.transitionFunc_ = tFunc;

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
   * Whether this state has been fully initialized.
   * @private {boolean}
   */
  this.initialized_ = false;

  /**
   * Whether this state is currently the active state.
   * @private {boolean}
   */
  this.active_ = false;

  /**
   * The currently active XHR. Null if no XHR is outstanding.
   * @private {XMLHttpRequest}
   */
  this.xhr_ = null;

  /**
   * The reticle image.
   * @private {!HTMLImageElement}
   */
  this.bufferImg_ = document.createElement('img');
  var self = this;
  this.bufferImg_.onload = function() {
    self.initialized_ = true;
    self.drawInternal_();
  };
  this.bufferImg_.src = 'images/reticle.png';

  // Start the interval timer for updates.
  var self = this;
  window.setInterval(function() {
    self.poll_();
  }, 1000);
};


/**
 * @override
 */
ScanScene.prototype.getName = function() {
    return 'scan';
};


/**
 * @override
 */
ScanScene.prototype.handleInterval = function() {
  this.active_ = true;
};


/**
 * @override
 */
ScanScene.prototype.handleKeyDown = function(e) {
  var charCode = (typeof e.which == "number") ? e.which : e.keyCode;
  // 'P' and 'p' are the only keys that suceed.
  if (Constants.DEBUGGING) {
    if (charCode == 16 || charCode == 80) {
      this.transitionFunc_('eyeg');
      this.active_ = false;
    } else {
      this.transitionFunc_('eyeb');
      this.active_ = false;
    }
    this.drawInternal_();
  }
  return true;
};


/**
 * @override
 */
ScanScene.prototype.draw = function() {
    return this.bufferCanvas_;
};


/**
 * Helper to refresh the scene.
 * @private
 */
ScanScene.prototype.drawInternal_ = function() {
  var ctx = this.bufferCanvas_.getContext('2d');
  var w = this.bufferCanvas_.width;
  var h = this.bufferCanvas_.height;
  ctx.clearRect(0, 0, w, h);

  ctx.font = Constants.DEFAULT_FONT;
  ctx.fillStyle = Constants.DEFAULT_FILL;

  if (this.initialized_) {
    // For this simple scene we draw just 3 lines of text.
    var s = ' ################################################### '
    var t = ' # AWAITING VALID RETINA SCAN FOR IDENTIFICATION.. # ';
    ctx.fillText(s, 1, 19);
    ctx.fillText(t, 1, 29);
    ctx.fillText(s, 1, 39);

    // Draw the reticle image.
    ctx.drawImage(this.bufferImg_,
                  Math.floor((w - this.bufferImg_.width) / 2), 45);    
  }
};


/**
 * Helper to send an XHR to the server.
 * @private
 */
ScanScene.prototype.poll_ = function() {
  if (this.active_ && this.xhr_ == null) {
    this.xhr_ = new XMLHttpRequest();
    this.xhr_.open('get', '/signal', true);
    var self = this;
    this.xhr_.onreadystatechange = function() {
      self.handleResponse_();
    };
    this.xhr_.send();
  }
};


/**
 * Helper to handle an XHR response.
 * @private
 */
ScanScene.prototype.handleResponse_ = function() {
  if (this.xhr_.readyState == 4) {
    if (this.xhr_.status == 200) {
      data = JSON.parse(this.xhr_.responseText);
      if (data['ret']) {
        this.transitionFunc_('eyeg');
	this.active_ = false;
        this.drawInternal_();
      }
      this.xhr_ = null;
    }
  }
};
