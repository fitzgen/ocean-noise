const {
  get,
  conj,
  js_to_clj: map,
  clj_to_js: pretty
} = mori;

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
  const noise = get(state, "noise");
  const playing = get(state, "playing");
  if (playing) {
    noise.pause();
    updateState(conj(state, map({ playing: false })));
  } else {
    noise.play();
    updateState(conj(state, map({ playing: true })));
  }
};

const updateVolume = newVolume => {
  const noise = get(state, "noise");
  noise.setVolume(newVolume);
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
    playing: false,
    noise: new WhiteNoise(),
  }));
}

init();
