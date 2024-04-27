<script setup lang="ts">
import { useEventListener, useMagicKeys } from '@vueuse/core'

import type { Whiteboard } from '~/lib/whiteboard'
import { createWhiteboard } from '~/lib/whiteboard'

const cursorDotOutline = shallowRef<HTMLDivElement>()
const cursorDot = shallowRef<HTMLDivElement>()

const canvas = shallowRef<HTMLCanvasElement>()
const whiteboard = shallowRef<Whiteboard>()

const colors = [
  '#fd7f50',
  '#5078fd',
  '#50fd7f',
  '#fd5078',
  '#7f50fd',
  '#7ffd50',
]

const currentColorIndex = ref(0)
watch(currentColorIndex, (index) => {
  const currentWhiteboard = whiteboard.value
  if (currentWhiteboard) {
    currentWhiteboard.color = colors[index]
  }
})

watch(canvas, (canvas) => {
  const currentWhiteboard = whiteboard.value
  if (currentWhiteboard) {
    currentWhiteboard.disconnect()
    whiteboard.value = undefined
  }

  if (!canvas) {
    return
  }

  whiteboard.value = createWhiteboard(canvas)
})

const isOverBottomRightCorner = ref(false)
const showColorPicker = ref(false)

function onButtonClick() {
  showColorPicker.value = !showColorPicker.value
}

const { c } = useMagicKeys()

watch(c, () => {
  showColorPicker.value = !showColorPicker.value
})

onMounted(() => {
  useEventListener(window, 'mousemove', (e) => {
    const circleRadiusSquared = 100 ** 2

    const distanceSquared = (window.innerWidth - e.clientX) ** 2 + (window.innerHeight - e.clientY) ** 2

    if (distanceSquared <= circleRadiusSquared) {
      isOverBottomRightCorner.value = true
    }
    else {
      isOverBottomRightCorner.value = false
    }
  }, {
    passive: true,
  })
})
</script>

<template>
  <div class="relative w-svw h-svh overflow-hidden">
    <canvas ref="canvas" class="block cursor-crosshair" width="0" height="0" />

    <div ref="cursorDotOutline" class="cursor-dot-outline" />
    <div ref="cursorDot" class="cursor-dot" />

    <transition
      enter-from-class="opacity-0"
      enter-active-class="transition duration-300"
      leave-to-class="opacity-0"
      leave-active-class="transition duration-300"
    >
      <div v-show="showColorPicker" class="absolute p-2 rounded-md shadow-md bottom-32 right-2 bg-neutral-800">
        <div class="flex flex-col gap-2">
          <button
            v-for="(color, index) in colors"
            :key="index"
            type="button"
            class="rounded-md cursor-pointer size-6 outline outline-0 outline-offset-2"
            :style="{
              backgroundColor: color,
              outlineColor: currentColorIndex === index ? color : undefined,
              outlineWidth: currentColorIndex === index ? '1px' : undefined,
            }"
            @click="currentColorIndex = index"
          />
        </div>
      </div>
    </transition>

    <transition
      enter-from-class="opacity-0"
      enter-active-class="transition duration-300"
    >
      <div v-show="isOverBottomRightCorner" class="size-[100px] absolute bottom-0 right-0 z-10">
        <button
          type="button"
          class="appearance-none size-[200px] border-2 border-dashed border-red-300 rounded-full"
          @click="onButtonClick"
        />
      </div>
    </transition>
  </div>
</template>
