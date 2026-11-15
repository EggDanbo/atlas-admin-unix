import { http } from '@/api/http'

const url = 'atlas/apply'

export default {
  /** 提交申请（请假 / 加班） */
  submit: (data: Recordable) => {
    return http.post<ServiceResult<{ ok: boolean, no: string }>>(`${url}/submit`, data)
  },
}
