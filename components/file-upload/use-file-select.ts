import { getEnvName, ENV_TYPE } from '@/utils/platform'
import type { FileSelectMode, FileSourceType } from './props.ts'

import { showToast } from '@/components/sp-toast/toast.ts'
import { DEFAULT_ACCEPT_IMAGE, DEFAULT_ACCEPTS } from './props.ts'

/** 选中的文件信息 */
export interface SelectedFile {
  /** 临时文件路径 */
  path: string
  /** 文件名 */
  name: string
  /** 文件大小（字节） */
  size: number
  /** MIME 类型 */
  type: string
}

/** MIME → 扩展名 映射 */
const MIME_TO_EXT: Record<string, string> = {
  'image/png': '.png',
  'image/jpg': '.jpg',
  'image/jpeg': '.jpg',
  'image/pjpeg': '.jpg',
  'image/gif': '.gif',
  'image/bmp': '.bmp',
  'image/svg+xml': '.svg',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'text/csv': '.csv',
  'text/plain': '.txt',
  'application/rtf': '.rtf',
  'application/zip': '.zip',
  'application/x-zip-compressed': '.zip',
  'application/vnd.rar': '.rar',
  'application/x-7z-compressed': '.7z',
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
  'video/avi': '.avi',
  'audio/wav': '.wav',
}

/** 扩展名 → MIME 反向映射（chooseMessageFile 返回扩展名而非 MIME） */
const EXT_TO_MIME: Record<string, string> = Object.fromEntries(
  Object.entries(MIME_TO_EXT).map(([mime, ext]) => [ext, mime]),
)

/** 从文件名提取扩展名（含前导点号），如 "uni.txt" → ".txt" */
function extFromName(name: string): string {
  const dotIndex = name.lastIndexOf('.')
  if (dotIndex < 0)
    return ''
  return name.slice(dotIndex).toLowerCase()
}

/** 将扩展名标准化为 MIME 类型 */
function normalizeType(rawType: string): string {
  if (!rawType)
    return ''
  // 已经是 MIME 格式（含 /）
  if (rawType.includes('/'))
    return rawType.toLowerCase()
  // 扩展名格式：补充前导点号查找
  const ext = rawType.startsWith('.') ? rawType.toLowerCase() : `.${rawType.toLowerCase()}`
  return EXT_TO_MIME[ext] || rawType.toLowerCase()
}

/** 判断当前是否为小程序环境 */
function isMiniProgram(): boolean {
  return getEnvName() === ENV_TYPE.WEAPP
}

/** 选择图片（mode='image'） */
async function selectImages(remaining: number, sourceType: FileSourceType): Promise<SelectedFile[]> {
  const count = Math.min(remaining, 9)
  const res = await uni.chooseImage({ count, sizeType: ['original', 'compressed'], sourceType })
  return res.tempFiles.map(f => ({
    path: f.path,
    name: f.path.split('/').pop() || `image_${Date.now()}.jpg`,
    size: f.size,
    type: f.type || 'image/jpeg',
  }))
}

/** 选择媒体文件（mode='media'） */
async function selectMedia(remaining: number, sourceType: FileSourceType): Promise<SelectedFile[]> {
  if (isMiniProgram()) {
    // 小程序：使用 chooseMedia
    const count = Math.min(remaining, 9)
    const res = await uni.chooseMedia({ count, mediaType: ['image', 'video'], sourceType })
    return res.tempFiles.map(f => ({
      path: f.tempFilePath,
      name: f.tempFilePath.split('/').pop() || `media_${Date.now()}`,
      size: f.size,
      type: f.fileType === 'image' ? 'image/jpeg' : 'video/mp4',
    }))
  }
  // H5：优先尝试 chooseImage（兼容性最好）
  return selectImages(remaining, sourceType)
}

