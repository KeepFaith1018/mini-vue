import { currentInstance } from "./component";

export function provide(key, value) {
  if (!currentInstance) return; // 建立在组件基础上的
  const parentProvides = currentInstance.parent?.provides;
  let provides = currentInstance.provides;
  if (provides === parentProvides) {
    provides = currentInstance.provides = Object.create(provides);
  }
  provides[key] = value;
}

export function inject(key, defaultvalue = null) {
  if (!currentInstance) return;
  const provides = currentInstance.parent?.provides;
  if (provides && key in provides) {
    return provides[key];
  } else {
    return defaultvalue;
  }
}
