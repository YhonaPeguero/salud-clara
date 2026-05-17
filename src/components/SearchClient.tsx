'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import type { SearchResult } from '@/lib/types'
import { formatMillones, formatNumero, formatVariacion } from '@/lib/format'

interface Props {
  initialHeroes: SearchResult[]
}

// ============================================
// UNIQUE VISUAL COMPONENTS
// ============================================

function LiveIndicator() {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-success)] opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-success)]" />
      </span>
      <span className="text-xs font-medium text-[var(--color-success)]">Datos en vivo</span>
    </span>
  )
}

function DataSourceBadge({ source, variant }: { source: string; variant: 'dipres' | 'minsal' }) {
  const colors = {
    dipres: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/20',
    minsal: 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] border-[var(--color-accent)]/20'
  }
  
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${colors[variant]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${variant === 'dipres' ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-accent)]'}`} />
      {source}
    </span>
  )
}

function CircularProgress({ value, size = 80, strokeWidth = 6, color }: { value: number; size?: number; strokeWidth?: number; color: string }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (Math.min(value, 100) / 100) * circumference
  
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-[var(--color-foreground)]">{value.toFixed(0)}%</span>
      </div>
    </div>
  )
}

function MetricCard({ label, value, subvalue, trend, icon }: { label: string; value: string; subvalue?: string; trend?: { value: number; positive: boolean }; icon: React.ReactNode }) {
  return (
    <div className="group relative bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[var(--color-primary)]/5">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-xl bg-[var(--color-muted)] group-hover:bg-[var(--color-primary)]/10 transition-colors">
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trend.positive ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}`}>
            <svg className={`w-3 h-3 ${trend.positive ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            {formatVariacion(Math.abs(trend.value))}
          </div>
        )}
      </div>
      <p className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-[var(--color-foreground)] animate-count-up">{value}</p>
      {subvalue && <p className="text-xs text-[var(--color-muted-foreground)] mt-1">{subvalue}</p>}
    </div>
  )
}

function BudgetBar({ assigned, executed, percentage }: { assigned: string; executed: string; percentage: number }) {
  const getColor = (pct: number) => {
    if (pct >= 90) return 'var(--color-success)'
    if (pct >= 70) return 'var(--color-warning)'
    return 'var(--color-danger)'
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wide">Presupuesto Asignado</p>
          <p className="text-3xl font-bold text-[var(--color-foreground)] mt-1">{assigned}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wide">Ejecutado</p>
          <p className="text-3xl font-bold" style={{ color: getColor(percentage) }}>{executed}</p>
        </div>
      </div>
      
      <div className="relative">
        <div className="h-3 bg-[var(--color-muted)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
            style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: getColor(percentage) }}
          >
            <div className="absolute inset-0 animate-shimmer" />
          </div>
        </div>
        <div 
          className="absolute -top-1 w-0.5 h-5 bg-[var(--color-foreground)]/30"
          style={{ left: '100%', transform: 'translateX(-1px)' }}
        />
      </div>
      
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--color-muted-foreground)]">0%</span>
        <span className="font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${getColor(percentage)}20`, color: getColor(percentage) }}>
          {percentage.toFixed(1)}% ejecutado
        </span>
        <span className="text-[var(--color-muted-foreground)]">100%</span>
      </div>
    </div>
  )
}

