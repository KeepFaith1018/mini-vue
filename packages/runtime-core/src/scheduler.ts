const queue: Function[] = [];
const pendingPreFlushCbs: Function[] = [];
const pendingPostFlushCbs: Function[] = [];
const resolvedPromise = Promise.resolve();
let currentFlushPromise: Promise<void> | null = null;
let isFlushing = false;

function queueCb(cb: Function, pendingQueue: Function[]) {
  if (!pendingQueue.includes(cb)) pendingQueue.push(cb);
  queueFlush();
}

export function queueJob(job: Function) {
  if (!queue.includes(job)) {
    queue.push(job);
    queueFlush();
  }
}

export const queuePreFlushCb = (cb: Function) =>
  queueCb(cb, pendingPreFlushCbs);
export const queuePostFlushCb = (cb: Function) =>
  queueCb(cb, pendingPostFlushCbs);

function flushCbs(cbs: Function[]) {
  for (const cb of [...new Set(cbs)]) cb();
  cbs.length = 0;
}

function queueFlush() {
  if (!isFlushing) {
    isFlushing = true;
    currentFlushPromise = resolvedPromise.then(flushJobs);
  }
}

function flushJobs() {
  try {
    flushCbs(pendingPreFlushCbs);
    for (let job; (job = queue.shift()); ) job();
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
