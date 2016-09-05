/**
 * The bootup access scene.
 * @param {number} w The width of the screen buffer for this scene.
 * @param {number} h The height of the screen buffer for this scene.
 * @implements {Scene}
 * @constructor
 */
AccessScene = function(w, h) {
  /**
   * Transition Function
   */
  this.transitionFunc = null;

  /**
   * Animation counter for this node visit.
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
   * Scrolling list of strings to display in the UI.
   * @private {!Array.<string>}
   */
  this.strings_ = [
    'INITIALIZE PROGRAMS..DONE',
    'BALANCING TREES',
    'TESTING THERMANE REACT.',
    'LOADING KEYBOARD DRIVER',
    'LOADING INTERFACE DRIVER',

    'LOADING SPEAKER DRIVER',
    'LOADING DBUS DRIVER',
    'LOADING CAN BUS BRIVER',
    'LOADING MEMORY STORAGE 1',
    'LOADING MEMORY STORAGE 2',

    'SERIAL NUMBER #1231194',
    'ALLOCATING BLOCKS',
    'REMOVING OBSOLETE ENTRIES',
    'ALL INTERFACES READY',
    'PREPARING PAYLOAD',

    'LOADING SENSOR DRIVER',
    'LOAD PDGN HARDWARE CNTRL',
    'GAINING SECURE ACCESS TKN',
    'TERMINAL IDENT. VERIFIED',
    'PRIVELAGE USE ALLOWED',

    'MASTER CONTROL ACTIVE',
    'TYRELL NETWORK ACCESS UP',
    'TYRELL DATABASE STARTUP',
    'CONTROLLER 547 BUFFER 23',
    'CONTROLLER 234 BUFFER 121',

    'TEST HARNESS INIT.',
    'SCREEN BUFFER INIT.',
    'TESTING 998 SERIAL PORT',
    'TESTING NETWORK PORT',
    'INITIALIZING PORT 134-578',

    'BEGIN SEC. ELEVATION',
    'LEVEL 10 SEC. -- TRUE',
    'LEVEL 09 SEC. -- TRUE',
    'LEVEL 08 SEC. -- TRUE',
    'LEVEL 07 SEC. -- TRUE',

    'LEVEL 06 SEC. -- FALSE',
    'LEVEL N SEC. -- DENIED',
    'SEC. ELEVATION ABORT',
    '1337 H4XX0RZ W3R H3R3',
    '-----A WINNER BE YOU!!!-----',
  ];
};


/**
 * @override
 */
AccessScene.prototype.getName = function() {
  return 'access';
};


/**
 * @override
 */
AccessScene.prototype.handleInterval = function() {
  // Handle transition.
  this.drawInternal_();
  this.count_++;
  if (this.count_ > this.strings_.length) {
    this.transitionFunc('repl');
    this.count_ = 0;
    this.drawInternal_();
  }
};


/**
 * @override
 */
AccessScene.prototype.handleKeyDown = function(e) {
  return true;
};


/**
 * @override
 */
AccessScene.prototype.draw = function() {
  return this.bufferCanvas_;
};


/**
 * Helper to refresh the scene.
 * @private
 */
AccessScene.prototype.drawInternal_ = function() {
  var ctx = this.bufferCanvas_.getContext('2d');
  var w = this.bufferCanvas_.width;
  var h = this.bufferCanvas_.height;
  ctx.clearRect(0, 0, w, h);

  ctx.font = Constants.DEFAULT_FONT;
  ctx.fillStyle = Constants.DEFAULT_FILL;

  // Draw the last 20 entries seen from the strings buffer.
  var start = Math.max(0, this.count_ - 20);
  for (var i = start; i < this.count_; i++) {
    var row = i - start;
    var s = this.strings_[i];
    ctx.fillText(s, 1, row * 10 + 9);
  }
};
