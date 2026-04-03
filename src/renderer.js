import { mat4, vec3 } from './math.js';
import {
  MAIN_VERT, MAIN_FRAG,
} from './shaders.js';
import {
  generateCylinder, generateDiskCap, generateFloor,
} from './geometry.js';
import {
  DISK_HEIGHT, SLICES, TOWER_X, COLORS,
  LIGHT_DIR, AMBIENT, SPECULAR, SHININESS,
} from './constants.js';

// Peg geometry constants
const PEG_RADIUS  = 0.08;
const PEG_HEIGHT  = 3.0;  // tall enough to show above all 16 disks

function compileShader(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error('Shader compile error: ' + gl.getShaderInfoLog(s));
  }
  return s;
}

function createProgram(gl, vert, frag) {
  const prog = gl.createProgram();
  gl.attachShader(prog, vert);
  gl.attachShader(prog, frag);
  gl.bindAttribLocation(prog, 0, 'aPosition');
  gl.bindAttribLocation(prog, 1, 'aNormal');
  gl.bindAttribLocation(prog, 2, 'aColor');
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error('Program link error: ' + gl.getProgramInfoLog(prog));
  }
  return prog;
}

function createMesh(gl, positions, normals, indices, colors = null) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  // positions — location 0
  const posVBO = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posVBO);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

  // normals — location 1
  const normVBO = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normVBO);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

  // colors — location 2 (constant zero if not provided)
  const colVBO = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colVBO);
  if (colors) {
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
  } else {
    const zeros = new Float32Array(positions.length); // all zeros
    gl.bufferData(gl.ARRAY_BUFFER, zeros, gl.STATIC_DRAW);
  }
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);

  let ibo = null;
  let count;
  if (indices) {
    ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    count = indices.length;
  } else {
    count = positions.length / 3;
  }

  gl.bindVertexArray(null);
  return { vao, ibo, count };
}

export class Renderer {
  constructor(canvas) {
    this.gl = canvas.getContext('webgl2');
    if (!this.gl) throw new Error('WebGL2 not supported');

    this.projMatrix = new Float32Array(16);
    this.viewMatrix = new Float32Array(16);

    // Reusable scratch matrices
    this._model    = new Float32Array(16);
    this._mv       = new Float32Array(16);
    this._normalM  = new Float32Array(16);
    this._lightDir = new Float32Array(3);
    vec3.normalize(this._lightDir, LIGHT_DIR);
  }

  init() {
    const gl = this.gl;

    // Compile main shader program
    this._program = createProgram(
      gl,
      compileShader(gl, gl.VERTEX_SHADER,   MAIN_VERT),
      compileShader(gl, gl.FRAGMENT_SHADER, MAIN_FRAG),
    );

    // Cache uniform locations
    const p = this._program;
    this._u = {
      model:          gl.getUniformLocation(p, 'uModel'),
      view:           gl.getUniformLocation(p, 'uView'),
      projection:     gl.getUniformLocation(p, 'uProjection'),
      normalMatrix:   gl.getUniformLocation(p, 'uNormalMatrix'),
      lightDir:       gl.getUniformLocation(p, 'uLightDir'),
      cameraPos:      gl.getUniformLocation(p, 'uCameraPos'),
      diffuseColor:   gl.getUniformLocation(p, 'uDiffuseColor'),
      useVertexColor: gl.getUniformLocation(p, 'uUseVertexColor'),
      ambient:        gl.getUniformLocation(p, 'uAmbient'),
      specular:       gl.getUniformLocation(p, 'uSpecular'),
      shininess:      gl.getUniformLocation(p, 'uShininess'),
    };

    // Build meshes
    const cyl  = generateCylinder(SLICES);
    const capB = generateDiskCap(SLICES, true);   // bottom cap, normal (0,-1,0)
    const capT = generateDiskCap(SLICES, false);  // top cap,    normal (0,+1,0)
    const floor = generateFloor();

    this._meshes = {
      cylBody:  createMesh(gl, cyl.positions,  cyl.normals,  cyl.indices),
      capBot:   createMesh(gl, capB.positions, capB.normals, capB.indices),
      capTop:   createMesh(gl, capT.positions, capT.normals, capT.indices),
      floor:    createMesh(gl, floor.positions, floor.normals, null, floor.colors),
    };

    // GL state
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.clearColor(0, 0, 0, 1);
  }

