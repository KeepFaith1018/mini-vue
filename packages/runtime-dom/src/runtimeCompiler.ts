import { baseCompile } from "@vue/compiler-core";
import {
  Fragment,
  h,
  registerRuntimeCompiler,
  toDisplayString,
} from "@vue/runtime-core";

export function compileToFunction(template: string) {
  const { code } = baseCompile(template);
  return new Function("Vue", code)({ h, Fragment, toDisplayString });
}

registerRuntimeCompiler(compileToFunction);
