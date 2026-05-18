#!/usr/bin/env node
/**
 * scripts/ingest_dipres.mjs
 *
 * Reescribe data/dipres_ejecucion.json descargando los XMLs oficiales de
 * ejecución presupuestaria DIPRES por Servicio de Salud (Partida 16, Salud).
 * Cero dependencias: solo Node >= 18.
 *
 * Uso:   node scripts/ingest_dipres.mjs
 * o:     npm run ingest:dipres
 *
 * Regla CLAUDE.md #1: cifras null si la fuente no responde o no contiene
 * el bloque GASTOS. Cada registro lleva url_fuente_real.
 */

import { writeFileSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const OUT_PATH = resolve(ROOT, 'data/dipres_ejecucion.json')

// Mapeo ss_id → article id DIPRES (Servicios de Salud, 28 en total).
// Estos IDs son los publicados por DIPRES para los informes trimestrales
// de ejecución. Si DIPRES cambia el ID, actualizar esta tabla.
const ARTICLE_IDS = {
  ss_arica_parinacota:  '359477',
  ss_tarapaca:          '359478',
  ss_antofagasta:       '359479',
  ss_atacama:           '359480',
  ss_coquimbo:          '359481',
  ss_valparaiso_sa:     '359482',
  ss_vina_quillota:     '359483',
  ss_aconcagua:         '359484',
  ss_ohiggins:          '359485',
  ss_maule:             '359486',
  ss_nuble:             '359487',
  ss_talcahuano:        '359489',
  ss_biobio:            '359490',
  ss_arauco:            '359491',
  ss_araucania_norte:   '359492',
  ss_araucania_sur:     '359493',
  ss_osorno:            '359494',
  ss_valdivia:          '359495', // XML real = "SERVICIO DE SALUD LOS RÍOS"
  ss_reloncavi:         '359496',
  ss_aysen:             '359497',
  ss_magallanes:        '359498',
  ss_metro_oriente:     '359499',
  ss_metro_central:     '359500',
  ss_metro_sur:         '359501',
  ss_metro_norte:       '359502',
  ss_metro_occidente:   '359503',
  ss_metro_sur_oriente: '359504',
  ss_chiloe:            '359508',
}

const HERO_IDS = new Set(['ss_metro_norte', 'ss_araucania_sur', 'ss_valparaiso_sa'])

const XML_BASE = 'https://www.dipres.gob.cl/597/articles-'

const round2 = (n) => (n == null ? null : Math.round(n * 100) / 100)

function parseGastos(xml) {
  // Captura el bloque <nombre>GASTOS</nombre> seguido de los 3 montos.
  const m = xml.match(
    /<nombre>GASTOS<\/nombre>\s*<formulado>(\d+)<\/formulado>\s*<vigente>(\d+)<\/vigente>\s*<monto>(\d+)<\/monto>/
  )
  if (!m) return null
  return {
    formulado_raw: parseInt(m[1], 10),
    vigente_raw: parseInt(m[2], 10),
    monto_raw: parseInt(m[3], 10),
  }
}

function parseNombreServicio(xml) {
  const m = xml.match(/<nombre>(SERVICIO DE SALUD[^<]+)<\/nombre>/)
  return m ? m[1].trim() : null
}

async function fetchService(key, articleId) {
  const url = XML_BASE + articleId + '_doc_xml.xml'
  const r = await fetch(url)
  if (r.status !== 200) {
    return { key, url, ok: false, error: `HTTP ${r.status}` }
  }
  const xml = await r.text()
  const gastos = parseGastos(xml)
  const nombre_oficial = parseNombreServicio(xml)
  if (!gastos) return { key, url, ok: false, error: 'No <GASTOS> en XML' }
  return { key, url, ok: true, gastos, nombre_oficial }
}

async function main() {
  const existing = JSON.parse(readFileSync(OUT_PATH, 'utf8'))
  const oldServicios = existing.servicios ?? {}

  console.log('Descargando', Object.keys(ARTICLE_IDS).length, 'XMLs oficiales de dipres.gob.cl ...')
  const results = await Promise.all(
    Object.entries(ARTICLE_IDS).map(([k, a]) => fetchService(k, a).catch((e) => ({ key: k, ok: false, error: e.message })))
  )

  const servicios = {}
  let nFail = 0
  for (const r of results) {
    const old = oldServicios[r.key] ?? {}
    if (!r.ok) {
      nFail++
      console.warn('  FAIL', r.key, r.error)
      servicios[r.key] = {
        nombre: old.nombre ?? r.key,
        region: old.region ?? null,
        presupuesto_inicial_MM: null,
        presupuesto_vigente_MM: null,
        devengado_MM: null,
        pct_ejecucion: null,
        poblacion_beneficiaria_aprox: null,
        mes_corte: null,
        url_fuente_real: r.url ?? null,
        es_hero: HERO_IDS.has(r.key),
        nota: `Error en ingesta: ${r.error}`,
      }
      continue
    }
    const g = r.gastos
    const vigenteMM = g.vigente_raw / 1000
    const monto = g.monto_raw / 1000
    const pct = vigenteMM > 0 ? (monto / vigenteMM) * 100 : null
    servicios[r.key] = {
      nombre: old.nombre ?? (r.nombre_oficial
        ? r.nombre_oficial.replace(/^SERVICIO DE SALUD/, 'Servicio de Salud')
        : r.key),
      region: old.region ?? null,
      presupuesto_inicial_MM: round2(g.formulado_raw / 1000),
      presupuesto_vigente_MM: round2(vigenteMM),
      devengado_MM: round2(monto),
      pct_ejecucion: round2(pct),
      poblacion_beneficiaria_aprox: null,
      mes_corte: old.mes_corte ?? 'Cuarto trimestre 2024',
      url_fuente_real: r.url,
      es_hero: HERO_IDS.has(r.key),
    }
  }

  const out = {
    ...existing,
    version: '1.2.0',
    fecha_ingesta: new Date().toISOString(),
    servicios,
  }

  writeFileSync(OUT_PATH, JSON.stringify(out, null, 2))
  console.log('Escrito', OUT_PATH)
  console.log('  Servicios OK:', Object.keys(servicios).length - nFail, '/ Fallidos:', nFail)
}

main().catch((e) => {
  console.error('FATAL:', e)
  process.exit(1)
})
