import { ShapeFlags } from "@vue/share";
import { onMounted, onUpdated } from "../apiLifeCycle";
import { getCurrentInstance } from "../component";

export const KeepAlive = {
  is_keepAlive: true,
  props: {
    // LRU缓存算法,将最近最少使用的移除
    max: Number,
  },
  setup(proxy, { slots }) {
    /* <keepalive key="1">
        <div>1</div> 
    </keepalive>**/
    // 区分有无key的情况
    const keys = new Set();
    const cache = new Map();
    let pendingCacheKey = null;
    const instance = getCurrentInstance();
    const { max } = this.props;
    const cacheSubTree = () => {
      cache.set(pendingCacheKey, instance.subTree);
    };
    const { move, createElement, unmount: _unmount } = instance.ctx.render;
    function reset(vnode) {
      let shapeFlag = vnode.shapeFlag;
      if (shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
        shapeFlag -= ShapeFlags.COMPONENT_KEPT_ALIVE;
      }
      if (shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
        shapeFlag -= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE;
      }
      vnode.shapeFlag = shapeFlag;
    }

    function unmount(vnode) {
      // 还原标志位
      reset(vnode);
      // 真实dom移除
      _unmount(vnode);
    }
    function pruneCacheEntry(key) {
      keys.delete(key);
      const cacheVNode = cache.get(key);
      unmount(cacheVNode);
    }

    // keeplive 特有的初始化方法
    // 激活时执行,将元素移动到指定容器中
    instance.ctx.activate = (vnode, container, anchor) => {
      move(vnode, container, anchor);
    };
    // 卸载时执行，将元素移动到创建的缓存空间
    const storageContent = createElement("div");
    instance.ctx.deactivate = (vnode) => {
      move(vnode, storageContent, null); // 将dom元素临时移动到这个div中，没有销毁
    };

    onMounted(cacheSubTree);
    onUpdated(cacheSubTree);

    return () => {
      const vnode = slots.default();
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
        if (max && keys.size > max) {
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

export const isKeepAlive = (value) => value.type._isKeepAlive;