/**
 * 任意文件选择
 *
 * Web：用原生 <input type="file">（可多选、可指定 accept）
 * 其它端：没有 DOM，退化为系统相册/媒体选择器
 */
function selectAnyFilesH5(remaining: number, _accepts: string[]): Promise<SelectedFile[]> {
  // #ifdef WEB
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    if (remaining > 1)
      input.multiple = true
    input.style.display = 'none'

    let resolved = false
    // 用户取消：文件对话框关闭后 focus 回页面
    const onCancel = () => setTimeout(() => {
      if (resolved)
        return
      resolved = true
      input.remove()
      window.removeEventListener('focus', onCancel)
      resolve([])
    }, 300)
    window.addEventListener('focus', onCancel)

    input.onchange = () => {
      resolved = true
      window.removeEventListener('focus', onCancel)
      const files = Array.from(input.files != null ? input.files : [])
      const results: SelectedFile[] = files.map((f: any) => ({
        path: URL.createObjectURL(f),
        name: f.name,
        size: f.size,
        type: f.type.length > 0 ? f.type : '',
      }))
      input.remove()
      resolve(results)
    }

    document.body.appendChild(input)
    input.click()
  })
  // #endif
  // #ifndef WEB
  return selectMedia(remaining, ['album', 'camera'])
  // #endif
}

/** 选择任意文件（mode='file'） */
async function selectAnyFiles(remaining: number, accepts: string[]): Promise<SelectedFile[]> {
  if (isMiniProgram()) {
    const res = await uni.chooseMessageFile({
      count: Math.min(remaining, 100),
      type: 'all',
    })
    return res.tempFiles.map(f => ({
      path: f.path,
      name: f.name,
      size: f.size,
      // chooseMessageFile.type 是文件类别（file/image/video），从文件名提取扩展名查 MIME
      type: normalizeType(extFromName(f.name)),
    }))
  }
  // H5：使用原生 <input type="file"> 选择任意文件
  return selectAnyFilesH5(remaining, accepts)
}

/**
 * 文件选择 composable
 * 按 mode 和平台分发到对应的 Taro API
 */
export function useFileSelect() {
  /**
   * 选择文件
   * @param mode 选择模式
   * @param accepts 允许的 MIME 列表
   * @param remaining 剩余可选数量
   * @returns 选中的文件列表，校验失败返回空数组
   */
  async function selectFiles(mode: FileSelectMode, accepts: string[] | undefined, remaining: number, sourceType: FileSourceType = ['album', 'camera']): Promise<SelectedFile[]> {
    if (remaining <= 0) {
      showToast('已达最大数量')
      return []
    }

    const effectiveAccepts = accepts ?? (mode === 'image' ? DEFAULT_ACCEPT_IMAGE : DEFAULT_ACCEPTS)

    let files: SelectedFile[]
    try {
      switch (mode) {
        case 'image':
          files = await selectImages(remaining, sourceType)
          break
        case 'media':
          files = await selectMedia(remaining, sourceType)
          break
        case 'file':
          files = await selectAnyFiles(remaining, effectiveAccepts)
          break
        default:
          files = await selectAnyFiles(remaining, effectiveAccepts)
      }
    }
    catch {
      // 用户取消选择，静默处理
      return []
    }

    if (files.length === 0)
      return []

    // 数量校验
    if (files.length > remaining) {
      showToast(`最多上传 ${remaining + files.length} 个文件，还可上传 ${remaining} 个`)
      return []
    }

    // MIME 校验
    const validFiles: SelectedFile[] = []
    for (const file of files) {
      const mime = file.type.toLowerCase()
      // MIME 为空时跳过校验（信任 API 返回）
      if (mime && !effectiveAccepts.some(a => a.toLowerCase() === mime || mime.startsWith(a.split('/')[0]))) {
        showToast(`"${file.name}" 不支持的文件类型`)
        continue
      }
      validFiles.push(file)
    }

    return validFiles
  }

  return { selectFiles }
}
