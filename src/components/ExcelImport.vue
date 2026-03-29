<template>
  <div class="excel-import">
    <label for="excel-upload" class="import-btn" :class="{ loading }">
      <span v-if="!loading">📂 Загрузить точки из Excel</span>
      <span v-else>⏳ Загрузка...</span>
    </label>
    <input
      id="excel-upload"
      type="file"
      accept=".csv,.xlsx,.xls"
      style="display: none"
      @change="handleFile"
    />
    <div v-if="error" class="import-error">⚠️ {{ error }}</div>
    <div v-if="count > 0" class="import-count">✅ Загружено точек: {{ count }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { parseExcel } from '../composables/useMeshImport'
import type { MeshLogPoint } from '../types/meshLog'

const emit = defineEmits<{
  (e: 'sites-loaded', sites: MeshLogPoint[]): void
}>()

const loading = ref(false)
const error = ref('')
const count = ref(0)

async function handleFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  loading.value = true
  error.value = ''
  count.value = 0

  try {
    const points = await parseExcel(file)
    if (points.length === 0) {
      error.value = 'Не найдено валидных точек с координатами'
    } else {
      count.value = points.length
      emit('sites-loaded', points)
    }
  } catch (err) {
    error.value = 'Ошибка при чтении файла'
    console.error(err)
  } finally {
    loading.value = false
    // Сброс input чтобы можно было загрузить тот же файл повторно
    ;(event.target as HTMLInputElement).value = ''
  }
}
</script>

<style scoped>
.excel-import {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.import-btn {
  display: inline-block;
  padding: 8px 14px;
  background: #2d6a4f;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  user-select: none;
  transition: background 0.2s;
}

.import-btn:hover {
  background: #40916c;
}

.import-btn.loading {
  background: #888;
  cursor: not-allowed;
}

.import-error {
  font-size: 13px;
  color: #e63946;
}

.import-count {
  font-size: 13px;
  color: #40916c;
}
</style>
