import { ref, onMounted, onUnmounted } from 'vue'
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
    const timeInfo = ref<TimeInfo>(getTimeInfo())
    let alignTimeout: ReturnType<typeof setTimeout> | null = null
    let tickInterval: ReturnType<typeof setInterval> | null = null

    function getTimeInfo(): TimeInfo {
        const now = new Date()
        const pad = (n: number) => String(n).padStart(2, '0')
        return {
            hours: pad(now.getHours()),
            minutes: pad(now.getMinutes()),
            seconds: pad(now.getSeconds()),
            dateStr: now.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'short',
            }),
        }
    }

    function tick() {
        timeInfo.value = getTimeInfo()
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

    onMounted(() => {
        tick()
        alignToSecondBoundary()
    })

    onUnmounted(stopTick)

    return { timeInfo }
}
