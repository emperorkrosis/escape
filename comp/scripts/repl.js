/**
 * The replicant dossier scene.
 * @param {number} w The width of the screen buffer for this scene.
 * @param {number} h The height of the screen buffer for this scene.
 * @implements {Scene}
 * @constructor
 */
ReplicantScene = function(w, h) {
  /**
   * The function to invoke when transitioning to a new state.
   * @private {Function}
   */
  this.transitionFunc = null;

  /**
   * Animation time for this scene visit.
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
   * Crane image of the dossier.
   * TODO: We don't wait for the image to load.
   * @private {HTMLImageElement}
   */
  this.craneImg_ = document.createElement('img');
  this.craneImg_.src = 'images/crane.png';

  /**
   * The current dossier image.
   * @private {HTMLImageElement}
   */
  this.currentImg_ = this.loadImage_('images/unknown.png');
  this.currentName_ = 'UNKNOWN';
  this.currentDOB_ = 'UNKNOWN';
  this.currentDOE_ = 'UNKNOWN';

  /**
   * The array of dossier strings to load and print on the screen.
   * @private {!Array.<string>}
   */
  this.paramStrings_ = this.generateParamStrings_();

  /**
   * The currently active XHR. Null if no XHR is outstanding.
   * @private {XMLHttpRequest}
   */
  this.xhr_ = null;

  // Poll for new dossier data.
  var self = this;
  window.setInterval(function() {
    self.poll_();
  }, 1000);
};


/**
 * @override
 */
ReplicantScene.prototype.getName = function() {
  return 'repl';
};


/**
 * @override
 */
ReplicantScene.prototype.handleInterval = function() {
  // Do the basic loading animation.
  if (this.count_ <= 35) {
    this.drawInternal_();
    this.count_++;
  }

  if (this.count_ > 35) {
    // If 36 we draw again without the overlay, but on 45 we draw with the
    // overlay.
    if (this.count_ == 36 || this.count_ == 45) {
      this.drawInternal_();
    }
    // Wrap around
    if (this.count_ > 55) {
      this.count_ = 35;
    }
    this.count_++;
  }
};


/**
 * @override
 */
ReplicantScene.prototype.handleKeyDown = function(e) {
  var charCode = (typeof e.which == 'number') ? e.which : e.keyCode;
  // When debugging 'P' and 'p' will override the hat flag being triggered.
  if (Constants.DEBUGGING) {
    if (charCode == 16 || charCode == 80) {
      this.transitionFunc('success');
      this.count_ = 0;
      this.drawInternal_();
    }
  }
  return true;
};


/**
 * @override
 */
ReplicantScene.prototype.draw = function() {
  return this.bufferCanvas_;
};


/**
 * Helper that load a dossier image resource.
 * @param {string} url The image url.
 * @return {!HTMLImageElement} The image that may or may not still
 *     be loading.
 */
ReplicantScene.prototype.loadImage_ = function(url) {
  // Load all the images and keep track of number loaded.
  this.initialized_ = false;
  var self = this;
  var imgElem = document.createElement('img');
  imgElem.onload = function() {
      self.initialized_ = true;
      self.drawInternal_();
    };
  imgElem.src = url;
  return imgElem;
};


/**
 * Helper to build an array of strings for the dossier, based on the current
 * dossier state.
 * @return {!Array.<string>}
 */
ReplicantScene.prototype.generateParamStrings_ = function() {
  return [
    '*** REPLICANT DOSSIER ***',
    '',
    'NAME: ' + this.currentName_,
    'B:    O-NEG',
    'DOB:  ' + this.currentDOB_,
    'DOE:  ' + this.currentDOE_,
    '',
    'ID#:  172433-112144',
    'MDL#: NEXUS 6',
    'SN#:  A12-DELUXE'
  ];
};


/**
 * Helper to refresh the scene.
 * @private
 */
ReplicantScene.prototype.drawInternal_ = function() {
  var ctx = this.bufferCanvas_.getContext('2d');
  var w = this.bufferCanvas_.width;
  var h = this.bufferCanvas_.height;
  ctx.clearRect(0, 0, w, h);

  if (this.initialized_) {
    // Draw the dossier image.
    var img = this.currentImg_;
    var percentage = 1.0;
    if (this.count_ < 20) {
      percentage = this.count_ / 20;
    }
    ctx.drawImage(img, 0, 0, img.width, Math.floor(img.height * percentage),
		  130, 10, img.width, Math.floor(img.height * percentage));

    // Draw the status.
    ctx.font = Constants.DEFAULT_FONT;
    ctx.fillStyle = Constants.DEFAULT_FILL;

    if (this.count_ > 22) {
      var end = Math.min(this.paramStrings_.length, this.count_ - 23);
      for (var i = 0; i < end; i++) {
	ctx.fillText(this.paramStrings_[i], 1, i * 10 + 9);
      }
    }

    // Draw the crane image.
    if (this.count_ > 32 && this.craneImg_) {
      var cImg = this.craneImg_;
      ctx.drawImage(cImg, 0, 0, cImg.width, cImg.height,
                    20, 110, cImg.width, cImg.height);
    }

    // Maybe draw the blinking overlay.
    if (this.count_ == 45) {
      var r = '############################';
      var s = '##                        ##';
      var t = '## USE HEADGEAR TO EXTEND ##'
      var u = '##  REPLICANT EXPIRATION  ##'
      ctx.clearRect(80, 70, 170, 60);
      ctx.fillText(r, 80, 7 * 10 + 9);
      ctx.fillText(s, 80, 8 * 10 + 9);
      ctx.fillText(t, 80, 9 * 10 + 9);
      ctx.fillText(u, 80, 10 * 10 + 9);
      ctx.fillText(s, 80, 11 * 10 + 9);
      ctx.fillText(r, 80, 12 * 10 + 9);
    }
  }
};


/**
 * Helper to send an XHR to the server.
 * @private
 */
ReplicantScene.prototype.poll_ = function() {
  if (this.xhr_ == null) {
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
ReplicantScene.prototype.handleResponse_ = function() {
  if (this.xhr_.readyState == 4) {
    if (this.xhr_.status == 200) {
      data = JSON.parse(this.xhr_.responseText);
      var dirty = false;
      if (data['img'] &&
	  data['img'] != '' &&
	  data['img'] != this.currentImg_.src) {
	this.currentImg_ = this.loadImage_(data['img']);
	dirty = true;
      }
      if (data['name'] &&
	  data['name'] != '' &&
	  data['name'] != this.currentName_) {
	this.currentName_ = data['name'];
	dirty = true;
      }
      if (data['dob'] &&
	  data['dob'] != '' &&
	  data['dob'] != this.currentDOB_) {
	this.currentDOB_ = data['dob'];
	dirty = true;
      }
      if (data['doe'] &&
	  data['doe'] != '' &&
	  data['doe'] != this.currentDOE_) {
	this.currentDOE_ = data['doe'];
	dirty = true;
      }
      if (dirty) {
        this.paramStrings_ = this.generateParamStrings_();
	this.drawInternal_();
      }
      this.xhr_ = null;
    }
  }
};
