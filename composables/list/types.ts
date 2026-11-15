import type { ComputedRef, Ref } from 'vue'

/** 列表 API 接口 */
export interface UseListPageApi<
  T extends Recordable = Recordable,
> {
  /** 搜索/列表查询（分页或非分页） */
  search: (params: ServiceSearchCondition) => Promise<ServiceResultPage<T>> | Promise<ServiceResult<T[]>>
}

/**
 * 列表页面 Hook 配置选项
 * @template Q 查询模型类型（需继承 ServiceSearchCondition）
 * @template T 行数据类型
 */
export interface UseListPageOptions<
  Q extends ServiceSearchCondition = ServiceSearchCondition,
  T extends Recordable = Recordable,
> {
  /** API 服务对象 */
  api: UseListPageApi<T>
  /** 查询条件工厂函数 */
  createQueryModel: () => Q
  /** 请求前参数转换（如日期范围拆分为 time_begin/time_end） */
  beforeFetch?: (params: Q) => Q
  /** 去重字段名，默认 'id' */
  idField?: string
  /** 每页条数，默认 20 */
  pageSize?: number
  /** 是否立即加载，默认 true */
  immediate?: boolean
  /** 数据转换函数，对每条记录加载后做转换（如枚举/自定义字段），与 useDetailPage 对称 */
  transform?: (data: any) => any
}

/**
 * 列表页面 Hook 返回值
 * @template Q 查询模型类型
 * @template T 行数据类型，默认 Recordable
 */
export interface UseListPageReturn<
  Q extends ServiceSearchCondition = ServiceSearchCondition,
  T extends Recordable = Recordable,
> {
  /** 列表数据 */
  list: Ref<T[]>
  /** 加载状态（统一锁，防止并发请求） */
  loading: Ref<boolean>
  /** 是否已到底（API 返回空列表时置为 true） */
  finished: Ref<boolean>
  /** 是否为空（首次加载完成后且列表为空） */
  isEmpty: ComputedRef<boolean>
  /** 总条数 */
  total: Ref<number>
  /** 当前页码 */
  page: Ref<number>
  /** 查询条件（响应式） */
  queryModel: Q
  /** 搜索：page=1，替换数据 */
  search: () => Promise<void>
  /** 加载更多：page++，去重追加 */
  loadMore: () => Promise<void>
  /** 刷新当前页：相同 idField 更新，不同追加 */
  reload: () => Promise<void>
  /** 重置查询条件并重新搜索 */
  reset: () => Promise<void>
}
