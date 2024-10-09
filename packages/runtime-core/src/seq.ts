// 最长递增子序列
// 原来的diff算法，将所有新节点全部倒序插入，浪费性能。
// olg  abc defj h
// new  abc jefds h
// 对于上面的用例，其实存在可用的序列ef，只需要移动其他节点即可，不需整体倒序处理。
// 所以利用最长递增子序列算法，用新序列来记录老节点的位置，寻找到最长递增子序列，进行特殊处理即可。

// 来实现这个算法

export function getSequence(arr: number[]) {
  const length = arr.length;
  const result = [0]; // 记录的是arr中的索引
  const p = result.slice(0); // 用于记录前驱节点索引
  // 二分查找
  let start, end, middle;

  for (let i = 0; i < length; i++) {
    let arrI = arr[i];
    if (arrI !== 0) {
      // 排除掉vue3中为0的情况
      const lastIndex = result[result.length - 1];
      if (arrI > arr[lastIndex]) {
        p[i] = result[result.length - 1]; // 正常放入的时候，结果集的最后一个就是前驱节点
        result.push(i);
        continue;
      }
      // 小于的情况，采用二分查找的方式，进行替换
      start = 0;
      end = result.length - 1;
      while (start < end) {
        middle = ((start + end) / 2) | 0; // 向下取整 3.5 | 0 = 3
        if (arr[result[middle]] < arrI) {
          start = middle + 1;
        } else {
          end = middle;
        }
      }
      if (arrI < arr[result[start]]) {
        p[i] = result[start - 1];
        result[start] = i; //  替换
      }
    }
  }

  // p 为前驱节点集，用结果集的最后一个节点进行追溯
  let l = result.length;
  let last = result[l - 1];
  while (l-- > 0) {
    result[l] = last;
    last = p[last];
  }
  return result;
}
