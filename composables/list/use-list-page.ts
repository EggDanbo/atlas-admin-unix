import type { Ref } from 'vue'
import type { UseListPageOptions, UseListPageReturn } from './types.ts'
import { computed, reactive, ref } from 'vue'
import { useEnumStoreWithOut } from '@/store/enums.ts'

/**
 * 移动端列表页面通用 Hook
 *
 * 封装服务端分页列表的通用逻辑：搜索、加载更多、刷新当前页、去重合并。
 * 配合 uni-app x 的 `onPullDownRefresh` + `onReachBottom` 使用。
 *
 * @template Q 查询模型类型
 * @template T 行数据类型，默认 Recordable
 *
 * @example
 * // 人员列表
 * const { list, loading, finished, isEmpty, queryModel, search, loadMore } = useListPage({
 *   api: staffApi,
 *   createQueryModel: () => ({
 *     filter: undefined as string | undefined,
 *   }),
 *   idField: 'user_id',
 *   pageSize: 20,
 *   immediate: false,
 * })
 *
 * // 在页面生命周期中使用
 * onLoad(() => search())
 * usePullDownRefresh(async () => { await search(); uni.stopPullDownRefresh() })
 * onReachBottom(() => loadMore())
 *
 * @example
 * // 搜索触发
 * function onSearch(val: string) {
 *   queryModel.filter = val || undefined
 *   search()
 * }
 */
export function useListPage<
  Q extends ServiceSearchCondition = ServiceSearchCondition,
  T extends Recordable = Recordable,
>(
  options: UseListPageOptions<Q, T>,
): UseListPageReturn<Q, T> {
  const {
    api,
    beforeFetch,
    createQueryModel,
    idField = 'id',
    pageSize = 20,
    immediate = true,
    transform,
  } = options

  const list = ref<T[]>([]) as Ref<T[]>
  const loading = ref(false)
  const finished = ref(false)
  const total = ref(0)
  const page = ref(1)
  const initialized = ref(false)
  const queryModel = reactive(createQueryModel()) as Q

  function extractResult(data: ServicePagedList<T> | T[]) {
    if (Array.isArray(data)) {
      return { list: data, totalcount: data.length }
    }
    return { list: data?.list || [], totalcount: data?.totalcount ?? 0 }
  }

  /** 对每条记录应用转换（如枚举/自定义字段），仅在配置 transform 时生效 */
  function applyTransform(items: T[]): T[] {
    return transform ? items.map(item => transform(item)) : items
  }

  /** transform 涉及枚举标签时，确保枚举已加载完毕 */
  async function ensureEnumReady() {
    if (transform)
      await useEnumStoreWithOut().ensureLoaded()
  }

  const isEmpty = computed(() => initialized.value && list.value.length === 0)

  function buildParams(extra: Record<string, any> = {}): Q {
    const params = { ...queryModel, ...extra } as Q
    return beforeFetch ? beforeFetch(params) : params
  }

  function mergeData(newItems: T[]) {
    for (const item of newItems) {
      const id = String(item[idField])
      const idx = list.value.findIndex(x => String(x[idField]) === id)
      if (idx !== -1) {
        list.value[idx] = item
      }
      else {
        list.value.push(item)
      }
    }
  }

  async function search() {
    if (loading.value)
      return
    loading.value = true
    page.value = 1
    finished.value = false
    list.value = []
    try {
      const { data } = await api.search(buildParams({ page: 1, pagesize: pageSize }))
      const result = extractResult(data)
      await ensureEnumReady()
      list.value = applyTransform(result.list)
      total.value = result.totalcount
      finished.value = result.list.length === 0
    }
    finally {
      loading.value = false
      initialized.value = true
    }
  }

  async function loadMore() {
    if (loading.value || finished.value)
      return
    loading.value = true
    const nextPage = page.value + 1
    try {
      const { data } = await api.search(buildParams({ page: nextPage, pagesize: pageSize }))
      const result = extractResult(data)
      if (result.list.length === 0) {
        finished.value = true
      }
      else {
        page.value = nextPage
        await ensureEnumReady()
        mergeData(applyTransform(result.list))
        total.value = result.totalcount
      }
    }
    finally {
      loading.value = false
    }
  }

  async function reload() {
    if (loading.value)
      return
    loading.value = true
    try {
      const { data } = await api.search(buildParams({ page: page.value, pagesize: pageSize }))
      const result = extractResult(data)
      await ensureEnumReady()
      mergeData(applyTransform(result.list))
      total.value = result.totalcount
    }
    finally {
      loading.value = false
    }
  }

  function reset() {
    const fresh = createQueryModel()
    Object.assign(queryModel, fresh)
    return search()
  }

  if (immediate) {
    search()
  }

  return {
    list,
    loading,
    finished,
    isEmpty,
    total,
    page,
    queryModel,
    search,
    loadMore,
    reload,
    reset,
  }
}
