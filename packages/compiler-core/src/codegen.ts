import {
  NodeTypes,
  type ElementNode,
  type PropNode,
  type RootNode,
  type SimpleExpressionNode,
  type TemplateChildNode,
} from "./ast";

export function generate(ast: RootNode): { code: string } {
  // codegenNode 在 generate 前必定已被 transform 赋值,用非空断言
  const expression = genNode(ast.codegenNode!);
  return {
    code:
      `const { h: _h, Fragment: _Fragment, toDisplayString: _toDisplayString } = Vue\n` +
      `return function render(_ctx) { return ${expression} }`,
  };
}

// 【可辨识联合的主场】switch(node.type) 的每个 case 里,
// node 自动收窄成对应接口,访问错字段会直接报错
function genNode(node: TemplateChildNode | SimpleExpressionNode): string {
  switch (node.type) {
    case NodeTypes.TEXT:
      return JSON.stringify(node.content);
    case NodeTypes.SIMPLE_EXPRESSION:
      return node.content;
    case NodeTypes.INTERPOLATION:
      return `_toDisplayString(${genNode(node.content)})`;
    case NodeTypes.ELEMENT:
      return genElement(node);
    default:
      return "null";
  }
}

function genElement(node: ElementNode): string {
  const tag = node.tag === "Fragment" ? "_Fragment" : JSON.stringify(node.tag);
  const props = genProps(node.props);
  let children = "null";
  if (node.children.length === 1) children = genNode(node.children[0]);
  else if (node.children.length > 1) {
    children = `[${node.children.map(genNode).join(", ")}]`;
  }
  return `_h(${tag}, ${props}, ${children})`;
}

function genProps(props: PropNode[]): string {
  if (!props.length) return "null";
  return `{ ${props
    .map((prop) => {
      // if/else 里同样收窄:这个分支是 AttributeNode,
      // 走到下面的代码 prop 自动是 DirectiveNode
      if (prop.type === NodeTypes.ATTRIBUTE) {
        return `${JSON.stringify(prop.name)}: ${JSON.stringify(prop.value)}`;
      }
      const name =
        prop.name === "on"
          ? `on${prop.arg[0].toUpperCase()}${prop.arg.slice(1)}`
          : prop.arg;
      const value =
        prop.name === "on"
          ? `(...args) => _ctx.${prop.exp}(...args)`
          : `_ctx.${prop.exp}`;
      return `${JSON.stringify(name)}: ${value}`;
    })
    .join(", ")} }`;
}
