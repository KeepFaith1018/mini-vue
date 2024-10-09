import { ShapeFlags } from "@vue/share";
import { Text, isSameVnode, Fragment } from "./createVnode";
import { h } from "./h";
import { getSequence } from "./seq";
export function createRenderer(renderOptions) {
  // core中不关心如何进行的渲染
  const {
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
    setText: hostSetText,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
  } = renderOptions;

  /**
   * 将虚拟节点转化为真实dom挂载到真实dom上
   * @param vnode 虚拟节点
   * @param  container 真实dom
   */
  const mountElement = (vnode, container, anchor) => {
    const { type, children, props, shapeFlag } = vnode;
    // 在第一次渲染时，将虚拟节点与真实dom关联起来
    let el = (vnode.el = hostCreateElement(type));
    if (props) {
      for (let key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 如果子节点是文本
      hostSetElementText(el, children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 如果子节点是数组
      mountChildren(children, el);
    }

    hostInsert(el, container, anchor);
  };

  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      if (typeof children[i] === "string") {
        children[i] = h("text", {}, children[i]);
      }

      //TODO: children[i] 可能是纯文本元素
      patch(null, children[i], container);
    }
  };

  const processText = (oldVnode, newVnode, container) => {
    if (oldVnode == null) {
      // 创建
      hostInsert((newVnode.el = hostCreateText(newVnode.children)), container);
    } else {
      // 更新
      const el = (newVnode.el = oldVnode.el);
      if (oldVnode.children !== newVnode.children) {
        hostSetText(el, newVnode.children);
      }
    }
  };
  const processFragment = (oldVnode, newVnode, container) => {
    if (oldVnode == null) {
      mountChildren(newVnode.children, container);
    } else {
      patchChildren(oldVnode, newVnode, container);
    }
  };
  const processElement = (oldVode, newVnode, container, anchor) => {
    if (oldVode == null) {
      // 初始化操作
      mountElement(newVnode, container, anchor);
    } else {
      patchElement(oldVode, newVnode, container);
    }
  };

  /**
   * 删除从真实dom中删除虚拟子节点
   * @param children
   */
  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i]);
    }
  };
  /**
   * 两个数组之间的比较
   */
  const patchKeyedChildren = (oldChildren, newChildren, el) => {
    let index = 0;
    let e1 = oldChildren.length - 1;
    let e2 = newChildren.length - 1;
    // 从头开始比较
    // old [a,b,c,d] new [a,b,c]       index = 0 e1=3 e2=2
    while (index <= e1 && index <= e2) {
      if (isSameVnode(oldChildren[index], newChildren[index])) {
        patch(oldChildren[index], newChildren[index], el);
      } else {
        break;
      }
      index++;
    }
    // 从尾开始比较
    while (index <= e1 && index <= e2) {
      if (isSameVnode(oldChildren[e1], newChildren[e2])) {
        patch(oldChildren[e1], newChildren[e2], el);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    console.log(index, e1, e2);
    // 通过正序和倒序比较，找出不同,对不同的进行处理，index，和e2分别是相同的两段的结束索引

    // 确定前后，不变的部分，只处理插入和删除
    if (index > e1) {
      // 老的少
      if (index <= e2) {
        // old [a,b,c] new [a.b.c.d]
        // old [a,b] new [c,a,b]
        // 新的多
        // e2是后段相同的开始，可由上面的测试用例看出，
        // 通过e2+1这个存不存存在，是在指定元素前插入，还是直接在末尾插入
        let nextPos = e2 + 1;
        let anchor = newChildren[nextPos]?.el;
        while (index <= e2) {
          patch(null, newChildren[index], el, anchor);
          index++;
        }
      }
    } else if (index > e2) {
      // 老的多
      if (index <= e1) {
        // old [a,b,c] new [a,b]
        // old [c,a,b] new [a,b]
        // 删除多的
        while (index <= e1) {
          unmount(oldChildren[index]);
          index++;
        }
      }
    } else {
      // 此时index不大于e1和e2，中间有一段需要处理，进行特殊的对比方式
      // old [ab cde  fg]
      // new [ab ecdh fg]
      // index-》e1 index-》e2  采取将其中一段作为映射表，进行比较来进行复用
      // v2采用old的，v3采用新的做映射表
      let s1 = index;
      let s2 = index;

      const keyToNewIndexMap = new Map(); // 用映射表对比，有就复用更新，没有就删除
      let toBePatched = e2 - s2 + 1; // 需要插入的个数
      // 用新的节点做映射表，记录老的位置
      // old [ab cde  fg]
      // new [ab ecdh fg]    ecdn有四个元素，所以数组长度为4,e在旧数组中的索引为4，c为2，h没有，是新创建的，所以为0
      // 以上面为例，得出结果为[4,2,3,0] 根据此，求出递增子序列，以最小的更改，实现更新
      let newIndexToOldMapIndex = new Array(toBePatched).fill(0);

      // 将新的数组加入映射表
      // 根据新的节点，找到老的对应位置
      for (let i = s2; i <= e2; i++) {
        keyToNewIndexMap.set(newChildren[i].key, i);
      }

      // 遍历老的
      for (let i = s1; i <= e1; i++) {
        let oldChild = oldChildren[i];
        let newIndex = keyToNewIndexMap.get(oldChild.key);

        if (newIndex === undefined) {
          // 如果找不到，删除旧的
          unmount(oldChild);
        } else {
          // i可能出现0的情况，通过+1来避免歧义，0代表新创建的，没有比对过的
          newIndexToOldMapIndex[newIndex - s2] = i + 1;
          // 比较差异，更新属性和儿子
          patch(oldChild, newChildren[newIndex], el);
        }
      }
      console.log(newIndexToOldMapIndex);

      // 获得递归子序列
      let increasingSequence = getSequence(newIndexToOldMapIndex);
      console.log(increasingSequence);
      let j = increasingSequence.length - 1;
      // 处理顺序问题
      // 以新的为基础，倒序插入

      for (let i = toBePatched - 1; i >= 0; i--) {
        let newIndex = s2 + i; // 要插入的元素索引
        let anchor = newChildren[newIndex + 1]?.el; // 插入参照物
        let vnode = newChildren[newIndex];

        if (!vnode.el) {
          // 如果没有el,需要先创建一个,在插入
          patch(null, vnode, el, anchor);
        } else {
          if (j == i) {
            j--;
          } else {
            hostInsert(vnode.el, el, anchor);
          }
        }
      }
    }
  };

  const patchProps = (oldProps, newProps, el) => {
    // 新的全部生效
    for (let key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key]);
    }
    // 从老的里面删除旧的
    for (let key in oldProps) {
      if (!(key in newProps)) {
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
  };

  const patchChildren = (oldVNode, newVNode, el) => {
    let oldChildren = oldVNode.children;
    let newChildren = newVNode.children;
    let preShapeFlag = oldVNode.shapeFlag;
    let shapeFlag = newVNode.shapeFlag;

    // 新旧childern只有三种情况 数组，文本，null

    // 新的是文本，老的是数组或着文本,
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 老的是数组，需要先进行清空
      if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(oldChildren);
      }
      // 替换创建新文本
      if (oldChildren !== newChildren) {
        hostSetElementText(el, newChildren);
      }
    } else if (preShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 老的是数组
      if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 新的也是数组，进行全量diff，两个数组进行比较
        patchKeyedChildren(oldChildren, newChildren, el);
      } else {
        // 老的不是数组
        unmountChildren(oldChildren);
      }
    } else {
      //  老的是文本
      if (preShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(el, "");
      }

      if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 新的是数组
        mountChildren(newChildren, el);
      }
    }
  };

  /**
   * 老的已经挂载了，拿到el，比较新旧虚拟节点更新el的属性和孩子即可
   * @param oldVNode 老的虚拟节点
   * @param newVNode 新的虚拟节点
   * @param container
   */
  const patchElement = (oldVNode, newVNode, container) => {
    let el = (newVNode.el = oldVNode.el); // 比较差异，更新old的，然后复用给new
    let oldProps = oldVNode.props || {};
    let newProps = newVNode.props || {};
    // 处理属性 hostPatchProp只针对单一的属性
    patchProps(oldProps, newProps, el);
    // 处理子节点
    patchChildren(oldVNode, newVNode, el);
  };
  // 渲染和更新都通过这个函数
  const patch = (oldVnode, newVnode, container, anchor = null) => {
    if (oldVnode == newVnode) {
      // 如果相同直接返回就行
      return;
    }
    // 需要进行diff比较，如果不是同一类型，直接替换
    if (oldVnode && !isSameVnode(oldVnode, newVnode)) {
      unmount(oldVnode);
      oldVnode = null; // 直接去除掉，去执行下面的逻辑
    }
    const { type } = newVnode;
    switch (type) {
      case Text:
        processText(oldVnode, newVnode, container);
        break;
      case Fragment:
        processFragment(oldVnode, newVnode, container);
        break;
      default:
        processElement(oldVnode, newVnode, container, anchor);
    }
  };
  /**
   * 将虚拟节点从真实dom中删除
   * @param vnode 虚拟节点
   */
  const unmount = (vnode) => {
    if (vnode.type == Fragment) {
      unmountChildren(vnode.children);
    }
    hostRemove(vnode.el);
  };

  /**
   * 将虚拟节点渲染到真实container上
   * @param vnode 虚拟dom
   * @param container 真实容器dom
   */
  const render = (vnode, container) => {
    if (vnode == null) {
      // 不是第一次渲染，vnode为null，表示将之前的虚拟节点删除
      if (container._vnode) {
        unmount(container._vnode);
      }
    } else {
      patch(container._vnode || null, vnode, container);
      container._vnode = vnode;
    }
  };
  return {
    render,
  };
}
