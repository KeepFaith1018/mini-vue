// 调度器里的任务都是"无参无返回"的函数,统一成一个别名替代 Function
type SchedulerJob = () => void;

const queue: SchedulerJob[] = [];
const pendingPreFlushCbs: SchedulerJob[] = [];
const pendingPostFlushCbs: SchedulerJob[] = [];
const resolvedPromise = Promise.resolve();
let currentFlushPromise: Promise<void> | null = null;
let isFlushing = false;

function queueCb(cb: SchedulerJob, pendingQueue: SchedulerJob[]) {
  if (!pendingQueue.includes(cb)) pendingQueue.push(cb);
  queueFlush();
}

export function queueJob(job: SchedulerJob) {
  if (!queue.includes(job)) {
    queue.push(job);
    queueFlush();
  }
}

export const queuePreFlushCb = (cb: SchedulerJob) =>
  queueCb(cb, pendingPreFlushCbs);
export const queuePostFlushCb = (cb: SchedulerJob) =>
  queueCb(cb, pendingPostFlushCbs);

function flushCbs(cbs: SchedulerJob[]) {
  for (const cb of [...new Set(cbs)]) cb();
  cbs.length = 0;
}

function queueFlush() {
  if (!isFlushing) {
    isFlushing = true;
    currentFlushPromise = resolvedPromise.then(flushJobs);
  }
}

function flushJobs(): void {
  try {
    flushCbs(pendingPreFlushCbs);
    for (let job: SchedulerJob | undefined; (job = queue.shift()); ) job();
    flushCbs(pendingPostFlushCbs);
  } finally {
    isFlushing = false;
    currentFlushPromise = null;
    if (queue.length || pendingPreFlushCbs.length || pendingPostFlushCbs.length) {
      queueFlush();
    }
  }
}

export function nextTick<T = void>(fn?: () => T): Promise<T | void> {
  const promise = currentFlushPromise || resolvedPromise;
  return fn ? promise.then(fn) : promise;
}
