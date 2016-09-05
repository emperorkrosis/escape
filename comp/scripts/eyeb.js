/**
 * The retinal scan scene.
 * @param {number} w The width of the screen buffer for this scene.
 * @param {number} h The height of the screen buffer for this scene.
 * @param {boolean} isGood Whether this instance represents a successful
 *     retinal scan or not.
 * @implements {Scene}
 * @constructor
 */
EyeBadScene = function(w, h, isGood) {
  /**
   * The function to invoke when transitioning to a new state.
   * @private {Function}
   */
  this.transitionFunc = null;

  /**
   * If true this scene represents the success state for the iris scanner.
   * @private {boolean}
   */
  this.isGood_ = isGood;

  /**
   * Animation time for this scene visit.
   * @private {number}
   */
  this.count_ = 0;

  /**
   * Retina image index that was chose for this state visit.
   * @private {number}
   */
  this.imageIndex_ = -1;

  /**
   * Array of strings representing the random parameters for the retina.
   * @private {!Array.<string>}
   */
  this.paramStrings_ = [];

  /**
   * The result string.
   * @param {string}
   */
  this.resultString_ = (isGood) ? '*** WELCOME HARLANH1' :
      'NO DATABASE MATCH';

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
   * All the retina images. The last retina image will always be used for the
   * good state.
   * @private {!Array.<!HTMLImageElement>}
   */
  this.allImgs_ = this.loadImages_();
};


/**
 * @override
 */
EyeBadScene.prototype.getName = function() {
  if (this.isGood_) {
    return 'eyeg';
  } else {
    return 'eyeb';
  }
};


/**
 * @override
 */
EyeBadScene.prototype.handleInterval = function() {
  // If we haven't customized this instance do it now.
  if (this.imageIndex_ < 0) {
    // Pick a random image.
    if (this.isGood_) {
      this.imageIndex_ = this.allImgs_.length - 1;
    } else {
      this.imageIndex_ =
          Math.floor(Math.random() * (this.allImgs_.length - 1));
    }
    // Both success and failure get a random set of params.
    this.paramStrings_ = this.generateParamStrings_();
  }
  this.drawInternal_();
  this.count_++;

  // The entire animation runs for 35 ticks.
  if (this.count_ > 35) {
    if (this.isGood_) {
      this.transitionFunc('login');
    } else {
      this.transitionFunc('denied1');
    }
    this.count_ = 0;
    this.imageIndex_ = -1;
    this.drawInternal_();
  }
};


/**
 * @override
 */
EyeBadScene.prototype.handleKeyDown = function(e) {
  return true;
};


/**
 * @override
 */
EyeBadScene.prototype.draw = function() {
  return this.bufferCanvas_;
};


/**
 * Helper that loads all the retina image resources.
 * @return {!Array.<!HTMLImageElement>} The images that may or may not still
 *     be loading.
 */
EyeBadScene.prototype.loadImages_ = function() {
  var imgElems = [];
  // Location of all the images.
  var srcs = [
    'images/retina1.png',
    'images/retina2.png',
    'images/retina3.png',
    'images/retina4.png',
    'images/retina5.png',
    'images/retina6.png',
    'images/retina7.png'
  ];

  // Load all the images and keep track of number loaded.
  var count = srcs.length;
  var self = this;
  for (var i = 0; i < srcs.length; i++) {
    imgElems[i] = document.createElement('img');
    imgElems[i].onload = function() {
      count--;
      if (count == 0) {
        self.initialized_ = true;
        self.drawInternal_();
      }
    };
    imgElems[i].src = srcs[i];
  }
  return imgElems;
};


/**
 * Helper to generate an array of strings that represent face retina metrics
 * and their values. These will be drawn after the scan sweep completes. These
 * parameters should stay constant for the entire visit to this node.
 * @return {!Array.<string>} The parameter strings.
 */
EyeBadScene.prototype.generateParamStrings_ = function() {
  var get3 = function() {
      var n = Math.floor(Math.random() * 999.9);
      if (n < 10) {
        return '00' + n;
      } else if (n < 100) {
        return '0' + n;
      } else {
        return '' + n;
      }
    };

  return [
    'H1:' + get3() + ' W1:' + get3() + ' G1:' + get3(),
    'H2:' + get3() + ' W2:' + get3() + ' G2:' + get3(),
    'H3:' + get3() + ' W3:' + get3() + ' K1:' + get3(),
    'H4:' + get3() + ' W4:' + get3() + ' J1:' + get3(),
    'H5:' + get3() + ' W5:' + get3()
  ];
};


/**
 * Helper to refresh the scene.
 * @private
 */
EyeBadScene.prototype.drawInternal_ = function() {
  var ctx = this.bufferCanvas_.getContext('2d');
  var w = this.bufferCanvas_.width;
  var h = this.bufferCanvas_.height;
  ctx.clearRect(0, 0, w, h);

  if (this.initialized_ && this.imageIndex_ >= 0) {
    // Draw the retinal image.
    var img = this.allImgs_[this.imageIndex_];
    var percentage = 1.0;
    if (this.count_ < 20) {
      percentage = this.count_ / 20;
    }
    ctx.drawImage(img, 0, 0, img.width, Math.floor(img.height * percentage),
		  130, 10, img.width, Math.floor(img.height * percentage));

    // Draw the status.
    if (this.count_ > 22) {
      ctx.font = Constants.DEFAULT_FONT;
      ctx.fillStyle = Constants.DEFAULT_FILL;
      var end = Math.min(this.paramStrings_.length, this.count_ - 23);
      for (var i = 0; i < end; i++) {
	ctx.fillText(this.paramStrings_[i], 1, i * 10 + 9);
      }
      if (end == this.paramStrings_.length) {
        ctx.fillText(this.resultString_, 1,
            this.paramStrings_.length * 10 + 9);
      }
    }
  }
};
