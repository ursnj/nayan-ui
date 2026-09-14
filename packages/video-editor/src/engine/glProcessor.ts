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
  //
  // The V coordinate is inverted because the two conventions disagree: GL's
  // framebuffer counts rows from the bottom, while a texture uploaded from a
  // canvas has its first row — the top of the picture — at v = 0. Sampling
  // straight through hands back a vertically flipped frame.
  vUv = vec2((aPosition.x + 1.0) * 0.5, 1.0 - (aPosition.y + 1.0) * 0.5);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

/*
 * The grade runs in the order a colourist would work: fix the picture, then
 * balance it, then style it, then add texture. Reordering these changes the
 * result, so the stages are commented rather than merely listed.
 */
const FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uTexture;
uniform vec2 uTexel;

uniform float uBrightness;
uniform float uContrast;
uniform float uSaturation;
uniform float uVibrance;
uniform float uTemperature;
uniform float uTint;
uniform float uHighlights;
uniform float uShadows;
uniform float uFade;
uniform float uVignette;
uniform float uGrain;
uniform float uSharpen;
uniform vec3 uShadowTint;
uniform vec3 uHighlightTint;
uniform float uSplitTone;
uniform float uGrayscale;
uniform float uSeed;

uniform bool uChromaEnabled;
uniform vec3 uKeyColor;
uniform float uSimilarity;
uniform float uSmoothness;
uniform float uSpill;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

float luminance(vec3 color) {
  return dot(color, LUMA);
}

/** RGB -> chrominance only; hue/saturation distance keys far better than RGB distance. */
vec2 toChroma(vec3 color) {
  float y = luminance(color);
  return vec2(color.b - y, color.r - y);
}

