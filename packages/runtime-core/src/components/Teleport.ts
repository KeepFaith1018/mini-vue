import { ShapeFlags } from "@vue/share";

// 内置组件
export const Teleport = {
  _isTeleport: true,
  process(oldVnode, newVnode, container, anchor, parentComponent, internals) {
    let { mountChildren, patchChildren, move } = internals;
    if (!oldVnode) {
      const target = (newVnode.target = document.querySelector(
        newVnode.props.to
      ));
      if (target) {
        mountChildren(newVnode.children, target);
      }
    } else {
      // 先更新子节点
      patchChildren(oldVnode, newVnode, newVnode.target, parentComponent);
      // 将子节点移动到对应的位置
      if (newVnode.props.to !== oldVnode.props.to) {
        const nextTarget = document.querySelector(newVnode.props.to);
        newVnode.children.forEach((child) => move(child, nextTarget, anchor));
      }
    }
  },
  remove(vnode, unmountChildren) {
    const { shapeFlag, children } = vnode;
    if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(children);
    }
  },
};

export const isTeleport = (value) => value._isTeleport;
