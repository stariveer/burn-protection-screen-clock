<script setup lang="ts">
  import { ref, computed } from "vue";
  import { useStorage } from "@vueuse/core";
  import ClockDisplay from "./components/ClockDisplay.vue";
  import ConfigPanel from "./components/ConfigPanel.vue";
  import { useTimeSync } from "./hooks/useTimeSync";
  import { useBurnInProtect } from "./hooks/useBurnInProtect";
  import type { ClockConfig } from "./types";

  // 持久化配置（localStorage）
  const config = useStorage<ClockConfig>("burn-clock-config", {
    color: "#ffffff",
    fontSize: 18,
    updateIntervalMs: 60_000,
    showSeconds: true,
    showDate: true,
  });

  // 配置面板显隐
  const panelVisible = ref(false);

  // 检测双击左上角（80×80px 热区）打开配置
  let lastTapTime = 0;
  function handleScreenTap(e: MouseEvent | TouchEvent) {
    const x = "touches" in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
    const y = "touches" in e ? (e.touches[0]?.clientY ?? 0) : e.clientY;

    // 仅响应左上角热区
    if (x > 80 || y > 80) return;

    const now = Date.now();
    if (now - lastTapTime < 400) {
      panelVisible.value = true;
    }
    lastTapTime = now;
  }

  // 时间同步
  const { timeInfo } = useTimeSync();

  // 时钟元素引用（交给防烧屏 Hook 测量尺寸）
  const clockRef = ref<HTMLElement | null>(null);
  const configRef = computed(() => config);

  // 防烧屏位置调度
  const { position } = useBurnInProtect(clockRef, configRef);
</script>

<template>
  <!-- 全黑背景，防止 OLED 漏光 -->
  <div
    class="app-bg"
    @click="handleScreenTap"
    @touchstart.passive="handleScreenTap"
  >
    <!-- 左上角提示点（极小的可见标记） -->
    <div class="corner-hint" />

    <!-- 时钟展示 -->
    <ClockDisplay
      ref="clockRef"
      :time-info="timeInfo"
      :position="position"
      :config="config"
    />

    <!-- 配置面板 -->
    <ConfigPanel v-model="config" v-model:visible="panelVisible" />
  </div>
</template>

<style>
  /* 全局重置 */
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html,
  body,
  #app {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000;
  }

  .app-bg {
    width: 100%;
    height: 100%;
    background: #000;
    position: relative;
    cursor: none; /* 全屏时钟隐藏鼠标指针 */
  }

  /* 左上角极小提示点，用于提示双击区域 */
  .corner-hint {
    position: fixed;
    top: 8px;
    left: 8px;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.15);
    pointer-events: none;
  }
</style>
