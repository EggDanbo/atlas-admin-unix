/**
 * 业务类型定义
 *
 * 迁移自 Taro 版的 src/types/*.d.ts（全局 declare namespace）。
 * UTS 不支持 declare namespace，这里把 Service.AccessToken 这类引用
 * 扁平化成 ServiceAccessToken，语义保持不变。
 */

/* ==================== Service ==================== */
export type ServiceRequestErrorType = 'Response Error' | 'Business Error' | null
export type ServiceRequestCode = string | number

/** 基础响应接口 */
export interface ServiceBaseResponse {
  response?: any
  errorType: ServiceRequestErrorType
  code: ServiceRequestCode
  message: string
  data?: any
}

/** 响应结果 */
export interface ServiceResponse extends ServiceBaseResponse {
  isSuccess: boolean
}

/** 数据响应结果 */
export interface ServiceResult<T = any> extends ServiceResponse {
  data: T
}

/** 分页参数 */
export interface ServicePagination {
  page?: null | number
  pagesize?: null | number
}

/** 高级查询筛选条件 */
export interface ServiceSearchFilter {
  column?: null | string
  value?: null | string
  express?: null | string
}

/** 排序字段 */
export interface ServiceSearchOrder {
  column?: null | string
  value?: number
}

/** 高级查询筛选条件 */
export interface ServiceSearchCondition extends ServicePagination {
  [key: string]: any
  totalenabled?: boolean
  ids?: null | string[]
  format?: null | string
  searchfilter?: null | ServiceSearchFilter[]
  searchorder?: null | ServiceSearchOrder[]
}

/** 分页信息 */
export interface ServicePaged {
  isempty?: boolean
  totalcount?: number
  page?: number
  pageindex: number
  pagesize: number
  totalpages?: number
  haspreviouspage?: boolean
  hasnextpage?: boolean
}

/** 分页列表模型类 */
export interface ServicePagedList<T = any> extends ServicePaged {
  list: T[]
}

/** 分页数据响应结果 */
export interface ServiceResultPage<T = any> extends ServiceResult<ServicePagedList<T>> {}

/* ==================== Auth ==================== */
/** 角色权限模型 */
export interface AuthPermission {
  /** 权限名称 */
  id: string
  /** 权限描述 */
  title: string
  /** 子权限 */
  children: AuthPermission[]
}

/** 验证码 */
export interface AuthCaptchaForm {
  /** 验证码标识 */
  key?: string | null | undefined
  /** 验证码 */
  verifycode?: string | null | undefined
}

/** 基于账号密码方式获取API授权令牌 */
export interface AuthPasswordTokenCommand {
  /** 用户名 */
  username: string
  /** 用户密码 */
  password: string
  /** 验证码 */
  captcha?: AuthCaptchaForm | null | undefined
  /** 滑块验证凭证 */
  verifyToken?: string | null | undefined
}

/** 获取当前登录用户信息 */
export interface AuthUserCurrent {
  /** 用户ID */
  userid: string
  /** 授权认证角色 */
  authrole?: string[] | null | undefined
  /** 登录账号 */
  code?: string | null | undefined
  /** 人员名称 */
  name?: string | null | undefined
  /** 昵称 */
  nickname?: string | null | undefined
  /** 头像 */
  avatarurl?: string | null | undefined
  /** 人脸 */
  faceurl?: string | null | undefined
  /** 签名 */
  signurl?: string | null | undefined
  /** 手机号码 */
  mobile_number?: string | null | undefined
  /** 工作证号 */
  wkno?: string | null | undefined
  /** 水印开启 */
  watermark: boolean
  /** 人员类型 */
  types?: number | null | undefined
  /** 用户类型;0:内部,1:外部 */
  kind?: number | null | undefined
  /** 能否修改密码 */
  can_modify_pass: boolean
  /** 单位ID */
  team_id?: string | null | undefined
  /** 单位名称 */
  team_name?: string | null | undefined
  /** 是否工作中 */
  working?: boolean
  /** 人员照片ID */
  user_pic?: string | null | undefined
  /** 人员照片地址 */
  user_url?: string | null | undefined
}

