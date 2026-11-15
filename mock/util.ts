/** 成功响应 */
export function resultSuccess(data: any, message = 'success') {
  return { code: 0, data, message }
}

/** 错误响应 */
export function resultError(message = '请求失败', code = 1) {
  return { code, data: null, message }
}

/** 分页切片 */
export function pagination<T>(pageNo: number, pageSize: number, array: T[]): T[] {
  const offset = (pageNo - 1) * pageSize
  return array.slice(offset, offset + pageSize)
}

/** 分页成功响应 */
export function resultPageSuccess<T = any>(
  page: number,
  pageSize: number,
  list: T[],
) {
  const totalcount = list.length
  const pagedList = pagination(page, pageSize, list)
  return resultSuccess({
    list: pagedList,
    totalcount,
    page,
    pageindex: page - 1,
    pagesize: pageSize,
    totalpages: Math.ceil(totalcount / pageSize),
    haspreviouspage: page > 1,
    hasnextpage: (page - 1) * pageSize + pageSize < totalcount,
    isempty: totalcount === 0,
  })
}
