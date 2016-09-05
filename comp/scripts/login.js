/**
 * The login screen scene.
 * @param {number} w The width of the screen buffer for this scene.
 * @param {number} h The height of the screen buffer for this scene.
 * @param {Function} tFunc Transition function to call to change states.
 * @implements {Scene}
 * @constructor
 */
LoginScene = function(w, h, tFunc) {
  /**
   * The function to invoke when transitioning to a new state.
   * @private {Function}
   */
  this.transitionFunc_ = tFunc;

  /**
   * The set of character that make up the username and password. We hardcode
   * the usename HARLANH1 because it comes from the retinal scan now.
   * @private {!Array.<string>}
   */
  this.chars_ = ['H', 'A', 'R', 'L', 'A', 'N', 'H', '1'];

  /**
   * The last login string that was constructed. Cached for performance.
   * @private {string}
   */
  this.lastStr_ = null;

  /**
   * Whether the cursor is visible for not. Used for animating the cursor.
   * @private {boolean}
   */
  this.cursorOn_ = true;

  /**
   * Animation timer for this scene visit.
   * @private {number}
   */
  this.count_ = 0;

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
   * Whether the resources are loaded yet to draw this scene.
   * @private {boolean}
   */
  this.initialized_ = false;

  /**
   * The login screen image.
   * @private {!HTMLImageElement}
   */
  this.bufferImg_ = document.createElement('img');
  var self = this;
  this.bufferImg_.onload = function() {
    self.initialized_ = true;
    self.drawInternal_();
  };
  this.bufferImg_.src = 'images/tyrell2.png';
};


/**
 * @override
 */
LoginScene.prototype.getName = function() {
  return 'login';
};


/**
 * @override
 */
LoginScene.prototype.handleInterval = function() {
  this.count_++;
  if (this.count_ >= 5) {
    this.cursorOn_ = !this.cursorOn_;
    this.lastStr_ = null;
    // The cursor changed, regenerate the image.
    this.drawInternal_();
    this.count_ = 0;
  }

  if (this.chars_.length == 16) {
    var result = this.chars_.join('');
    if (result === 'HARLANH123456789') {
      this.transitionFunc_('access');
    } else {
      this.transitionFunc_('denied2');
    }
    this.chars_ = ['H', 'A', 'R', 'L', 'A', 'N', 'H', '1'];
    this.lastStr_ = null;
    this.drawInternal_();
  }
};


/**
 * @override
 */
LoginScene.prototype.handleKeyDown = function(e) {
  var charCode = (typeof e.which == "number") ? e.which : e.keyCode;
  var handled = false;
  if (charCode == 8) {
    // Handle backspace.
    handled = true;
    if (this.chars_.length > 8) {
      this.chars_.pop();
    }
    this.lastStr_ = null;
  } else if (charCode >= 48 && charCode <= 90) {
    handled = true;
    // Handle all other alpha numeric characters.
    var c = String.fromCharCode(charCode).toUpperCase();
    if (c.length == 1) {
      c = c[0];
      if ((c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9')) {
        if (this.chars_.length < 16) {
          this.chars_.push(c);
          this.lastStr_ = null;
	}
      }
    }
  }
  // The characters changed, regenerate the image.
  this.drawInternal_();
  return handled;
};


/**
 * @override
 */
LoginScene.prototype.draw = function() {
  return this.bufferCanvas_;
};


/**
 * Helper to refresh the scene.
 * @private
 */
LoginScene.prototype.drawInternal_ = function() {
  var ctx = this.bufferCanvas_.getContext('2d');
  var w = this.bufferCanvas_.width;
  var h = this.bufferCanvas_.height;
  ctx.clearRect(0, 0, w, h);

  if (this.initialized_) {
    // Draw the Tyrell logo.
    ctx.drawImage(this.bufferImg_,
		  Math.floor((w - this.bufferImg_.width) / 2), 0);

    // Draw the login fields.
    ctx.font = Constants.DEFAULT_FONT;
    ctx.fillStyle = Constants.DEFAULT_FILL;
    var s = this.prepareString_();
    ctx.fillText(s, 40, 190);
  }
};


/**
 * Handle constructing the login string from the current buffer state.
 * @return {string} The login string.
 * @private
 */
LoginScene.prototype.prepareString_ = function() {
  // Cache the last string to avoid duplicate work.
  if (this.lastStr_) {
    return this.lastStr_;
  }

  var staStr = 'LOGIN: _';
  var midStr = '_  PASSWORD: _';
  var finStr = '_';
  var logStr = '';
  var pasStr = '';

  for (var i = 0; i < 8; i++) {
    // Build the login name.
    if (this.chars_.length > i) {
      logStr += this.chars_[i];
    } else if (this.chars_.length == i && this.cursorOn_) {
      logStr += '\u2588';
    } else {
      logStr += '_';
    }
    // Build the password.
    if (this.chars_.length > i + 8) {
      pasStr += this.chars_[i + 8];
    } else if (this.chars_.length == i + 8 && this.cursorOn_) {
      pasStr += '\u2588';
    } else {
      pasStr += '_';
    }
  }

  this.lastStr_ = staStr + logStr + midStr + pasStr + finStr;
  return this.lastStr_;
};
