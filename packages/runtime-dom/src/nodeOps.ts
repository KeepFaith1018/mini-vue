// 对节点元素的增删改查操作
import type { RendererElement, RendererNode } from "@vue/runtime-core";

// 【逆变与开放接口】这里参数不写 DOM 类型(Node/HTMLElement),而是用 runtime-core 的
// 开放接口 RendererNode/RendererElement。原因:RendererOptions 的成员是"属性式函数类型",
// strictFunctionTypes 下参数按逆变检查 —— 实现侧把参数收窄成 HTMLElement,反而无法赋值给
// 要求 RendererElement 的接口。真正的 Vue 用 HostNode/HostElement 泛型 + any 默认值解决,
// mini-vue 里开放接口的索引签名(返回 any)同样让 DOM API 在边界内直接可用
export const nodeOps = {
  /**
   * 插入元素
   * @param el  真实节点
   * @param parent  父节点
   * @param anchor  插入的位置，没有则在末尾插入
   */
  insert(el: RendererNode, parent: RendererElement, anchor: RendererNode | null = null) {
    parent.insertBefore(el, anchor);
  },
  remove(el: RendererNode) {
    const parent = el.parentNode;
    if (parent) {
      parent.removeChild(el);
    }
  },
  createElement(type: string): RendererElement {
    return document.createElement(type);
  },
  createText(text: string): RendererNode {
    return document.createTextNode(text);
  },
  setText(node: RendererNode, text: string): string {
    return (node.nodeValue = text); // 设置文本
  },
  setElementText(el: RendererElement, text: string) {
    el.textContent = text;
  },
  parentNode(node: RendererNode): RendererElement | null {
    return node.parentNode;
  },
  nextSibling(node: RendererNode): RendererNode | null {
    return node.nextSibling;
  },
};
