import { http } from '@/api/http'

export interface DraftBoxEntity {
  id: number
  cuser: number
  ctime: string
  utime: string
  types: string
  data: string
  memo: string
}

/** 草稿箱 */
export default {
  /** 获取草稿信息 */
  get: (id: number) => {
    return http.get<ServiceResult<DraftBoxEntity>>(`draftbox/get`, { id })
  },
  /** 查询草稿列表 */
  list: (types: string) => {
    return http.get<ServiceResult<DraftBoxEntity[]>>(`draftbox/list`, { types })
  },
  /** 查询草稿分页列表 */
  search: (data: any) => {
    return http.post<ServiceResult<Recordable>>(`draftbox/search`, data)
  },
  /** 保存草稿 */
  save: (types: string, data: Recordable, memo?: string) => {
    return http.post<ServiceResult<string>>(`draftbox/save`, {
      types,
      data: JSON.stringify(data),
      memo,
    })
  },
  /** 删除草稿 */
  remove: (id: number) => {
    return http.post<ServiceResponse>(`draftbox/remove`, { id })
  },
}
