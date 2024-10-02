function createInvoker(value) {
  const invoker = (e) => invoker.value(e);
  invoker.value = value;
  return invoker;
}
export function patchEvent(el, key, nextValue) {
  // 对事件处理，先解绑，在绑定浪费性能进行优化
  // _vei  vue-event-invoker
  const invokers = el._vei || (el._vei = {});
  const eventName = key.slice(2).toLowerCase();

  const exisitingInvoker = invokers[key];
  if (nextValue && exisitingInvoker) {
    // 事件换绑定
    return (exisitingInvoker.value = nextValue);
  }
  if (nextValue) {
    const invoker = (invokers[key] = createInvoker(nextValue));
    el.addEventListener(eventName, invoker);
  }
  if (exisitingInvoker) {
    el.removeEventListener(eventName, exisitingInvoker);
    invokers[key] = undefined;
  }
}
