import { NodeTypes } from "./ast";

export function transform(root) {
  traverseNode(root);
  root.codegenNode =
    root.children.length === 1
      ? root.children[0]
      : { type: NodeTypes.ELEMENT, tag: "Fragment", props: [], children: root.children };
  return root;
}

function traverseNode(node) {
  if (node.type === NodeTypes.INTERPOLATION) {
    node.content.content = `_ctx.${node.content.content}`;
  }
  if (node.children) {
    for (const child of node.children) traverseNode(child);
  }
}
