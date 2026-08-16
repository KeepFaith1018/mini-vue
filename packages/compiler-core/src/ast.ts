export enum NodeTypes {
  ROOT,
  ELEMENT,
  TEXT,
  INTERPOLATION,
  SIMPLE_EXPRESSION,
  ATTRIBUTE,
  DIRECTIVE,
}

export const createRoot = (children) => ({
  type: NodeTypes.ROOT,
  children,
  helpers: [],
  codegenNode: null,
});
