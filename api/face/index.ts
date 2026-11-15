import { http } from '@/api/http'

/** 人脸识别 API */
export default {
  /** 人脸对比（拍照链路，image 为临时文件 ID） */
  math: (data: Recordable) => {
    return http.post<ServiceResultPage<Recordable>>('face/math', data)
  },
  /** 视频流单帧人脸验证（本地活体预检 + 服务端比对/活体判定，image 为 base64 JPEG） */
  verify: (data: Recordable) => {
    return http.post<ServiceResult<Recordable>>('face/verify', data, { showErr: false })
  },
}
