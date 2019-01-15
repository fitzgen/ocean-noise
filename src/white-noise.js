const makeGainNode = noise => {
  const gainNode = noise.gainNode = noise.context.createGain();
  gainNode.gain.value = noise.gain;
  gainNode.connect(noise.context.destination);
};

const makeFilterNode = noise => {
  const filterNode = noise.filterNode = noise.context.createBiquadFilter();
  filterNode.type = "lowpass";
  noise.filterNode.connect(noise.gainNode);
};

const makeOscillationNode = noise => {
  const oscillationNode = noise.oscillationNode = noise.context.createGain();
  oscillationNode.connect(noise.filterNode);
};

const CHANNELS = 2;
const BUFFER_SIZE = 16384;

const startQValueLoop = noise => {
  // Fucking magic numbers; no idea what the scale for Q is, this just sounds
  // alright.
  const qVals = [8, 9, 10, 11, 10, 9];
  let qValIndex = 0;
  (function qValueLoop() {
    noise.filterNode.Q.value = qVals[qValIndex++ % qVals.length];
    qValIndex = qValIndex % qVals.length;
    noise.qValueTimer = setTimeout(qValueLoop, 6000 + Math.random() * 3);
  }());
};

const startFrequencyValueLoop = noise => {
  const fVals = [670, 680, 690, 700, 710, 720, 730, 740, 750, 740, 730, 720, 710, 700, 690, 680];
  let fValIndex = 0;
  (function frequencyValueLoop(){
    noise.filterNode.frequency.value = fVals[fValIndex++ % fVals.length];
    fValIndex = fValIndex % fVals.length;
    noise.frequencyValueTimer = setTimeout(frequencyValueLoop, 7000 + Math.random() * 3);
  }());
};

const startOscillationTimer = noise => {
  let rampToLow = true;
  (function oscillationLoop () {
    const rand = Math.random();
    noise.oscillationNode.gain.exponentialRampToValueAtTime(
      rampToLow ? .3 : 1,
      noise.context.currentTime + 4 + rand
    );
    rampToLow = !rampToLow;
    noise.oscillationTimer = setTimeout(oscillationLoop, 4000 + rand * 3);
  }());
};

const onAudioProcess = e => {
  for (var i = 0; i < CHANNELS; i++) {
    var output = e.outputBuffer.getChannelData(i);
    for (var j = 0, length = output.length; j < length; j++) {
      output[j] = Math.random() * 2 - 1;
    }
  }
};

class WhiteNoise {
  constructor() {
    this.context = null;
    this.gain = 1;
    this.gainNode = null;
    this.filterNode = null;
    this.node = null;
    this.qValueTimer = null;
    this.frequencyValueTimer = null;
    this.oscillationTimer = null;
  }

  play() {
    if (this.context) {
      return;
    }

    const ctx = this.context = new AudioContext();

    makeGainNode(this);
    makeFilterNode(this);
    makeOscillationNode(this);
    startQValueLoop(this);
    startFrequencyValueLoop(this);
    startOscillationTimer(this);

    this.node = ctx.createScriptProcessor(BUFFER_SIZE, 1, CHANNELS);
    this.node.onaudioprocess = onAudioProcess;
    this.node.connect(this.oscillationNode);
  }

  pause() {
    if (!this.context) {
      return;
    }

    clearTimeout(this.qValueTimer);
    this.qValueTimer = null;

    clearTimeout(this.frequencyValueTimer);
    this.frequencyValueTimer = null;

    clearTimeout(this.oscillationTimer);
    this.oscillationTimer = null;

    this.filterNode.disconnect();
    this.filterNode = null;

    this.gainNode.disconnect();
    this.gainNode = null;

    this.node.disconnect();
    this.node = null;

    this.context.close();
    this.context = null;
  }

  setVolume(newVolume) {
    const percentage = newVolume / 100;
    const gain = percentage * percentage;
    this.gain = gain;
    if (this.gainNode) {
      this.gainNode.gain.value = gain;
    }
  }
}
