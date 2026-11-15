/* eslint-disable */
// 本文件由 scripts/mock/extract-schema.mjs 自动生成，请勿手工修改。
// 数据来源：src/pages/**/define.ts + src/service/api/**。
// 重新生成：node scripts/mock/extract-schema.mjs

export interface MockField {
  key: string
  label: string
  title: string
  listOrder: number
  detailOrder: number
  transform?: boolean
}

export interface MockModule {
  /** 页面目录，同时作为数据域标识 */
  page: string
  /** 列表/详情标题 */
  title: string
  /** 接口基础路径（不含 atlas/ 前缀） */
  base: string
  fields: MockField[]
  enums: Record<string, string>
  numbers: string[]
  customs: string[]
  /** 详情页明细表格用到的字段 */
  detailItemKeys: string[]
  /** 详情页表单模型用到的字段 */
  detailFormKeys: string[]
}

export const MOCK_MODULES: MockModule[] = []
