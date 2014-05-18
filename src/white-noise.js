function WhiteNoise(context, opts) {
  this._channels = opts.channels;
  this._bufferSize = opts.bufferSize;

  this._node = context.createScriptProcessor(this._bufferSize, 1, this._channels);
  this._node.onaudioprocess = this.onAudioProcess.bind(this);

  this.connect = this._node.connect.bind(this._node);
  this.disconnect = this._node.disconnect.bind(this._node);
}

WhiteNoise.prototype.onAudioProcess = function (e) {
  for (var i = 0; i < this._channels; i++) {
    var output = e.outputBuffer.getChannelData(i);
    for (var j = 0, length = output.length; j < length; j++) {
      output[j] = Math.random() * 2 - 1;
    }
  }
};
