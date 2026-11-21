// Runs on the audio rendering thread. PCM is produced by the shared Rust mixer on the main thread.
class NayanMixer extends AudioWorkletProcessor {
  constructor() {
    super();
    this.blocks = [];
    this.offset = 0;
    this.port.onmessage = ({ data }) => {
      if (this.blocks.length < 8) this.blocks.push(data);
    };
  }
  process(_inputs, outputs) {
    const channels = outputs[0];
    for (let i = 0; i < channels[0].length; i++) {
      const block = this.blocks[0];
      channels[0][i] = block ? block[this.offset] : 0;
      channels[1][i] = block ? block[this.offset + 1] : 0;
      if (block) {
        this.offset += 2;
        if (this.offset >= block.length) {
          this.blocks.shift();
          this.offset = 0;
          this.port.postMessage(block.buffer, [block.buffer]);
        }
      }
    }
    return true;
  }
}
registerProcessor('nayan-mixer', NayanMixer);

// The page's microphone: mixes each input block to mono and posts ~43 ms batches to the main thread,
// which hands them to the core's capture buffer.
class NayanMicrophone extends AudioWorkletProcessor {
  constructor() {
    super();
    this.batch = new Float32Array(2048);
    this.filled = 0;
  }
  process(inputs) {
    const channels = inputs[0];
    if (!channels || !channels.length) return true;
    const frames = channels[0].length;
    for (let i = 0; i < frames; i++) {
      let sum = 0;
      for (let c = 0; c < channels.length; c++) sum += channels[c][i];
      this.batch[this.filled++] = sum / channels.length;
      if (this.filled === this.batch.length) {
        this.port.postMessage(this.batch, [this.batch.buffer]);
        this.batch = new Float32Array(2048);
        this.filled = 0;
      }
    }
    return true;
  }
}
registerProcessor('nayan-microphone', NayanMicrophone);
