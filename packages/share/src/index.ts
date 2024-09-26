export function isObject(object: any) {
  return Object.prototype.toString.call(object) === "[object Object]";
}

export function isFunction(fn: any) {
  return typeof fn === "function";
}
