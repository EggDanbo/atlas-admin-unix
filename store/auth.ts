import { reactive } from 'vue'
import authorize from '@/api/identity/authorize.ts'
import permit from '@/api/identity/permit.ts'
import profile from '@/api/identity/profile.ts'
import wechatAuth from '@/api/identity/wechat.ts'
import wechatWorkAuth from '@/api/identity/wechatwork.ts'
import type { AuthAccessToken, AuthPermission, AuthUserCurrent } from '@/types/api.ts'
import { getAuthPlatform } from '@/utils/platform.ts'
import { buildQuery, getCurrentPageInfo, routes, stripBasename } from '@/utils/router.ts'
import { storage } from '@/utils/storage.ts'
import { token } from '@/utils/token.ts'
import { encrypt } from '@/utils/crypto.ts'

export type AuthStatus = 'loading' | 'auth' | 'guest'

export type LoginRedirect = {
  url: string
  type: string
}

export type LoginParams = {
  type: string
  mobile?: string
  verifyCode?: string
  username?: string
  password?: string
  phoneCode?: string
  loginCode?: string
  verifyToken?: string
}

export type LoginResult = {
  isSuccess: boolean
  message?: string
}

const REDIRECT_KEY = 'login_redirect_url'

class AuthStore {
  status: AuthStatus = 'loading'
  key: string | null = null
  userInfo: AuthUserCurrent | null = null
  permissions: string[] = []
  allPermissions: AuthPermission[] = []
  loginLoading: boolean = false

  get isLoggedIn(): boolean {
    return this.status === 'auth'
  }

  get isAdmin(): boolean {
    return this.userInfo?.code === 'atlas'
  }

  // ==================== 登录重定向 ====================

  saveLoginRedirect(url: string, type: string = 'navigate') {
    const redirect: LoginRedirect = { url, type } as LoginRedirect
    storage.set(REDIRECT_KEY, redirect)
  }

  consumeLoginRedirect(): LoginRedirect | null {
    const redirect = storage.get<LoginRedirect>(REDIRECT_KEY)
    if (redirect == null)
      return null
    storage.remove(REDIRECT_KEY)
    return redirect
  }

  /**
   * 登录成功后跳转
   *
   * 统一用 reLaunch：让目标页以全新实例重建，导航栈只有一页，
   * 避免「返回」退到登录页或产生空页面。
   */
  navigateAfterLogin() {
    const redirect = this.consumeLoginRedirect()
    if (redirect != null) {
      const url = stripBasename(redirect.url)
      uni.reLaunch({ url })
    }
    else {
      uni.switchTab({ url: routes.home })
    }
  }

  // ==================== 内部逻辑 ====================

  /** 从 oauthCallback 页导航到目标页 */
  private navigateFromOAuthCallback(pathParam?: string) {
    const targetUrl = (pathParam != null && pathParam.length > 0)
      ? decodeURIComponent(pathParam)
      : routes.home
    uni.reLaunch({
      url: targetUrl,
      complete: (_res: any) => {
        uni.setNavigationBarTitle({ title: 'Atlas 工作台' })
      },
    })
  }

  /** 加载用户信息与权限 */
  async loadUserProfile(): Promise<boolean> {
    try {
      const profileRes = await profile.get()
      if (profileRes.isSuccess && profileRes.data != null) {
        this.userInfo = {
          ...(this.userInfo ?? {}),
          ...profileRes.data,
        } as AuthUserCurrent
      }

      const permRes = await permit.get()
      if (permRes.isSuccess && permRes.data != null)
        this.allPermissions = permRes.data as AuthPermission[]

      const userPermRes = await permit.currentUser()
      if (userPermRes.isSuccess && userPermRes.data != null)
        this.permissions = userPermRes.data as string[]

      return this.userInfo?.userid != null
    }
    catch (error) {
      console.error('加载用户信息失败:', error)
      return false
    }
  }

  /** 处理 LoginTokenDto：bound 为 true 已绑定用户，否则只是拿到 key */
  private handleLoginTokenDto(data: AuthAccessToken): boolean {
    if (data.bound === true) {
      token.set(data)
      return true
    }
    this.key = data.key ?? null
    return false
  }

