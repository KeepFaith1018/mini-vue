import { baseCompile } from "@vue/compiler-core";
import {
  Fragment,
  h,
  registerRuntimeCompiler,
  toDisplayString,
} from "@vue/runtime-core";
import type { RenderFunction } from "@vue/runtime-core";

// 运行时编译:把模板字符串编译成 render 函数,注册给 runtime-core
export function compileToFunction(template: string): RenderFunction {
  const { code } = baseCompile(template);
  return new Function("Vue", code)({ h, Fragment, toDisplayString });
}

registerRuntimeCompiler(compileToFunction);
