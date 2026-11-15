/**
 * 请求层（uni-app x 版）
 *
 * 与原 Taro 版的差异：
 * - 原实现基于 alova（Vue Hook + 惰性 method + 拦截器链），UTS 环境无法运行；
 *   这里用 uni.request + 手写拦截逻辑重写，对外契约保持一致：
 *   所有接口都返回 Promise<ServiceResult<T>>，页面侧 await 即可。
 * - 演示版没有后端：useMock 为 true 时请求不离开本地，由 mock/engine 生成数据。
 */
import { showToast } from '@/components/sp-toast/toast.ts'
import { NO_ERROR_TIP_CODES } from '@/constants/enum.ts'
import { apiBaseUrl, appConfig } from '@/constants/config.ts'
import type { RequestOptions } from '@/types/service.ts'
import type { ServiceResult } from '@/types/api.ts'
import { token } from '@/utils/token.ts'
import { respond } from '@/mock/engine.ts'

const CODE_FIELD = 'code'
const MESSAGE_FIELD = 'message'
const DATA_FIELD = 'data'
const TOKEN_FIELD = 'Authorization'

/** 演示环境：本地数据生成的模拟延迟，保留 loading 态 */
const MOCK_DELAY = 180

/** token 失效时的外部回调（由 App.uvue 注入，避免与 store 循环依赖） */
let tokenExpiredHandler: (() => void) | null = null

export function registerTokenExpiredHandler(handler: () => void) {
  tokenExpiredHandler = handler
}

const HTTP_STATUS_TEXT: Map<number, string> = new Map<number, string>([
  [400, '请求出现语法错误'],
  [401, '用户未授权'],
  [403, '服务器拒绝访问'],
  [404, '请求的资源不存在'],
  [405, '请求方法未允许'],
  [408, '网络请求超时'],
  [500, '服务器内部错误'],
  [502, '错误网关'],
  [503, '服务不可用'],
  [504, '网关超时'],
])

function ok<T>(data: T, response: any = null): ServiceResult<T> {
  return {
    response,
    isSuccess: true,
    errorType: null,
    data,
  } as ServiceResult<T>
}

function fail<T>(message: string, code: number, errorType: string = 'Business Error'): ServiceResult<T> {
  return {
    response: null,
    isSuccess: false,
    errorType,
    data: null,
    code,
    message,
  } as ServiceResult<T>
}

function showError(message: string, code: number) {
  if (NO_ERROR_TIP_CODES.includes(code))
    return
  showToast(message.length > 0 ? message : '请求失败')
}

/** 拼接完整地址，并统一小写路径（与后端约定的路由大小写不敏感） */
function buildUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://'))
    return url
  const base = apiBaseUrl()
  const path = url.startsWith('/') ? url : `/${url}`
  return `${base}${path}`
}

function normalizePath(url: string): string {
  const pure = url.split('?')[0]
  return pure.toLowerCase()
}

function authHeader(options: RequestOptions | null): Map<string, string> {
  const headers = new Map<string, string>()
  headers.set('Content-Type', 'application/json')
  if (options != null && options.withToken === false)
    return headers
  const accessToken = token.get()
  if (accessToken != null) {
    headers.set(TOKEN_FIELD, `${accessToken.token_type} ${accessToken.access_token}`)
  }
  return headers
}

/** 业务响应解包 */
function unwrap<T>(body: any, options: RequestOptions | null): ServiceResult<T> {
  if (body == null)
    return ok<T>(null as T)

  const code = Number(body[CODE_FIELD])
  const message = String(body[MESSAGE_FIELD] ?? '')

  if (code === 0)
    return ok<T>(body[DATA_FIELD] as T, body)

  // token 过期 / 未登录
  if (code === 42001 || code === 912) {
    token.remove()
    if (tokenExpiredHandler != null)
      tokenExpiredHandler!()
  }

  const showErr = options == null || options.showErr !== false
  if (showErr)
    showError(message, code)

  return fail<T>(message.length > 0 ? message : '请求失败', code)
}

/** 本地 mock 响应（不发起真实网络请求） */
function mockRequest<T>(method: string, url: string, data: any, options: RequestOptions | null): Promise<ServiceResult<T>> {
  return new Promise<ServiceResult<T>>((resolve) => {
    setTimeout(() => {
      let body: any
      try {
        body = respond(normalizePath(url), data)
      }
      catch (e) {
        console.error('[atlas-mock]', url, e)
        body = { code: 500, data: null, message: String(e) }
      }
      if (options != null && options.isReturnNativeResponse === true) {
        resolve(ok<T>(body as T, body))
        return
      }
      if (options != null && options.isTransformResponse === false) {
        resolve(ok<T>(body[DATA_FIELD] as T, body))
        return
      }
      resolve(unwrap<T>(body, options))
    }, MOCK_DELAY)
  })
}

function realRequest<T>(method: string, url: string, data: any, options: RequestOptions | null): Promise<ServiceResult<T>> {
  return new Promise<ServiceResult<T>>((resolve) => {
    const headers = authHeader(options)
    const headerObj: Record<string, string> = {}
    headers.forEach((v, k) => {
      headerObj[k] = v
    })

    uni.request({
      url: buildUrl(url),
      method: method as any,
      data,
      header: headerObj,
      timeout: 15000,
      success: (res: any) => {
        const status = Number(res.statusCode)
        if (status !== 200) {
          const text = HTTP_STATUS_TEXT.get(status) ?? '请求错误'
          showError(text, status)
          resolve(fail<T>(text, status, 'Response Error'))
          return
        }
        resolve(unwrap<T>(res.data, options))
      },
      fail: (err: any) => {
        const message = String(err?.errMsg ?? '网络异常')
        showError(message, -1)
        resolve(fail<T>(message, -1, 'Response Error'))
      },
    })
  })
}

function request<T>(method: string, url: string, data: any, options: RequestOptions | null): Promise<ServiceResult<T>> {
  if (appConfig.useMock)
    return mockRequest<T>(method, url, data, options)
  return realRequest<T>(method, url, data, options)
}

export const http = {
  get: <T = any>(url: string, params: any = null, options: RequestOptions | null = null): Promise<ServiceResult<T>> =>
    request<T>('GET', url, params, options),

  post: <T = any>(url: string, data: any = null, options: RequestOptions | null = null): Promise<ServiceResult<T>> =>
    request<T>('POST', url, data, options),

  put: <T = any>(url: string, data: any = null, options: RequestOptions | null = null): Promise<ServiceResult<T>> =>
    request<T>('PUT', url, data, options),

  delete: <T = any>(url: string, data: any = null, options: RequestOptions | null = null): Promise<ServiceResult<T>> =>
    request<T>('DELETE', url, data, options),
}
