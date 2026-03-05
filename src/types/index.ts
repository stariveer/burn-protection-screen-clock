/** 时钟显示配置 */
export interface ClockConfig {
    /** 字体颜色，支持任意 CSS 颜色值，或 'random' 表示每次跳位随机使用内置颜色池 */
    color: string | 'random'
    /** 字体大小，单位 vmin */
    fontSize: number
    /** 防烧屏位置更新频率，单位毫秒 */
    updateIntervalMs: number
    /** 是否显示秒数 */
    showSeconds: boolean
    /** 是否显示日期 */
    showDate: boolean
    /** 自定义安全区 [startX, startY, endX, endY]，原点为左上角 */
    customSafeZone: [number, number, number, number]
}

/** 二维坐标位置 */
export interface Position {
    x: number
    y: number
}

/** 带尺寸的边界盒（用于碰撞检测） */
export interface BoundingBox extends Position {
    width: number
    height: number
}

/** 时间信息 */
export interface TimeInfo {
    hours: string
    minutes: string
    seconds: string
    /** 如：3月3日 */
    monthDay: string
    /** 如：周二 */
    weekday: string
}

