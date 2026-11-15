import { computed } from 'vue'
import { useEnumStore } from '@/store/enums.ts'

/**
 * 枚举数据的便捷 Hook
 *
 * 认证成功后由 app.ts 预加载枚举；登录态下组件可直接使用，未登录时不加载
 *
 * @example
 * ```ts
 * const { getLabel, getOptions } = useEnum()
 *
 * // 获取选项
 * const statusOptions = getOptions('UserStatus')
 *
 * // 获取标签
 * const label = getLabel('UserStatus', '1')
 * ```
 */
export function useEnum() {
  const enumStore = useEnumStore()

  return {
    /** store 实例 */
    enumStore,
    /** 获取枚举对象 */
    getEnum: (key: string) => enumStore.getEnum(key),
    /** 获取选项 */
    getOptions: (key: string) => enumStore.getEnumOptions(key),
    /** 获取标签 */
    getLabel: (key: string, value: string | number | null, matchBy?: 'value' | 'name') =>
      enumStore.getLabel(key, value, matchBy),
    /** 是否已加载 */
    isLoaded: computed(() => enumStore.isLoaded),
    /** 加载状态 */
    isLoading: computed(() => enumStore.isLoading),
    /** 错误信息 */
    error: computed(() => enumStore.error),
  }
}

/**
 * 枚选项的 Composable Hook
 * 返回响应式的选项数据
 *
 * @example
 * ```ts
 * const { options, isLoading } = useEnumOptions('UserStatus')
 * // <n-select :options="options" :loading="isLoading" />
 * ```
 */
export function useEnumOptions(key: string) {
  const enumStore = useEnumStore()

  return {
    /** 响应式选项数据 */
    options: computed(() => enumStore.getEnumOptions(key)),
    /** 加载状态 */
    isLoading: computed(() => enumStore.isLoading),
    /** 错误信息 */
    error: computed(() => enumStore.error),
  }
}