function WaitlistMeter({ count, label, trend }: { count: number; label: string; trend: number | null }) {
  const maxCount = 10000
  const percentage = Math.min((count / maxCount) * 100, 100)
  
  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wide">{label}</span>
        {trend !== null && (
          <span className={`text-xs font-semibold ${trend >= 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}`}>
            {trend >= 0 ? '+' : ''}{formatVariacion(trend)} vs. anterior
          </span>
        )}
      </div>
      <div className="flex items-end gap-3">
        <div className="text-4xl font-bold text-[var(--color-foreground)]">
          {formatNumero(count)}
        </div>
        <div className="text-sm text-[var(--color-muted-foreground)] pb-1">personas</div>
      </div>
      <div className="mt-3 flex gap-0.5">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className={`h-8 flex-1 rounded-sm transition-all duration-300 ${
              i < Math.floor(percentage / 5) 
                ? 'bg-[var(--color-accent)]' 
                : 'bg-[var(--color-muted)]'
            }`}
            style={{ 
              opacity: i < Math.floor(percentage / 5) ? 1 - (i * 0.03) : 0.5,
              transitionDelay: `${i * 30}ms`
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ============================================
// RESULT CARD
// ============================================

function ResultCard({ result }: { result: SearchResult }) {
  const { entry, dipres, minsal } = result
  const esComuna = entry.tipo === 'comuna'
  const hospitalNombre = minsal?.nombre ?? entry.display_nombre

  return (
    <article className="animate-fade-up bg-[var(--color-card)] rounded-3xl shadow-xl shadow-[var(--color-foreground)]/5 overflow-hidden border border-[var(--color-border)]">
      {/* Header */}
      <header className="relative bg-[var(--color-surface-dark)] px-6 py-6 overflow-hidden noise-overlay">
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary-muted)]">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {esComuna ? 'Comuna' : 'Hospital'}
              </span>
              <LiveIndicator />
            </div>
            <h2 className="text-white text-xl font-bold leading-tight">{hospitalNombre}</h2>
            <p className="text-white/60 text-sm mt-1 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {entry.region}
            </p>
          </div>
          {entry.es_hero && (
            <span className="shrink-0 bg-[var(--color-primary)] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
              Verificado
            </span>
          )}
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary)]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[var(--color-accent)]/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
      </header>

      {/* Budget Section */}
      <section className="px-6 py-6 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-5">
          <DataSourceBadge source="DIPRES" variant="dipres" />
          <span className="text-[10px] text-[var(--color-muted-foreground)]">Actualizado: {dipres.mes_corte}</span>
        </div>
        
        <p className="text-sm text-[var(--color-muted-foreground)] mb-5 font-medium">
          Red de Salud: {dipres.nombre}
        </p>
        
        <BudgetBar 
          assigned={formatMillones(dipres.presupuesto_vigente_MM)}
          executed={formatMillones(dipres.devengado_MM)}
          percentage={dipres.pct_ejecucion}
        />
      </section>

      {/* Waitlist Section */}
      <section className="px-6 py-6 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-5">
          <DataSourceBadge source="MINSAL" variant="minsal" />
          {minsal && (
            <span className="text-[10px] text-[var(--color-muted-foreground)]">Actualizado: {minsal.fecha_corte}</span>
          )}
        </div>
        
        {minsal ? (
          <div className="space-y-6">
            <WaitlistMeter 
              count={minsal.espera_cirugia} 
              label="Esperando Cirugia"
              trend={minsal.variacion_cirugia_pct}
            />
            <WaitlistMeter 
              count={minsal.espera_consulta_especialidad} 
              label="Esperando Especialidad"
              trend={minsal.variacion_consulta_pct}
            />
          </div>
        ) : (
          <div className="bg-[var(--color-muted)] rounded-2xl p-5 text-center">
            <svg className="w-10 h-10 mx-auto text-[var(--color-muted-foreground)] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
            </svg>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              No hay datos de lista de espera disponibles para este establecimiento.
            </p>
          </div>
        )}
      </section>

      {/* Insight Section */}
      <section className="px-6 py-5 bg-[var(--color-muted)]/50">
        <div className="flex items-start gap-3">
          <div className="shrink-0 p-2 rounded-xl bg-[var(--color-primary)]/10">
            <svg className="w-4 h-4 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)] mb-1">En palabras simples</p>
            <p className="text-sm text-[var(--color-card-foreground)] leading-relaxed">{result.parrafo}</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-4 bg-[var(--color-card)] border-t border-[var(--color-border)]">
        <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] text-[var(--color-muted-foreground)]">
          <a href="https://www.dipres.gob.cl/597/w3-propertyvalue-15131.html" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-primary)] transition-colors flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            DIPRES
          </a>
          <span className="text-[var(--color-border)]">|</span>
          <a href="https://visortiemposespera.minsal.cl/" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-accent)] transition-colors flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            MINSAL
          </a>
        </div>
      </footer>
    </article>
  )
}

// ============================================
// SEARCH INPUT
// ============================================

