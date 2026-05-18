#!/usr/bin/env node
/**
 * scripts/ingest_minsal.mjs
 *
 * Reescribe data/minsal_espera.json descargando los JSONs oficiales que
 * listaesperasalud.cl (Subsecretaría de Redes Asistenciales) publica por
 * Servicio de Salud. Cero dependencias: solo Node >= 18 (fetch nativo).
 *
 * Uso:   node scripts/ingest_minsal.mjs
 * o:     npm run ingest:minsal
 *
 * Regla CLAUDE.md #1: si la fuente devuelve null o falla, queda null + motivo.
 * Cada cifra escrita tiene url_fuente_real apuntando al JSON oficial.
 */

import { writeFileSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const OUT_PATH = resolve(ROOT, 'data/minsal_espera.json')

const HISTORICO_TRIMESTRES = 8

const SERVICIOS = {
  ss_arica_parinacota:  { url_name: 'ARICA_Y_PARINACOTA',       display: 'Servicio de Salud Arica y Parinacota' },
  ss_tarapaca:          { url_name: 'TARAPACA',                 display: 'Servicio de Salud Tarapacá' },
  ss_antofagasta:       { url_name: 'ANTOFAGASTA',              display: 'Servicio de Salud Antofagasta' },
  ss_atacama:           { url_name: 'ATACAMA',                  display: 'Servicio de Salud Atacama' },
  ss_coquimbo:          { url_name: 'COQUIMBO',                 display: 'Servicio de Salud Coquimbo' },
  ss_valparaiso_sa:     { url_name: 'VALPARAISO-SAN_ANTONIO',   display: 'Servicio de Salud Valparaíso - San Antonio' },
  ss_vina_quillota:     { url_name: 'VINA_DEL_MAR-QUILLOTA',    display: 'Servicio de Salud Viña del Mar - Quillota' },
  ss_aconcagua:         { url_name: 'ACONCAGUA',                display: 'Servicio de Salud Aconcagua' },
  ss_metro_norte:       { url_name: 'METROPOLITANO_NORTE',      display: 'Servicio de Salud Metropolitano Norte' },
  ss_metro_occidente:   { url_name: 'METROPOLITANO_OCCIDENTE',  display: 'Servicio de Salud Metropolitano Occidente' },
  ss_metro_central:     { url_name: 'METROPOLITANO_CENTRAL',    display: 'Servicio de Salud Metropolitano Central' },
  ss_metro_oriente:     { url_name: 'METROPOLITANO_ORIENTE',    display: 'Servicio de Salud Metropolitano Oriente' },
  ss_metro_sur:         { url_name: 'METROPOLITANO_SUR',        display: 'Servicio de Salud Metropolitano Sur' },
  ss_metro_sur_oriente: { url_name: 'METROPOLITANO_SUR_ORIENTE',display: 'Servicio de Salud Metropolitano Sur-Oriente' },
  ss_ohiggins:          { url_name: 'O’HIGGINS',                display: "Servicio de Salud O'Higgins" },
  ss_maule:             { url_name: 'DEL_MAULE',                display: 'Servicio de Salud del Maule' },
  ss_nuble:             { url_name: 'NUBLE',                    display: 'Servicio de Salud Ñuble' },
  ss_biobio:            { url_name: 'BIOBIO',                   display: 'Servicio de Salud Biobío' },
  ss_talcahuano:        { url_name: 'TALCAHUANO',               display: 'Servicio de Salud Talcahuano' },
  ss_arauco:            { url_name: 'ARAUCO',                   display: 'Servicio de Salud Arauco' },
  ss_araucania_norte:   { url_name: 'ARAUCANIA_NORTE',          display: 'Servicio de Salud Araucanía Norte' },
  ss_araucania_sur:     { url_name: 'ARAUCANIA_SUR',            display: 'Servicio de Salud Araucanía Sur' },
  ss_valdivia:          { url_name: 'LOS_RIOS',                 display: 'Servicio de Salud Los Ríos' },
  ss_osorno:            { url_name: 'OSORNO',                   display: 'Servicio de Salud Osorno' },
  ss_reloncavi:         { url_name: 'DEL_RELONCAVI',            display: 'Servicio de Salud del Reloncaví' },
  ss_chiloe:            { url_name: 'CHILOE',                   display: 'Servicio de Salud Chiloé' },
  ss_aysen:             { url_name: 'AYSEN',                    display: 'Servicio de Salud Aysén' },
  ss_magallanes:        { url_name: 'MAGALLANES',               display: 'Servicio de Salud Magallanes' },
}

const BASE = 'https://www.listaesperasalud.cl/data/data_SERVICIO_DE_SALUD_'

const round2 = (n) => (n == null ? null : Math.round(n * 100) / 100)
const pct = (curr, prev) => (curr == null || prev == null || prev === 0 ? null : ((curr - prev) / prev) * 100)

async function fetchService(key, meta) {
  const url = BASE + meta.url_name + '.json'
  const r = await fetch(url)
  if (r.status !== 200) {
    return {
      key,
      record: {
        nombre_servicio: meta.display,
        espera_cirugia: null,
        espera_consulta_especialidad: null,
        variacion_cirugia_pct: null,
        variacion_consulta_pct: null,
        fecha_corte: null,
        historico: [],
        url_fuente_real: url,
        nota: `HTTP ${r.status} al leer fuente`,
      },
    }
  }
  const data = await r.json()
  if (!Array.isArray(data) || data.length === 0) {
    return {
      key,
      record: {
        nombre_servicio: meta.display,
        espera_cirugia: null,
        espera_consulta_especialidad: null,
        variacion_cirugia_pct: null,
        variacion_consulta_pct: null,
        fecha_corte: null,
        historico: [],
        url_fuente_real: url,
        nota: 'Fuente respondió sin filas',
      },
    }
  }
  const last = data[data.length - 1]
  const yoy = data[data.length - 1 - 4] ?? null
  const historico = data.slice(-HISTORICO_TRIMESTRES).map((row) => ({
    trimestre: row.trimestre,
    espera_cirugia: row.quirurgica_pacientes ?? null,
    espera_consulta_especialidad: row.consulta_pacientes ?? null,
  }))
  return {
    key,
    record: {
      nombre_servicio: meta.display,
      espera_cirugia: last.quirurgica_pacientes ?? null,
      espera_consulta_especialidad: last.consulta_pacientes ?? null,
      variacion_cirugia_pct: round2(pct(last.quirurgica_pacientes, yoy?.quirurgica_pacientes)),
      variacion_consulta_pct: round2(pct(last.consulta_pacientes, yoy?.consulta_pacientes)),
      fecha_corte: last.trimestre,
      historico,
      url_fuente_real: url,
    },
  }
}

async function main() {
  const existing = JSON.parse(readFileSync(OUT_PATH, 'utf8'))
  const oldEstab = existing.establecimientos ?? {}

  console.log('Descargando', Object.keys(SERVICIOS).length, 'JSONs oficiales de listaesperasalud.cl ...')
  const results = await Promise.all(
    Object.entries(SERVICIOS).map(([k, m]) => fetchService(k, m).catch((e) => ({ key: k, error: e.message })))
  )

  const servicios = {}
  let nFail = 0
  for (const r of results) {
    if (r.error) {
      nFail++
      console.warn('  FAIL', r.key, r.error)
      servicios[r.key] = {
        nombre_servicio: SERVICIOS[r.key].display,
        espera_cirugia: null,
        espera_consulta_especialidad: null,
        variacion_cirugia_pct: null,
        variacion_consulta_pct: null,
        fecha_corte: null,
        historico: [],
        url_fuente_real: BASE + SERVICIOS[r.key].url_name + '.json',
        nota: `Error: ${r.error}`,
      }
      continue
    }
    servicios[r.key] = r.record
  }

  const allCorte = new Set(Object.values(servicios).map((s) => s.fecha_corte).filter(Boolean))
  const rootCorte = allCorte.size === 1 ? [...allCorte][0] : null

  const establecimientos = {}
  for (const [id, e] of Object.entries(oldEstab)) {
    establecimientos[id] = {
      nombre: e.nombre,
      servicio_salud_id: e.servicio_salud_id,
      es_hero: !!e.es_hero,
    }
  }

  const out = {
    version: '2.1.0',
    fecha_corte: rootCorte,
    fecha_ingesta: new Date().toISOString(),
    fuente: 'MINSAL — Subsecretaría de Redes Asistenciales. Visualizador de Listas de Espera de Salud.',
    url_fuente: 'https://www.listaesperasalud.cl/',
    nota: 'Cifras a nivel de Servicio de Salud (unidad oficial de análisis del MINSAL). Variaciones interanuales calculadas contra el mismo trimestre del año anterior. consulta_pacientes/quirurgica_pacientes vienen del JSON oficial por servicio en listaesperasalud.cl. Si la fuente entrega null en algún campo del trimestre comparado, la variación queda en null. historico contiene los últimos 8 trimestres por servicio. El campo establecimientos mantiene el mapeo hospital → servicio_salud_id para la búsqueda; las cifras viven en servicios.',
    servicios,
    establecimientos,
  }

  writeFileSync(OUT_PATH, JSON.stringify(out, null, 2))
  console.log('Escrito', OUT_PATH)
  console.log('  Servicios OK:', Object.keys(servicios).length - nFail, '/ Fallidos:', nFail)
  console.log('  fecha_corte raíz:', rootCorte)
  console.log('  Trimestres por servicio (histórico):', HISTORICO_TRIMESTRES)
}

main().catch((e) => {
  console.error('FATAL:', e)
  process.exit(1)
})
