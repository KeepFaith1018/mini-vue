import { ShapeFlags } from "@vue/share";
import { onMounted, onUpdated } from "../apiLifeCycle";
import { getCurrentInstance } from "../component";
import type { ComponentOptions, Data, SetupContext } from "../component";
import type { VNode } from "../createVnode";
import type { RendererElement, RendererNode } from "../renderer";

// 【交叉类型】组件选项对象再交叉一个品牌标记,用于 isKeepAlive 判断
export const KeepAlive: ComponentOptions & { _isKeepAlive: true } = {
  _isKeepAlive: true,
  props: {
    // LRU缓存算法,将最近最少使用的移除
    max: Number,
  },
  setup(props: Data, { slots }: SetupContext) {
    /* <keepalive key="1">
        <div>1</div>
    </keepalive>**/
    // 区分有无key的情况
    const keys = new Set<unknown>();
    const cache = new Map<unknown, VNode>();
    let pendingCacheKey: unknown = null;
    // setup 执行时一定是组件内,当前实例必然存在
    const instance = getCurrentInstance()!;
    const { max } = props;
    const cacheSubTree = () => {
      cache.set(pendingCacheKey, instance.subTree!);
    };
    // KeepAlive 的 render 由 renderer 挂载时注入
    const { move, createElement, unmount: _unmount } = instance.ctx.render!;
    function reset(vnode: VNode) {
      let shapeFlag = vnode.shapeFlag;
      if (shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
        shapeFlag -= ShapeFlags.COMPONENT_KEPT_ALIVE;
      }
      if (shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
        shapeFlag -= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE;
      }
      vnode.shapeFlag = shapeFlag;
    }

    function unmount(vnode: VNode) {
      // 还原标志位
      reset(vnode);
      // 真实dom移除
      _unmount(vnode);
    }
    function pruneCacheEntry(key: unknown) {
      keys.delete(key);
      const cacheVNode = cache.get(key);
      cache.delete(key);
      unmount(cacheVNode!);
    }

    // keeplive 特有的初始化方法
    // 激活时执行,将元素移动到指定容器中
    instance.ctx.activate = (
      vnode: VNode,
      container: RendererElement,
      anchor: RendererNode | null
    ) => {
      move(vnode, container, anchor);
    };
    // 卸载时执行，将元素移动到创建的缓存空间
    const storageContent = createElement("div");
    instance.ctx.deactivate = (vnode: VNode) => {
      move(vnode, storageContent, null); // 将dom元素临时移动到这个div中，没有销毁
    };

    onMounted(cacheSubTree);
    onUpdated(cacheSubTree);

    return () => {
      // 默认插槽的返回值归一化成 VNode
      const vnode = slots.default() as VNode;
      const comp = vnode.type;
      const key = vnode.key == null ? comp : vnode.key;

      const cacheVNode = cache.get(key);
      pendingCacheKey = key;

      if (cacheVNode) {
        vnode.component = cacheVNode.component;
        vnode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE;
        keys.delete(key);
        keys.add(key); // 刷新缓存
      } else {
        keys.add(key);
        // max 声明在 props 里,类型上是 unknown,比较前断言成 number
        if (max && keys.size > (max as number)) {
          // 达到了最大缓存数量

          // 删除set的第一个元素 lru
          pruneCacheEntry(keys.values().next().value);
        }
        keys.add(key);
      }
      // 这个元素不需要真的卸载，缓存的dom，临时放到存储容器中，这样标记方便处理
      vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE;
      return vnode;
    };
  },
};

export const isKeepAlive = (value: VNode): boolean =>
  !!(value.type as { _isKeepAlive?: boolean })._isKeepAlive;
