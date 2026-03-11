<script setup lang="ts">
  import { ref, watch, computed } from "vue";
  import type { ClockConfig, Position, TimeInfo } from "../types";

  interface Props {
    timeInfo: TimeInfo;
    position: Position;
    config: ClockConfig;
  }

  const props = defineProps<Props>();

  /* ─── 色系定义 ─── */
  const colorThemes: Record<
    string,
    { dark: [string, string]; light: [string, string] }
  > = {
    blue: { dark: ["#005ae6", "#003b99"], light: ["#6fb5ff", "#209aff"] },
    purple: { dark: ["#8e2de2", "#4a00e0"], light: ["#d387ff", "#9d4edd"] },
    green: { dark: ["#00b09b", "#008060"], light: ["#5cffdb", "#00d4a1"] },
    orange: { dark: ["#ff512f", "#dd2476"], light: ["#fca584", "#fc75a0"] },
    red: { dark: ["#cb2d3e", "#9e0e20"], light: ["#ff758c", "#ff3e5b"] },
    pink: { dark: ["#ec4899", "#be185d"], light: ["#fbcfe8", "#f472b6"] },
    cyan: { dark: ["#0891b2", "#155e75"], light: ["#a5f3fc", "#22d3ee"] },
  };
  const colorPool = Object.keys(colorThemes);
  const currentColor = ref("blue");

  watch(
    () => [props.config.color, props.position] as const,
    ([newColor]) => {
      if (newColor === "random") {
        currentColor.value =
          colorPool[Math.floor(Math.random() * colorPool.length)];
      } else {
        currentColor.value = colorPool.includes(newColor) ? newColor : "blue";
      }
    },
    { immediate: true },
  );

  const darkGradient = computed(() => {
    const [s, e] = colorThemes[currentColor.value]?.dark ?? [
      "#005ae6",
      "#003b99",
    ];
    return `linear-gradient(180deg, ${s} 0%, ${e} 100%)`;
  });
  const lightGradient = computed(() => {
    const [s, e] = colorThemes[currentColor.value]?.light ?? [
      "#6fb5ff",
      "#209aff",
    ];
    return `linear-gradient(135deg, ${s} 0%, ${e} 100%)`;
  });

  /* ─── 每个数字独立随机倾斜 ─── */
  // 6 个槽：[h0, h1, m0, m1, s0, s1]
  function randAngle() {
    return Math.random() * 20 - 10; // -10 ~ +10 deg，随机左右倾
  }

  const angles = ref<number[]>([0, 0, 0, 0, 0, 0].map(randAngle));

  // 每次防烧屏换位时重新随机（position 变化）
  watch(
    () => props.position,
    () => {
      angles.value = angles.value.map(randAngle);
    },
  );

  // 性能优化：拆分为时分样式和秒样式两个 computed
  // - hmStyles 只在颜色/角度变化时重算（不受每秒 timeInfo 触发）
  // - sStyles 仅在 showSeconds=true 时才参与计算，关闭秒数时节省计算量
  const hmStyles = computed(() => {
    const dark = darkGradient.value;
    const light = lightGradient.value;
    const ang = angles.value;
    return [
      { backgroundImage: dark, transform: `rotate(${ang[0]}deg)` }, // hh[0]
      { backgroundImage: light, transform: `rotate(${ang[1]}deg)` }, // hh[1]
      { backgroundImage: dark, transform: `rotate(${ang[2]}deg)` }, // mm[0]
      { backgroundImage: light, transform: `rotate(${ang[3]}deg)` }, // mm[1]
    ];
  });

  const sStyles = computed(() => {
    if (!props.config.showSeconds) return null;
    const dark = darkGradient.value;
    const light = lightGradient.value;
    const ang = angles.value;
    return [
      { backgroundImage: dark, transform: `rotate(${ang[4]}deg)` }, // ss[0]
      { backgroundImage: light, transform: `rotate(${ang[5]}deg)` }, // ss[1]
    ];
  });

  /* ─── 位移动画期间动态启用 will-change，动画结束后移除以节省 GPU 合成层内存 ─── */
  const isMoving = ref(false);
  let moveEndTimer: ReturnType<typeof setTimeout> | null = null;

  watch(
    () => props.position,
    () => {
      isMoving.value = true;
      if (moveEndTimer) clearTimeout(moveEndTimer);
      // 1.2s 是 transition 时长，结束后释放合成层
      moveEndTimer = setTimeout(() => {
        isMoving.value = false;
        moveEndTimer = null;
      }, 1300);
    },
  );
</script>