  // Called once per frame before draw calls.
  beginFrame(camera) {
    const gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Projection: gluPerspective(55, 1.5, 5, 21)
    mat4.perspective(this.projMatrix, 55, 1.5, 5, 21);

    // View
    this.viewMatrix.set(camera.getViewMatrix());
    this._eyePos = camera.getEyePosition();

    // Set shared uniforms on main program
    gl.useProgram(this._program);
    gl.uniformMatrix4fv(this._u.view,       false, this.viewMatrix);
    gl.uniformMatrix4fv(this._u.projection, false, this.projMatrix);
    gl.uniform3fv(this._u.lightDir,   this._lightDir);
    gl.uniform3f(this._u.cameraPos, ...this._eyePos);
    gl.uniform3fv(this._u.ambient,   new Float32Array(AMBIENT));
    gl.uniform3fv(this._u.specular,  new Float32Array(SPECULAR));
    gl.uniform1f(this._u.shininess,  SHININESS);
  }

  drawFloor() {
    const gl = this.gl;
    const m  = this._meshes.floor;

    mat4.identity(this._model);
    this._setModelUniforms(this._model, null, true);

    gl.bindVertexArray(m.vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
  }

  drawPeg(towerIndex) {
    const tx = TOWER_X[towerIndex];

    // Scale: (PEG_RADIUS, PEG_HEIGHT, PEG_RADIUS)
    mat4.identity(this._model);
    mat4.translate(this._model, this._model, [tx, 0, 0]);
    mat4.scale(this._model, this._model, [PEG_RADIUS, PEG_HEIGHT, PEG_RADIUS]);

    this._setModelUniforms(this._model, [0.5, 0.5, 0.553222222], false);
    this._drawCylinder();
  }

  drawDisk(worldX, worldY, diskIndex, level, isSelected, rotationDeg) {
    const radius = 0.3 + diskIndex * (1.7 / level);
    const color  = COLORS[(diskIndex - 1) % COLORS.length];

    mat4.identity(this._model);
    mat4.translate(this._model, this._model, [worldX, worldY, 0]);

    if (isSelected) {
      const bob = DISK_HEIGHT + DISK_HEIGHT / (3.9 - radius * 1.4);
      mat4.translate(this._model, this._model, [0, bob, 0]);
      mat4.rotateY(this._model, this._model, rotationDeg * Math.PI / 180);
      mat4.rotateX(this._model, this._model, 5 * Math.PI / 180);
    }

    mat4.scale(this._model, this._model, [radius, DISK_HEIGHT, radius]);

    this._setModelUniforms(this._model, color, false);
    this._drawCylinder();
  }

  // Draws cylinder body + bottom cap + top cap using current model matrix.
  _drawCylinder() {
    const gl = this.gl;

    // Body
    gl.bindVertexArray(this._meshes.cylBody.vao);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._meshes.cylBody.ibo);
    gl.drawElements(gl.TRIANGLES, this._meshes.cylBody.count, gl.UNSIGNED_SHORT, 0);

    // Bottom cap (y=0 face, normal down)
    gl.bindVertexArray(this._meshes.capBot.vao);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._meshes.capBot.ibo);
    gl.drawElements(gl.TRIANGLES, this._meshes.capBot.count, gl.UNSIGNED_SHORT, 0);

    // Top cap (y=1 face, normal up)
    gl.bindVertexArray(this._meshes.capTop.vao);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._meshes.capTop.ibo);
    gl.drawElements(gl.TRIANGLES, this._meshes.capTop.count, gl.UNSIGNED_SHORT, 0);

    gl.bindVertexArray(null);
  }

  _setModelUniforms(model, diffuseColor, useVertexColor) {
    const gl = this.gl;

    // Normal matrix = transpose(inverse(view * model))
    mat4.multiply(this._mv, this.viewMatrix, model);
    mat4.normalMatrix(this._normalM, this._mv);

    gl.uniformMatrix4fv(this._u.model,        false, model);
    gl.uniformMatrix4fv(this._u.normalMatrix,  false, this._normalM);
    gl.uniform1i(this._u.useVertexColor, useVertexColor ? 1 : 0);
    if (!useVertexColor && diffuseColor) {
      gl.uniform3fv(this._u.diffuseColor, new Float32Array(diffuseColor));
    }
  }
}
