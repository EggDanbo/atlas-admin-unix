import { appConfig } from '@/constants/config'
import { getExtension } from './file-type.ts'

/** 可预览的文件项（兼容 FileResourceModel 与 FileResourceResult） */
export interface PreviewableItem {
  /** 文件资源 url（可能不带后缀） */
  url: string
  /** 文件名 */
  name?: string
  /** 扩展名字段，形如 ".doc" */
  extension?: string
}

/**
 * 给文件资源 url 拼接扩展名后缀，供 file-viewer 按扩展名识别类型。
 * 后端对带/不带后缀的 url 均可访问。若 url 已含 query，后缀插在 ? 之前。
 */
export function buildFileUrl(item: PreviewableItem): string {
  const ext = getExtension(item.extension) || getExtension(item.name)
  if (!ext)
    return item.url

  const queryIdx = item.url.indexOf('?')
  if (queryIdx < 0)
    return `${item.url}.${ext}`

  return `${item.url.slice(0, queryIdx)}.${ext}${item.url.slice(queryIdx)}`
}

/** 独立文件预览服务地址；空值表示用本应用内置预览页（仅开发模式有效） */
const FILE_PREVIEW_BASE = (appConfig.filePreviewBase ?? '').trim()

/**
 * 组装 H5 独立预览服务地址：`<base>/?url=<拼后缀的文件url>&name=<文件名>`
 * 未配置 TARO_APP_FILE_PREVIEW_BASE 时返回空串，调用方应改用内置预览页（仅开发模式）。
 */
export function buildPreviewUrl(item: PreviewableItem): string {
  if (!FILE_PREVIEW_BASE)
    return ''
  const fileUrl = buildFileUrl(item)
  const params = new URLSearchParams({
    url: fileUrl,
    name: item.name ?? '',
  })
  return `${FILE_PREVIEW_BASE.replace(/\/+$/, '')}/?${params.toString()}`
}