/** 我的信息 */
export interface AuthUserProfile {
  /** 登录账号 */
  code?: string | null | undefined
  /** 人员名称 */
  name?: string | null | undefined
  /** 单位ID */
  team_id?: string | null | undefined
  /** 身份证号 */
  id_no?: string | null | undefined
  /** 单位名称 */
  team_name?: string | null | undefined
  /** 手机号码 */
  mobile_number?: string | null | undefined
  /** 人员照片Url */
  user_url?: string | null | undefined
  /** 人员照片ID */
  user_pic?: string | null | undefined
  /** 人脸照片Url */
  face_url?: string | null | undefined
  /** 人脸照片ID */
  face_pic: string | null | undefined
  /** 人脸采集时间 */
  face_utime?: string | null | undefined
  /** 签名图片Url */
  sign_url?: string | null | undefined
  /** 签名图片ID */
  sign_pic: string
  /** 是否工作中 */
  working?: boolean | null | undefined
  /** 工作证号 */
  wkno?: string | null | undefined
  /** 用户种类;0:内部人员,1:外部人员 */
  kind?: number | null | undefined
  /** 用户类型 */
  user_type?: number | null | undefined
}

/** 访问令牌 */
export interface AuthAccessToken {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  expires_time?: number
  update_time?: number
}

/** 修改密码 */
export interface AuthChangePassWordCommand {
  /** 旧密码 */
  oldpassword: string
  /** 新密码 */
  newpassword: string
}

/** 我的信息修改 */
export interface AuthUpdateProfileCommand {
  /** 登录账号 */
  code?: string | null | undefined
  /** 姓名 */
  name: string
  /** 单位ID */
  team_id: string | null | undefined
  /** 身份证号 */
  id_no?: string | null | undefined
  /** 单位名称 */
  team_name?: string | null | undefined
  /** 手机号码 */
  mobile_number: string
  /** 人员照片ID */
  user_pic?: string | null | undefined
  /** 人员照片地址（上传后回写，便于列表页直接展示） */
  user_url?: string | null | undefined
  /** 人脸照片ID */
  face_pic?: string | null | undefined
  /** 签名图片ID */
  sign_pic?: string | null | undefined
  /** 是否工作中 */
  working: boolean
  /** 工作证号 */
  wkno?: string | null | undefined
}

/** 发送登录验证码,有效期为1分钟 */
export interface AuthSendVerifyCodeCommand {
  /** 手机号码 */
  mobile_number?: string | null | undefined
  /** 验证码 */
  captcha?: AuthCaptchaForm | null | undefined
  /** 滑块验证凭证 */
  verifyToken?: string | null | undefined
}

/** 基于短信验证码方式获取API授权令牌 */
export interface AuthVerifyCodeTokenCommand {
  /** 手机号码 */
  mobile_number?: string | null | undefined
  /** 短信验证码 */
  password?: string | null | undefined
}

/* ==================== FileStorage ==================== */
/** 上传临时图片，基于base64字符传输 */
export interface FileStorageUploadImageTempRequest {
  /** base64图像数据 */
  data?: string | null | undefined
  /** 名称 */
  name?: string | null | undefined
  /** 是否开启水印 */
  watermark?: boolean | null | undefined
  /** 水印位置，按照小键盘方式定位1 ~ 9，默认3 */
  watermark_pos?: number | null | undefined
  /** 水印文字，空时默认为时间 */
  watermark_text?: string | null | undefined
  /** 是否开启质量处理，大于0则除了gif外转为jpeg图片 */
  quality?: number | null | undefined
}

/** 上传图片，基于base64字符传输 */
export interface FileStorageUploadImageRequest extends FileStorageUploadImageTempRequest {
  /** 关联的业务Id */
  xid?: string | null | undefined
  /** 分类 */
  mark?: string | null | undefined
}

/** 大文件分片上传完毕后续处理 */
export interface FileStorageUploadFragmentRequest extends FileStorageUploadImageRequest {
  /** 已上传的文件唯一标识 */
  identifier: string
  /** 是否临时文件 */
  temp: boolean
}

/** 文件资源模型 */
export interface FileStorageFileResourceModel {
  /** 文件ID */
  id: string
  /** url */
  url: string
  /** 名称 */
  name: string
  /** 是否为图片 */
  image: boolean
  /** 文件MIME类型 */
  content_type: string
  /** 文件大小 */
  size: string
}

/** 资源删除 */
export interface FileStorageFileDeleteRequest {
  /** 列表 */
  list?: string[] | null | undefined
  /** 关联ID */
  xid?: string | null | undefined
  /** (可选)分类 */
  mark?: string | null | undefined
}

/** 文件资源查询 */
export interface FileStorageFileResourceCondition {
  /** 页码从 1 开始，如果设置值小于 1，则实际返回 1 */
  page?: null | number
  /** 获取或设置分页数据行数 */
  pagesize?: null | number
  /** 搜索文件名 */
  name?: string | null | undefined
  /** (可选)业务关联,默认查询自己上传的数据 */
  xid?: string | null | undefined
  /** 分类 */
  mark?: string | null | undefined
  /** 是否查看隐藏 */
  hide: number
}

