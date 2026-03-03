import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { Ref } from 'vue'
import type { Position, BoundingBox, ClockConfig } from '../types'
import { calcNonOverlapPosition } from '../utils/math'

/**
 * 防烧屏位置调度 Hook
 *
 * 工作流程：
 * 1. 挂载后立即读取时钟 DOM 元素的实际宽高（BoundingBox）
 * 2. 调用 calcNonOverlapPosition 计算第一个合法坐标
 * 3. 计算距下一个「间隔边界」整点的毫秒数，setTimeout 对齐后启动 setInterval
 *    例如 updateIntervalMs=60000 时，触发时刻始终是整分钟的 :00 秒
 * 4. 监听 fontSize / showSeconds / showDate 变化，立即重新定位
 * 5. 监听窗口 resize，自动适配新视口尺寸
 */
export function useBurnInProtect(
    clockRef: Ref<HTMLElement | null>,
    config: Ref<ClockConfig>,
) {
    const position = ref<Position>({ x: 0, y: 0 })
    const prevBox = ref<BoundingBox | null>(null)
    let timer: ReturnType<typeof setInterval> | null = null
    let alignTimeout: ReturnType<typeof setTimeout> | null = null

    function updatePosition() {
        const raw = clockRef.value
        if (!raw) return

        const el: HTMLElement | undefined =
            raw instanceof HTMLElement ? raw : (raw as unknown as { $el: HTMLElement }).$el
        if (!el || !(el instanceof HTMLElement)) return

        const rect = el.getBoundingClientRect()
        const vpW = window.innerWidth
        const vpH = window.innerHeight

        const newPos = calcNonOverlapPosition(
            prevBox.value,
            rect.width,
            rect.height,
            vpW,
            vpH,
        )

        prevBox.value = {
            x: newPos.x,
            y: newPos.y,
            width: rect.width,
            height: rect.height,
        }

        position.value = newPos
    }

    /**
     * 等待 n 个动画帧后执行，确保 DOM 重排完成后再测量
     */
    function afterFrames(n: number, fn: () => void) {
        if (n <= 0) { fn(); return }
        requestAnimationFrame(() => afterFrames(n - 1, fn))
    }

    function stopTimer() {
        if (timer) { clearInterval(timer); timer = null }
        if (alignTimeout) { clearTimeout(alignTimeout); alignTimeout = null }
    }

    function startTimer() {
        stopTimer()
        afterFrames(2, () => {
            prevBox.value = null
            updatePosition()

            // 对齐到「间隔边界」整点
            // 例如 interval=60000 时，下次触发恰好在下一个整分钟 :00 秒
            const interval = config.value.updateIntervalMs
            const msToNextBoundary = interval - (Date.now() % interval)

            alignTimeout = setTimeout(() => {
                alignTimeout = null
                updatePosition()
                timer = setInterval(updatePosition, interval)
            }, msToNextBoundary)
        })
    }

    // 视口大小变化时立即重新定位
    function onResize() {
        afterFrames(1, updatePosition)
    }

    onMounted(() => {
        startTimer()
        window.addEventListener('resize', onResize)
    })

    onUnmounted(() => {
        stopTimer()
        window.removeEventListener('resize', onResize)
    })

    // 防烧屏频率变化：重新对齐边界 + 重新调度
    watch(
        () => config.value.updateIntervalMs,
        startTimer,
    )

    // 字体大小或显示选项变化：等 DOM 更新后重新测量并立即重定位
    watch(
        () => [
            config.value.fontSize,
            config.value.showSeconds,
            config.value.showDate,
        ],
        () => {
            afterFrames(2, () => {
                prevBox.value = null
                updatePosition()
            })
        },
    )

    return { position }
}
