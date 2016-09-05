/**
 * Pipeline for shifting the pitch of the input audio by 1 octave up or down.
 * @param {!AudioContext} context The contex to build nodes from.
 * @constructor
 */
PitchShifterPipeline = function(context) {
  /**
   * The input node to pipe audio to be shifted into.
   * @type {!AudioNode}
   */
  this.input = context.createGain();

  /**
   * The output node to route the resulting shifted audio from.
   * @type {!AudioNode}
   */
  this.output = context.createGain();

  /**
   * The current pitch shift that the pipeline is applying.
   * @private
   */
  this.currentPitch_ = -1;

  // Helper buffers.
  var shiftDownBuffer = PitchShifterPipeline.createDelayTimeBuffer_(context,
      PitchShifterPipeline.BUFFER_TIME_, PitchShifterPipeline.FADE_TIME_,
      false);
  var shiftUpBuffer = PitchShifterPipeline.createDelayTimeBuffer_(context,
      PitchShifterPipeline.BUFFER_TIME_, PitchShifterPipeline.FADE_TIME_,
      true);
    
  // Delay modulation.
  this.mod1a_ = PitchShifterPipeline.createBufferNode_(context,
      shiftDownBuffer);
  this.mod1b_ = PitchShifterPipeline.createBufferNode_(context,
      shiftUpBuffer);

  this.mod2a_ = PitchShifterPipeline.createBufferNode_(context,
      shiftDownBuffer);
  this.mod2b_ = PitchShifterPipeline.createBufferNode_(context,
      shiftUpBuffer);

  // for switching between oct-up and oct-down
  this.mod1aGain_ = context.createGain();
  this.mod1bGain_ = context.createGain();
  this.mod1bGain_.gain.value = 0;

  this.mod2aGain_ = context.createGain();
  this.mod2bGain_ = context.createGain();
  this.mod2bGain_.gain.value = 0;

  // Delay amount for changing pitch.
  this.modGain1_ = context.createGain();
  this.modGain2_ = context.createGain();

  this.delay1_ = context.createDelay();
  this.delay2_ = context.createDelay();

  // Crossfading.
  var fadeBuffer = PitchShifterPipeline.createFadeBuffer_(context,
     PitchShifterPipeline.BUFFER_TIME_, PitchShifterPipeline.FADE_TIME_);
  this.fade1_ = PitchShifterPipeline.createBufferNode_(context, fadeBuffer);
  this.fade2_ = PitchShifterPipeline.createBufferNode_(context, fadeBuffer);

  this.mix1_ = context.createGain();
  this.mix1_.gain.value = 0;

  this.mix2_ = context.createGain();
  this.mix2_.gain.value = 0;

  // Connect the internal nodes of the graph.
  this.mod1a_.connect(this.mod1aGain_);
  this.mod1b_.connect(this.mod1bGain_);
  this.mod1aGain_.connect(this.modGain1_);
  this.mod1bGain_.connect(this.modGain1_);
  this.modGain1_.connect(this.delay1_.delayTime);

  this.fade1_.connect(this.mix1_.gain);

  this.input.connect(this.delay1_);
  this.delay1_.connect(this.mix1_);
  this.mix1_.connect(this.output);

  this.mod2a_.connect(this.mod2aGain_);
  this.mod2b_.connect(this.mod2bGain_);
  this.mod2aGain_.connect(this.modGain2_);
  this.mod2bGain_.connect(this.modGain2_);
  this.modGain2_.connect(this.delay2_.delayTime);

  this.fade2_.connect(this.mix2_.gain);

  this.input.connect(this.delay2_);
  this.delay2_.connect(this.mix2_);
  this.mix2_.connect(this.output);

  // Start the buffer nodes.
  var t = context.currentTime + 0.050;
  var t2 = t + PitchShifterPipeline.BUFFER_TIME_ -
      PitchShifterPipeline.FADE_TIME_;
  this.mod1a_.start(t);
  this.mod1b_.start(t);
  this.fade1_.start(t);

  this.mod2a_.start(t2);
  this.mod2b_.start(t2);
  this.fade2_.start(t2);

  // Set the parameters for the buffer nodes.
  this.setPitchOffset(1);
};


