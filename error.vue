<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps({
  error: Object as () => NuxtError,
})
</script>

<template>
  <div class="flex items-center justify-center h-screen">
    <div class="max-w-md text-center">
      <h1 class="text-5xl font-bold mb-4">
        {{ error?.statusCode }}
      </h1>
      <p class="text-gray-500 mb-4">
        {{ error?.message }}
      </p>
      <NuxtLink to="/" class="inline-block py-2 px-4 border border-transparent text-base font-medium rounded-md text-white bg-rose-600 hover:bg-rose-700">
        Take me home
      </NuxtLink>
    </div>
  </div>
</template>
