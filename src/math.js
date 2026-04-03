// Minimal mat4/vec3 library — column-major Float32Array, no external deps.
// All functions that take an `out` parameter write into it and return it.

const { sin, cos, tan, sqrt } = Math;

// ─── mat4 ────────────────────────────────────────────────────────────────────

export const mat4 = {
  create() {
    return new Float32Array(16);
  },

  clone(m) {
    return new Float32Array(m);
  },

  identity(out) {
    out.fill(0);
    out[0] = out[5] = out[10] = out[15] = 1;
    return out;
  },

  // Column-major multiplication: out = a * b
  multiply(out, a, b) {
    const a00 = a[0], a01 = a[1], a02 = a[2],  a03 = a[3];
    const a10 = a[4], a11 = a[5], a12 = a[6],  a13 = a[7];
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    const a30 = a[12],a31 = a[13],a32 = a[14], a33 = a[15];

    let b0, b1, b2, b3;
    b0=b[0]; b1=b[1]; b2=b[2]; b3=b[3];
    out[0]=b0*a00+b1*a10+b2*a20+b3*a30;
    out[1]=b0*a01+b1*a11+b2*a21+b3*a31;
    out[2]=b0*a02+b1*a12+b2*a22+b3*a32;
    out[3]=b0*a03+b1*a13+b2*a23+b3*a33;
    b0=b[4]; b1=b[5]; b2=b[6]; b3=b[7];
    out[4]=b0*a00+b1*a10+b2*a20+b3*a30;
    out[5]=b0*a01+b1*a11+b2*a21+b3*a31;
    out[6]=b0*a02+b1*a12+b2*a22+b3*a32;
    out[7]=b0*a03+b1*a13+b2*a23+b3*a33;
    b0=b[8]; b1=b[9]; b2=b[10];b3=b[11];
    out[8] =b0*a00+b1*a10+b2*a20+b3*a30;
    out[9] =b0*a01+b1*a11+b2*a21+b3*a31;
    out[10]=b0*a02+b1*a12+b2*a22+b3*a32;
    out[11]=b0*a03+b1*a13+b2*a23+b3*a33;
    b0=b[12];b1=b[13];b2=b[14];b3=b[15];
    out[12]=b0*a00+b1*a10+b2*a20+b3*a30;
    out[13]=b0*a01+b1*a11+b2*a21+b3*a31;
    out[14]=b0*a02+b1*a12+b2*a22+b3*a32;
    out[15]=b0*a03+b1*a13+b2*a23+b3*a33;
    return out;
  },

  // gluPerspective equivalent
  perspective(out, fovYDeg, aspect, near, far) {
    const f = 1.0 / tan((fovYDeg * Math.PI / 180) / 2);
    const nf = 1 / (near - far);
    out.fill(0);
    out[0]  = f / aspect;
    out[5]  = f;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[14] = 2 * far * near * nf;
    return out;
  },

  // gluLookAt equivalent
  lookAt(out, eye, center, up) {
    let fx = center[0]-eye[0], fy = center[1]-eye[1], fz = center[2]-eye[2];
    let len = sqrt(fx*fx+fy*fy+fz*fz);
    fx/=len; fy/=len; fz/=len;

    let sx = fy*up[2]-fz*up[1];
    let sy = fz*up[0]-fx*up[2];
    let sz = fx*up[1]-fy*up[0];
    len = sqrt(sx*sx+sy*sy+sz*sz);
    sx/=len; sy/=len; sz/=len;

    const ux = sy*fz-sz*fy;
    const uy = sz*fx-sx*fz;
    const uz = sx*fy-sy*fx;

    out[0]=sx; out[1]=ux; out[2]=-fx; out[3]=0;
    out[4]=sy; out[5]=uy; out[6]=-fy; out[7]=0;
    out[8]=sz; out[9]=uz; out[10]=-fz;out[11]=0;
    out[12]=-(sx*eye[0]+sy*eye[1]+sz*eye[2]);
    out[13]=-(ux*eye[0]+uy*eye[1]+uz*eye[2]);
    out[14]= (fx*eye[0]+fy*eye[1]+fz*eye[2]);
    out[15]=1;
    return out;
  },

  translate(out, m, v) {
    const x=v[0], y=v[1], z=v[2];
    if (out !== m) { for (let i=0;i<16;i++) out[i]=m[i]; }
    out[12] = m[0]*x + m[4]*y + m[8]*z  + m[12];
    out[13] = m[1]*x + m[5]*y + m[9]*z  + m[13];
    out[14] = m[2]*x + m[6]*y + m[10]*z + m[14];
    out[15] = m[3]*x + m[7]*y + m[11]*z + m[15];
    return out;
  },

  scale(out, m, v) {
    const x=v[0], y=v[1], z=v[2];
    out[0]=m[0]*x;  out[1]=m[1]*x;  out[2]=m[2]*x;  out[3]=m[3]*x;
    out[4]=m[4]*y;  out[5]=m[5]*y;  out[6]=m[6]*y;  out[7]=m[7]*y;
    out[8]=m[8]*z;  out[9]=m[9]*z;  out[10]=m[10]*z;out[11]=m[11]*z;
    out[12]=m[12];  out[13]=m[13];  out[14]=m[14];  out[15]=m[15];
    return out;
  },

  rotateX(out, m, rad) {
    const s=sin(rad), c=cos(rad);
    const a10=m[4],a11=m[5],a12=m[6],a13=m[7];
    const a20=m[8],a21=m[9],a22=m[10],a23=m[11];
    if (out !== m) { for (let i=0;i<16;i++) out[i]=m[i]; }
    out[4]  = a10*c + a20*s; out[5]  = a11*c + a21*s;
    out[6]  = a12*c + a22*s; out[7]  = a13*c + a23*s;
    out[8]  = a20*c - a10*s; out[9]  = a21*c - a11*s;
    out[10] = a22*c - a12*s; out[11] = a23*c - a13*s;
    return out;
  },

  rotateY(out, m, rad) {
    const s=sin(rad), c=cos(rad);
    const a00=m[0],a01=m[1],a02=m[2],a03=m[3];
    const a20=m[8],a21=m[9],a22=m[10],a23=m[11];
    if (out !== m) { for (let i=0;i<16;i++) out[i]=m[i]; }
    out[0]  = a00*c - a20*s; out[1]  = a01*c - a21*s;
    out[2]  = a02*c - a22*s; out[3]  = a03*c - a23*s;
    out[8]  = a00*s + a20*c; out[9]  = a01*s + a21*c;
    out[10] = a02*s + a22*c; out[11] = a03*s + a23*c;
    return out;
  },

  rotateZ(out, m, rad) {
    const s=sin(rad), c=cos(rad);
    const a00=m[0],a01=m[1],a02=m[2],a03=m[3];
    const a10=m[4],a11=m[5],a12=m[6],a13=m[7];
    if (out !== m) { for (let i=0;i<16;i++) out[i]=m[i]; }
    out[0] = a00*c + a10*s; out[1] = a01*c + a11*s;
    out[2] = a02*c + a12*s; out[3] = a03*c + a13*s;
    out[4] = a10*c - a00*s; out[5] = a11*c - a01*s;
    out[6] = a12*c - a02*s; out[7] = a13*c - a03*s;
    return out;
  },

  // Full 4×4 invert; returns null if not invertible
  invert(out, m) {
    const m00=m[0],m01=m[1],m02=m[2],m03=m[3];
    const m10=m[4],m11=m[5],m12=m[6],m13=m[7];
    const m20=m[8],m21=m[9],m22=m[10],m23=m[11];
    const m30=m[12],m31=m[13],m32=m[14],m33=m[15];

    const b00=m00*m11-m01*m10, b01=m00*m12-m02*m10;
    const b02=m00*m13-m03*m10, b03=m01*m12-m02*m11;
    const b04=m01*m13-m03*m11, b05=m02*m13-m03*m12;
    const b06=m20*m31-m21*m30, b07=m20*m32-m22*m30;
    const b08=m20*m33-m23*m30, b09=m21*m32-m22*m31;
    const b10=m21*m33-m23*m31, b11=m22*m33-m23*m32;

    let det = b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06;
    if (!det) return null;
    det = 1 / det;

    out[0]  = (m11*b11 - m12*b10 + m13*b09) * det;
    out[1]  = (m02*b10 - m01*b11 - m03*b09) * det;
    out[2]  = (m31*b05 - m32*b04 + m33*b03) * det;
    out[3]  = (m22*b04 - m21*b05 - m23*b03) * det;
    out[4]  = (m12*b08 - m10*b11 - m13*b07) * det;
    out[5]  = (m00*b11 - m02*b08 + m03*b07) * det;
    out[6]  = (m32*b02 - m30*b05 - m33*b01) * det;
    out[7]  = (m20*b05 - m22*b02 + m23*b01) * det;
    out[8]  = (m10*b10 - m11*b08 + m13*b06) * det;
    out[9]  = (m01*b08 - m00*b10 - m03*b06) * det;
    out[10] = (m30*b04 - m31*b02 + m33*b00) * det;
    out[11] = (m21*b02 - m20*b04 - m23*b00) * det;
    out[12] = (m11*b07 - m10*b09 - m12*b06) * det;
    out[13] = (m00*b09 - m01*b07 + m02*b06) * det;
    out[14] = (m31*b01 - m30*b03 - m32*b00) * det;
    out[15] = (m20*b03 - m21*b01 + m22*b00) * det;
    return out;
  },

  transpose(out, m) {
    if (out === m) {
      let t;
      t=m[1];  out[1]=m[4];  out[4]=t;
      t=m[2];  out[2]=m[8];  out[8]=t;
      t=m[3];  out[3]=m[12]; out[12]=t;
      t=m[6];  out[6]=m[9];  out[9]=t;
      t=m[7];  out[7]=m[13]; out[13]=t;
      t=m[11]; out[11]=m[14];out[14]=t;
    } else {
      out[0]=m[0]; out[1]=m[4]; out[2]=m[8];  out[3]=m[12];
      out[4]=m[1]; out[5]=m[5]; out[6]=m[9];  out[7]=m[13];
      out[8]=m[2]; out[9]=m[6]; out[10]=m[10];out[11]=m[14];
      out[12]=m[3];out[13]=m[7];out[14]=m[11];out[15]=m[15];
    }
    return out;
  },

  // Returns transpose(inverse(m)) for use as normal matrix (as mat4)
  normalMatrix(out, modelView) {
    const tmp = new Float32Array(16);
    mat4.invert(tmp, modelView);
    mat4.transpose(out, tmp);
    return out;
  },
};

// ─── vec3 ────────────────────────────────────────────────────────────────────

export const vec3 = {
  normalize(out, v) {
    const len = sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]);
    if (len > 0) { out[0]=v[0]/len; out[1]=v[1]/len; out[2]=v[2]/len; }
    return out;
  },
};
