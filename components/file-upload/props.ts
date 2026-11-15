import type { FileStorageFileResourceModel } from '@/types/api.ts'
import type { PropType } from 'vue'

/** 默认图片 MIME 类型列表 */
export const DEFAULT_ACCEPT_IMAGE: string[] = [
  'image/png',
  'image/jpg',
  'image/jpeg',
  'image/pjpeg',
  'image/gif',
  'image/bmp',
  'image/svg+xml',
]

/** 默认全部 MIME 类型列表（与 PC 端对齐） */
export const DEFAULT_ACCEPTS: string[] = [
  'image/png',
  'image/jpg',
  'image/jpeg',
  'image/pjpeg',
  'image/gif',
  'image/bmp',
  'image/svg+xml',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/pdf',
  'text/csv',
  'text/plain',
  'application/rtf',
  'application/zip',
  'application/x-zip-compressed',
  'application/vnd.rar',
  'application/x-7z-compressed',
  'video/mp4',
  'video/mpg4',
  'video/x-mp4',
  'video/flv',
  'video/x-flv',
  'video/avi',
  'video/msvideo',
  'video/x-msvideo',
  'video/quicktime',
  'video/webm',
  'video/mp2t',
  'video/mpeg',
  'video/3gpp',
  'video/3gpp2',
  'audio/wav',
]

/** 选择模式 */
export type FileSelectMode = 'image' | 'media' | 'file'

/** 图片/视频来源类型 */
export type FileSourceType = ('album' | 'camera')[]

export const fileUploadProps = {
  /** 选择模式：image=仅图片, media=图片+视频, file=任意文件 */
  mode: {
    type: String as PropType<FileSelectMode>,
    default: 'file',
  },
  /** 允许的 MIME 类型列表 */
  accepts: {
    type: Array as PropType<string[]>,
    default: undefined,
  },
  /** 文件大小限制，单位 MB */
  maxSize: {
    type: Number,
    default: 50,
  },
  /** 最大文件数量 */
  maxNumber: {
    type: Number,
    default: Infinity,
  },
  /** 是否禁用 */
  disabled: {
    type: Boolean,
    default: false,
  },
  /** 卡片宽度（px） */
  width: {
    type: Number,
    default: 150,
  },
  /** 卡片高度（px） */
  height: {
    type: Number,
    default: 150,
  },
  /** 文件列表（v-model） */
  modelValue: {
    type: Array as PropType<FileStorageFileResourceModel[]>,
    default: () => [],
  },
  /** 是否开启水印 */
  watermark: {
    type: Boolean,
    default: false,
  },
  /** 水印位置 1-9（小键盘布局），默认 3 */
  watermarkPos: {
    type: Number,
    default: 3,
  },
  /** 水印文字，空时后端默认用时间 */
  watermarkText: {
    type: String,
    default: '',
  },
  /** 是否显示文件名，默认 true */
  showFileName: {
    type: Boolean,
    default: true,
  },
  /** 上传按钮文字 */
  uploadTitle: {
    type: String,
    default: '上传文件',
  },
  /** 图片/视频来源类型 */
  sourceType: {
    type: Array as PropType<FileSourceType>,
    default: () => ['album', 'camera'] as FileSourceType,
  },
}
