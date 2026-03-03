<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from "vue";
  import { useStorage } from "@vueuse/core";
  import ClockDisplay from "./components/ClockDisplay.vue";
  import ConfigPanel from "./components/ConfigPanel.vue";
  import { useTimeSync } from "./hooks/useTimeSync";
  import { useBurnInProtect } from "./hooks/useBurnInProtect";
  import type { ClockConfig } from "./types";

  // 持久化配置（localStorage）
  const config = useStorage<ClockConfig>("burn-clock-config", {
    color: "random",
    fontSize: 40,
    updateIntervalMs: 60_000,
    showSeconds: true,
    showDate: true,
  });

  // 配置面板显隐
  const panelVisible = ref(false);

  // 检测双击左上角（100×100px 热区）打开配置
  let lastTapTime = 0;
  function handleScreenTap(e: MouseEvent | TouchEvent) {
    const x = "touches" in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
    const y = "touches" in e ? (e.touches[0]?.clientY ?? 0) : e.clientY;

    // 面板已打开时不处理，避免点遮罩关闭后立即重新打开
    if (panelVisible.value) return;
    if (x > 100 || y > 100) return;

    const now = Date.now();
    if (now - lastTapTime < 400) {
      panelVisible.value = true;
      lastTapTime = 0; // 重置，防止三击再次触发
    } else {
      lastTapTime = now;
    }
  }

  // 时间同步
  const { timeInfo } = useTimeSync();

  // 时钟元素引用（交给防烧屏 Hook 测量尺寸）
  const clockRef = ref<HTMLElement | null>(null);

  // 防烧屏位置调度
  const { position } = useBurnInProtect(clockRef, config);
  // 禁止手机双指缩放和双击放大（兼容 iOS Safari 忽略 user-scalable=no 的情况）
  function blockZoom(e: TouchEvent) {
    if (e.touches.length > 1) e.preventDefault();
  }
  onMounted(() => {
    document.addEventListener("touchmove", blockZoom, { passive: false });
  });
  onUnmounted(() => {
    document.removeEventListener("touchmove", blockZoom);
  });
</script>

<template>
  <!-- 全黑背景，防止 OLED 漏光 -->
  <div
    class="app-bg"
    @click="handleScreenTap"
    @touchstart.passive="handleScreenTap"
  >
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
  }
</style>
