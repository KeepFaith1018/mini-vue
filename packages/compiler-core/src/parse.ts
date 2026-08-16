import { createRoot, NodeTypes } from "./ast";

export function baseParse(content: string) {
  return createRoot(parseChildren({ source: content }, []));
}

function parseChildren(context, ancestors) {
  const nodes = [];
  while (!isEnd(context, ancestors)) {
    let node;
    if (context.source.startsWith("{{")) node = parseInterpolation(context);
    else if (context.source[0] === "<" && /[a-z]/i.test(context.source[1])) {
      node = parseElement(context, ancestors);
    } else node = parseText(context);
    nodes.push(node);
  }
  return nodes;
}

function parseInterpolation(context) {
  advanceBy(context, 2);
  const closeIndex = context.source.indexOf("}}");
  if (closeIndex < 0) throw new Error("Interpolation is missing closing delimiter.");
  const content = context.source.slice(0, closeIndex).trim();
  advanceBy(context, closeIndex + 2);
  return {
    type: NodeTypes.INTERPOLATION,
    content: { type: NodeTypes.SIMPLE_EXPRESSION, content },
  };
}

function parseElement(context, ancestors) {
  const element = parseTag(context, false);
  if (element.isSelfClosing) return element;
  ancestors.push(element);
  element.children = parseChildren(context, ancestors);
  ancestors.pop();
  if (!context.source.startsWith(`</${element.tag}`)) {
    throw new Error(`Missing end tag for <${element.tag}>.`);
  }
  parseTag(context, true);
  return element;
}

function parseTag(context, isEnd) {
  const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source);
  if (!match) throw new Error("Invalid tag.");
  const tag = match[1];
  advanceBy(context, match[0].length);
  advanceSpaces(context);
  const props = isEnd ? [] : parseAttributes(context);
  const isSelfClosing = context.source.startsWith("/>");
  advanceBy(context, isSelfClosing ? 2 : 1);
  return {
    type: NodeTypes.ELEMENT,
    tag,
    props,
    children: [],
    isSelfClosing,
  };
}

function parseAttributes(context) {
  const props = [];
  while (context.source.length && !context.source.startsWith(">") && !context.source.startsWith("/>")) {
    const match = /^([^\t\r\n\f />=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\t\r\n\f >]+)))?/.exec(context.source);
    if (!match) throw new Error("Invalid attribute.");
    const name = match[1];
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    advanceBy(context, match[0].length);
    advanceSpaces(context);
    if (name.startsWith(":") || name.startsWith("v-bind:")) {
      props.push({ type: NodeTypes.DIRECTIVE, name: "bind", arg: name.replace(/^:|^v-bind:/, ""), exp: value });
    } else if (name.startsWith("@") || name.startsWith("v-on:")) {
      props.push({ type: NodeTypes.DIRECTIVE, name: "on", arg: name.replace(/^@|^v-on:/, ""), exp: value });
    } else {
      props.push({ type: NodeTypes.ATTRIBUTE, name, value });
    }
  }
  return props;
}

function parseText(context) {
  let endIndex = context.source.length;
  for (const token of ["<", "{{"]) {
    const index = context.source.indexOf(token);
    if (index !== -1 && index < endIndex) endIndex = index;
  }
  if (endIndex === 0) endIndex = 1;
  const content = context.source.slice(0, endIndex);
  advanceBy(context, endIndex);
  return { type: NodeTypes.TEXT, content };
}

function isEnd(context, ancestors) {
  if (!context.source) return true;
  if (context.source.startsWith("</")) {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      if (context.source.startsWith(`</${ancestors[i].tag}`)) return true;
    }
  }
  return false;
}

const advanceBy = (context, count) =>
  (context.source = context.source.slice(count));
const advanceSpaces = (context) => {
  const match = /^[\t\r\n\f ]+/.exec(context.source);
  if (match) advanceBy(context, match[0].length);
};
