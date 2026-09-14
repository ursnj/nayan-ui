import type { ChromaKey, ColorAdjust } from '../types';

/**
 * Per-pixel layer processing on the GPU.
 *
 * Canvas2D's `filter` covers brightness, contrast, saturate, grayscale and
 * blur perfectly well, and those stay on the cheap path. Two things it cannot
 * express are worth a shader: chroma keying, which depends on how close a
 * pixel's own colour is to the key, and colour temperature, which is a
 * per-channel offset rather than a filter.
 *
 * The compositor only routes a layer through here when it needs one of those
 * (`needsPixelProcessing`).
 */

const VERTEX_SHADER = `#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main() {
  // A single oversized triangle beats a quad: no diagonal seam, one less vertex.
  vUv = (aPosition + 1.0) * 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uTexture;

uniform float uBrightness;
uniform float uContrast;
uniform float uSaturation;
uniform float uTemperature;
uniform float uGrayscale;

uniform bool uChromaEnabled;
uniform vec3 uKeyColor;
uniform float uSimilarity;
uniform float uSmoothness;
uniform float uSpill;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

float luminance(vec3 color) {
  return dot(color, LUMA);
}

/** RGB → chrominance only; hue/saturation distance keys far better than RGB distance. */
vec2 toChroma(vec3 color) {
  float y = luminance(color);
  return vec2(color.b - y, color.r - y);
}

void main() {
  vec4 texel = texture(uTexture, vUv);

  // Work in straight alpha so colour maths isn't skewed by transparency.
  vec3 color = texel.a > 0.001 ? texel.rgb / texel.a : texel.rgb;
  float alpha = texel.a;

  if (uChromaEnabled) {
    float keyDistance = length(toChroma(color) - toChroma(uKeyColor));
    float matte = smoothstep(uSimilarity, uSimilarity + max(uSmoothness, 0.001), keyDistance);
    if (uSpill > 0.0) {
      // Where the matte is partial, the remaining fringe carries key colour;
      // pull it toward neutral rather than leaving a green rim.
      color = mix(color, vec3(luminance(color)), (1.0 - matte) * uSpill);
    }
    alpha *= matte;
  }

  color *= uBrightness;
  color = (color - 0.5) * uContrast + 0.5;

  if (uTemperature != 0.0) {
    color.r += uTemperature * 0.12;
    color.b -= uTemperature * 0.12;
  }

  color = mix(vec3(luminance(color)), color, uSaturation);
  if (uGrayscale > 0.0) color = mix(color, vec3(luminance(color)), uGrayscale);

  color = clamp(color, 0.0, 1.0);
  // Back to premultiplied alpha for correct canvas compositing.
  fragColor = vec4(color * alpha, alpha);
}`;

export interface PixelEffectParams {
  color: ColorAdjust;
  chromaKey: ChromaKey;
}

/** True when a layer needs the shader rather than plain `ctx.filter`. */
export const needsPixelProcessing = (params: { color: ColorAdjust; chromaKey?: ChromaKey }): boolean =>
  (params.chromaKey?.enabled ?? false) || params.color.temperature !== 0;

const hexToRgb = (hex: string): [number, number, number] => {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.replace(/./g, char => char + char) : clean;
  const value = Number.parseInt(full.slice(0, 6), 16);
  if (Number.isNaN(value)) return [0, 0, 0];
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
};

class GLProcessor {
  private canvas: OffscreenCanvas | HTMLCanvasElement | null = null;
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private texture: WebGLTexture | null = null;
  private uniforms = new Map<string, WebGLUniformLocation | null>();
  private failed = false;

