'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { HologramAvatar } from './HologramAvatar'
import styles from './HolographicMedicalAgent.module.css'

type SpeechRecognitionAlternativeLike = {
  transcript: string
}

type SpeechRecognitionResultLike = {
  readonly length: number
  readonly isFinal: boolean
  [index: number]: SpeechRecognitionAlternativeLike
}

type SpeechRecognitionEventLike = Event & {
  resultIndex: number
  results: {
    readonly length: number
    [index: number]: SpeechRecognitionResultLike
  }
}

type SpeechRecognitionErrorEventLike = Event & {
  error?: string
}

type SpeechRecognitionLike = EventTarget & {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

const chatTransport = new DefaultChatTransport({ api: '/api/chat' })
const AGENT_NAME = 'K-milla'
const LOCALE = 'es-CL'
const WELCOME_TEXT = 'Hola, soy el asistente holográfico de K-milla. Puedo ayudarte a entender presupuesto DIPRES y listas de espera MINSAL usando solo los datos oficiales cargados.'

const suggestedQuestions = [
  '¿Cuánto presupuesto recibió el Servicio Metropolitano Norte?',
  '¿Qué Servicio de Salud ejecutó casi todo su presupuesto en 2024?',
  'Explica qué es el presupuesto vigente',
]

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter(part => part.type === 'text')
    .map(part => part.text)
    .join('')
}

