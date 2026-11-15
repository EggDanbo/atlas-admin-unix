import type { FileStorageFileResourceModel } from '@/types/api.ts'
import type { Ref } from 'vue'
import { isWeb, isWeapp } from '@/utils/platform.ts'
import type { CameraAdapter } from './use-camera-weapp.ts'

import { ref } from 'vue'
import { useFileUpload } from '@/components/file-upload/use-file-upload.ts'
import { showToast } from '@/components/sp-toast/toast.ts'
import { appConfig } from '@/constants/config'
import { hasGetUserMedia, useCameraH5 } from './use-camera-h5.ts'
import { useCameraWeapp } from './use-camera-weapp.ts'

export type CameraStatus = 'idle' | 'camera' | 'preview' | 'uploading'

const IS_WEAPP = isWeapp()

export function useCamera(h5ContainerRef: Ref<any>) {
  const state = ref<CameraStatus>('idle')
  const tempImagePath = ref('')
  const uploadProgress = ref(0)

  const { uploadFile } = useFileUpload()

  let adapter: CameraAdapter | null = null

  function createAdapter(): CameraAdapter {
    if (IS_WEAPP)
      return useCameraWeapp()
    return useCameraH5(h5ContainerRef)
  }

  async function startCamera() {
    // H5 降级
    if (!IS_WEAPP && !hasGetUserMedia()) {
      try {
        const res = await uni.chooseImage({ count: 1, sizeType: ['compressed'], sourceType: ['camera'] })
        tempImagePath.value = res.tempFilePaths[0]
        state.value = 'preview'
      }
      catch {
        // 用户取消
      }
      return
    }

    state.value = 'camera'
    try {
      adapter = createAdapter()
      await adapter.start()
    }
    catch (err: any) {
      adapter?.stop()
      adapter = null
      state.value = 'idle'
      showToast(err.message || '相机启动失败')
    }
  }

  async function capture() {
    if (!adapter)
      return
    try {
      tempImagePath.value = await adapter.capture()
      adapter.stop()
      adapter = null
      state.value = 'preview'
    }
    catch (err: any) {
      showToast(err.message || '拍照失败')
    }
  }

  function cancelCamera() {
    adapter?.stop()
    adapter = null
    state.value = 'idle'
  }

  async function retake() {
    tempImagePath.value = ''
    state.value = 'camera'
    try {
      adapter = createAdapter()
      await adapter.start()
    }
    catch (err: any) {
      adapter?.stop()
      adapter = null
      state.value = 'idle'
      showToast(err.message || '相机启动失败')
    }
  }

  async function upload(): Promise<FileStorageFileResourceModel | null> {
    state.value = 'uploading'
    uploadProgress.value = 0

    // 演示环境没有文件服务：直接用本地临时路径作为人脸照片，页面仍可看到效果
    if (appConfig.useMock) {
      uploadProgress.value = 100
      return {
        id: `local-face-${Date.now()}`,
        url: tempImagePath.value,
        name: '人脸照片',
        image: true,
        content_type: 'image/jpeg',
        size: '0',
      }
    }

    try {
      const result = await uploadFile(
        { path: tempImagePath.value, name: '人脸照片', size: 0, type: 'image/jpeg' },
        { watermark: false, watermarkPos: 0, watermarkText: '' },
        progress => uploadProgress.value = progress,
      )
      return result
    }
    catch {
      showToast('上传失败')
      return null
    }
  }

  function cleanup() {
    adapter?.stop()
    adapter = null
    state.value = 'idle'
    tempImagePath.value = ''
    uploadProgress.value = 0
  }

  return {
    IS_WEAPP,
    state,
    tempImagePath,
    uploadProgress,
    startCamera,
    capture,
    cancelCamera,
    retake,
    upload,
    cleanup,
  }
}
