/**
 * 密码加密
 *
 * Taro 版用 crypto-js 做 AES/CBC/PKCS7。crypto-js 是纯 JS 实现，
 * 无法编译到 uni-app x 的 Android/iOS 原生端（UTS → Kotlin），因此这里：
 *
 * - 演示版（useMock = true）后端由本地引擎模拟，不做真实校验，直接原样返回；
 * - 对接真实后端时，请在 uni_modules 里放一个 UTS 版 AES 插件，
 *   或改为走 HTTPS + 后端只接收明文口令（推荐，AES 硬编码密钥本身并不安全）。
 */
const AES_ENABLED = false

export function encrypt(word: string): string | null {
  if (word.length === 0)
    return null
  if (!AES_ENABLED)
    return word
  return word
}

export function decrypt(ciphertext: string): string {
  if (ciphertext.length === 0)
    return ''
  return ciphertext
}
