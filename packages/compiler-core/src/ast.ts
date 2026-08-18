// 【可辨识联合的判别式】所有节点共用同一个枚举当 type 字段,
// switch / if 检查 type 时,TS 就能确定具体是哪种节点
export enum NodeTypes {
  ROOT,
  ELEMENT,
  TEXT,
  INTERPOLATION,
  SIMPLE_EXPRESSION,
  ATTRIBUTE,
  DIRECTIVE,
}

export interface RootNode {
  type: NodeTypes.ROOT;
  children: TemplateChildNode[];
  helpers: unknown[];
  codegenNode: TemplateChildNode | null;
}

export interface ElementNode {
  type: NodeTypes.ELEMENT;
  tag: string;
  props: PropNode[];
  children: TemplateChildNode[];
  // transform 里合成的 Fragment 根节点没有该字段,设为可选
  isSelfClosing?: boolean;
}

export interface TextNode {
  type: NodeTypes.TEXT;
  content: string;
}

export interface InterpolationNode {
  type: NodeTypes.INTERPOLATION;
  content: SimpleExpressionNode;
}

export interface SimpleExpressionNode {
  type: NodeTypes.SIMPLE_EXPRESSION;
  content: string;
}

export interface AttributeNode {
  type: NodeTypes.ATTRIBUTE;
  name: string;
  value: string;
}

export interface DirectiveNode {
  type: NodeTypes.DIRECTIVE;
  name: string;
  arg: string;
  exp: string;
}

/** 模板子节点的联合 —— 可辨识联合的"户口本" */
export type TemplateChildNode = ElementNode | TextNode | InterpolationNode;
/** 属性联合:普通属性 | 指令 */
export type PropNode = AttributeNode | DirectiveNode;

export const createRoot = (children: TemplateChildNode[]): RootNode => ({
  type: NodeTypes.ROOT,
  children,
  helpers: [],
  codegenNode: null,
});