  /** 初始化认证状态（App onLaunch 调用） */
  async init(): Promise<void> {
    const accessToken = token.get()

    // ① 有 token → 加载用户信息
    if (accessToken != null) {
      const loaded = await this.loadUserProfile()
      if (loaded) {
        this.status = 'auth'
        return
      }
      token.remove()
    }

    // ② 无 token → 按平台分流
    const platform = getAuthPlatform()

    if (platform === 'weapp') {
      await this.initWeapp()
    }
    else if (platform === 'h5-wecom') {
      await this.initH5Wecom()
    }
    else if (platform === 'h5-wechat') {
      await this.initH5Wechat()
    }
    else {
      this.status = 'guest'
    }
  }

  /** 小程序初始化 */
  private async initWeapp(): Promise<void> {
    try {
      const loginRes: any = await uni.login({ provider: 'weixin' })
      const res = await wechatAuth.getWxappToken({ code: String(loginRes.code ?? '') })
      if (res.isSuccess && res.data != null) {
        if (this.handleLoginTokenDto(res.data!)) {
          await this.loadUserProfile()
          this.status = 'auth'
        }
        else {
          this.status = 'guest'
        }
      }
      else {
        this.status = 'guest'
      }
    }
    catch (e) {
      this.status = 'guest'
    }
  }

  /** H5 微信浏览器初始化 */
  private async initH5Wechat(): Promise<void> {
    const info = getCurrentPageInfo()
    const code = info.params['code'] ?? ''
    const state = info.params['state'] ?? ''

    if (code.length > 0 && state.length > 0) {
      try {
        const res = await wechatAuth.getWxToken({ code, state })
        if (res.isSuccess && res.data != null) {
          if (this.handleLoginTokenDto(res.data!)) {
            await this.loadUserProfile()
            this.status = 'auth'
          }
          else {
            this.status = 'guest'
          }
        }
        else {
          this.status = 'guest'
        }
      }
      catch (e) {
        this.status = 'guest'
      }
      this.navigateFromOAuthCallback(info.params['path'])
      return
    }

    // Web 端的整页 OAuth 跳转只在浏览器里成立
    // #ifdef WEB
    try {
      let redirectPath = stripBasename(info.path)
      const queryString = buildQuery(info.params)
      if (queryString.length > 0)
        redirectPath = `${redirectPath}?${queryString}`
      const redirectUri = `${window.location.origin}/pages/oauthCallback/index?path=${encodeURIComponent(redirectPath)}`
      const res = await wechatAuth.getAuthorizeUrl({ redirect_uri: redirectUri })
      if (res.isSuccess && res.data != null)
        window.location.href = String(res.data)
      else
        this.status = 'guest'
    }
    catch (e) {
      this.status = 'guest'
    }
    // #endif
    // #ifndef WEB
    this.status = 'guest'
    // #endif
  }

  /** H5 企业微信初始化 */
  private async initH5Wecom(): Promise<void> {
    const info = getCurrentPageInfo()
    const code = info.params['code'] ?? ''
    const state = info.params['state'] ?? ''

    if (code.length > 0 && state.length > 0) {
      try {
        const res = await wechatWorkAuth.getToken({ code, state })
        if (res.isSuccess && res.data != null) {
          if (this.handleLoginTokenDto(res.data!)) {
            await this.loadUserProfile()
            this.status = 'auth'
          }
          else {
            this.status = 'guest'
          }
        }
        else {
          this.status = 'guest'
        }
      }
      catch (e) {
        this.status = 'guest'
      }
      this.navigateFromOAuthCallback(info.params['path'])
      return
    }

    // #ifdef WEB
    try {
      let redirectPath = stripBasename(info.path)
      const queryString = buildQuery(info.params)
      if (queryString.length > 0)
        redirectPath = `${redirectPath}?${queryString}`
      const redirectUri = `${window.location.origin}/pages/oauthCallback/index?path=${encodeURIComponent(redirectPath)}`
      const res = await wechatWorkAuth.getOAuth2Url({ redirect_uri: redirectUri })
      if (res.isSuccess && res.data != null)
        window.location.href = String(res.data)
      else
        this.status = 'guest'
    }
    catch (e) {
      this.status = 'guest'
    }
    // #endif
    // #ifndef WEB
    this.status = 'guest'
    // #endif
  }

