import { Matrix4 } from 'three';

export default class Matrix extends Matrix4 {
  set x(x) {
    this.elements[12] = x;
  }

  get x() {
    return this.elements[12];
  }

  set y(y) {
    this.elements[13] = y;
  }

  get y() {
    return this.elements[13];
  }

  set z(z) {
    this.elements[14] = z;
  }

  get z() {
    return this.elements[14];
  }
}
