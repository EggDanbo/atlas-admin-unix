import { http } from '@/api/http'

const url = 'map/geocode'

export default {
  /**
   * geo
   * @param data 请求数据
   */
  geo: (data: Recordable) => {
    return http.post<ServiceResult<Recordable[]>>(`${url}/geo`, data)
  },
  /**
   * regeo
   * @param data 请求数据
   */
  regeo: (data: Recordable) => {
    return http.post<ServiceResult<Recordable[]>>(`${url}/regeo`, data)
  },
}
