import uni from '@dcloudio/vite-plugin-uni'
import { defineConfig } from 'vite'

/**
 * HBuilderX 工程本身不需要这个文件（IDE 内置构建链会注入等价配置）。
 * 这里保留一份，用于命令行编译验证：
 *   UNI_INPUT_DIR=$PWD UNI_PLATFORM=h5 node <HBuilderX>/plugins/uniapp-cli-vite/node_modules/@dcloudio/vite-plugin-uni/bin/uni.js build -p h5
 *
 * 命令行模式下 uni 插件不会自动把 `vue` 指向 DCloud 打补丁的运行时（IDE 里由构建链注入），
 * 这里显式指定 H5 侧运行时，避免 `injectHook` 找不到。
 */
export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: [
      { find: /^vue$/, replacement: '@dcloudio/uni-h5-vue' },
    ],
  },
})
