import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import type { MeshLogPoint } from '../types/meshLog'

function parseRow(row: Record<string, any>): MeshLogPoint | null {
  // Поддерживаем старые (Excel) и новые (CSV) названия столбцов
  const rawRxLat = row['rx pos lat'] ?? row['r_lat'] ?? 0
  const rawRxLon = row['rx pos long'] ?? row['r_long'] ?? 0

  const rxLat = parseFloat(String(rawRxLat).replace(',', '.'))
  const rxLon = parseFloat(String(rawRxLon).replace(',', '.'))

  // Пропускаем точки без координат или с пустыми значениями (NaN)
  if (isNaN(rxLat) || isNaN(rxLon) || rxLat === 0 || rxLon === 0) return null

  // Собираем остальные поля с учетом обоих форматов
  const senderName = row['sender name'] ?? row['t_name'] ?? 'Unknown'
  const senderLat = parseFloat(String(row['sender lat'] ?? row['t_lat'] ?? 0).replace(',', '.')) || 0
  const senderLon = parseFloat(String(row['sender long'] ?? row['t_long'] ?? 0).replace(',', '.')) || 0
  const rxAlt = parseFloat(String(row['rx pos alt'] ?? row['r_alt'] ?? 0).replace(',', '.')) || 0
  const rssi = parseFloat(String(row['rx pos rssi'] ?? row['r_RSSI'] ?? 0).replace(',', '.')) || 0
  const snr = parseFloat(String(row['rx pos snr'] ?? row['r_SNR'] ?? 0).replace(',', '.')) || 0
  const distance = parseFloat(String(row['distance'] ?? 0).replace(',', '.')) || 0
  const preset = row['LoRa modem preset name'] ?? row['lora_modem_preset_name'] ?? ''
  const date = row['date'] ?? row['r_date'] ?? ''
  const time = row['time'] ?? row['r_time'] ?? ''

  return {
    name: senderName,
    senderLat,
    senderLon,
    rxLat,
    rxLon,
    rxAlt,
    rssi,
    snr,
    distance,
    preset,
    timestamp: `${date} ${time}`.trim(),
  }
}

export function rssiToColor(rssi: number): string {
  if (rssi >= -70) return '#00cc44'
  if (rssi >= -85) return '#ffaa00'
  if (rssi >= -100) return '#ff6600'
  return '#cc0000'
}

export async function parseExcel(file: File): Promise<MeshLogPoint[]> {
  return new Promise((resolve, reject) => {
    // Для CSV файлов используем PapaParse
    if (file.name.toLowerCase().endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const points = results.data
              .map((row) => parseRow(row as Record<string, string>))
              .filter(Boolean) as MeshLogPoint[]
            resolve(points)
          } catch (err) {
            reject(err)
          }
        },
        error: (err: any) => reject(err),
      })
      return
    }

    // Старая логика для Excel (.xlsx, .xls)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
          raw: false,
          defval: '',
        })
        const points = rows.map(parseRow).filter(Boolean) as MeshLogPoint[]
        resolve(points)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}
