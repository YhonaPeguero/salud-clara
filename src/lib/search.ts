import mappingRaw from '@data/mapping.json'
import dipresRaw from '@data/dipres_ejecucion.json'
import minsalRaw from '@data/minsal_espera.json'
import type { MappingEntry, DipresServicio, MinsalEstablecimiento, SearchResult } from './types'
import { generarParrafo } from './format'

const mapping = mappingRaw as { entries: MappingEntry[] }
const dipres = dipresRaw as { servicios: Record<string, DipresServicio>; mes_corte: string }
const minsal = minsalRaw as { establecimientos: Record<string, MinsalEstablecimiento>; fecha_corte: string | null }

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function scoreMatch(query: string, entry: MappingEntry): number {
  const q = normalize(query)
  const nombre = normalize(entry.display_nombre)

  if (q === nombre) return 100
  if (nombre.startsWith(q)) return 90

  for (const term of entry.search_terms) {
    const t = normalize(term)
    if (q === t) return 85
    if (t.startsWith(q) || q.startsWith(t)) return 75
    if (t.includes(q) || q.includes(t)) return 60
  }

  const qWords = q.split(' ').filter(w => w.length > 2)
  let wordScore = 0
  for (const word of qWords) {
    if (nombre.includes(word)) wordScore += 15
    for (const term of entry.search_terms) {
      if (normalize(term).includes(word)) {
        wordScore += 10
        break
      }
    }
  }

  return wordScore
}

function buildResult(entry: MappingEntry): SearchResult | null {
  const dipresData = dipres.servicios[entry.servicio_salud_id]
  if (!dipresData) return null

  let minsalData: MinsalEstablecimiento | null = null
  let minsalId = entry.id

  if (entry.tipo === 'comuna' && entry.establecimiento_principal_id) {
    minsalId = entry.establecimiento_principal_id
  }

  minsalData = minsal.establecimientos[minsalId] ?? null

  const parrafo = generarParrafo({
    nombreEstablecimiento: minsalData?.nombre ?? entry.display_nombre,
    tipoEntidad: entry.tipo,
    nombreServicio: entry.servicio_salud_nombre,
    region: entry.region,
    presupuestoVigenteMMCLP: dipresData.presupuesto_vigente_MM,
    devengadoMMCLP: dipresData.devengado_MM,
    pctEjecucion: dipresData.pct_ejecucion,
    mesCorte: dipresData.mes_corte,
    esperaCirugia: minsalData?.espera_cirugia ?? null,
    esperaConsulta: minsalData?.espera_consulta_especialidad ?? null,
    variacionCirugiaPct: minsalData?.variacion_cirugia_pct ?? null,
    variacionConsultaPct: minsalData?.variacion_consulta_pct ?? null,
    fechaCorteMinsal: minsalData?.fecha_corte ?? null,
  })

  return {
    entry,
    dipres: dipresData,
    minsal: minsalData,
    parrafo,
    score: 0,
  }
}

export function search(query: string): SearchResult[] {
  if (!query || query.trim().length < 2) return []

  const scored = mapping.entries
    .map(entry => ({ entry, score: scoreMatch(query, entry) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  const results: SearchResult[] = []
  for (const { entry, score } of scored) {
    const result = buildResult(entry)
    if (result) {
      result.score = score
      results.push(result)
    }
  }

  return results.slice(0, 3)
}

export function getHeroDemos(): SearchResult[] {
  const heroIds = ['hosp_san_jose', 'hosp_regional_temuco', 'hosp_carlos_van_buren']
  const results: SearchResult[] = []
  for (const id of heroIds) {
    const entry = mapping.entries.find(e => e.id === id)
    if (!entry) continue
    const result = buildResult(entry)
    if (result) {
      result.score = 100
      results.push(result)
    }
  }
  return results
}
