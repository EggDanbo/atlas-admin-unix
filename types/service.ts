/**
 * 请求层配置类型
 *
 * 业务响应类型（ServiceResult / ServicePagedList / AuthAccessToken ...）统一放在
 * types/api.uts，这里只保留请求层自身的配置结构。
 */

/** 任意键值对象 */
export type Recordable = Record<string, any>

/** 请求选项（替代原 alova 的 method.meta） */
export type RequestOptions = {
  /** 是否携带 token，默认 true */
  withToken?: boolean
  /** 是否展示错误提示，默认 true */
  showErr?: boolean
  /** 是否返回原生响应，不做业务解包 */
  isReturnNativeResponse?: boolean
  /** 是否关闭响应转换，直接返回 data */
  isTransformResponse?: boolean
  /** 认证角色标记 */
  authRole?: string | null
}

/** 请求配置 */
export type RequestConfig = {
  codeField: string
  messageField: string
  dataField: string
  successCode: number
  tokenField: string
  baseURL: string
  timeout: number
}
