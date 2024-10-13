export function isObject(object: any) {
  return Object.prototype.toString.call(object) === "[object Object]";
}

export function isFunction(fn: any) {
  return typeof fn === "function";
}

export function isString(str: any) {
  return typeof str === "string";
}
export * from "./shapeFlags";

const hasOwnProperty = Object.prototype.hasOwnProperty;
export const hasOwn = (value, key) => hasOwnProperty.call(value, key);
