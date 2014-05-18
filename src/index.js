const {
  get,
  conj,
  js_to_clj: map,
  clj_to_js: pretty
} = mori;

////////////////////////////////////////////////////////////////////////////////

const context = new AudioContext();

const gainNode = context.createGain();
gainNode.gain.value = 1;
gainNode.connect(context.destination);

const filterNode = context.createBiquadFilter();
filterNode.type = "lowpass";

// Fucking magic numbers; no idea what the scale for Q is, this just sounds
// alright.
const qVals = [8, 9, 10, 11, 10, 9];
let qValIndex = 0;
(function qValueLoop() {
  filterNode.Q.value = qVals[qValIndex++ % qVals.length];
  qValIndex = qValIndex % qVals.length;
  setTimeout(qValueLoop, 6000 + Math.random() * 3);
}());

const fVals = [670, 680, 690, 700, 710, 720, 730, 740, 750, 740, 730, 720, 710, 700, 690, 680];
let fValIndex = 0;
(function frequencyValueLoop(){
  filterNode.frequency.value = fVals[fValIndex++ % fVals.length];
  fValIndex = fValIndex % fVals.length;
  setTimeout(frequencyValueLoop, 7000 + Math.random() * 3);
}());

filterNode.connect(gainNode);

const oscillationNode = context.createGain();
let rampToLow = true;
(function oscillationLoop () {
  const rand = Math.random();
  oscillationNode.gain.exponentialRampToValueAtTime(
    rampToLow ? .3 : 1,
    context.currentTime + 4 + rand
  );
  rampToLow = !rampToLow;
  setTimeout(oscillationLoop, 4000 + rand * 3);
}());
oscillationNode.connect(filterNode);

const noise = new WhiteNoise(context, {
  channels: 2,
  bufferSize: 16384
});

////////////////////////////////////////////////////////////////////////////////

let state;

const logState = () => console.log(pretty(state));

const updateState = newState => {
  if (newState !== state) {
    state = newState;
    scheduleRender();
  }
};

////////////////////////////////////////////////////////////////////////////////

const button = document.getElementById("toggle");
const volume = document.getElementById("volume");

function render(state) {
  button.textContent = get(state, "playing") ? "Pause" : "Play";
  volume.value = get(state, "volume");
}

const scheduleRender = (function () {
  let scheduled = false;
  return () => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(() => {
        render(state);
        scheduled = false;
      });
    }
  };
}());

////////////////////////////////////////////////////////////////////////////////

const toggleNoise = () => {
  if (get(state, "playing")) {
    noise.disconnect();
  } else {
    noise.connect(oscillationNode);
  }

  updateState(conj(state, map({
    playing: !get(state, "playing")
  })));
};

const updateVolume = newVolume => {
  const percentage = newVolume / 100;
  const gain = percentage * percentage;
  gainNode.gain.value = gain;

  updateState(conj(state, map({
    volume: newVolume
  })));
};

////////////////////////////////////////////////////////////////////////////////

button.addEventListener("click", toggleNoise, false);

const SPACE_KEY = 32;
window.addEventListener("keydown", event => {
  if (event.which == SPACE_KEY) {
    toggleNoise();
  }
}, false);

volume.addEventListener("input", _ => {
  updateVolume(parseInt(volume.value, 10));
}, false);

////////////////////////////////////////////////////////////////////////////////

function init() {
  updateState(map({
    volume: 100,
    playing: false
  }));
}

init();
