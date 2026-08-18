export * from "./ast";
export * from "./parse";
export * from "./transform";
export * from "./codegen";

import { baseParse } from "./parse";
import { transform } from "./transform";
import { generate } from "./codegen";
import type { RootNode } from "./ast";

export function baseCompile(template: string): {
  ast: RootNode;
  code: string;
} {
  const ast = baseParse(template);
  transform(ast);
  return { ast, ...generate(ast) };
}

// 兼容项目早期拼写，新的代码应使用 baseParse。
export { baseParse as prase } from "./parse";
