// 对节点元素的增删改查操作
export const nodeOps = {
  /**
   * 插入元素
   * @param el  真实节点
   * @param parent  父节点
   * @param anchor  插入的位置，没有则在末尾插入
   */
  insert(el, parent, anchor = null) {
    parent.insertBefore(el, anchor);
  },
  remove(el) {
    const parent = el.parentNode;
    if (parent) {
      parent.removeChild(el);
    }
  },
  createElement(type) {
    return document.createElement(type);
  },
  createText(text) {
    return document.createTextNode(text);
  },
  setText(node, text) {
    return (node.nodeValue = text); // 设置文本
  },
  setElementText(el, text) {
    el.textContent = text;
  },
  parentNode(node) {
    return node.parentNode;
  },
  nextSibling(node) {
    return node.nextSibling;
  },
};
