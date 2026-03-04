import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
    appId: 'com.xinghe.burnclock',
    appName: '防烧屏时钟',
    webDir: 'dist',
    ios: {
        scheme: 'BurnClock',
        // 调试用：深红色，确认 WebView 是否铺满（验证后改回 #000000）
        backgroundColor: '#880000',
        // 关闭内置滚动弹性，避免与时钟内容冲突
        scrollEnabled: false,
        // 内容延伸到状态栏下方（全屏效果）
        contentInset: 'always',
    },
    // 禁用本地开发服务器（生产构建用本地 dist）
    server: {
        // 若调试时需要热重载，取消注释以下行并填写你的 Mac IP
        // url: 'http://192.168.x.x:5173',
        // cleartext: true,
    },
}

export default config
