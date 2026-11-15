/** Alova 方法对象的最小结构（避免直接依赖 alova 内部类型） */
export interface AlovaMethodLike {
  url?: string
  type?: string
  config?: {
    params?: Record<string, any>
    data?: any
  }
}
