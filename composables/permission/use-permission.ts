import { useAuthStore } from '@/store/auth.ts'
import { matchPermit } from '@/utils/permission.ts'

export function usePermission() {
  const authStore = useAuthStore()

  /**
   * 判断是否有权限（支持前缀匹配）
   * @param accesses 配置的权限要求
   * @returns 是否有权限
   *
   * @example
   * // 前缀匹配：配置 ORGAN，用户有 ORGAN_ADD → true
   * hasPermission(['ORGAN'])
   *
   * // 精确匹配：配置 ORGAN_ADD，用户有 ORGAN_ADD → true
   * hasPermission(['ORGAN_ADD'])
   *
   * // 精确匹配：配置 ORGAN_ADD，用户只有 ORGAN → false
   * hasPermission(['ORGAN_ADD'])
   */
  function hasPermission(accesses: string[]): boolean {
    if (!accesses || !accesses.length)
      return true
    if (authStore.isAdmin)
      return true
    return matchPermit(accesses, authStore.permissions, authStore.allPermissions)
  }

  /**
   * 是否包含指定的所有权限
   * @param accesses
   */
  function hasEveryPermission(accesses: string[]): boolean {
    if (!accesses || !accesses.length)
      return true
    if (authStore.isAdmin)
      return true
    // 用户必须拥有所有配置的权限
    return accesses.every(access =>
      matchPermit([access], authStore.permissions, authStore.allPermissions),
    )
  }

  /**
   * 是否包含其中某个权限
   * @param accesses
   */
  function hasSomePermission(accesses: string[]): boolean {
    if (!accesses || !accesses.length)
      return true
    if (authStore.isAdmin)
      return true
    // 用户拥有任一配置的权限即可
    return accesses.some(access =>
      matchPermit([access], authStore.permissions, authStore.allPermissions),
    )
  }

  return { hasPermission, hasEveryPermission, hasSomePermission }
}
