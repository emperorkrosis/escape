/**
 * Main entry point for the state machine.
 */
Game = function(id) {
  /**
   * Set up the main canvases and screen buffer.
   */
  this.mainCanvas_ = document.getElementById(id);;

  /**
   * The canvas context object to draw using.
   */
  this.mainContext_ = this.mainCanvas_.getContext('2d');
  this.mainContext_.imageSmoothingEnabled = false;

  /**
   * All the states in the terminal state machine.
   */
  this.allScenes_ = {};

  // Global representing the current state that the machine is in.
  this.currentScene_ = null;

  /**
   * Transition function.
   */
  var that = this;
  this.transitionFunc_ = function(name) {
      that.transition_(name);
    };

  /**
   * Whether we have started the state machine yet.
   */
  this.started_ = false;

  // Add all the state machine states.
  this.addScene_(new ScanScene(320, 200, this.transitionFunc_));
  this.addScene_(new EyeBadScene(320, 200, this.transitionFunc_, false));
  this.addScene_(new DeniedScene(320, 200, this.transitionFunc_, 'denied1',
      'scan'));
  this.addScene_(new EyeBadScene(320, 200, this.transitionFunc_, true));
  this.addScene_(new LoginScene(320, 200, this.transitionFunc_));
  this.addScene_(new DeniedScene(320, 200, this.transitionFunc_, 'denied2',
      'login'));
  this.addScene_(new AccessScene(320, 200, this.transitionFunc_));
  this.addScene_(new ReplicantScene(320, 200, this.transitionFunc_,
      Constants.START_STATE));
};


/**
 * Start all the event loop running.
 */
Game.prototype.start = function() {
  // Only allow us to start once.
  if (this.started_) {
    return;
  }
  this.started_ = true;

  // Transition that state machine to the initial screen.
  this.transition_(Constants.START_STATE);

  // Set up user input handling for scenes.
  var that = this;
  window.onkeydown = function(e) {
      if (that.currentScene_.handleKeyDown(e)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

  // Set up interval timer for scenes.
  window.setInterval(function() {
      that.currentScene_.handleInterval();
    }, 100);

  // Start drawing render loop.
  window.requestAnimationFrame(function() {
      that.redraw_();
    });
};


/**
 * Static helper function to transitioning between scenes.
 * @param {string} name The scene name to transition to.
 */
Game.prototype.addScene_ = function(scene) {
  this.allScenes_[scene.getName()] = scene;
};


/**
 * Helper for adding scenes to the state machine.
 * @param {!Scene} scene The scene to add.
 */
Game.prototype.transition_ = function(name) {
  if (this.allScenes_[name]) {
    this.currentScene_ = this.allScenes_[name];
  }
};


/**
 * Redraw the main canvas.
 */
Game.prototype.redraw_ = function() {
  // Redraw the screen if dirty.
  var buffer = this.currentScene_.draw();
  this.mainContext_.clearRect(0, 0,
      this.mainCanvas_.width, this.mainCanvas_.height);
  this.applyTransform_();
  this.mainContext_.drawImage(buffer, 0, 0,
      this.mainCanvas_.width, this.mainCanvas_.height);
  this.mainContext_.setTransform(1, 0, 0, 1, 0, 0);
  this.applyGlitch_();
  this.drawScanlineOverlay_();

  var that = this;
  window.requestAnimationFrame(function() {
    that.redraw_();
  });
}


/**
 * Helper to apply a transform to the screen before drawing the
 * buffer to it.
 * @private
 */
Game.prototype.applyTransform_ = function() {
  var SKEW_PROBABILITY = 0.007;
  var TRANS_PROBABILITY = 0.3;
  var SKEW_FACTOR = 0.07;
  var TRANS_FACTOR = 0.03;

  var skewY = 0;
  var transX = 0; 

  var r = Math.random();
  // One percent probability each for skewing positive or negative.
  if (r < SKEW_PROBABILITY) {
    // 30% probabiliy each of translating left or right.
    if (r < SKEW_PROBABILITY * TRANS_PROBABILITY) {
      transX = -TRANS_FACTOR;
    } else if (r > SKEW_PROBABILITY * (1 - TRANS_PROBABILITY)) {
      transX = TRANS_FACTOR;
    }
    skewY = SKEW_FACTOR;
  } else if (r > 1 - SKEW_PROBABILITY) {
    // 30% probabiliy each of translating left or right.
    if (r > 1 - (SKEW_PROBABILITY * TRANS_PROBABILITY)) {
      transX = -TRANS_FACTOR;
    } else if (r < 1 - (SKEW_PROBABILITY * (1 - TRANS_PROBABILITY))) {
      transX = TRANS_FACTOR;
    }
    skewY = -SKEW_FACTOR;
  }

  this.mainContext_.setTransform(1, 0, skewY,
      1, transX * this.mainCanvas_.width, 0);
};


/**
 * Helper to remove a portion of the scanlines to represent periodic failure
 * of the CRT.
 * @private
 */
Game.prototype.applyGlitch_ = function() {
  var startLine = Math.floor(Math.random() * 800);
  var height = Math.floor(Math.random() * 30) + 10;
  this.mainContext_.clearRect(0, startLine, 800, height); 
};


/**
 * Helper to draw a set of horizontal lines on the main canvas to emulate CRT
 * scanlines.
 * @private
 */
Game.prototype.drawScanlineOverlay_ = function() {
  this.mainContext_.strokeStyle = '#000000';
  for (var i = 0; i < this.mainCanvas_.height; i++) {
    if (i % 3 == 0) {
      this.mainContext_.beginPath();
      this.mainContext_.moveTo(0, i);
      this.mainContext_.lineTo(this.mainCanvas_.width, i);
      this.mainContext_.stroke();
    }
  }
};
