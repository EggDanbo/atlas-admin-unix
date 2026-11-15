import type { PreviewableItem } from '@/components/file/shared/index.ts'
import { buildFileUrl, buildPreviewUrl, FileKind, getFileKind } from '@/components/file/shared/index.ts'
import { showToast } from '@/components/sp-toast/toast.ts'
import { isH5Wechat, isH5Wecom } from '@/utils/platform.ts'
import { buildQuery, routes } from '@/utils/router.ts'

const IS_H5 = isWeb()

/**
 * 文件预览 composable：按类型与运行端分发。
 * - 图片：两端均用 uni.previewImage 原生放大
 * - 文档：H5 跳独立预览服务（配置 TARO_APP_FILE_PREVIEW_BASE）或内置预览页（仅开发模式）；
 *   小程序 downloadFile + openDocument
 */
export function useFilePreview() {
  async function previewFile(item: PreviewableItem): Promise<void> {
    const fileUrl = buildFileUrl(item)
    const kind = getFileKind(item)

    if (kind === FileKind.Image) {
      uni.previewImage({ current: fileUrl, urls: [fileUrl] })
      return
    }

    if (IS_H5) {
      // 独立预览服务：新窗口打开；未配置则走内置预览页（生产必须配置，见 .env）
      const previewUrl = buildPreviewUrl(item)
      if (previewUrl.length > 0) {
        // #ifdef WEB
        // 微信/企微 webview 会拦截 window.open（静默失败），需用当前页导航
        if (isH5Wechat() || isH5Wecom())
          window.location.href = previewUrl
        else
          window.open(previewUrl)
        // #endif
        return
      }
      uni.navigateTo({
        url: `${routes.minePreview}?${buildQuery({ url: fileUrl, name: item.name })}`,
      })
      return
    }

    await previewByOpenDocument(fileUrl)
  }

  return { previewFile }
}

/** 小程序：下载后用系统能力打开；不支持格式（如 md）则 toast 提示 */
async function previewByOpenDocument(fileUrl: string): Promise<void> {
  uni.showLoading({ title: '加载中', mask: true })
  try {
    const res = await uni.downloadFile({ url: fileUrl })
    if (res.statusCode !== 200) {
      showToast('文件下载失败')
      return
    }
    await uni.openDocument({
      filePath: res.tempFilePath,
      showMenu: true,
      fail: () => showToast('小程序暂不支持该格式预览'),
    })
  }
  catch {
    showToast('文件下载失败')
  }
  finally {
    uni.hideLoading()
  }
}
