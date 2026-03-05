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

  function updateCustomSafeZone(index: number, val: number) {
    const newVal = isNaN(val) ? 0 : val;
    const arr = props.modelValue.customSafeZone
      ? [...props.modelValue.customSafeZone]
      : [0, 0, 0, 0];
    arr[index] = newVal;
    emit("update:modelValue", {
      ...props.modelValue,
      customSafeZone: arr as [number, number, number, number],
    });
  }

  const intervalOptions = [
    { label: "30 秒", value: 30_000 },
    { label: "1 分钟", value: 60_000 },
    { label: "2 分钟", value: 120_000 },
    { label: "5 分钟", value: 300_000 },
  ];

  // 色卡预览颜色映射（与 ClockDisplay.vue 中的色系保持一致）
  const colorMap: Record<string, string> = {
    blue: "linear-gradient(135deg, #6fb5ff, #209aff)",
    purple: "linear-gradient(135deg, #d387ff, #9d4edd)",
    green: "linear-gradient(135deg, #5cffdb, #00d4a1)",
    orange: "linear-gradient(135deg, #fca584, #fc75a0)",
    red: "linear-gradient(135deg, #ff758c, #ff3e5b)",
    pink: "linear-gradient(135deg, #fbcfe8, #f472b6)",
    cyan: "linear-gradient(135deg, #a5f3fc, #22d3ee)",
  };
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
          <h2>
            时钟配置
            <span class="panel-version">v1.0.1</span>
            <span class="panel-hint">（双击左上角呼出）</span>
          </h2>
          <button class="close-btn" @click="emit('update:visible', false)">
            ✕
          </button>
        </div>

        <div class="panel-body">
          <!-- 颜色主题 -->
          <label class="config-row">
            <span>颜色主题</span>
            <div class="color-group">
              <button
                v-for="c in [
                  'random', // 随机色（首位默认）
                  'blue', // 蓝色
                  'purple', // 紫色
                  'green', // 绿色
                  'orange', // 橙色
                  'red', // 红色
                  'pink', // 粉色
                  'cyan', // 青色
                ]"
                :key="c"
                :class="[
                  'color-preset',
                  props.modelValue.color === c && 'active',
                  c === 'random' && 'random-btn',
                ]"
                :title="c === 'random' ? '随机渐变色' : c"
                :style="c === 'random' ? {} : { background: colorMap[c] }"
                @click="update('color', c)"
              >
                <span v-if="c === 'random'">🎲</span>
              </button>
            </div>
          </label>

          <!-- 字体大小 -->
          <label class="config-row">
            <span>字体大小 ({{ props.modelValue.fontSize }} vmin)</span>
            <input
              type="range"
              min="28"
              max="48"
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

          <!-- 显示内容：秒数 + 日期同行 -->
          <div class="config-row toggle-row">
            <span>显示内容</span>
            <div class="toggle-pair">
              <label class="toggle-label">
                <span>秒数</span>
                <button
                  :class="['toggle', props.modelValue.showSeconds && 'on']"
                  @click="update('showSeconds', !props.modelValue.showSeconds)"
                >
                  <span class="toggle-knob" />
                </button>
              </label>
              <label class="toggle-label">
                <span>日期</span>
                <button
                  :class="['toggle', props.modelValue.showDate && 'on']"
                  @click="update('showDate', !props.modelValue.showDate)"
                >
                  <span class="toggle-knob" />
                </button>
              </label>
            </div>
          </div>

          <!-- 自定义安全区 -->
          <div class="config-row">
            <span>自定义避让区 (像素, 格式: 左上X, 左上Y, 右下X, 右下Y)</span>
            <div class="safe-zone-inputs">
              <input
                type="number"
                min="0"
                step="1"
                :value="props.modelValue.customSafeZone?.[0] ?? 0"
                @input="
                  updateCustomSafeZone(
                    0,
                    Number(($event.target as HTMLInputElement).value),
                  )
                "
                placeholder="X1"
              />
              <input
                type="number"
                min="0"
                step="1"
                :value="props.modelValue.customSafeZone?.[1] ?? 0"
                @input="
                  updateCustomSafeZone(
                    1,
                    Number(($event.target as HTMLInputElement).value),
                  )
                "
                placeholder="Y1"
              />
              <input
                type="number"
                min="0"
                step="1"
                :value="props.modelValue.customSafeZone?.[2] ?? 0"
                @input="
                  updateCustomSafeZone(
                    2,
                    Number(($event.target as HTMLInputElement).value),
                  )
                "
                placeholder="X2"
              />
              <input
                type="number"
                min="0"
                step="1"
                :value="props.modelValue.customSafeZone?.[3] ?? 0"
                @input="
                  updateCustomSafeZone(
                    3,
                    Number(($event.target as HTMLInputElement).value),
                  )
                "
                placeholder="Y2"
              />
            </div>
          </div>
        </div>
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
    /* 横屏小屏时允许整体滚动 */
    overflow-y: auto;
    padding: 16px 0;
  }

  .config-panel {
    background: rgba(20, 20, 20, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 20px;
    width: min(90vw, 380px);
    box-shadow: 0 32px 64px rgba(0, 0, 0, 0.6);
    /* 限制最大高度，超出时内部滚动 */
    max-height: 90dvh;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
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
  .panel-version {
    font-size: 10px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.1);
    padding: 1px 6px;
    border-radius: 4px;
    margin-left: 6px;
    vertical-align: middle;
  }
  .panel-hint {
    font-size: 11px;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.3);
    vertical-align: middle;
    margin-left: 4px;
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
    overflow-y: auto;
    flex: 1;
    /* 在 WebKit 上隐藏滚动条使其更美观 */
    scrollbar-width: none;
  }
  .panel-body::-webkit-scrollbar {
    display: none;
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
    padding: 4px; /* 为 scale(1.1) + box-shadow 留出溢出空间 */
  }

  .color-preset {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.1);
    cursor: pointer;
    transition:
      transform 0.15s,
      border-color 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }
  .color-preset:hover {
    transform: scale(1.1);
    border-color: rgba(255, 255, 255, 0.5);
  }
  .color-preset.active {
    border-color: #fff;
    transform: scale(1.1);
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
  }
  .random-btn {
    /* 彩虹渐变，传达“每次都不一样”的视觉感 */
    background: conic-gradient(
      from 0deg,
      #ff6b6b,
      #ffd93d,
      #6bcb77,
      #4d96ff,
      #c77dff,
      #ff6b6b
    );
  }

  input[type="range"] {
    width: 100%;
    accent-color: #00cfff;
    cursor: pointer;
  }

  /* 显示内容行：秒数 + 日期同行布局 */
  .toggle-pair {
    display: flex;
    gap: 16px;
    align-items: center;
  }
  .toggle-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
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

  /* 自定义安全区输入框 */
  .safe-zone-inputs {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }
  .safe-zone-inputs input {
    width: 60px;
    padding: 6px 8px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 6px;
    color: #fff;
    font-size: 13px;
    text-align: center;
    outline: none;
    transition: border-color 0.2s;
  }
  .safe-zone-inputs input:focus {
    border-color: #00cfff;
  }
  .safe-zone-inputs input::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
  /* 隐藏 number input 的上下箭头 */
  .safe-zone-inputs input::-webkit-outer-spin-button,
  .safe-zone-inputs input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .safe-zone-inputs input[type="number"] {
    -moz-appearance: textfield;
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
