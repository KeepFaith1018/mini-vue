import { NodeTypes } from "./ast";

export function generate(ast) {
  const expression = genNode(ast.codegenNode);
  return {
    code:
      `const { h: _h, Fragment: _Fragment, toDisplayString: _toDisplayString } = Vue\n` +
      `return function render(_ctx) { return ${expression} }`,
  };
}

function genNode(node): string {
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

function genElement(node) {
  const tag = node.tag === "Fragment" ? "_Fragment" : JSON.stringify(node.tag);
  const props = genProps(node.props);
  let children = "null";
  if (node.children.length === 1) children = genNode(node.children[0]);
  else if (node.children.length > 1) {
    children = `[${node.children.map(genNode).join(", ")}]`;
  }
  return `_h(${tag}, ${props}, ${children})`;
}

function genProps(props) {
  if (!props.length) return "null";
  return `{ ${props
    .map((prop) => {
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
