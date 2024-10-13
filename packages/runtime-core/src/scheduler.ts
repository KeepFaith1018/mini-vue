// 调度方法，实现组件的异步状态更新

const queue = []; // 缓存当前要执行的队列
const resolvePromise = Promise.resolve();
let isFlushing = false;

export function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }
  if (!isFlushing) {
    isFlushing = true;
    resolvePromise.then(() => {
      isFlushing = false;
      const copy = queue.slice(0);
      queue.length = 0;
      copy.forEach((fn) => {
        fn();
      });
      copy.length = 0;
    });
  }
}
// 通过事件循环机制， 先是宏任务，在走微任务，把job放在微任务里
