<script setup lang="ts">
  import type { ClockConfig, Position, TimeInfo } from "../types";

  interface Props {
    timeInfo: TimeInfo;
    position: Position;
    config: ClockConfig;
  }

  const props = defineProps<Props>();
</script>

<template>
  <div
    class="clock-wrapper"
    :style="{
      transform: `translate(${props.position.x}px, ${props.position.y}px)`,
      color: props.config.color,
      fontSize: `${props.config.fontSize}vmin`,
    }"
  >
    <!-- 主时间显示 -->
    <div class="clock-time">
      <span class="clock-digits">{{ props.timeInfo.hours }}</span>
      <span class="clock-colon">:</span>
      <span class="clock-digits">{{ props.timeInfo.minutes }}</span>
      <template v-if="props.config.showSeconds">
        <span class="clock-colon">:</span>
        <span class="clock-digits clock-seconds">{{
          props.timeInfo.seconds
        }}</span>
      </template>
    </div>
    <!-- 日期显示 -->
    <div v-if="props.config.showDate" class="clock-date">
      {{ props.timeInfo.dateStr }}
    </div>
  </div>
</template>

<style scoped>
  .clock-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3em;
    /* 使用 transition 让位置变化更流畅 */
    transition: transform 1.2s cubic-bezier(0.4, 0, 0.2, 1);
    /* 关闭文字选中，防止点击触发歪曲 */
    user-select: none;
    -webkit-user-select: none;
    /* 开启 GPU 合成层，防止屏幕撕裂 */
    will-change: transform;
    white-space: nowrap;
  }

  .clock-time {
    display: flex;
    align-items: baseline;
    gap: 0.05em;
    font-family: "SF Mono", "JetBrains Mono", "Courier New", monospace;
    font-weight: 200;
    letter-spacing: -0.02em;
    line-height: 1;
  }

  .clock-digits {
    font-variant-numeric: tabular-nums;
  }

  .clock-seconds {
    font-size: 0.55em;
    opacity: 0.7;
  }

  .clock-colon {
    opacity: 0.6;
    animation: blink 1s step-end infinite;
  }

  .clock-date {
    font-size: 0.22em;
    letter-spacing: 0.08em;
    opacity: 0.55;
    font-weight: 300;
  }

  @keyframes blink {
    0%,
    100% {
      opacity: 0.6;
    }
    50% {
      opacity: 0.15;
    }
  }
</style>
