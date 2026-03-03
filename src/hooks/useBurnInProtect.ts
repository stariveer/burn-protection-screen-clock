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
 * 5. 监听 config 变化，动态重启定时器
 *
 * @param clockRef  时钟容器的模板引用（HTMLElement）
 * @param config    响应式的时钟配置
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

        // ref 可能指向 Vue 组件实例（有 $el），也可能是原生 DOM 元素
        const el: HTMLElement | undefined =
            raw instanceof HTMLElement ? raw : (raw as unknown as { $el: HTMLElement }).$el
        if (!el || !(el instanceof HTMLElement)) return

        const rect = el.getBoundingClientRect()
        const vpW = window.innerWidth
        const vpH = window.innerHeight

        // 计算不与上次重叠的新坐标
        const newPos = calcNonOverlapPosition(
            prevBox.value,
            rect.width,
            rect.height,
            vpW,
            vpH,
        )

        // 记录本次 BoundingBox 供下次使用
        prevBox.value = {
            x: newPos.x,
            y: newPos.y,
            width: rect.width,
            height: rect.height,
        }

        position.value = newPos
    }

    function startTimer() {
        stopTimer()
        // 等待一个渲染帧，确保 DOM 尺寸已稳定
        requestAnimationFrame(() => {
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

    onMounted(startTimer)
    onUnmounted(stopTimer)

    // 配置变化时重置并重新调度（重置 prevBox 避免旧约束干扰）
    watch(
        () => config.value.updateIntervalMs,
        () => {
            prevBox.value = null
            startTimer()
        },
    )

    return { position }
}