/** Cheap hash for grain. Deterministic per pixel per frame, no texture needed. */
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec4 texel = texture(uTexture, vUv);

  /* --- Texture: unsharp mask, before any colour work touches the edges --- */
  if (uSharpen > 0.0) {
    // Four-tap cross is enough for a preview-grade mask and costs a quarter of
    // a full 3x3 kernel. Only the colour is sharpened — running the mask over
    // alpha too would ring the edge of every matte and every glyph.
    vec3 neighbours = texture(uTexture, vUv + vec2(uTexel.x, 0.0)).rgb
                    + texture(uTexture, vUv - vec2(uTexel.x, 0.0)).rgb
                    + texture(uTexture, vUv + vec2(0.0, uTexel.y)).rgb
                    + texture(uTexture, vUv - vec2(0.0, uTexel.y)).rgb;
    texel.rgb += (texel.rgb - neighbours * 0.25) * uSharpen * 1.5;
  }

  // Work in straight alpha so colour maths isn't skewed by transparency.
  vec3 color = texel.a > 0.001 ? texel.rgb / texel.a : texel.rgb;
  float alpha = texel.a;
  color = clamp(color, 0.0, 1.0);

  /* --- Matte: pull the key before grading, so spill is judged on raw pixels --- */
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

  /* --- Exposure --- */
  color *= uBrightness;

  /* --- Tone regions. Weighted by luma so each end moves without flattening
         the other; squaring the weight keeps the midtones still. --- */
  if (uHighlights != 0.0 || uShadows != 0.0) {
    float y = luminance(color);
    float highlightWeight = y * y;
    float shadowWeight = (1.0 - y) * (1.0 - y);
    color += uHighlights * highlightWeight * 0.5;
    color += uShadows * shadowWeight * 0.5;
  }

  /* --- Contrast, pivoted on mid grey --- */
  color = (color - 0.5) * uContrast + 0.5;

  /* --- White balance: amber/blue on one axis, magenta/green on the other --- */
  if (uTemperature != 0.0) {
    color.r += uTemperature * 0.12;
    color.b -= uTemperature * 0.12;
  }
  if (uTint != 0.0) {
    color.g -= uTint * 0.10;
    color.r += uTint * 0.05;
    color.b += uTint * 0.05;
  }

  // Exposure, tone and contrast can all push a channel outside [0,1]. Every
  // stage below reads the channel values back — vibrance compares them, split
  // tone assumes a soft-light range, grain weights by luma — so bring them
  // back into range once here rather than letting each stage misbehave.
  color = clamp(color, 0.0, 1.0);

  /* --- Vibrance before saturation: it leans on the gap between a pixel's
         strongest and weakest channel, which a global saturate would erase. --- */
  if (uVibrance != 0.0) {
    float mx = max(color.r, max(color.g, color.b));
    float mn = min(color.r, min(color.g, color.b));
    float chroma = mx - mn;
    color = mix(vec3(luminance(color)), color, 1.0 + uVibrance * (1.0 - chroma));
  }

  color = mix(vec3(luminance(color)), color, uSaturation);

  /* --- Split tone: push the dark and bright ends towards their own hues --- */
  if (uSplitTone > 0.0) {
    float y = clamp(luminance(color), 0.0, 1.0);
    vec3 tint = mix(uShadowTint, uHighlightTint, smoothstep(0.15, 0.85, y));
    // Soft light keeps the tint from washing the picture out the way a
    // straight mix would.
    vec3 toned = color * (1.0 - 2.0 * (tint - 0.5) * color) + 2.0 * color * (tint - 0.5);
    color = mix(color, toned, uSplitTone);
  }

  if (uGrayscale > 0.0) color = mix(color, vec3(luminance(color)), uGrayscale);

  /* --- Fade: lift the black point for the matte-film look --- */
  if (uFade > 0.0) color = color * (1.0 - uFade * 0.45) + uFade * 0.22;

  /* --- Vignette --- */
  if (uVignette > 0.0) {
    // smoothstep is undefined when edge0 >= edge1, so the falloff is built the
    // right way round and inverted rather than passing reversed edges.
    float falloff = 1.0 - smoothstep(0.25, 0.75, length(vUv - 0.5) * 1.4);
    color *= mix(1.0, falloff, uVignette);
  }

  /* --- Grain last, so it isn't stretched by contrast or tinted --- */
  if (uGrain > 0.0) {
    float noise = hash(vUv * 1024.0 + uSeed) - 0.5;
    // Grain reads strongest in the midtones and all but vanishes in clipped
    // highlights, which is how film behaves.
    float y = luminance(color);
    color += noise * uGrain * 0.22 * (1.0 - abs(y * 2.0 - 1.0));
  }

  color = clamp(color, 0.0, 1.0);
  // Back to premultiplied alpha for correct canvas compositing.
  fragColor = vec4(color * alpha, alpha);
}`;

export interface PixelEffectParams {
  color: ColorAdjust;
  chromaKey: ChromaKey;
  /** Varies the grain pattern between frames; static grain looks like dirt. */
  seed: number;
}

/**
 * True when a layer needs the shader rather than plain `ctx.filter`.
 *
 * Canvas2D covers brightness, contrast, saturate, grayscale and blur, so a
 * clip using only those stays on the cheap path. Everything below is either
 * per-pixel or region-weighted and has no filter-function equivalent.
 */
export const needsPixelProcessing = (params: { color: ColorAdjust; chromaKey?: ChromaKey }): boolean => {
  const { color } = params;
  return (
    (params.chromaKey?.enabled ?? false) ||
    color.temperature !== 0 ||
    color.tint !== 0 ||
    color.vibrance !== 0 ||
    color.highlights !== 0 ||
    color.shadows !== 0 ||
    color.fade > 0 ||
    color.vignette > 0 ||
    color.grain > 0 ||
    color.sharpen > 0 ||
    color.splitTone > 0
  );
};

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
      } catch (error) {
        // Falling back to Canvas2D silently would leave every shader-only
        // effect doing nothing with no way to tell why, so say so once.
        console.error('[video-editor] GPU effects unavailable, falling back to Canvas2D:', error);
        this.failed = true;
        return null;
      }
    }
    /*
     * Grow only, never shrink.
     *
     * Resizing a WebGL canvas reallocates its drawing buffer. A transition
     * runs two layers through here per frame, so a 1080p clip blending into a
     * 720p one would reallocate twice on every frame of the blend. Keeping the
     * surface at the high-water mark costs a little idle memory and removes
     * the churn entirely; `process` renders into a sub-rectangle of it.
     */
    if (this.canvas && (this.canvas.width < width || this.canvas.height < height)) {
      this.canvas.width = Math.max(this.canvas.width, width);
      this.canvas.height = Math.max(this.canvas.height, height);
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
      // The surface may be larger than this layer. GL counts rows from the
      // bottom and the compositor reads back from the top-left, so the
      // viewport is pushed up to land the render where Canvas2D will look for
      // it: the rectangle (0, 0, width, height) in image coordinates.
      const surfaceHeight = this.canvas?.height ?? height;
      gl.viewport(0, surfaceHeight - height, width, height);
      gl.useProgram(this.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

      const { color, chromaKey } = params;
      gl.uniform1i(this.location('uTexture'), 0);
      gl.uniform2f(this.location('uTexel'), 1 / Math.max(1, width), 1 / Math.max(1, height));
      gl.uniform1f(this.location('uBrightness'), color.brightness);
      gl.uniform1f(this.location('uContrast'), color.contrast);
      gl.uniform1f(this.location('uSaturation'), color.saturation);
      gl.uniform1f(this.location('uVibrance'), color.vibrance);
      gl.uniform1f(this.location('uTemperature'), color.temperature);
      gl.uniform1f(this.location('uTint'), color.tint);
      gl.uniform1f(this.location('uHighlights'), color.highlights);
      gl.uniform1f(this.location('uShadows'), color.shadows);
      gl.uniform1f(this.location('uFade'), color.fade);
      gl.uniform1f(this.location('uVignette'), color.vignette);
      gl.uniform1f(this.location('uGrain'), color.grain);
      gl.uniform1f(this.location('uSharpen'), color.sharpen);
      gl.uniform1f(this.location('uSplitTone'), color.splitTone);
      gl.uniform1f(this.location('uGrayscale'), color.grayscale);
      // Wrapped so the value stays small enough for `sin()` to keep its
      // precision in the grain hash.
      gl.uniform1f(this.location('uSeed'), (params.seed / 1000) % 1024);

      const [sr, sg, sb] = hexToRgb(color.shadowTint);
      gl.uniform3f(this.location('uShadowTint'), sr, sg, sb);
      const [hr, hg, hb] = hexToRgb(color.highlightTint);
      gl.uniform3f(this.location('uHighlightTint'), hr, hg, hb);

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
