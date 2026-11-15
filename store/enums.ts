import { reactive } from 'vue'
import { common } from '@/api/misc/index.ts'
import { isObject } from '@/utils/is.ts'

/** 枚举项 */
export type SystemEnumItem = {
  name: string
  label: string
  value: string
}

/** 枚举 */
export type SystemEnums = {
  name: string
  items: SystemEnumItem[]
}

/** 下拉选项 */
export type SelectOption = {
  label: string
  value: string
}

/** 枚举查找模式 */
export type EnumMatchBy = 'value' | 'name'

/**
 * 枚举 Store
 *
 * 所有 get 方法都会自动触发加载，无需手动调用 asyncEnums。
 */
class EnumStore {
  enumsMap: Map<string, SystemEnums> | null = null
  error: string | null = null
  loadFailed: boolean = false
  private optionsCache: Map<string, SelectOption[]> = new Map<string, SelectOption[]>()
  private loading: boolean = false

  get isLoading(): boolean {
    return this.loading
  }

  get isLoaded(): boolean {
    return this.enumsMap != null
  }

  /** 异步加载（已加载直接返回，正在加载复用同一次请求） */
  async asyncEnums(): Promise<Map<string, SystemEnums>> {
    if (this.enumsMap != null)
      return this.enumsMap!
    if (this.loading)
      return this.enumsMap ?? new Map<string, SystemEnums>()
    return await this.performLoad()
  }

  private async performLoad(): Promise<Map<string, SystemEnums>> {
    this.loading = true
    this.error = null
    try {
      const res = await common.enums()
      const data = res.data
      if (!res.isSuccess || data == null || !isObject(data)) {
        this.loadFailed = true
        return new Map<string, SystemEnums>()
      }
      this.optionsCache.clear()
      const map = new Map<string, SystemEnums>()
      const keys = Object.keys(data)
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        map.set(key, data[key] as SystemEnums)
      }
      this.enumsMap = map
      this.loadFailed = false
      return map
    }
    catch (err) {
      this.error = String(err)
      this.loadFailed = true
      return new Map<string, SystemEnums>()
    }
    finally {
      this.loading = false
    }
  }

  /** 重试 */
  async retry(): Promise<Map<string, SystemEnums>> {
    this.loadFailed = false
    this.enumsMap = null
    this.optionsCache.clear()
    return await this.asyncEnums()
  }

  /** 确保已加载 */
  async ensureLoaded(): Promise<Map<string, SystemEnums>> {
    this.loadFailed = false
    if (this.enumsMap == null)
      return await this.asyncEnums()
    return this.enumsMap!
  }

  /** 等待指定枚举加载完成 */
  async awaitEnum(key: string): Promise<SystemEnums | null> {
    await this.ensureLoaded()
    if (this.enumsMap == null)
      return null
    return this.enumsMap!.get(key) ?? null
  }

  /** 同步获取枚举（未加载时触发后台加载并返回 null） */
  getEnum(key: string): SystemEnums | null {
    if (this.enumsMap == null && !this.loading && !this.loadFailed)
      void this.asyncEnums()
    if (this.enumsMap == null)
      return null
    return this.enumsMap!.get(key) ?? null
  }

  /** 枚举键名列表 */
  getEnumKeys(): string[] {
    if (this.enumsMap == null && !this.loading && !this.loadFailed)
      void this.asyncEnums()
    if (this.enumsMap == null)
      return []
    return Array.from(this.enumsMap!.keys())
  }

  /** 选项列表（带缓存） */
  getEnumOptions(key: string): SelectOption[] {
    if (this.enumsMap == null && !this.loading && !this.loadFailed)
      void this.asyncEnums()

    const cached = this.optionsCache.get(key)
    if (cached != null)
      return cached

    const enumData = this.getEnum(key)
    if (enumData == null || enumData.items == null || enumData.items.length === 0)
      return []

    const options: SelectOption[] = enumData.items.map((item: SystemEnumItem) => {
      return { label: item.label, value: item.value } as SelectOption
    })
    this.optionsCache.set(key, options)
    return options
  }

  /** 按 value/name 取 label */
  getLabel(key: string, matchValue: string | number | null, matchBy: EnumMatchBy = 'value'): string | null {
    if (matchValue == null)
      return null
    const enumData = this.getEnum(key)
    const strVal = matchValue.toString()
    if (enumData == null || enumData.items == null)
      return strVal
    const item = enumData.items.find((it: SystemEnumItem) => {
      return matchBy === 'value' ? it.value === strVal : it.name === strVal
    })
    return item != null ? item!.label : strVal
  }

  /** 取完整枚举项 */
  getItem(key: string, matchValue: string | number | null, matchBy: EnumMatchBy = 'value'): SystemEnumItem | null {
    if (matchValue == null)
      return null
    const enumData = this.getEnum(key)
    if (enumData == null || enumData.items == null)
      return null
    const strVal = matchValue.toString()
    return enumData.items.find((it: SystemEnumItem) => {
      return matchBy === 'value' ? it.value === strVal : it.name === strVal
    }) ?? null
  }

  getItemByValue(key: string, value: string | number): SystemEnumItem | null {
    return this.getItem(key, value, 'value')
  }

  getItemByName(key: string, name: string): SystemEnumItem | null {
    return this.getItem(key, name, 'name')
  }

  /** 清空（登出时调用） */
  resetStore(): void {
    this.enumsMap = null
    this.error = null
    this.loadFailed = false
    this.loading = false
    this.optionsCache.clear()
  }
}

export const enumStore = reactive(new EnumStore()) as EnumStore

export function useEnumStore(): EnumStore {
  return enumStore
}

/** 与 pinia 版保持同名导出，语义为「拿 store 实例」 */
export function useEnumStoreWithOut(): EnumStore {
  return enumStore
}
