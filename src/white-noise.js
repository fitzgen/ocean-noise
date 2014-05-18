function WhiteNoise(context, { channels, bufferSize }) {
  this._channels = channels;
  this._bufferSize = bufferSize;

  this._node = context.createScriptProcessor(this._bufferSize, 1, this._channels);
  this._node.onaudioprocess = this.onAudioProcess.bind(this);

  this.connect = this._node.connect.bind(this._node);
  this.disconnect = this._node.disconnect.bind(this._node);
}

WhiteNoise.prototype.onAudioProcess = function (e) {
  for (let i = 0; i < this._channels; i++) {
    let output = e.outputBuffer.getChannelData(i);
    for (let j = 0, length = output.length; j < length; j++) {
      output[j] = Math.random() * this._channels;
    }
  }
};
