import type { FileStorageFileResourceModel } from '@/types/api.ts'
import type { SelectedFile } from './use-file-select.ts'

import { showToast } from '@/components/sp-toast/toast.ts'
import { appConfig } from '@/constants/config'
import { token } from '@/utils/token'

/** 上传任务状态 */
export type UploadStatus = 'uploading' | 'success' | 'error'

/** 上传任务 */
export interface UploadTask {
  /** 唯一 ID */
  uid: string
  /** 临时文件路径 */
  path: string
  /** 文件名 */
  name: string
  /** 上传状态 */
  status: UploadStatus
  /** 上传进度 0-100 */
  progress: number
  /** 上传成功后的文件模型 */
  result?: FileStorageFileResourceModel
}

/** 水印参数 */
export interface WatermarkOptions {
  watermark: boolean
  watermarkPos: number
  watermarkText: string
}

let uidCounter = 0

/**
 * 文件上传 composable
 * 封装 uni.uploadFile 调用 /resource/uploadtemp
 */
export function useFileUpload() {
  /**
   * 上传单个文件
   * @param file 选中的文件信息
   * @param watermarkOptions 水印参数
   * @param onProgress 进度回调
   * @returns 上传结果（FileResourceModel），失败返回 null
   */
  function uploadFile(
    file: SelectedFile,
    watermarkOptions: WatermarkOptions,
    onProgress?: (progress: number) => void,
  ): Promise<FileStorageFileResourceModel | null> {
    return new Promise((resolve) => {
      const tokenData = token.get()
      const header: Record<string, string> = {}

      if (tokenData) {
        header.Authorization = `${tokenData.token_type} ${tokenData.access_token}`
      }

      // 构建 formData（只传有值的可选参数）
      const formData: Record<string, string | number | boolean> = {
        name: file.name,
      }
      if (watermarkOptions.watermark) {
        formData.watermark = true
        formData.watermark_pos = watermarkOptions.watermarkPos
        if (watermarkOptions.watermarkText) {
          formData.watermark_text = watermarkOptions.watermarkText
        }
      }

      const uploadTask = uni.uploadFile({
        url: `${appConfig.baseUrl}/file/resource/uploadtemp`,
        filePath: file.path,
        name: 'file',
        header,
        formData,
        success(res) {
          if (res.statusCode === 200) {
            try {
              const data = JSON.parse(res.data)
              if (data.code === 0 && data.data) {
                resolve(data.data as FileStorageFileResourceModel)
                return
              }
              const msg = data.message || data.msg || '上传失败'
              showToast(msg)
            }
            catch {
              showToast('解析响应失败')
            }
          }
          else {
            showToast(`上传失败 (${res.statusCode})`)
          }
          resolve(null)
        },
        fail(err) {
          showToast(err.errMsg || '上传失败')
          resolve(null)
        },
      })

      // 监听上传进度
      if (onProgress) {
        uploadTask.progress((res) => {
          onProgress(res.progress)
        })
      }
    })
  }

  /**
   * 创建上传任务（不执行）
   */
  function createTask(file: SelectedFile): UploadTask {
    return {
      uid: `upload_${++uidCounter}_${Date.now()}`,
      path: file.path,
      name: file.name,
      status: 'uploading',
      progress: 0,
    }
  }

  /**
   * 执行上传任务
   */
  async function runTask(
    task: UploadTask,
    watermarkOptions: WatermarkOptions,
    onProgress?: (task: UploadTask) => void,
  ): Promise<void> {
    const result = await uploadFile({ path: task.path, name: task.name, size: 0, type: '' }, watermarkOptions, (progress) => {
      task.progress = progress
      onProgress?.({ ...task })
    })

    if (result) {
      task.status = 'success'
      task.progress = 100
      task.result = result
    }
    else {
      task.status = 'error'
    }
  }

  return { uploadFile, createTask, runTask }
}
