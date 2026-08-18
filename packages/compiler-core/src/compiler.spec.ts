import { describe, expect, it } from "vitest";
import { baseCompile, baseParse, NodeTypes } from "./index";

describe("compiler-core", () => {
  it("parses text, interpolation, elements and directives", () => {
    const ast = baseParse(
      '<button :id="id" @click="inc">Hi {{ name }}</button>'
    );
    const element = ast.children[0];
    expect(element.type).toBe(NodeTypes.ELEMENT);
    // 【可辨识联合】确认 type 后,TS 在下面把 element 自动收窄成 ElementNode
    if (element.type !== NodeTypes.ELEMENT)
      throw new Error("expected an element");
    expect(element.props).toHaveLength(2);
    expect(element.children.map((node) => node.type)).toEqual([
      NodeTypes.TEXT,
      NodeTypes.INTERPOLATION,
    ]);
  });

  it("generates an executable render function body", () => {
    const { code } = baseCompile('<div class="box">{{ message }}</div>');
    expect(code).toContain('_h("div"');
    expect(code).toContain("_toDisplayString(_ctx.message)");
  });
});
