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
 * 3. 按 config.updateIntervalMs 定时触发新一轮坐标计算
 * 4. 每次切换前记录当前 BoundingBox，作为下次计算的约束
 * 5. 监听 fontSize / showSeconds / showDate 变化，立即重新定位
 * 6. 监听窗口 resize，自动适配新视口尺寸
 */
export function useBurnInProtect(
    clockRef: Ref<HTMLElement | null>,
    config: Ref<ClockConfig>,
) {
    const position = ref<Position>({ x: 0, y: 0 })
    const prevBox = ref<BoundingBox | null>(null)
    let timer: ReturnType<typeof setInterval> | null = null

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
     * 等待 n 个动画帧后执行
     * 字体大小、显示选项变化后 DOM 需要至少 2 帧才能完成重排
     */
    function afterFrames(n: number, fn: () => void) {
        if (n <= 0) { fn(); return }
        requestAnimationFrame(() => afterFrames(n - 1, fn))
    }

    function startTimer() {
        stopTimer()
        afterFrames(2, () => {
            prevBox.value = null
            updatePosition()
            timer = setInterval(updatePosition, config.value.updateIntervalMs)
        })
    }

    function stopTimer() {
        if (timer) {
            clearInterval(timer)
            timer = null
        }
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

    // 防烧屏频率变化：重置 + 重新调度
    watch(
        () => config.value.updateIntervalMs,
        startTimer,
    )

    // 字体大小或显示选项变化：等 DOM 更新后重新测量并立即重定位
    // 不重启 timer（频率不变），只即刻重算一次位置确保不超出视口
    watch(
        () => [
            config.value.fontSize,
            config.value.showSeconds,
            config.value.showDate,
        ],
        () => {
            afterFrames(2, () => {
                prevBox.value = null // 尺寸变了，旧约束无效
                updatePosition()
            })
        },
    )

    return { position }
}