function useTypewriter(text: string, textKey: string, speed = 18) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const targetRef = useRef(text)
  const displayedRef = useRef('')
  const skipRef = useRef(false)

  useEffect(() => {
    skipRef.current = false
    targetRef.current = text
    displayedRef.current = ''
    setDisplayed('')
    setDone(text.length === 0)
    // Reset only when a different assistant message starts streaming.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textKey])

  useEffect(() => {
    targetRef.current = text

    if (!text) {
      displayedRef.current = ''
      setDisplayed('')
      setDone(true)
      return
    }

    if (skipRef.current) {
      displayedRef.current = text
      setDisplayed(text)
      setDone(true)
      return
    }

    let cancelled = false
    let timeoutId: number | null = null

    const tick = () => {
      if (cancelled) return

      const target = targetRef.current
      const current = displayedRef.current

      if (skipRef.current || current === target) {
        displayedRef.current = target
        setDisplayed(target)
        setDone(true)
        return
      }

      const next = target.startsWith(current)
        ? target.slice(0, current.length + 1)
        : target.slice(0, Math.min(target.length, current.length + 1))

      displayedRef.current = next
      setDisplayed(next)
      setDone(next === target)

      if (next !== target) {
        timeoutId = window.setTimeout(tick, speed)
      }
    }

    setDone(displayedRef.current === text)
    timeoutId = window.setTimeout(tick, speed)

    return () => {
      cancelled = true
      if (timeoutId != null) window.clearTimeout(timeoutId)
    }
  }, [text, speed])

  const skip = useCallback(() => {
    skipRef.current = true
    displayedRef.current = targetRef.current
    setDisplayed(targetRef.current)
    setDone(true)
  }, [])

  return { displayed, done, skip }
}

export function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const transcriptRef = useRef('')
  const historyEndRef = useRef<HTMLDivElement | null>(null)
  const spokenMessageIdRef = useRef<string | null>(null)

  const { messages, sendMessage, status, setMessages, error, clearError } = useChat({
    transport: chatTransport,
  })

  const isThinking = status === 'submitted' || status === 'streaming'
  const lastMessage = messages[messages.length - 1]
  const showThinkingDots = isThinking && lastMessage?.role === 'user'

  const latestAssistantMessage = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index]?.role === 'assistant') return messages[index]
    }
    return null
  }, [messages])

  const lastUserMessage = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index]?.role === 'user') return messages[index]
    }
    return null
  }, [messages])

  const latestAssistantText = latestAssistantMessage ? getMessageText(latestAssistantMessage) : WELCOME_TEXT
  const latestAssistantKey = latestAssistantMessage?.id ?? 'welcome'
  const typewriter = useTypewriter(latestAssistantText, latestAssistantKey)

  const supportsSpeechRecognition = useMemo(() => {
    if (typeof window === 'undefined') return false
    return Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition)
  }, [])

  const supportsSpeechSynthesis = useMemo(() => {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
  }, [])

  useEffect(() => {
    if (showHistory) {
      historyEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages, showHistory, isThinking])

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const openAgent = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeAgent = useCallback(() => {
    recognitionRef.current?.abort()
    recognitionRef.current = null
    setIsListening(false)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
    setShowHistory(false)
    setIsOpen(false)
  }, [])

  const speak = useCallback((text: string) => {
    if (!voiceOutputEnabled || !supportsSpeechSynthesis) return

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = LOCALE
    utterance.rate = 0.98
    utterance.pitch = 1.02

    const voices = window.speechSynthesis.getVoices()
    const preferredVoice =
      voices.find(voice => voice.lang.toLowerCase() === LOCALE.toLowerCase()) ??
      voices.find(voice => voice.lang.toLowerCase().startsWith('es-cl')) ??
      voices.find(voice => voice.lang.toLowerCase().startsWith('es'))

    if (preferredVoice) utterance.voice = preferredVoice

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }, [supportsSpeechSynthesis, voiceOutputEnabled])

  useEffect(() => {
    if (!latestAssistantMessage || isThinking || latestAssistantMessage.id === spokenMessageIdRef.current) return

    spokenMessageIdRef.current = latestAssistantMessage.id
    speak(getMessageText(latestAssistantMessage))
  }, [isThinking, latestAssistantMessage, speak])

  const submitQuestion = useCallback(async (question: string) => {
    const value = question.trim()
    if (!value || isThinking) return

    openAgent()
    clearError()
    setNotice(null)
    setInput('')

    try {
      await sendMessage({ text: value })
    } catch {
      setNotice('No pudimos completar la respuesta. Verifica MINIMAX_API_KEY o intenta de nuevo.')
    }
  }, [clearError, isThinking, openAgent, sendMessage])

  const submit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void submitQuestion(input)
  }, [input, submitQuestion])

  const clearChat = useCallback(() => {
    clearError()
    setNotice(null)
    setShowHistory(false)
    setMessages([])
    spokenMessageIdRef.current = null
  }, [clearError, setMessages])

  const toggleVoiceOutput = useCallback(() => {
    if (!supportsSpeechSynthesis) {
      setNotice('Este navegador no soporta salida de voz. Puedes seguir usando texto.')
      return
    }

    setNotice(null)
    setVoiceOutputEnabled((enabled) => {
      if (enabled) {
        window.speechSynthesis.cancel()
        setIsSpeaking(false)
      }
      return !enabled
    })
  }, [supportsSpeechSynthesis])

  const toggleListening = useCallback(() => {
    if (!supportsSpeechRecognition) {
      setNotice('Este navegador no soporta entrada por voz. Puedes escribir tu consulta.')
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!Recognition) {
      setNotice('Este navegador no soporta entrada por voz. Puedes escribir tu consulta.')
      return
    }

    openAgent()
    setNotice(null)
    transcriptRef.current = ''

    const recognition = new Recognition()
    recognition.lang = LOCALE
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      let interimTranscript = ''
      let finalTranscript = transcriptRef.current

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        const transcript = result[0]?.transcript ?? ''
        if (result.isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      transcriptRef.current = finalTranscript
      setInput(`${finalTranscript}${interimTranscript}`.trimStart())
    }

    recognition.onerror = (event) => {
      setNotice(
        event.error === 'not-allowed'
          ? 'El navegador bloqueó el micrófono. Puedes escribir tu consulta.'
          : 'No pude capturar audio con claridad. Puedes intentarlo de nuevo o escribir.',
      )
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      const finalText = transcriptRef.current.trim()
      if (finalText) void submitQuestion(finalText)
    }

    recognitionRef.current = recognition
    setIsListening(true)
    recognition.start()
  }, [isListening, openAgent, submitQuestion, supportsSpeechRecognition])

  const handleDialogClick = useCallback(() => {
    if (!typewriter.done) typewriter.skip()
  }, [typewriter])

  const displayedNotice = notice ?? (error ? 'No pudimos completar la respuesta. Verifica MINIMAX_API_KEY o intenta de nuevo.' : null)

  return (
    <div
      className={[styles.agentShell, isOpen ? styles.active : styles.idle, styles.right].join(' ')}
      data-holographic-medical-agent="true"
    >
      {isOpen ? <div className={styles.backdrop} onClick={closeAgent} aria-hidden="true" /> : null}

      <div className={styles.stage}>
        <div className={styles.figureWrap}>
          <button
            type="button"
            className={styles.figureButton}
            onClick={openAgent}
            disabled={isOpen}
            aria-label={isOpen ? 'Holograma activo' : 'Abrir asistente holográfico'}
          >
            <div className={styles.figureCanvas}>
              <HologramAvatar
                active={isOpen}
                listening={isListening}
                speaking={isSpeaking}
                thinking={isThinking}
              />
            </div>
            {!isOpen ? <span className={styles.idleLabel}>Asistente</span> : null}
          </button>
        </div>

        {isOpen ? (
          <div className={styles.dialogArea}>
            <button type="button" className={styles.closeBtn} onClick={closeAgent} aria-label="Cerrar agente">
              X
            </button>

            <div className={styles.statusChip} aria-live="polite">
              <span className={styles.statusDot} data-active={isListening || isSpeaking || isThinking} />
              {isListening
                ? 'Escuchando...'
                : isSpeaking
                  ? 'Hablando...'
                  : isThinking
                    ? 'Pensando...'
                    : 'En línea'}
            </div>

            {lastUserMessage && isThinking ? (
              <div className={styles.userBubble}>
                <span>Tú</span>
                <p>{getMessageText(lastUserMessage)}</p>
              </div>
            ) : null}

            <div
              className={styles.dialogBox}
              onClick={handleDialogClick}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  handleDialogClick()
                }
              }}
            >
              <div className={styles.namePlate}>{AGENT_NAME}</div>
              <div className={styles.dialogText} aria-live="polite">
                {showThinkingDots ? (
                  <span className={styles.thinkingDots} aria-label="Pensando">
                    <i />
                    <i />
                    <i />
                  </span>
                ) : (
                  <p>
                    {typewriter.displayed}
                    {!typewriter.done ? <span className={styles.caret}>|</span> : null}
                  </p>
                )}
              </div>
              {typewriter.done && !isThinking ? <span className={styles.chevron}>v</span> : null}
            </div>

            {displayedNotice ? <p className={styles.notice}>{displayedNotice}</p> : null}

            {messages.length === 0 && !isThinking ? (
              <div className={styles.suggestions}>
                {suggestedQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    className={styles.suggestionBtn}
                    onClick={() => void submitQuestion(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            ) : null}

            {messages.length > 1 ? (
              <div className={styles.historyActions}>
                <button
                  type="button"
                  className={styles.historyToggle}
                  onClick={() => setShowHistory((current) => !current)}
                >
                  {showHistory ? 'Ocultar conversación' : 'Ver conversación completa'}
                </button>
                <button type="button" className={styles.historyToggle} onClick={clearChat}>
                  Limpiar
                </button>
              </div>
            ) : null}

            {showHistory ? (
              <div className={styles.history} role="log" aria-live="polite">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={message.role === 'assistant' ? styles.historyAssistant : styles.historyUser}
                  >
                    <span>{message.role === 'assistant' ? AGENT_NAME : 'Tú'}</span>
                    <p>{getMessageText(message)}</p>
                  </div>
                ))}
                <div ref={historyEndRef} />
              </div>
            ) : null}

            <form className={styles.composer} onSubmit={submit}>
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Escribe tu consulta..."
                aria-label="Escribe tu consulta"
                className={styles.input}
                disabled={isThinking}
              />
              <button
                type="button"
                className={styles.iconBtn}
                onClick={toggleVoiceOutput}
                data-active={voiceOutputEnabled}
                aria-label={voiceOutputEnabled ? 'Silenciar voz' : 'Activar voz'}
                title={voiceOutputEnabled ? 'Silenciar voz' : 'Activar voz'}
              >
                Voz
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={toggleListening}
                data-active={isListening}
                aria-label={isListening ? 'Detener micrófono' : 'Hablar'}
                title={isListening ? 'Detener micrófono' : 'Hablar'}
              >
                Mic
              </button>
              <button type="submit" className={styles.sendBtn} disabled={!input.trim() || isThinking}>
                Enviar
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  )
}
