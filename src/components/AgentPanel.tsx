'use client'

import { useChat } from '@ai-sdk/react'
import { useState, useRef, useEffect } from 'react'

interface AgentPanelProps {
  isOpen: boolean
  onClose: () => void
}

// Mascot icon (same as SearchClient)
function MascotIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none">
      <path 
        d="M16 2L4 6v9c0 7.5 5 13 12 16 7-3 12-8.5 12-16V6L16 2z" 
        fill="var(--color-primary)"
        fillOpacity="0.12"
      />
      <path 
        d="M16 2L4 6v9c0 7.5 5 13 12 16 7-3 12-8.5 12-16V6L16 2z" 
        stroke="var(--color-primary)"
        strokeWidth="1.5"
        fill="none"
      />
      <path 
        d="M7 15h4l2-4 3 8 2-4h5" 
        stroke="var(--color-primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

export function AgentPanel({ isOpen, onClose }: AgentPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  
  const { messages, input = '', handleInputChange, handleSubmit, isLoading, setMessages, error } = useChat({
    api: '/api/chat',
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const suggestedQuestions = [
    'Cual hospital tiene mas lista de espera?',
    'Que servicio de salud tiene mejor ejecucion presupuestaria?',
    'Como se relaciona el presupuesto con la lista de espera?',
    'Explica que significa el porcentaje de ejecucion',
  ]

  const handleSuggestion = (question: string) => {
    if (inputRef.current) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
      nativeInputValueSetter?.call(inputRef.current, question)
      inputRef.current.dispatchEvent(new Event('input', { bubbles: true }))
      setTimeout(() => {
        const form = inputRef.current?.closest('form')
        form?.requestSubmit()
      }, 50)
    }
  }

  const clearChat = () => {
    setMessages([])
    stopSpeaking()
  }

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      stopSpeaking()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'es-CL'
      utterance.rate = 0.9
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      window.speechSynthesis.speak(utterance)
      setIsSpeaking(true)
    }
  }

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        className="w-full max-w-lg bg-[var(--color-card)] rounded-2xl shadow-2xl shadow-black/20 border border-[var(--color-border)] flex flex-col max-h-[80vh] animate-fade-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <MascotIcon className="w-7 h-7" />
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Preguntar a los datos</h2>
              <p className="text-[10px] text-[var(--color-muted-foreground)]">Consulta sobre presupuesto y listas de espera</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] px-2 py-1 rounded transition-colors"
              >
                Limpiar
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] rounded-lg transition-colors"
              aria-label="Cerrar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[300px]">
          {messages.length === 0 && !isLoading ? (
            <div className="space-y-4">
              {/* Empty state with mascot */}
              <div className="flex flex-col items-center py-6">
                <MascotIcon className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm text-[var(--color-muted-foreground)] text-center">
                  Preguntame sobre hospitales, presupuestos o listas de espera
                </p>
              </div>
              
              {/* Suggested questions */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">Preguntas sugeridas</p>
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestion(q)}
                    className="w-full text-left text-sm text-[var(--color-card-foreground)] bg-[var(--color-muted)]/50 hover:bg-[var(--color-muted)] px-4 py-3 rounded-xl transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="shrink-0 mr-2 mt-1">
                      <MascotIcon className="w-5 h-5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      message.role === 'user'
                        ? 'bg-[var(--color-primary)] text-white rounded-br-md'
                        : 'bg-[var(--color-muted)] text-[var(--color-card-foreground)] rounded-bl-md'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              
              {/* Loading state */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="shrink-0 mr-2 mt-1">
                    <MascotIcon className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="bg-[var(--color-muted)] px-4 py-3 rounded-2xl rounded-bl-md">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-[var(--color-muted-foreground)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-[var(--color-muted-foreground)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-[var(--color-muted-foreground)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="mx-5 mb-3 px-4 py-3 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-xl text-sm text-[var(--color-danger)]">
            Error al procesar la consulta. Por favor intenta de nuevo.
          </div>
        )}

        {/* Source badges + Listen button */}
        {lastAssistantMessage && !isLoading && (
          <div className="px-5 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">Fuentes:</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded-full">
                DIPRES 2024
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-2 py-0.5 rounded-full">
                MINSAL 2024
              </span>
            </div>
            <button
              onClick={() => isSpeaking ? stopSpeaking() : speakText(lastAssistantMessage.content)}
              className="flex items-center gap-1.5 text-[10px] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] px-2 py-1 rounded transition-colors"
            >
              {isSpeaking ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  Detener
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                  Escuchar
                </>
              )}
            </button>
          </div>
        )}

        {/* Input */}
        <form 
          onSubmit={handleSubmit} 
          className="p-4 border-t border-[var(--color-border)]"
        >
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              name="chat-input"
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Escribe tu pregunta..."
              className="flex-1 text-sm px-4 py-3 bg-[var(--color-muted)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-transparent text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input?.trim()}
              className="p-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-muted)] disabled:opacity-40 text-white rounded-xl transition-colors disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
