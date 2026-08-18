import { NodeTypes, type RootNode, type TemplateChildNode } from "./ast";

export function transform(root: RootNode): RootNode {
  traverseNode(root);
  root.codegenNode =
    root.children.length === 1
      ? root.children[0]
      : {
          type: NodeTypes.ELEMENT,
          tag: "Fragment",
          props: [],
          children: root.children,
        };
  return root;
}

function traverseNode(node: RootNode | TemplateChildNode): void {
  // 【可辨识联合收窄】确认 type 是 INTERPOLATION 后,
  // node 自动变成 InterpolationNode,一路点进 content.content 都不用断言
  if (node.type === NodeTypes.INTERPOLATION) {
    node.content.content = `_ctx.${node.content.content}`;
  }
  // 【in 操作符收窄】Text/Interpolation 节点没有 children 字段,
  // "children" in node 让 TS 收窄到带 children 的节点类型
  if ("children" in node) {
    for (const child of node.children) traverseNode(child);
  }
}
