export const rules = {
  // 验证手机
  isMobileNumber: /^1[1|3-9]\d{9}$/,
  // 验证数字
  isNumber: /^\d*$/,
  isLowerCase: /^[a-z]+&/,
  isUpperCase: /^[A-Z]+&/,
  isAlphabets: /^[A-Z]+&/i,
  // 验证价格（正数金额）
  isPrice: /(^[1-9](\d+)?(\.\d{1,2})?$)|(^0$)|(^\d\.\d{1,2}$)/,
  isEmail: /^([0-9a-z]+[-._+&])*[0-9a-z]+@([-0-9a-z]+\.)+[a-z]{2,6}$/i,
  isCertificateNumber: /(^\d{15}$)|(^\d{18}$)|(^\d{17}([\dX])$)/i,
  isUrl:
    /^(https?|ftp):\/\/([a-zA-Z0-9.-]+(:[a-zA-Z0-9.&%$-]+)*@)*((25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d?)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}|([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(:\d+)*(\/($|[\w.,?'\\+&%$#=~-]+))*$/,
}

export function validEmail(value: string) {
  if (!value)
    return Promise.reject(new Error('请输入邮箱'))
  if (!rules.isEmail.test(value))
    return Promise.reject(new Error('邮箱格式不正确'))
  return Promise.resolve()
}

export function validMobileNumber(value: string) {
  if (!value)
    return Promise.reject(new Error('请输入手机号码'))
  if (!rules.isMobileNumber.test(value))
    return Promise.reject(new Error('手机号码格式不正确'))
  return Promise.resolve()
}

export function validUrl(value: string) {
  if (value && !rules.isUrl.test(value))
    return Promise.reject(new Error('不合法的Url'))
  return Promise.resolve()
}

export function validCertificateNumber(value: string) {
  if (value && !rules.isCertificateNumber.test(value))
    return Promise.reject(new Error('身份证号码格式不正确'))
  return Promise.resolve()
}
