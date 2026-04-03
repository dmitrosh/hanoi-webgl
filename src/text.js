import { mat4 } from './math.js';
import { COLORS } from './constants.js';
import { TEXT_VERT, TEXT_FRAG } from './shaders.js';

const TEX_W = 512;
const TEX_H = 64;

// 3D quad local coords, TRIANGLE_STRIP: (0,0,0)→(8,1.5,0)
// uv: bottom-left=(0,1), bottom-right=(1,1), top-left=(0,0), top-right=(1,0)
const QUAD_DATA = new Float32Array([
  // x      y     z    u    v
  0.0,   0.0,  0.0,  0.0, 1.0,
  8.0,   0.0,  0.0,  1.0, 1.0,
  0.0,   1.5,  0.0,  0.0, 0.0,
  8.0,   1.5,  0.0,  1.0, 0.0,
]);

function compileShader(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error('Text shader compile error: ' + gl.getShaderInfoLog(s));
  }
  return s;
}

function createProgram(gl, vert, frag) {
  const prog = gl.createProgram();
  gl.attachShader(prog, vert);
  gl.attachShader(prog, frag);
  gl.bindAttribLocation(prog, 0, 'aPosition');
  gl.bindAttribLocation(prog, 1, 'aTexCoord');
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error('Text program link error: ' + gl.getProgramInfoLog(prog));
  }
  return prog;
}

export class TextRenderer {
  constructor(gl) {
    this._gl = gl;
    this._canvas = document.createElement('canvas');
    this._canvas.width  = TEX_W;
    this._canvas.height = TEX_H;
    this._ctx = this._canvas.getContext('2d');

    this._program = createProgram(
      gl,
      compileShader(gl, gl.VERTEX_SHADER,   TEXT_VERT),
      compileShader(gl, gl.FRAGMENT_SHADER, TEXT_FRAG),
    );

    this._uMVP     = gl.getUniformLocation(this._program, 'uMVP');
    this._uTexture = gl.getUniformLocation(this._program, 'uTexture');

    // Upload empty texture first
    this._texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this._texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._canvas);

    // VAO + VBO for the text quad
    this._vao = gl.createVertexArray();
    gl.bindVertexArray(this._vao);

    this._vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this._vbo);
    gl.bufferData(gl.ARRAY_BUFFER, QUAD_DATA, gl.STATIC_DRAW);

    const stride = 5 * 4;
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 3 * 4);

    gl.bindVertexArray(null);

    this._mvp = new Float32Array(16);
    this._tmp = new Float32Array(16);
  }

  updateText(text, colorIndex) {
    const gl  = this._gl;
    const ctx = this._ctx;
    ctx.clearRect(0, 0, TEX_W, TEX_H);

    const col = COLORS[colorIndex] || COLORS[0];
    ctx.fillStyle = `rgb(${Math.round(col[0]*255)},${Math.round(col[1]*255)},${Math.round(col[2]*255)})`;
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.textBaseline = 'top';

    const lines = text.split('/');
    const lineH = TEX_H / lines.length;
    lines.forEach((line, i) => {
      ctx.fillText(line.trim(), 4, i * lineH + 4);
    });

    gl.bindTexture(gl.TEXTURE_2D, this._texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._canvas);
  }

  render(projMatrix, viewMatrix) {
    const gl = this._gl;

    // Model: translate(-1,-0.6,3) * rotateX(-35°)
    mat4.identity(this._tmp);
    mat4.translate(this._tmp, this._tmp, [1, -1, 4]);
    mat4.rotateX(this._tmp, this._tmp, -35 * Math.PI / 180);

    // MVP = projection * view * model
    mat4.multiply(this._mvp, viewMatrix, this._tmp);
    mat4.multiply(this._mvp, projMatrix, this._mvp);

    gl.useProgram(this._program);
    gl.uniformMatrix4fv(this._uMVP, false, this._mvp);
    gl.uniform1i(this._uTexture, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._texture);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);

    gl.bindVertexArray(this._vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);

    gl.depthMask(true);
    gl.disable(gl.BLEND);
  }
}