function SearchInput({ 
  query, 
  onChange, 
  onSubmit, 
  onClear, 
  loading, 
  inputRef 
}: { 
  query: string
  onChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  onClear: () => void
  loading: boolean
  inputRef: React.RefObject<HTMLInputElement | null>
}) {
  return (
    <form onSubmit={onSubmit} className="relative">
      <div className="relative bg-white/95 rounded-xl shadow-lg shadow-black/5 border border-white/60">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          {loading ? (
            <div className="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4 text-[var(--color-muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => onChange(e.target.value)}
          placeholder="Hospital, comuna o ciudad..."
          className="w-full pl-11 pr-32 py-3.5 text-sm text-[var(--color-foreground)] bg-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 placeholder:text-[var(--color-muted-foreground)]"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-[88px] top-1/2 -translate-y-1/2 text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] px-2 py-1 rounded transition-colors"
          >
            Limpiar
          </button>
        )}
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-muted)] disabled:opacity-40 text-white text-xs font-medium px-4 py-2 rounded-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Buscar</span>
        </button>
      </div>
    </form>
  )
}

// ============================================
// QUICK SEARCH TAGS
// ============================================

function QuickSearchTags({ onSelect }: { onSelect: (term: string) => void }) {
  const tags = [
    { label: 'Hospital San Jose', term: 'Hospital San José' },
    { label: 'Temuco', term: 'Temuco' },
    { label: 'Valparaiso', term: 'Hospital Carlos Van Buren' },
    { label: 'Puente Alto', term: 'Puente Alto' },
  ]
  
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
      <span className="text-xs text-white/40">Prueba:</span>
      {tags.map(({ label, term }) => (
        <button
          key={term}
          onClick={() => onSelect(term)}
          className="text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 px-2.5 py-1 rounded-full transition-all duration-200"
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ============================================
// STATS BAR
// ============================================

function StatsBar() {
  return (
    <div className="flex items-center justify-center gap-6 mt-6">
      {[
        { value: '29', label: 'Servicios' },
        { value: '200+', label: 'Hospitales' },
        { value: '2024', label: 'Actualizado' },
      ].map(({ value, label }, i) => (
        <div key={label} className="flex items-center gap-2">
          {i > 0 && <span className="w-1 h-1 rounded-full bg-white/20" />}
          <span className="text-sm font-semibold text-white">{value}</span>
          <span className="text-xs text-white/40">{label}</span>
        </div>
      ))}
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

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
      if (!res.ok) throw new Error('Error en la busqueda')
      const data = await res.json()
      setResults(data.results ?? [])
      setSearched(true)
    } catch {
      setError('No pudimos completar la busqueda. Por favor intenta de nuevo.')
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
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Hero Section */}
      <header className="relative bg-[var(--color-surface-dark)] overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-[var(--color-primary)]/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-[var(--color-accent)]/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 max-w-2xl mx-auto px-4 pt-8 pb-12">
          {/* Top nav with logo */}
          <nav className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-2.5">
              {/* Custom Logo - Pulse/Heart + Shield */}
              <div className="relative w-9 h-9">
                <svg viewBox="0 0 36 36" className="w-full h-full" fill="none">
                  {/* Shield outline */}
                  <path 
                    d="M18 3L4 8v10c0 8.5 6 15 14 18 8-3 14-9.5 14-18V8L18 3z" 
                    fill="var(--color-primary)"
                    fillOpacity="0.15"
                  />
                  <path 
                    d="M18 3L4 8v10c0 8.5 6 15 14 18 8-3 14-9.5 14-18V8L18 3z" 
                    stroke="var(--color-primary)"
                    strokeWidth="1.5"
                    fill="none"
                  />
                  {/* Heartbeat line */}
                  <path 
                    d="M8 18h5l2-4 3 8 2-4h6" 
                    stroke="var(--color-primary)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </div>
              <span className="text-base font-semibold text-white">Salud Transparente</span>
            </div>
            <LiveIndicator />
          </nav>
          
          {/* Headline - more compact */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-3 text-balance">
              Presupuesto y lista de espera de tu hospital
            </h1>
            <p className="text-sm text-white/50 max-w-md mx-auto">
              Datos de DIPRES y MINSAL en lenguaje simple
            </p>
          </div>
          
          {/* Search */}
          <SearchInput
            query={query}
            onChange={handleQueryChange}
            onSubmit={handleSubmit}
            onClear={handleClear}
            loading={loading}
            inputRef={inputRef}
          />
          
          <QuickSearchTags onSelect={handleHeroClick} />
          
          <StatsBar />
        </div>
        
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[var(--color-background)] to-transparent" />
      </header>

      {/* Results Area */}
      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-16 text-[var(--color-muted-foreground)]">
            <div className="relative">
              <div className="w-12 h-12 border-3 border-[var(--color-primary)]/20 rounded-full" />
              <div className="absolute inset-0 w-12 h-12 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-sm">Consultando fuentes oficiales...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-[var(--color-danger)]/5 border border-[var(--color-danger)]/20 rounded-2xl px-6 py-5 text-[var(--color-danger)] text-sm flex items-start gap-3">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{error}</p>
          </div>
        )}

        {/* No Results */}
        {searched && !loading && !error && results.length === 0 && (
          <div className="bg-[var(--color-warning)]/5 border border-[var(--color-warning)]/20 rounded-2xl px-6 py-6">
            <div className="flex items-start gap-3 mb-4">
              <svg className="w-5 h-5 shrink-0 mt-0.5 text-[var(--color-warning)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <p className="text-[var(--color-warning)] font-semibold">Sin resultados para &quot;{query}&quot;</p>
                <p className="text-[var(--color-muted-foreground)] text-sm mt-1">
                  Intenta con el nombre de un hospital, comuna o ciudad.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {initialHeroes.map(h => (
                <button
                  key={h.entry.id}
                  onClick={() => handleHeroClick(h.entry.display_nombre)}
                  className="text-xs bg-[var(--color-warning)]/10 hover:bg-[var(--color-warning)]/20 text-[var(--color-warning)] px-3 py-1.5 rounded-full transition-colors"
                >
                  {h.entry.display_nombre}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results List */}
        {!loading && results.length > 0 && (
          <div className="space-y-8">
            {results.length > 1 && (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                {results.length} resultados para <span className="font-semibold text-[var(--color-foreground)]">&quot;{query}&quot;</span>
              </p>
            )}
            {results.map(r => (
              <ResultCard key={r.entry.id} result={r} />
            ))}
          </div>
        )}

        {/* Hero Demos */}
        {showHeroes && (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-[var(--color-border)]" />
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
                Ejemplos Verificados
              </p>
              <div className="h-px flex-1 bg-[var(--color-border)]" />
            </div>
            <div className="space-y-8">
              {initialHeroes.map(r => (
                <ResultCard key={r.entry.id} result={r} />
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-[var(--color-border)]">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                <path d="M12 2L3 6v6c0 5.5 3.8 10.2 9 12 5.2-1.8 9-6.5 9-12V6l-9-4z" fill="var(--color-primary)" fillOpacity="0.15" stroke="var(--color-primary)" strokeWidth="1.2"/>
                <path d="M5 12h3.5l1.5-3 2 6 1.5-3H17" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-sm font-medium text-[var(--color-foreground)]">Salud Transparente</span>
            </div>
            <p className="text-[11px] text-[var(--color-muted-foreground)] max-w-sm mx-auto">
              Datos de DIPRES y MINSAL. El presupuesto corresponde al Servicio de Salud regional.
            </p>
            <div className="flex items-center justify-center gap-3 text-[11px] text-[var(--color-muted-foreground)]">
              <a href="https://www.dipres.gob.cl" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-primary)] transition-colors">DIPRES</a>
              <span className="w-1 h-1 rounded-full bg-[var(--color-border)]" />
              <a href="https://visortiemposespera.minsal.cl" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-accent)] transition-colors">MINSAL</a>
              <span className="w-1 h-1 rounded-full bg-[var(--color-border)]" />
              <a href="https://github.com/YhonaPeguero/salud-clara" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-foreground)] transition-colors">GitHub</a>
            </div>
            <p className="text-[10px] text-[var(--color-muted-foreground)]/60">
              Hack@LATAM 2025
            </p>
          </div>
        </footer>
      </main>
    </div>
  )
}
