// 对节点元素的增删改查操作
export const nodeOps = {
  /**
   *  插入节点
   *  如果有anchor则在anchor之前插入，没有则在最后插入
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
