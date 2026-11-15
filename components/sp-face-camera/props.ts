import type { FileStorageFileResourceModel } from '@/types/api.ts'
import type { ExtractPublicPropTypes } from 'vue'

export const spFaceCameraProps = {
  /** 已有的人脸照片 */
  modelValue: {
    type: Object as () => FileStorageFileResourceModel | null,
    default: null,
  },
  /** 是否使用内置弹窗 */
  popup: {
    type: Boolean,
    default: false,
  },
  /** 弹窗可见性，popup 模式下生效 */
  visible: {
    type: Boolean,
    default: false,
  },
  /** 已有照片时是否禁止重新拍摄 */
  disabled: {
    type: Boolean,
    default: false,
  },
  /** 是否渲染内置的空态 / 已采集预览（页面自带状态卡时可关掉） */
  showIdle: {
    type: Boolean,
    default: true,
  },
}

export type SpFaceCameraProps = ExtractPublicPropTypes<typeof spFaceCameraProps>
