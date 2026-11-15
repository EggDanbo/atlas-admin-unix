import type { CaptchaDataResponse, TrailPoint, VerifyResult } from '@/components/sp-slider-captcha/types/index.ts'
import { http } from '@/api/http'

/** 滑块验证码 API */
export default {
  /** 获取滑块验证码配置 */
  getCaptcha: () => {
    return http.get<ServiceResult<CaptchaDataResponse>>('/captcha/slider', { withToken: false })
  },

  /** 校验滑块验证码 */
  verify: (key: string, sliderX: number, sliderTime: number, trail?: TrailPoint[]) => {
    return http.post<ServiceResult<VerifyResult>>('/captcha/slider/verify', {
      key,
      slideX: sliderX,
      slideTime: sliderTime,
      trail,
    }, { withToken: false })
  },
}
