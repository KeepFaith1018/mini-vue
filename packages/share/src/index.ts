// 【类型守卫】返回值写成 "参数 is 类型" 叫类型谓词:
// 调用方写 if (isObject(x)),分支里 x 会自动收窄成 Record —— TS 的"自动收窄"全靠它
export function isObject(
  object: unknown
): object is Record<PropertyKey, unknown> {
  return Object.prototype.toString.call(object) === "[object Object]";
}

export function isFunction(fn: unknown): fn is Function {
  return typeof fn === "function";
}

export function isString(str: unknown): str is string {
  return typeof str === "string";
}
export * from "./shapeFlags";
export * from "./patchFlags";

const hasOwnProperty = Object.prototype.hasOwnProperty;
// unknown 是"类型安全的 any":任何值都能赋给它,但必须先检查才能使用
export const hasOwn = (value: object, key: PropertyKey): boolean =>
  hasOwnProperty.call(value, key);