/** 文件资源视图 */
export interface FileStorageFileResourceResult {
  /** 文件ID */
  id?: string | null | undefined
  /** 关联ID */
  xid?: string | null | undefined
  /** 分类 */
  mark: string
  /** url */
  url: string
  /** 名称 */
  name: string
  /** 文件mime */
  mime: string
  /** 宽*高(不为空表示图片) */
  scale: string
  /** 扩展名 */
  extension: string
  /** 文件大小 */
  size: string
  /** 文件hash */
  hash: string
  /** 创建时间 */
  ctime: string
}

/* ==================== GuestAuth ==================== */
export interface GuestAuthRegisterReq {
  key: string
  mobile: string
  user_mobile: string
  user_card: string
  user_name: string
}

/** 当前访客信息（/guest/profile/get） */
export interface GuestAuthGuestInfo {
  userid: number
  name?: string
  faceurl?: string
  mobile_number?: string
  watermark: boolean
}

/** 访客详细信息（/guest/profile/info） */
export interface GuestAuthGuestProfile {
  userid: number
  name?: string
  mobile?: string
  card?: string
  face_url?: string
  face_pic?: string | null
  watermark: boolean
}

/** 更新访客信息请求 */
export interface GuestAuthUpdateProfileReq {
  name: string
  mobile: string
  card: string
  face_id?: string
}

/** 人脸照片上传请求 */
export interface GuestAuthUpdateFaceReq {
  image_pic: string
}

/* ==================== WechatAuth ==================== */
/** 微信认证响应（union type） */
export type WechatAuthLoginTokenDto
  = | ({ bound: true } & Auth.AccessToken)
    | { bound: false, key: string }

/** 获取微信 OAuth 授权 URL 请求参数 */
export interface WechatAuthGetAuthorizeUrlReq {
  /** 回调地址 */
  redirect_uri: string
}

/** Code 换身份 — 公众号请求参数 */
export interface WechatAuthWxTokenReq {
  /** 微信 OAuth 授权码 */
  code: string
  /** OAuth URL 中的 state 参数（CSRF 验证，5 分钟有效） */
  state: string
}

/** Code 换身份 — 小程序请求参数 */
export interface WechatAuthWxappTokenReq {
  /** wx.login() 获取的授权码 */
  code: string
}

/** 短信验证码登录 + 绑定（H5）请求参数 */
export interface WechatAuthWxBindReq {
  /** token 接口返回的加密 key（包含 openid） */
  key: string
  /** 短信验证码 */
  code: string
}

/** 短信验证码登录 + 绑定（小程序）请求参数 */
export interface WechatAuthWxappBindReq {
  /** apptoken 接口返回的加密 key */
  key: string
  /** 短信验证码 */
  sms_code: string
  /** wx.login() 获取的授权码 */
  code: string
}

/** 微信手机号一键登录请求参数（仅小程序） */
export interface WechatAuthWxappPhoneReq {
  /** getPhoneNumber 返回的 code（新版基础库 2.21.2+） */
  code_phone: string
  /** wx.login() 获取的 code */
  code: string
}

/** 发送短信验证码请求参数 */
export interface WechatAuthSendVerifyCodeReq {
  /** token/apptoken 接口返回的加密 key */
  key: string
  /** 手机号码 */
  mobile: string
}

/** JSSDK 签名请求参数（仅 H5） */
export interface WechatAuthJSSDKSignatureReq {
  /** 当前页面 URL（注意 urlencode） */
  url: string
}

/* ==================== WechatWorkAuth ==================== */
/** 获取 ConnectOAuth2 授权 URL 请求参数 */
export interface WechatWorkAuthGetOAuth2UrlReq {
  /** 回调地址 */
  redirect_uri: string
}

/** Code 换身份请求参数 */
export interface WechatWorkAuthTokenReq {
  /** 企业微信 OAuth 授权码 */
  code: string
  /** OAuth URL 中的 state 参数 */
  state: string
}

/** 短信验证码绑定请求参数 */
export interface WechatWorkAuthBindReq {
  /** token 接口返回的加密 key */
  key: string
  /** 短信验证码 */
  code: string
}

/** 发送短信验证码请求参数 */
export interface WechatWorkAuthSendVerifyCodeReq {
  /** token 接口返回的加密 key */
  key: string
  /** 手机号码 */
  mobile: string
}

/** JSSDK 签名请求参数 */
export interface WechatWorkAuthJSSDKSignatureReq {
  /** 当前页面 URL（注意 urlencode） */
  url: string
}

/** 企业微信应用信息 */
export interface WechatWorkAuthAppInfo {
  /** 应用 ID */
  appid: string
  /** AgentID */
  agentid: string
}

/* ==================== 便捷别名 ==================== */
export type ServiceResultPage<T = any> = ServiceResult<ServicePagedList<T>>