  /** 登录页前置检查：仅小程序需要拿到 key */
  async ensureKey(): Promise<boolean> {
    if (this.key != null)
      return true

    const platform = getAuthPlatform()
    if (platform === 'weapp') {
      try {
        const loginRes: any = await uni.login({ provider: 'weixin' })
        const res = await wechatAuth.getWxappToken({ code: String(loginRes.code ?? '') })
        if (res.isSuccess && res.data != null) {
          if (this.handleLoginTokenDto(res.data!)) {
            await this.loadUserProfile()
            this.status = 'auth'
          }
          return true
        }
      }
      catch (e) {
        // ignore
      }
      return false
    }

    // Web 端的 OAuth 由 init() 统一触发，这里不再整页跳转（会与首页守卫生成回环）
    return false
  }

  /** 登录 */
  async login(params: LoginParams): Promise<LoginResult> {
    try {
      this.loginLoading = true
      let isSuccess = false
      let message = ''

      if (params.type === 'phone') {
        const res = await wechatAuth.phoneLoginToken({
          code_phone: params.phoneCode ?? '',
          code: params.loginCode ?? '',
        })
        if (res.isSuccess && res.data != null) {
          if (!this.handleLoginTokenDto(res.data!))
            return { isSuccess: false, message: '绑定失败，请重试' } as LoginResult
        }
        isSuccess = res.isSuccess
        message = res.message ?? ''
      }
      else if (params.type === 'sms') {
        if (this.key == null)
          return { isSuccess: false, message: '身份标识已过期，请返回重试' } as LoginResult

        const platform = getAuthPlatform()
        if (platform === 'weapp') {
          const loginRes: any = await uni.login({ provider: 'weixin' })
          const bindRes = await wechatAuth.bindWxappUser({
            key: this.key!,
            sms_code: params.verifyCode ?? '',
            code: String(loginRes.code ?? ''),
          })
          if (bindRes.isSuccess && bindRes.data != null) {
            if (!this.handleLoginTokenDto(bindRes.data!))
              return { isSuccess: false, message: '绑定失败，请重试' } as LoginResult
          }
          isSuccess = bindRes.isSuccess
          message = bindRes.message ?? ''
        }
        else if (platform === 'h5-wecom') {
          const bindRes = await wechatWorkAuth.bind({ key: this.key!, code: params.verifyCode ?? '' })
          if (bindRes.isSuccess && bindRes.data != null) {
            if (!this.handleLoginTokenDto(bindRes.data!))
              return { isSuccess: false, message: '绑定失败，请重试' } as LoginResult
          }
          isSuccess = bindRes.isSuccess
          message = bindRes.message ?? ''
        }
        else {
          const bindRes = await wechatAuth.bindWxUser({ key: this.key!, code: params.verifyCode ?? '' })
          if (bindRes.isSuccess && bindRes.data != null) {
            if (!this.handleLoginTokenDto(bindRes.data!))
              return { isSuccess: false, message: '绑定失败，请重试' } as LoginResult
          }
          isSuccess = bindRes.isSuccess
          message = bindRes.message ?? ''
        }
      }
      else if (params.type === 'password') {
        const res = await authorize.token({
          username: encrypt(params.username ?? '') ?? '',
          password: encrypt(params.password ?? '') ?? '',
          verifyToken: params.verifyToken,
        })
        if (res.isSuccess && res.data != null)
          token.set(res.data!)
        isSuccess = res.isSuccess
        message = res.message ?? ''
      }
      else {
        return { isSuccess: false, message: '不支持的登录方式' } as LoginResult
      }

      if (isSuccess) {
        await this.loadUserProfile()
        this.status = 'auth'
        this.navigateAfterLogin()
        return { isSuccess: true } as LoginResult
      }

      return { isSuccess: false, message } as LoginResult
    }
    catch (error) {
      return { isSuccess: false, message: String(error) } as LoginResult
    }
    finally {
      this.loginLoading = false
    }
  }

  /** 退出登录 */
  async logout(): Promise<void> {
    const accessToken = token.get()
    if (accessToken?.refresh_token != null) {
      try {
        await authorize.unToken(accessToken.refresh_token)
      }
      catch (e) {
        // ignore
      }
    }
    this.userInfo = null
    this.permissions = []
    this.allPermissions = []
    token.remove()
    // 不清 key、不跳转：key 在有效期内可复用
    this.status = 'guest'
  }

  /** 降级（token 失效时由请求层触发） */
  downgrade(): void {
    token.remove()
    this.status = 'guest'
  }
}

export const authStore = reactive(new AuthStore()) as AuthStore

export function useAuthStore(): AuthStore {
  return authStore
}
