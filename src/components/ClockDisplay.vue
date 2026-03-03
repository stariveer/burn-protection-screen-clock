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
      fontSize: `${props.config.fontSize}vmin`,
    }"
  >
    <!-- 主时间显示 -->
    <div class="clock-time">
      <span class="digit dark">{{ props.timeInfo.hours[0] }}</span>
      <span class="digit light overlap">{{ props.timeInfo.hours[1] }}</span>

      <span class="clock-colon">:</span>

      <span class="digit dark">{{ props.timeInfo.minutes[0] }}</span>
      <span class="digit light overlap">{{ props.timeInfo.minutes[1] }}</span>

      <template v-if="props.config.showSeconds">
        <span class="clock-colon seconds-colon">:</span>
        <span class="digit dark clock-seconds">{{
          props.timeInfo.seconds[0]
        }}</span>
        <span class="digit light overlap clock-seconds">{{
          props.timeInfo.seconds[1]
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
    /* 使用 transition 让位置变化更流畅 */
    transition: transform 1.2s cubic-bezier(0.4, 0, 0.2, 1);
    /* 关闭文字选中，防止点击触发歪曲 */
    user-select: none;
    -webkit-user-select: none;
    /* 开启 GPU 合成层，防止屏幕撕裂 */
    will-change: transform;
    white-space: nowrap;
    line-height: 1;
  }

  .clock-time {
    display: flex;
    align-items: center;
    font-family: "Gotham Rounded", sans-serif;
  }

  .digit {
    display: inline-block;
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    font-variant-numeric: tabular-nums;
  }

  /* 深蓝渐变 (底层) - 参考图的较深蓝色 */
  .digit.dark {
    background-image: linear-gradient(180deg, #005ae6 0%, #003b99 100%);
    position: relative;
    z-index: 10;
  }

  /* 浅蓝渐变 半透明 (顶层透叠) - 还原参考图的亮蓝与半透重叠感 */
  .digit.light {
    background-image: linear-gradient(135deg, #6fb5ff 0%, #209aff 100%);
    position: relative;
    z-index: 20;
    opacity: 0.88;
  }

  .overlap {
    margin-left: -0.22em; /* 这里控制数字互相重叠的深度 */
  }

  .clock-colon {
    margin: 0 0.05em; /* 减小冒号的边距，贴紧数字 */
    color: rgba(220, 225, 230, 0.9);
    font-family: "Gotham Rounded", sans-serif;
    opacity: 0.9;
    transform: translateY(-0.06em);
  }

  .seconds-colon {
    font-size: 0.4em;
    margin: 0 0.02em;
  }

  .clock-seconds {
    font-size: 0.4em;
  }

  .clock-seconds.overlap {
    margin-left: -0.18em;
  }

  .clock-date {
    font-size: 0.22em;
    letter-spacing: 0.08em;
    opacity: 0.55;
    font-family: "Gotham Rounded", sans-serif;
    margin-top: 0.7em;
  }
</style>
