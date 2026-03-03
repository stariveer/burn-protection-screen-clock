import type { BoundingBox, Position } from '../types'

/**
 * 检测两个 BoundingBox 是否有像素级重叠
 * 使用分离轴定理（SAT）：只要在任意一个轴上分离，则无重叠
 */
export function isOverlapping(a: BoundingBox, b: BoundingBox): boolean {
    const separatedX = a.x + a.width <= b.x || b.x + b.width <= a.x
    const separatedY = a.y + a.height <= b.y || b.y + b.height <= a.y
    return !(separatedX || separatedY)
}

/**
 * 在视口范围内随机生成一个不与 prevBox 重叠的新坐标
 *
 * 算法逻辑：
 * 1. 计算合法的 x/y 坐标范围 [0, viewport - size]
 * 2. 在范围内随机生成候选坐标
 * 3. 用 isOverlapping 检查是否与上次区域重叠
 * 4. 若重叠则重试，最多 MAX_RETRY 次
 * 5. 超出重试次数后，将时钟分配到对角线安全区（上次在左上→新位置去右下，反之亦然）
 *
 * @param prevBox  上一次渲染的 BoundingBox（首次可传 null）
 * @param elemW    时钟元素实际宽度（px）
 * @param elemH    时钟元素实际高度（px）
 * @param vpW      视口宽度（px）
 * @param vpH      视口高度（px）
 * @returns        满足无重叠约束的新坐标
 */
export function calcNonOverlapPosition(
    prevBox: BoundingBox | null,
    elemW: number,
    elemH: number,
    vpW: number,
    vpH: number,
): Position {
    const MAX_RETRY = 50
    const maxX = Math.max(0, vpW - elemW)
    const maxY = Math.max(0, vpH - elemH)

    // 首次没有上次位置，直接随机放置
    if (!prevBox) {
        return {
            x: Math.floor(Math.random() * maxX),
            y: Math.floor(Math.random() * maxY),
        }
    }

    // 尝试随机生成不重叠的坐标
    for (let i = 0; i < MAX_RETRY; i++) {
        const x = Math.floor(Math.random() * maxX)
        const y = Math.floor(Math.random() * maxY)
        const candidate: BoundingBox = { x, y, width: elemW, height: elemH }

        if (!isOverlapping(candidate, prevBox)) {
            return { x, y }
        }
    }

    // 超出重试次数：强制跳到对角线安全区
    // 判断上次位置在视口的哪侧，新位置去对侧
    const prevCenterX = prevBox.x + prevBox.width / 2
    const prevCenterY = prevBox.y + prevBox.height / 2

    const goRight = prevCenterX < vpW / 2
    const goDown = prevCenterY < vpH / 2

    return {
        x: goRight ? Math.min(maxX, Math.floor(vpW * 0.6)) : Math.max(0, Math.floor(vpW * 0.1)),
        y: goDown ? Math.min(maxY, Math.floor(vpH * 0.6)) : Math.max(0, Math.floor(vpH * 0.1)),
    }
}
