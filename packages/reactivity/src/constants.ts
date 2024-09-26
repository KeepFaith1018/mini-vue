export enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
}

export enum DirtyLevels {
  Dirty = 4, // 脏值，需要重新进行计算
  NoDirty = 0, // 不是脏值，就继续使用上一次的结果
}
