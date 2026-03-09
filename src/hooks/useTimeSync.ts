import { reactive, onMounted, onUnmounted } from 'vue'
import type { TimeInfo } from '../types'

/**
 * 高精度时间同步 Hook
 *
 * 核心原理：
 * - 不使用 setInterval(fn, 1000)，因为宏任务调度存在累计漂移
 * - 通过计算「距下一秒整数边缘的毫秒差」= 1000 - Date.now() % 1000
 *   用 setTimeout 精准对齐到每秒的 00ms 时刻
 * - 对齐后再用 setInterval(fn, 1000) 维持节拍，并在每次触发时校验误差
 *   若误差 > 50ms 则重新对齐，保证长时间运行不漂移
 */
export function useTimeSync() {
    const defaultTimeInfo = (): TimeInfo => ({
        hours: '00',
        minutes: '00',
        seconds: '00',
        monthDay: '',
        weekday: ''
    })
    const timeInfo = reactive<TimeInfo>(defaultTimeInfo())
    
    let alignTimeout: ReturnType<typeof setTimeout> | null = null
    let tickInterval: ReturnType<typeof setInterval> | null = null
    let lastDay = -1 // 记录上一次的日期日份，用于性能优化，不频繁触发 toLocaleDateString

    function tick() {
        const now = new Date()
        const s = now.getSeconds()
        const m = now.getMinutes()
        const h = now.getHours()
        const d = now.getDate()
        
        // 性能优化：仅更新变化的值，避免 Vue 产生对象重造引发的深绘制
        timeInfo.seconds = s < 10 ? '0' + s : '' + s
        timeInfo.minutes = m < 10 ? '0' + m : '' + m
        timeInfo.hours = h < 10 ? '0' + h : '' + h

        if (d !== lastDay) {
            lastDay = d
            timeInfo.monthDay = now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
            timeInfo.weekday = now.toLocaleDateString('zh-CN', { weekday: 'short' })
        }
    }

    function alignToSecondBoundary() {
        // 计算距下一个整秒的毫秒数
        const msToNextSecond = 1000 - (Date.now() % 1000)

        alignTimeout = setTimeout(() => {
            tick()
            // 对齐后启动每秒节拍
            tickInterval = setInterval(() => {
                tick()
                // 校验漂移：若实际执行时间偏离整秒超过 50ms，重新对齐
                const drift = Date.now() % 1000
                if (drift > 50 && drift < 950) {
                    stopTick()
                    alignToSecondBoundary()
                }
            }, 1000)
        }, msToNextSecond)
    }

    function stopTick() {
        if (alignTimeout) clearTimeout(alignTimeout)
        if (tickInterval) clearInterval(tickInterval)
        alignTimeout = null
        tickInterval = null
    }

    function onVisibilityChange() {
        if (document.visibilityState === 'visible') {
            tick()
            alignToSecondBoundary()
        } else {
            stopTick()
        }
    }

    onMounted(() => {
        tick()
        alignToSecondBoundary()
        document.addEventListener('visibilitychange', onVisibilityChange)
    })

    onUnmounted(() => {
        stopTick()
        document.removeEventListener('visibilitychange', onVisibilityChange)
    })

    return { timeInfo }
}
