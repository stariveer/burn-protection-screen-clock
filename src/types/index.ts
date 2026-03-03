/** 时钟显示配置 */
export interface ClockConfig {
    /** 字体颜色，支持任意 CSS 颜色值 */
    color: string
    /** 字体大小，单位 vmin */
    fontSize: number
    /** 防烧屏位置更新频率，单位毫秒 */
    updateIntervalMs: number
    /** 是否显示秒数 */
    showSeconds: boolean
    /** 是否显示日期 */
    showDate: boolean
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
    dateStr: string
}

/** 防烧屏状态 */
export interface BurnInState {
    position: Position
    prevBox: BoundingBox | null
}
