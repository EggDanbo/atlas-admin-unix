import { http } from '@/api/http'

/** 文件资源 */
export default {

  /**
   * 获取API授权令牌
   * @param data 请求数据
   * @returns 请求方法对象
   */
  search: (data: FileStorageFileResourceCondition) => http.get<ServiceResultPage<FileStorageFileResourceResult>>(`file/search`, data),
  /**
   * 资源删除
   * @param data 请求数据
   * @returns 请求方法对象
   */
  delete: (data: FileStorageFileDeleteRequest) => http.post<ServiceResponse>(`file/resource/delete`, data),
  /**
   * 大文件分片上传完毕后续处理
   */
  uploadFragmentFinish: (data: FileStorageUploadFragmentRequest) =>
    http.post<ServiceResult<FileStorageFileResourceModel>>('file/resource/upload/fragment/finish', data),
  /**
   * 上传临时文件，基于base64字符传输
   */
  uploadImageTemp: (data: FileStorageUploadImageTempRequest) => http.post<ServiceResult<FileStorageFileResourceModel>>('file/resource/uploadimagetemp', data),
  /**
   * 上传文件，基于base64字符传输
   */
  uploadImage: (data: FileStorageUploadImageRequest) => http.post<ServiceResult<FileStorageFileResourceModel>>('file/resource/uploadimage', data),
}
