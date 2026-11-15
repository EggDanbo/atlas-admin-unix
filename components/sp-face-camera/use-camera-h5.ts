import type { Ref } from 'vue'
import type { CameraAdapter } from './use-camera-weapp.ts'
import { ref } from 'vue'

export function useCameraH5(containerRef: Ref<any>): CameraAdapter {
  const isReady = ref(false)
  let videoEl: HTMLVideoElement | null = null
  let stream: MediaStream | null = null

  function resolveContainer(): HTMLElement | null {
    const raw = containerRef.value
    if (!raw)
      return null
    if (raw.$el && raw.$el instanceof HTMLElement)
      return raw.$el
    if (raw instanceof HTMLElement)
      return raw
    return null
  }

  async function start() {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 720 },
        height: { ideal: 720 },
      },
    })

    videoEl = document.createElement('video')
    videoEl.srcObject = stream
    videoEl.autoplay = true
    videoEl.playsInline = true
    videoEl.setAttribute('playsinline', '')
    videoEl.muted = true
    videoEl.style.cssText = 'width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;transform:scaleX(-1);'

    const container = resolveContainer()
    if (!container)
      throw new Error('相机容器未就绪')
    container.insertBefore(videoEl, container.firstChild)

    await videoEl.play()
    isReady.value = true
  }

  async function capture(): Promise<string> {
    if (!videoEl)
      throw new Error('相机未就绪')

    const canvas = document.createElement('canvas')
    const { videoWidth, videoHeight } = videoEl
    const size = Math.min(videoWidth, videoHeight)
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    const sx = (videoWidth - size) / 2
    const sy = (videoHeight - size) / 2
    ctx.drawImage(videoEl, sx, sy, size, size, 0, 0, size, size)

    // base64 → Blob → blob URL（兼容 uni.uploadFile）
    const dataURL = canvas.toDataURL('image/jpeg', 0.85)
    const byteString = atob(dataURL.split(',')[1])
    const ab = new ArrayBuffer(byteString.length)
    const ia = new Uint8Array(ab)
    for (let i = 0; i < byteString.length; i++)
      ia[i] = byteString.charCodeAt(i)
    const blob = new Blob([ab], { type: 'image/jpeg' })
    return URL.createObjectURL(blob)
  }

  function stop() {
    stream?.getTracks().forEach(t => t.stop())
    stream = null
    videoEl?.remove()
    videoEl = null
    isReady.value = false
  }

  return { start, capture, stop, isReady }
}

export function hasGetUserMedia(): boolean {
  return !!(navigator as any).mediaDevices?.getUserMedia
}
