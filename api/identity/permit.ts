import { http } from '@/api/http'

/** 权限 API */
export default {
/**
 * 获取权限列表
 */
  get: () => {
    return http.get<ServiceResult<AuthPermission[]>>(`identity/permit/list`)
  },
  /**
   * 获取当前用户权限信息
   */
  currentUser: () => {
    return http.get<ServiceResult<string[]>>(`identity/permit/currentuser`)
  },
  /**
   * 验证当前用户权限
   */
  verifyUser: (data: any) => {
    return http.post<ServiceResponse>(`identity/permituser/verifyuser`, data)
  },
  /**
   * 验证用户权限
   */
  verify: () => {
    return http.post<ServiceResponse>(`identity/permituser/verify`)
  },
}
