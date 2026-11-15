import { reactive } from 'vue'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastState {
  visible: boolean
  title: string
  type: ToastType
  duration: number
}

/** 全局提示状态：任意位置（页面 / hooks / service）都可以直接调用 showToast */
export const toastState = reactive<ToastState>({
  visible: false,
  title: '',
  type: 'info',
  duration: 2200,
})

let timer: ReturnType<typeof setTimeout> | null = null

function clearTimer() {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

/** 按文案推断语义，避免每个调用点都显式传类型 */
function inferType(title: string): ToastType {
  if (/成功|已完成|已保存|已提交|已撤回|已更新/.test(title))
    return 'success'
  if (/失败|错误|异常|不支持|无法|不存在/.test(title))
    return 'error'
  return 'info'
}

export function showToast(title: string, options?: { type?: ToastType, duration?: number }) {
  if (!title)
    return
  clearTimer()
  toastState.title = title
  toastState.type = options?.type || inferType(title)
  toastState.duration = options?.duration ?? 2200
  toastState.visible = true
  timer = setTimeout(() => {
    toastState.visible = false
    timer = null
  }, toastState.duration)
}

export function showSuccess(title: string, duration?: number) {
  showToast(title, { type: 'success', duration })
}

export function showError(title: string, duration?: number) {
  showToast(title, { type: 'error', duration })
}

export function hideToast() {
  clearTimer()
  toastState.visible = false
}
