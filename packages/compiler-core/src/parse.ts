import {
  createRoot,
  NodeTypes,
  type ElementNode,
  type InterpolationNode,
  type PropNode,
  type RootNode,
  type TemplateChildNode,
  type TextNode,
} from "./ast";

/** 解析上下文:剩余未解析的模板字符串 */
export interface ParserContext {
  source: string;
}

export function baseParse(content: string): RootNode {
  return createRoot(parseChildren({ source: content }, []));
}

function parseChildren(
  context: ParserContext,
  ancestors: ElementNode[]
): TemplateChildNode[] {
  // 空数组字面量会推导成 never[],必须显式标注
  const nodes: TemplateChildNode[] = [];
  while (!isEnd(context, ancestors)) {
    // 可变变量先标注类型再赋值(和第一课的 let cleanup 同一课)
    let node: TemplateChildNode;
    if (context.source.startsWith("{{")) node = parseInterpolation(context);
    else if (context.source[0] === "<" && /[a-z]/i.test(context.source[1])) {
      node = parseElement(context, ancestors);
    } else node = parseText(context);
    nodes.push(node);
  }
  return nodes;
}

function parseInterpolation(context: ParserContext): InterpolationNode {
  advanceBy(context, 2);
  const closeIndex = context.source.indexOf("}}");
  if (closeIndex < 0)
    throw new Error("Interpolation is missing closing delimiter.");
  const content = context.source.slice(0, closeIndex).trim();
  advanceBy(context, closeIndex + 2);
  return {
    type: NodeTypes.INTERPOLATION,
    content: { type: NodeTypes.SIMPLE_EXPRESSION, content },
  };
}

function parseElement(
  context: ParserContext,
  ancestors: ElementNode[]
): ElementNode {
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

function parseTag(context: ParserContext, isEnd: boolean): ElementNode {
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

function parseAttributes(context: ParserContext): PropNode[] {
  const props: PropNode[] = [];
  while (
    context.source.length &&
    !context.source.startsWith(">") &&
    !context.source.startsWith("/>")
  ) {
    const match =
      /^([^\t\r\n\f />=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\t\r\n\f >]+)))?/.exec(
        context.source
      );
    if (!match) throw new Error("Invalid attribute.");
    const name = match[1];
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    advanceBy(context, match[0].length);
    advanceSpaces(context);
    if (name.startsWith(":") || name.startsWith("v-bind:")) {
      props.push({
        type: NodeTypes.DIRECTIVE,
        name: "bind",
        arg: name.replace(/^:|^v-bind:/, ""),
        exp: value,
      });
    } else if (name.startsWith("@") || name.startsWith("v-on:")) {
      props.push({
        type: NodeTypes.DIRECTIVE,
        name: "on",
        arg: name.replace(/^@|^v-on:/, ""),
        exp: value,
      });
    } else {
      props.push({ type: NodeTypes.ATTRIBUTE, name, value });
    }
  }
  return props;
}

function parseText(context: ParserContext): TextNode {
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

function isEnd(context: ParserContext, ancestors: ElementNode[]): boolean {
  if (!context.source) return true;
  if (context.source.startsWith("</")) {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      if (context.source.startsWith(`</${ancestors[i].tag}`)) return true;
    }
  }
  return false;
}

const advanceBy = (context: ParserContext, count: number): string =>
  (context.source = context.source.slice(count));
const advanceSpaces = (context: ParserContext): void => {
  const match = /^[\t\r\n\f ]+/.exec(context.source);
  if (match) advanceBy(context, match[0].length);
};
