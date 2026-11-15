/** 类型守卫工具函数 */
export function isObject(val: any): val is Record<string, any> {
  return val !== null && typeof val === 'object' && !Array.isArray(val)
}

export function isString(val: any): val is string {
  return typeof val === 'string'
}

export function isNumber(val: any): val is number {
  return typeof val === 'number' && !Number.isNaN(val)
}

export function isNull(val: any): val is null {
  return val === null
}

export function isUndefined(val: any): val is undefined {
  return typeof val === 'undefined'
}

export function isEmpty(val: any): boolean {
  if (val === null || val === undefined || val === '')
    return true
  if (Array.isArray(val) && val.length === 0)
    return true
  if (isObject(val) && Object.keys(val).length === 0)
    return true
  return false
}
