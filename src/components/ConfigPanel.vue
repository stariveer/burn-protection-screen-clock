<script setup lang="ts">
  import type { ClockConfig } from "../types";

  interface Props {
    modelValue: ClockConfig;
    visible: boolean;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<{
    "update:modelValue": [value: ClockConfig];
    "update:visible": [value: boolean];
  }>();

  function update<K extends keyof ClockConfig>(key: K, value: ClockConfig[K]) {
    emit("update:modelValue", { ...props.modelValue, [key]: value });
  }

  const intervalOptions = [
    { label: "30 秒", value: 30_000 },
    { label: "1 分钟", value: 60_000 },
    { label: "2 分钟", value: 120_000 },
    { label: "5 分钟", value: 300_000 },
  ];
</script>

<template>
  <Transition name="panel-fade">
    <div
      v-if="props.visible"
      class="config-overlay"
      @click.self="emit('update:visible', false)"
    >
      <div class="config-panel">
        <div class="panel-header">
          <h2>时钟配置</h2>
          <button class="close-btn" @click="emit('update:visible', false)">
            ✕
          </button>
        </div>

        <div class="panel-body">
          <!-- 字体颜色 -->
          <label class="config-row">
            <span>字体颜色</span>
            <div class="color-group">
              <input
                type="color"
                :value="props.modelValue.color"
                @input="
                  update('color', ($event.target as HTMLInputElement).value)
                "
              />
              <button
                v-for="c in [
                  '#ffffff',
                  '#00ff88',
                  '#00cfff',
                  '#ffaa00',
                  '#ff6b6b',
                ]"
                :key="c"
                class="color-preset"
                :style="{ background: c }"
                @click="update('color', c)"
              />
            </div>
          </label>

          <!-- 字体大小 -->
          <label class="config-row">
            <span>字体大小 ({{ props.modelValue.fontSize }} vmin)</span>
            <input
              type="range"
              min="8"
              max="40"
              step="1"
              :value="props.modelValue.fontSize"
              @input="
                update(
                  'fontSize',
                  Number(($event.target as HTMLInputElement).value),
                )
              "
            />
          </label>

          <!-- 跳动频率 -->
          <label class="config-row">
            <span>防烧屏频率</span>
            <div class="btn-group">
              <button
                v-for="opt in intervalOptions"
                :key="opt.value"
                :class="[
                  'opt-btn',
                  props.modelValue.updateIntervalMs === opt.value && 'active',
                ]"
                @click="update('updateIntervalMs', opt.value)"
              >
                {{ opt.label }}
              </button>
            </div>
          </label>

          <!-- 显示秒数 -->
          <label class="config-row toggle-row">
            <span>显示秒数</span>
            <button
              :class="['toggle', props.modelValue.showSeconds && 'on']"
              @click="update('showSeconds', !props.modelValue.showSeconds)"
            >
              <span class="toggle-knob" />
            </button>
          </label>

          <!-- 显示日期 -->
          <label class="config-row toggle-row">
            <span>显示日期</span>
            <button
              :class="['toggle', props.modelValue.showDate && 'on']"
              @click="update('showDate', !props.modelValue.showDate)"
            >
              <span class="toggle-knob" />
            </button>
          </label>
        </div>

        <p class="hint">双击屏幕左上角可再次呼出</p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
  .config-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .config-panel {
    background: rgba(20, 20, 20, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 28px;
    width: min(90vw, 380px);
    box-shadow: 0 32px 64px rgba(0, 0, 0, 0.6);
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }

  .panel-header h2 {
    font-size: 18px;
    font-weight: 600;
    color: #fff;
    margin: 0;
  }

  .close-btn {
    background: rgba(255, 255, 255, 0.08);
    border: none;
    color: #aaa;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.2s;
  }
  .close-btn:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .panel-body {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .config-row {
    display: flex;
    flex-direction: column;
    gap: 10px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 13px;
  }

  .toggle-row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .color-group {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  input[type="color"] {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    cursor: pointer;
    padding: 2px;
    background: transparent;
  }

  .color-preset {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.2);
    cursor: pointer;
    transition:
      transform 0.15s,
      border-color 0.15s;
  }
  .color-preset:hover {
    transform: scale(1.2);
    border-color: #fff;
  }

  input[type="range"] {
    width: 100%;
    accent-color: #00cfff;
    cursor: pointer;
  }

  .btn-group {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .opt-btn {
    padding: 6px 14px;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: transparent;
    color: rgba(255, 255, 255, 0.6);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .opt-btn:hover {
    border-color: rgba(255, 255, 255, 0.4);
    color: #fff;
  }
  .opt-btn.active {
    background: #00cfff;
    color: #000;
    border-color: #00cfff;
  }

  /* Toggle 开关 */
  .toggle {
    position: relative;
    width: 44px;
    height: 26px;
    border-radius: 13px;
    border: none;
    background: rgba(255, 255, 255, 0.12);
    cursor: pointer;
    transition: background 0.25s;
    flex-shrink: 0;
  }
  .toggle.on {
    background: #00cfff;
  }
  .toggle-knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.25s;
  }
  .toggle.on .toggle-knob {
    transform: translateX(18px);
  }

  .hint {
    margin-top: 20px;
    text-align: center;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.25);
  }

  /* 弹入动画 */
  .panel-fade-enter-active,
  .panel-fade-leave-active {
    transition:
      opacity 0.25s,
      transform 0.25s;
  }
  .panel-fade-enter-from,
  .panel-fade-leave-to {
    opacity: 0;
    transform: scale(0.95);
  }
</style>