<template>
  <div
    class="clock-wrapper"
    :style="{
      transform: `translate(${props.position.x}px, ${props.position.y}px)`,
      fontSize: `${props.config.fontSize}vmin`,
      willChange: isMoving ? 'transform' : 'auto',
    }"
  >
    <!-- 主行：左侧 HH:MM + 右侧辅助列 -->
    <div class="main-row">
      <!-- 左侧：仅时和分 -->
      <div class="clock-time">
        <span class="digit" :style="hmStyles[0]">{{ props.timeInfo.hours[0] }}</span>
        <span class="digit ol" :style="hmStyles[1]">{{ props.timeInfo.hours[1] }}</span>

        <span class="colon">:</span>

        <span class="digit" :style="hmStyles[2]">{{ props.timeInfo.minutes[0] }}</span>
        <span class="digit ol" :style="hmStyles[3]">{{ props.timeInfo.minutes[1] }}</span>
      </div>

      <!-- 右侧辅助列：顶部日期，底部秒数 -->
      <div class="right-col">
        <!-- 右上：秒数 -->
        <div v-if="props.config.showSeconds && sStyles" class="seconds-block">
          <span class="colon colon-sm">:</span>
          <span class="digit digit-sm" :style="sStyles[0]">{{ props.timeInfo.seconds[0] }}</span>
          <span class="digit digit-sm ol" :style="sStyles[1]">{{ props.timeInfo.seconds[1] }}</span>
        </div>

        <!-- 右下：月日 + 星期 -->
        <div v-if="props.config.showDate" class="date-block">
          <span class="date-monthday">{{ props.timeInfo.monthDay }}</span>
          <span class="date-weekday">{{ props.timeInfo.weekday }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .clock-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    display: inline-flex;
    flex-direction: row; /* 改为横向：左日期 + 右时钟 */
    align-items: flex-start; /* 顶对齐 */
    gap: 0; /* 日期和时钟的间距由 date-block margin 控制 */
    transition: transform 1.2s cubic-bezier(0.4, 0, 0.2, 1);
    user-select: none;
    -webkit-user-select: none;
    /* will-change 由 JS 动态控制（isMoving），仅在位移动画期间启用，平时为 auto 节省 GPU 合成层 */
    white-space: nowrap;
    overflow: visible;
  }

  .main-row {
    display: flex;
    flex-direction: row;
    align-items: flex-start; /* 顶对齐 */
    gap: 0;
    overflow: visible;
    margin: 0 0 0 -0.08em;
  }

  /* 右侧辅助列：撑满时钟高度，日期居顶，秒数居底 */
  .right-col {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    align-self: stretch; /* 拉伸与 clock-time 同高 */
    padding-left: 0.1em;
  }

  /* 日期块：右对齐，纵向排 */
  .date-block {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.03em;
    line-height: 1;
    margin: 0.01em 0 0;
    padding-right: 0.03em;
  }

  .date-monthday {
    font-size: 0.18em;
    font-family: "Gotham Rounded", sans-serif;
    color: rgba(200, 215, 230, 0.75);
    letter-spacing: 0.02em;
    white-space: nowrap;
  }

  .date-weekday {
    font-size: 0.16em;
    font-family: "Gotham Rounded", sans-serif;
    color: rgba(180, 200, 220, 0.55);
    letter-spacing: 0.04em;
  }

  /* 秒数块：右对齐底部 */
  .seconds-block {
    display: flex;
    flex-direction: row;
    align-items: center;
    font-family: "Gotham Rounded", sans-serif;
    line-height: 0.85;
    padding: 0.03em 0.1em 0 0;
  }

  .clock-time {
    display: flex;
    align-items: center;
    font-family: "Gotham Rounded", sans-serif;
    overflow: visible;
    line-height: 0.85;
    /* 不加 padding，让 getBoundingClientRect 尺寸尽量贴合视觉内容 */
  }

  .digit {
    display: inline-block;
    /* 固定宽度：防止不同数字字符宽度不同导致容器抖动 */
    width: 0.68em;
    text-align: center;
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    font-variant-numeric: tabular-nums;
    transform-origin: center bottom;
    position: relative;
    transition: transform 0.8s ease-in-out; /* 减少 GPU 持续动画时间 */
  }

  /* 第二个数字叠压在第一个上 */
  .digit.ol {
    margin: 0 -0.2em;
    z-index: 2;
    opacity: 0.88;
  }

  .digit-sm {
    font-size: 0.42em;
    /* 保持固定宽，与父级 .digit 的 0.62em 对应 */
    width: 0.68em;
    text-align: center;
  }

  .digit-sm.ol {
    margin-left: -0.15em;
  }

  .colon {
    margin: 0 -0.2em 0 0;
    color: rgba(220, 225, 230, 0.85);
    font-family: "Gotham Rounded", sans-serif;
    align-self: center;
    transform: translateY(-0.05em);
    z-index: 3;
  }

  .colon-sm {
    font-size: 0.42em;
    margin: 0 0 0 0.1em;
  }
</style>
