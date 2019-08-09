// TODO We could save a lot of bundle size by
// removing the dependency on 3.js.
import { Matrix4, Vector3 } from 'three';

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

  callVector3Function(name, args, d = 1) {
    let x = args[0];
    if (typeof x === 'object') {
      super[name](x);
    } else {
      let y = args.length > 1 ? args[1] : x;
      let z = args.length > 2 ? args[2] : d;
      super[name](new Vector3(x, y, z));
    }
  }

  scale() {
    this.callVector3Function('scale', arguments, 1);
  }

  setPosition() {
    this.callVector3Function('setPosition', arguments, 0);
  }
}
