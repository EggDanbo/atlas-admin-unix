/**
 * 确定性伪随机数
 *
 * 演示数据必须在刷新后保持一致，因此不使用 Math.random：
 * 同一个种子（模块 + 行号）永远得到同一组数据。
 */

/** FNV-1a 32 位哈希 */
export function hash(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** mulberry32 伪随机数生成器 */
export function createRng(seed: string): () => number {
  let a = hash(seed)
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 从数组中确定性取值 */
export function pick<T>(list: readonly T[], rng: () => number): T {
  return list[Math.floor(rng() * list.length) % list.length]
}

/** 区间内整数 */
export function intBetween(rng: () => number, min: number, max: number): number {
  return Math.floor(min + rng() * (max - min + 1))
}
