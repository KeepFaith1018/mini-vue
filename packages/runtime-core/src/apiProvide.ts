import { currentInstance } from "./component";

export function provide(key: string, value: unknown): void {
  if (!currentInstance) return; // 建立在组件基础上的
  const parentProvides = currentInstance.parent?.provides;
  let provides = currentInstance.provides;
  if (provides === parentProvides) {
    provides = currentInstance.provides = Object.create(provides);
  }
  provides[key] = value;
}

// 【泛型 + 默认参数】inject<T> 让调用方标注取出的类型,默认值保持原始 null
export function inject<T = unknown>(
  key: string,
  defaultvalue: T | null = null
): T | null | undefined {
  if (!currentInstance) return;
  const provides = currentInstance.parent?.provides;
  if (provides && key in provides) {
    return provides[key] as T;
  } else {
    return defaultvalue;
  }
}
