'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { SearchResult } from '@/lib/types'
import { formatMillones, formatNumero, formatVariacion } from '@/lib/format'

interface Props {
  initialHeroes: SearchResult[]
}

function BarraEjecucion({ pct }: { pct: number }) {
  const color =
    pct >= 90
      ? 'bg-emerald-500'
      : pct >= 70
      ? 'bg-amber-500'
      : 'bg-red-500'

  return (
    <div className="mt-3">
      <div className="flex justify-between text-sm text-gray-500 mb-1">
        <span>Ejecución presupuestaria</span>
        <span className="font-semibold text-gray-800">{pct.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3">
        <div
          className={`${color} h-3 rounded-full transition-all duration-700`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  )
}

function BadgeCapaData({ label, color }: { label: string; color: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${color}`}
    >
      {label}
    </span>
  )
}

function VariacionLabel({ pct, tipo }: { pct: number | null; tipo: 'cirugia' | 'consulta' }) {
  if (pct === null) return <span className="text-gray-400 text-sm">sin datos comp.</span>
  const positivo = pct >= 0
  const color = positivo ? 'text-amber-600' : 'text-emerald-600'
  const arrow = positivo ? '↑' : '↓'
  return (
    <span className={`text-sm font-medium ${color}`}>
      {arrow} {formatVariacion(pct)} vs. año ant.
    </span>
  )
}

function ResultCard({ result, expanded }: { result: SearchResult; expanded?: boolean }) {
  const { entry, dipres, minsal } = result
  const esComuna = entry.tipo === 'comuna'
  const nombrePrincipal = esComuna
    ? `Área: ${entry.display_nombre}`
    : entry.display_nombre

  const hospitalNombre = minsal?.nombre ?? entry.display_nombre

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-1">
              {esComuna ? 'Comuna' : 'Hospital / Establecimiento'}
            </div>
            <h2 className="text-white text-lg font-bold leading-tight">{hospitalNombre}</h2>
            <p className="text-slate-300 text-sm mt-0.5">{entry.region}</p>
          </div>
          {entry.es_hero && (
            <span className="shrink-0 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              Demo verificada
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="divide-y divide-gray-50">
        {/* Sección DIPRES */}
        <div className="px-6 py-5">
          <div className="flex items-center gap-2 mb-4">
            <BadgeCapaData label="Presupuesto de tu Red Regional" color="bg-blue-50 text-blue-700" />
            <span className="text-gray-300 text-xs">·</span>
            <span className="text-gray-400 text-xs">Fuente: DIPRES</span>
          </div>

          <p className="text-xs text-gray-500 mb-3 font-medium">
            {dipres.nombre}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Presupuesto Asignado 2024</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {formatMillones(dipres.presupuesto_vigente_MM)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Gasto Ejecutado</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">
                {formatMillones(dipres.devengado_MM)}
              </p>
            </div>
          </div>

          <BarraEjecucion pct={dipres.pct_ejecucion} />

          <p className="text-xs text-gray-400 mt-2">Con datos al {dipres.mes_corte}</p>
        </div>

        {/* Sección MINSAL */}
        <div className="px-6 py-5">
          <div className="flex items-center gap-2 mb-4">
            <BadgeCapaData label="Lista de Espera en tu Hospital" color="bg-orange-50 text-orange-700" />
            <span className="text-gray-300 text-xs">·</span>
            <span className="text-gray-400 text-xs">Fuente: MINSAL</span>
          </div>

          {minsal ? (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Esperando cirugía</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumero(minsal.espera_cirugia)}
                      <span className="text-sm font-normal text-gray-500 ml-1">personas</span>
                    </p>
                  </div>
                  <VariacionLabel pct={minsal.variacion_cirugia_pct} tipo="cirugia" />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Esperando especialidad</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumero(minsal.espera_consulta_especialidad)}
                      <span className="text-sm font-normal text-gray-500 ml-1">personas</span>
                    </p>
                  </div>
                  <VariacionLabel pct={minsal.variacion_consulta_pct} tipo="consulta" />
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-3">Con datos al {minsal.fecha_corte}</p>
            </>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-500">
              No se encontraron datos de lista de espera en el Visor MINSAL para este establecimiento en el período consultado.
            </div>
          )}
        </div>

        {/* Párrafo descriptivo */}
        <div className="px-6 py-5 bg-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">En palabras simples</span>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">{result.parrafo}</p>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white">
          <div className="flex flex-wrap gap-3 text-xs text-gray-400">
            <a
              href="https://www.dipres.gob.cl/597/w3-propertyvalue-15131.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-500 transition-colors underline underline-offset-2"
            >
              DIPRES — Ejecución Presupuestaria
            </a>
            <span>·</span>
            <a
              href="https://visortiemposespera.minsal.cl/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-500 transition-colors underline underline-offset-2"
            >
              MINSAL — Visor Ciudadano de Tiempos de Espera
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SearchClient({ initialHeroes }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doSearch = useCallback(async (q: string) => {
    if (!q || q.trim().length < 2) {
      setResults([])
      setSearched(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`)
      if (!res.ok) throw new Error('Error en la búsqueda')
      const data = await res.json()
      setResults(data.results ?? [])
      setSearched(true)
    } catch {
      setError('No pudimos completar la búsqueda. Por favor intenta de nuevo.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  function handleQueryChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) {
      setResults([])
      setSearched(false)
      return
    }
    debounceRef.current = setTimeout(() => {
      doSearch(value)
    }, 400)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    doSearch(query)
  }

  function handleHeroClick(term: string) {
    setQuery(term)
    doSearch(term)
    inputRef.current?.focus()
  }

  function handleClear() {
    setQuery('')
    setResults([])
    setSearched(false)
    setError(null)
    inputRef.current?.focus()
  }

  const showHeroes = !searched && !loading && results.length === 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero section */}
      <div className="bg-slate-900 text-white pt-16 pb-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6">
            Datos públicos · Lenguaje humano
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-4">
            ¿Llegó la plata a tu hospital?
          </h1>
          <p className="text-slate-300 text-base sm:text-lg mb-8 max-w-xl mx-auto">
            Escribe tu hospital o tu comuna y mira en segundos cuánto presupuesto recibió tu red de salud y cómo evolucionó la lista de espera.
          </p>

          {/* Search box */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-center">
              <div className="absolute left-4 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => handleQueryChange(e.target.value)}
                placeholder="Hospital San José, Temuco, Puente Alto..."
                className="w-full pl-12 pr-24 py-4 text-base text-gray-900 bg-white rounded-2xl border-0 shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
                autoComplete="off"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-20 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Limpiar búsqueda"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="absolute right-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 text-white disabled:text-gray-400 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
              >
                Buscar
              </button>
            </div>
          </form>

          {/* Quick links */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {[
              { label: 'Hospital San José', term: 'Hospital San José' },
              { label: 'Temuco', term: 'Temuco' },
              { label: 'Valparaíso', term: 'Hospital Carlos Van Buren' },
              { label: 'Puente Alto', term: 'Puente Alto' },
              { label: 'Concepción', term: 'Concepción' },
            ].map(({ label, term }) => (
              <button
                key={term}
                onClick={() => handleHeroClick(term)}
                className="text-slate-300 hover:text-white text-xs border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-full transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results area */}
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-12 text-gray-400">
            <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Buscando datos públicos...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-6 py-5 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* No results */}
        {searched && !loading && !error && results.length === 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl px-6 py-5">
            <p className="text-amber-800 text-sm font-medium">No encontramos datos para "{query}".</p>
            <p className="text-amber-600 text-sm mt-1">
              Prueba con el nombre del hospital, la comuna o la ciudad. Ejemplos verificados:
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {initialHeroes.map(h => (
                <button
                  key={h.entry.id}
                  onClick={() => handleHeroClick(h.entry.display_nombre)}
                  className="text-amber-700 bg-amber-100 hover:bg-amber-200 text-xs px-3 py-1.5 rounded-full transition-colors"
                >
                  {h.entry.display_nombre}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search results */}
        {!loading && results.length > 0 && (
          <div className="space-y-6">
            {results.length > 1 && (
              <p className="text-gray-500 text-sm">
                Encontramos {results.length} resultado{results.length !== 1 ? 's' : ''} para{' '}
                <span className="font-medium text-gray-800">"{query}"</span>
              </p>
            )}
            {results.map(r => (
              <ResultCard key={r.entry.id} result={r} />
            ))}
          </div>
        )}

        {/* Hero demos when idle */}
        {showHeroes && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-gray-200" />
              <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold whitespace-nowrap">
                Ejemplos verificados
              </p>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
            <div className="space-y-6">
              {initialHeroes.map(r => (
                <ResultCard key={r.entry.id} result={r} />
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-100">
          <div className="text-center space-y-2">
            <p className="text-gray-500 text-xs">
              Datos públicos de{' '}
              <a href="https://www.dipres.gob.cl" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700">DIPRES</a>
              {' '}y{' '}
              <a href="https://visortiemposespera.minsal.cl" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700">MINSAL</a>
              . Proyecto open source, hackathon hack@latam 2025.
            </p>
            <p className="text-gray-400 text-xs">
              El presupuesto corresponde al <strong>Servicio de Salud regional</strong> (fuente DIPRES), no al hospital individual (fuente MINSAL). Son unidades distintas, siempre etiquetadas por separado.
            </p>
            <a
              href="https://github.com/yhonatanwork90/salud-transparente-chile"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors mt-2"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.92.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              Código abierto en GitHub
            </a>
          </div>
        </footer>
      </div>
    </div>
  )
}