  /** Null when WebGL2 is unavailable; callers then fall back to Canvas2D. */
  private ensure(width: number, height: number): WebGL2RenderingContext | null {
    if (this.failed) return null;
    if (!this.gl) {
      try {
        this.canvas =
          typeof OffscreenCanvas !== 'undefined'
            ? new OffscreenCanvas(width, height)
            : Object.assign(document.createElement('canvas'), { width, height });
        const gl = this.canvas.getContext('webgl2', {
          premultipliedAlpha: true,
          alpha: true,
          antialias: false,
          preserveDrawingBuffer: false
        }) as WebGL2RenderingContext | null;
        if (!gl) throw new Error('no webgl2');
        this.gl = gl;
        this.setup(gl);
      } catch {
        this.failed = true;
        return null;
      }
    }
    if (this.canvas && (this.canvas.width !== width || this.canvas.height !== height)) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    return this.gl;
  }

  private setup(gl: WebGL2RenderingContext) {
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader) ?? 'shader compile failed');
      }
      return shader;
    };

    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX_SHADER));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) ?? 'program link failed');
    }
    gl.useProgram(program);
    this.program = program;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  private location(name: string): WebGLUniformLocation | null {
    if (!this.uniforms.has(name)) {
      this.uniforms.set(name, this.gl!.getUniformLocation(this.program!, name));
    }
    return this.uniforms.get(name) ?? null;
  }

  /**
   * Runs the effect stack over `source` and returns a canvas holding the
   * result, or null if the GPU path is unavailable.
   *
   * The returned canvas is reused between calls, so draw from it before
   * processing the next layer.
   */
  process(source: TexImageSource, width: number, height: number, params: PixelEffectParams): OffscreenCanvas | HTMLCanvasElement | null {
    const gl = this.ensure(width, height);
    if (!gl || !this.program) return null;

    try {
      gl.viewport(0, 0, width, height);
      gl.useProgram(this.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

      const { color, chromaKey } = params;
      gl.uniform1i(this.location('uTexture'), 0);
      gl.uniform1f(this.location('uBrightness'), color.brightness);
      gl.uniform1f(this.location('uContrast'), color.contrast);
      gl.uniform1f(this.location('uSaturation'), color.saturation);
      gl.uniform1f(this.location('uTemperature'), color.temperature);
      gl.uniform1f(this.location('uGrayscale'), color.grayscale);

      gl.uniform1i(this.location('uChromaEnabled'), chromaKey.enabled ? 1 : 0);
      const [r, g, b] = hexToRgb(chromaKey.color);
      gl.uniform3f(this.location('uKeyColor'), r, g, b);
      gl.uniform1f(this.location('uSimilarity'), chromaKey.similarity * 0.5);
      gl.uniform1f(this.location('uSmoothness'), chromaKey.smoothness * 0.5);
      gl.uniform1f(this.location('uSpill'), chromaKey.spill);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      return this.canvas;
    } catch {
      this.failed = true;
      return null;
    }
  }
}

/**
 * Preview and export each get their own processor: they run concurrently and
 * at different resolutions, and sharing one canvas would make them clobber
 * each other's output.
 */
export const previewProcessor = new GLProcessor();
export const exportProcessor = new GLProcessor();

/** Colour work that Canvas2D's `filter` handles well, for the fast path. */
export const canvasFilterString = (color: ColorAdjust, blurScale: number): string => {
  const parts: string[] = [];
  if (color.brightness !== 1) parts.push(`brightness(${color.brightness})`);
  if (color.contrast !== 1) parts.push(`contrast(${color.contrast})`);
  if (color.saturation !== 1) parts.push(`saturate(${color.saturation})`);
  if (color.grayscale > 0) parts.push(`grayscale(${color.grayscale})`);
  if (color.blur > 0) parts.push(`blur(${(color.blur * blurScale).toFixed(2)}px)`);
  return parts.length > 0 ? parts.join(' ') : 'none';
};

/** Blur only — used after the shader has handled everything else. */
export const blurOnlyFilter = (color: ColorAdjust, blurScale: number): string =>
  color.blur > 0 ? `blur(${(color.blur * blurScale).toFixed(2)}px)` : 'none';
