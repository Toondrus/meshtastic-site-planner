<template>
  <div class="mesh-controls" v-if="points.length > 0">
    <button @click="clearLayer">🗑 Очистить точки ({{ points.length }})</button>
  </div>
</template>

<script setup lang="ts">
import { watch, ref, onUnmounted } from 'vue'
import L from 'leaflet'
import type { MeshLogPoint } from '../types/meshLog'
import { rssiToColor } from '../composables/useMeshImport'

const props = defineProps<{
  map: L.Map | null
  points: MeshLogPoint[]
}>()

const layerGroup = ref<L.LayerGroup | null>(null)

function renderPoints() {
  const map = props.map as L.Map
  if (!map) {
    console.warn('Карта не готова')
    return
  }

  console.log('Рендерим точки:', props.points.length)
  console.log('Первая точка:', props.points[0])

  if (!layerGroup.value) {
    layerGroup.value = L.layerGroup().addTo(map)
  }
  layerGroup.value.clearLayers()

  props.points.forEach(p => {
    const color = rssiToColor(p.rssi)

    const icon = L.divIcon({
      className: '',
      html: `<div style="
        width: 12px; height: 12px; border-radius: 50%;
        background: ${color}; border: 2px solid white;
        box-shadow: 0 0 4px rgba(0,0,0,0.6);
      "></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    })

    L.marker([p.rxLat, p.rxLon], { icon })
      .addTo(layerGroup.value as L.LayerGroup)
      .bindPopup(`
        <b>${p.name}</b><br>
        🕐 ${p.timestamp}<br>
        📡 RSSI: <b>${p.rssi} dBm</b> | SNR: ${p.snr}<br>
        📏 Расстояние: ${p.distance} м<br>
        🔧 Пресет: ${p.preset}<br>
        📍 Высота: ${p.rxAlt} м
      `)
    // линии передачи пакетов
    /*
    if (p.senderLat !== 0 && p.senderLon !== 0) {
      L.polyline(
        [[p.senderLat, p.senderLon], [p.rxLat, p.rxLon]],
        { color, weight: 1.5, opacity: 0.5, dashArray: '5,5' }
      ).addTo(layerGroup.value as L.LayerGroup)
    }
      */
  })

  setTimeout(() => {
    if (!map || props.points.length === 0) return
    const bounds = L.latLngBounds(props.points.map(p => [p.rxLat, p.rxLon]))
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 })
  }, 300)
}


function clearLayer() {
  layerGroup.value?.clearLayers()
}

// deep: true чтобы реагировать на смену массива
watch(
  () => props.points,
  (newPoints) => {
    if (newPoints.length > 0) renderPoints()
  },
  { deep: true }
)

// Отдельно следим за картой — если она появилась после точек
watch(
  () => props.map,
  (map) => {
    if (map && props.points.length > 0) renderPoints()
  }
)

onUnmounted(() => {
  layerGroup.value?.remove()
})
</script>

<style scoped>
.mesh-controls {
  position: absolute;
  bottom: 20px;
  left: 10px;
  z-index: 1000;
}

.mesh-controls button {
  padding: 7px 12px;
  background: #e63946;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.mesh-controls button:hover {
  background: #c1121f;
}
</style>