/**
 * The amount of delay time to have in the audio.
 * @private {number}
 * @const
 */
PitchShifterPipeline.DELAY_TIME_ = 0.100;


/**
 * The amount of fade time to have in the audio.
 * @private {number}
 * @const
 */
PitchShifterPipeline.FADE_TIME_ = 0.050;


/**
 * The amount of buffer time to have in the audio.
 * @private {number}
 * @const
 */
PitchShifterPipeline.BUFFER_TIME_ = 0.100;


/**
 * Create a time delaying buffer.
 * @private
 */
PitchShifterPipeline.createDelayTimeBuffer_ = function(context,
    activeTime, fadeTime, shiftUp) {
  var length1 = activeTime * context.sampleRate;
  var length2 = (activeTime - 2 * fadeTime) * context.sampleRate;
  var length = length1 + length2;
  var buffer = context.createBuffer(1, length, context.sampleRate);
  var p = buffer.getChannelData(0);

  console.log("createDelayTimeBuffer() length = " + length);
    
  // 1st part of cycle
  for (var i = 0; i < length1; ++i) {
    if (shiftUp) {
      // This line does shift-up transpose
      p[i] = (length1 - i)/length;
    } else {
      // This line does shift-down transpose
      p[i] = i / length1;
    }
  }

  // 2nd part
  for (var i = length1; i < length; ++i) {
    p[i] = 0;
  }

  return buffer;
};


/**
 * Static helper method to create a sound buffer that operates the cross
 * fading circuit.
 * @param {!AudioContext} context The context.
 * @param {number} activeTime Unknown.
 * @param {number} fadeTime Unknown.
 * @private
 */
PitchShifterPipeline.createFadeBuffer_ = function(context,
    activeTime, fadeTime) {
  var length1 = activeTime * context.sampleRate;
  var length2 = (activeTime - 2 * fadeTime) * context.sampleRate;
  var length = length1 + length2;
  var buffer = context.createBuffer(1, length, context.sampleRate);
  var p = buffer.getChannelData(0);

  console.log("createFadeBuffer() length = " + length);

  var fadeLength = fadeTime * context.sampleRate;

  var fadeIndex1 = fadeLength;
  var fadeIndex2 = length1 - fadeLength;

  // 1st part of cycle.
  for (var i = 0; i < length1; ++i) {
    var value;
    if (i < fadeIndex1) {
      value = Math.sqrt(i / fadeLength);
    } else if (i >= fadeIndex2) {
      value = Math.sqrt(1 - (i - fadeIndex2) / fadeLength);
    } else {
      value = 1;
    }
    p[i] = value;
  }

  // 2nd part
  for (var i = length1; i < length; ++i) {
    p[i] = 0;
  }
   
  return buffer;
};


/**
 * @private
 */
PitchShifterPipeline.createBufferNode_ = function(context, buffer) {
  var bufferSource = context.createBufferSource();
  bufferSource.buffer = buffer;
  bufferSource.loop = true;
  return bufferSource;
};


/**
 * Get the current pitch shift amount.
 * @return {number} The pitch shift in octaves from -1 to 1.
 */
PitchShifterPipeline.prototype.setPitchOffset = function(mult) {
  if (mult > 0) {
    // pitch up
    this.mod1aGain_.gain.value = 0;
    this.mod1bGain_.gain.value = 1;
    this.mod2aGain_.gain.value = 0;
    this.mod2bGain_.gain.value = 1;
  } else {
    // pitch down
    this.mod1aGain_.gain.value = 1;
    this.mod1bGain_.gain.value = 0;
    this.mod2aGain_.gain.value = 1;
    this.mod2bGain_.gain.value = 0;
  }

  var delayTime = PitchShifterPipeline.DELAY_TIME_ * Math.abs(mult);
  this.modGain1_.gain.setTargetAtTime(0.5 * delayTime, 0, 0.010);
  this.modGain2_.gain.setTargetAtTime(0.5 * delayTime, 0, 0.010);

  this.currentPitch_ = mult;
};


/**
 * Get the current pitch shift amount.
 * @return {number} The pitch shift in octaves from -1 to 1.
 */
PitchShifterPipeline.prototype.getPitchOffset = function() {
  return this.currentPitch_;
};
