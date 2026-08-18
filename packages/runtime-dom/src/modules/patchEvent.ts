import type { RendererElement } from "@vue/runtime-core";

// 事件包装器:把用户处理函数包一层,更新事件时只换 value,不用解绑再绑定
interface EventInvoker {
  (e: Event): void;
  value: (e: Event) => void;
}

function createInvoker(value: (e: Event) => void): EventInvoker {
  // 自引用:invoker 在初始化器里引用自己,通过 as 断言提前给出完整类型
  const invoker = ((e: Event) => invoker.value(e)) as EventInvoker;
  invoker.value = value;
  return invoker;
}

// 显式声明 void 返回:多数分支没有返回值,noImplicitReturns 不再要求每个分支都写 return
export function patchEvent(
  el: RendererElement,
  key: string,
  nextValue: unknown
): void {
  // 对事件处理，先解绑，在绑定浪费性能进行优化
  // _vei  vue-event-invoker
  // 【交集类型扩字段】给元素挂私有事件表,用交集类型声明,而不是污染全局 HTMLElement 声明
  const elWithVei = el as RendererElement & {
    _vei?: Record<string, EventInvoker | undefined>;
  };
  const invokers = elWithVei._vei || (elWithVei._vei = {});
  const eventName = key.slice(2).toLowerCase();

  const exisitingInvoker = invokers[key];
  if (nextValue && exisitingInvoker) {
    // 事件换绑定(原 return 的赋值结果无人消费,拆成两行)
    exisitingInvoker.value = nextValue as (e: Event) => void;
    return;
  }
  if (nextValue) {
    const invoker = (invokers[key] = createInvoker(
      nextValue as (e: Event) => void
    ));
    el.addEventListener(eventName, invoker);
  }
  if (exisitingInvoker) {
    el.removeEventListener(eventName, exisitingInvoker);
    invokers[key] = undefined;
  }
}
