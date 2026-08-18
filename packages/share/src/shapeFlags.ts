/**
 * 用来描述虚拟dom的类型
 * 没有歧义，利用位运算组合
 * 即是元素，又是文本 1｜8 = 1+8 = 9
 * 判断里面是否包含文本  9&8>0
 * 在h函数中，创建元素时设置
 *
 * 【const 对象 + as const】与 PatchFlags 同理,用纯数据替代 enum
 */
export const ShapeFlags = {
  ELEMENT: 1, // 普通元素类型
  FUNCTIONAL_COMPONENT: 1 << 1, // 函数式组件
  STATEFUL_COMPONENT: 1 << 2, // 有状态组件
  TEXT_CHILDREN: 1 << 3, // 子节点为文本
  ARRAY_CHILDREN: 1 << 4, // 子节点为数组
  SLOTS_CHILDREN: 1 << 5, // 子节点为插槽
  TELEPORT: 1 << 6, // Teleport 组件
  SUSPENSE: 1 << 7, // Suspense 组件
  COMPONENT_SHOULD_KEEP_ALIVE: 1 << 8, // 组件需要被 KeepAlive 缓存
  COMPONENT_KEPT_ALIVE: 1 << 9, // 组件已被 KeepAlive 缓存
  // 对象字面量内部不能引用自身,组合值直接写出来: STATEFUL_COMPONENT | FUNCTIONAL_COMPONENT
  COMPONENT: (1 << 2) | (1 << 1), // 组件类型 (有状态组件或函数式组件)
} as const;

/** 所有标记值的联合类型,用法同 PatchFlags */
export type ShapeFlags = (typeof ShapeFlags)[keyof typeof ShapeFlags];
