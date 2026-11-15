import { http } from '@/api/http'

export default {
  /** 获取应用配置信息 */
  appinfo: () => {
    return http.get<ServiceResult<AppInfo>>('/common/appinfo', { withToken: false, authRole: null })
  },
  /** 枚举列表（访客） */
  enums: () => {
    return http.get<ServiceResult<Recordable<SystemEnums>>>('/common/enums')
  },
}
