import {
  currentInstance,
  setCurrentInstance,
  unsetCurrentInstance,
} from "./component";

export const enum LifeCycle {
  BEFORE_MOUNT = "bm",
  MOUNTED = "m",
  BEFORE_UPDATE = "bu",
  UPDATED = "u",
  BEFORE_UNMOUNT = "bum",
  UNMOUNTED = "um",
}
// 组件是可以嵌套的，所以一个类型，有多个函数
// bm -》[fn(),fn()]
function createHook(type) {
  return (hook, target = currentInstance) => {
    if (target) {
      // 当前实例是在组件中运行的
      const hooks = target[type] || (target[type] = []);

      // 用闭包保存实例，确保在函数执行时，实例存在
      function wrapHook() {
        setCurrentInstance(target);
        hook.call(target);
        unsetCurrentInstance();
      }
      hooks.push(wrapHook);
    }
  };
}
export const onBeforeMount = createHook(LifeCycle.BEFORE_MOUNT);
export const onMounted = createHook(LifeCycle.MOUNTED);

export const onBeforeUpdate = createHook(LifeCycle.BEFORE_UPDATE);
export const onUpdated = createHook(LifeCycle.UPDATED);

export const onBeforeUnmount = createHook(LifeCycle.BEFORE_UNMOUNT);
export const onUnmounted = createHook(LifeCycle.UNMOUNTED);

export function invokerArray(fns) {
  for (let i = 0; i < fns.length; i++) {
    fns[i]();
  }
}
