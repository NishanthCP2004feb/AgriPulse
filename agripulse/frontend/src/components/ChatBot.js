import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * BCP-47 locale codes for the Web Speech API.
 * Maps our language codes to the proper recognition locale.
 */
const SPEECH_LOCALES = {
  en: 'en-IN',
  hi: 'hi-IN',
  kn: 'kn-IN',
  ta: 'ta-IN',
  te: 'te-IN',
};

/**
 * ChatBot – Floating chatbot widget for AgriPulse.
 *
 * Features:
 *  - Bottom-right floating action button that opens a popup chat window
 *  - **In-chat language switcher** — switch language without leaving the chat
 *  - **Voice input** — microphone button with Web Speech API recognition
 *  - Language change inserts a system notice + updates all UI text instantly
 *  - Sends user messages + selected language code to POST /chatbot
 *  - Gemini responds in the currently selected language
 *  - Quick-action buttons for common farmer queries
 *  - "New Chat" button to reset the conversation
 *  - Auto-scrolls to latest message
 *
 * Props:
 *  - latestResults: optional array of soil analysis results from the main app
 */
function ChatBot({ latestResults }) {
  const { t, lang, setLang, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const prevLangRef = useRef(lang);

  // ── Voice input state ───────────────────────────────────────
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef(null);

  // ── Check Web Speech API support on mount ───────────────────
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognitionRef.current = recognition;
    }
  }, []);

  // ── Update speech recognition language when lang changes ────
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = SPEECH_LOCALES[lang] || 'en-IN';
    }
  }, [lang]);

  // ── Show welcome message when chat opens ────────────────────
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: 'bot', text: t('chat_welcome') }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── On language change: insert a translated system notice ───
  useEffect(() => {
    if (prevLangRef.current !== lang && messages.length > 0) {
      setMessages((prev) => [
        ...prev,
        { role: 'system', text: t('chat_lang_changed') },
      ]);
    }
    prevLangRef.current = lang;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // ── Auto-scroll to bottom on new messages ───────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ── Focus input when chat opens ─────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  /**
   * Send a message to the backend chatbot endpoint.
   */
  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim()) return;

      const userMsg = { role: 'user', text: text.trim() };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setLoading(true);

      try {
        // Build optional soil context from latest results
        let soilContext = null;
        if (latestResults && latestResults.length > 0) {
          soilContext = latestResults[0]; // use first sample as context
        }

        const res = await axios.post(`${API_URL}/chatbot`, {
          language: lang,
          message: text.trim(),
          soil_context: soilContext,
        });

        setMessages((prev) => [
          ...prev,
          { role: 'bot', text: res.data.response },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          { role: 'bot', text: t('chat_error'), isError: true },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [lang, latestResults, t]
  );

  /**
   * Reset the conversation.
   */
  const resetChat = () => {
    setMessages([{ role: 'bot', text: t('chat_welcome') }]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  /**
   * Handle in-chat language change.
   */
  const handleLangChange = (e) => {
    // Stop listening if active when language changes
    if (isListening && recognitionRef.current) {
      recognitionRef.current.abort();
      setIsListening(false);
    }
    setLang(e.target.value);
  };

  // ── Voice input: start / stop toggle ────────────────────────
  const toggleVoice = useCallback(() => {
    if (!voiceSupported || !recognitionRef.current) {
      setMessages((prev) => [
        ...prev,
        { role: 'system', text: t('voice_not_supported') },
      ]);
      return;
    }

    const recognition = recognitionRef.current;

    if (isListening) {
      // Stop listening
      recognition.stop();
      setIsListening(false);
      return;
    }

    // Start listening
    recognition.lang = SPEECH_LOCALES[lang] || 'en-IN';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      // Gather all results (including interim)
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);

      // If the result is final, auto-send
      const lastResult = event.results[event.results.length - 1];
      if (lastResult.isFinal) {
        setIsListening(false);
        if (transcript.trim()) {
          // Small delay so user sees the text before it sends
          setTimeout(() => sendMessage(transcript.trim()), 300);
        }
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error === 'no-speech' || event.error === 'aborted') {
        // Silently ignore — user just didn't speak or cancelled
        return;
      }
      const errorKey =
        event.error === 'not-allowed'
          ? 'voice_error'
          : 'voice_no_match';
      setMessages((prev) => [
        ...prev,
        { role: 'system', text: t(errorKey) },
      ]);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (err) {
      // Already started — ignore
      setIsListening(false);
    }
  }, [voiceSupported, isListening, lang, t, sendMessage]);

  // ── Quick-action definitions ────────────────────────────────
  const quickActions = [
    ...(latestResults && latestResults.length > 0
      ? [{ key: 'chat_explain', icon: '📊' }]
      : []),
    { key: 'chat_quick_nitrogen', icon: '🌿' },
    { key: 'chat_quick_phosphorus', icon: '🌸' },
    { key: 'chat_quick_ph', icon: '🧪' },
    { key: 'chat_quick_fertilizer', icon: '🧑‍🌾' },
    { key: 'chat_quick_disease', icon: '🦠' },
    { key: 'chat_quick_pest', icon: '🐛' },
    { key: 'chat_quick_irrigation', icon: '💧' },
  ];

  return (
    <>
      {/* ── Floating Chat Icon ──────────────────────────────── */}
      {!isOpen && (
        <button
          className="chatbot-fab"
          onClick={() => setIsOpen(true)}
          title={t('chat_open')}
          aria-label={t('chat_open')}
        >
          <span className="chatbot-fab-icon">💬</span>
        </button>
      )}

      {/* ── Chat Window ─────────────────────────────────────── */}
      {isOpen && (
        <div className="chatbot-window">
          {/* ─── Header with language switcher ───────────────── */}
          <div className="chatbot-header">
            <div className="chatbot-header-left">
              <span className="chatbot-header-icon">🌱</span>
              <span className="chatbot-header-title">{t('chat_title')}</span>
            </div>
            <div className="chatbot-header-right">
              {/* In-chat language switcher */}
              <select
                className="chatbot-lang-select"
                value={lang}
                onChange={handleLangChange}
                aria-label={t('language')}
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nativeLabel}
                  </option>
                ))}
              </select>
              {/* New chat button */}
              <button
                className="chatbot-new-btn"
                onClick={resetChat}
                title={t('chat_new')}
                aria-label={t('chat_new')}
              >
                🔄
              </button>
              {/* Close button */}
              <button
                className="chatbot-close"
                onClick={() => setIsOpen(false)}
                aria-label={t('chat_close')}
              >
                ✕
              </button>
            </div>
          </div>

          {/* ─── Messages Area ───────────────────────────────── */}
          <div className="chatbot-messages">
            {messages.map((msg, idx) => {
              // System messages (e.g. language change notice)
              if (msg.role === 'system') {
                return (
                  <div key={idx} className="chatbot-system-msg">
                    <span>🌐 {msg.text}</span>
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  className={`chatbot-msg ${
                    msg.role === 'user' ? 'chatbot-msg-user' : 'chatbot-msg-bot'
                  } ${msg.isError ? 'chatbot-msg-error' : ''}`}
                >
                  {msg.role === 'bot' && (
                    <span className="chatbot-avatar">🤖</span>
                  )}
                  <div className="chatbot-bubble">{msg.text}</div>
                  {msg.role === 'user' && (
                    <span className="chatbot-avatar">👤</span>
                  )}
                </div>
              );
            })}

            {/* Typing indicator */}
            {loading && (
              <div className="chatbot-msg chatbot-msg-bot">
                <span className="chatbot-avatar">🤖</span>
                <div className="chatbot-bubble chatbot-typing">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ─── Quick Actions ───────────────────────────────── */}
          <div className="chatbot-quick-actions">
            {quickActions.map((qa) => (
              <button
                key={qa.key}
                className="chatbot-quick-btn"
                onClick={() => sendMessage(t(qa.key))}
                disabled={loading}
              >
                {qa.icon} {t(qa.key)}
              </button>
            ))}
          </div>

          {/* ─── Input Area ──────────────────────────────────── */}
          <div className="chatbot-input-area">
            <input
              ref={inputRef}
              type="text"
              className="chatbot-input"
              placeholder={
                isListening ? t('voice_listening') : t('chat_placeholder')
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading || isListening}
            />
            {/* Mic button */}
            {voiceSupported && (
              <button
                className={`chatbot-mic ${isListening ? 'chatbot-mic-active' : ''}`}
                onClick={toggleVoice}
                disabled={loading}
                title={isListening ? t('voice_stop') : t('voice_start')}
                aria-label={isListening ? t('voice_stop') : t('voice_start')}
              >
                {isListening ? (
                  <span className="mic-icon mic-on">⏹</span>
                ) : (
                  <span className="mic-icon">🎤</span>
                )}
              </button>
            )}
            <button
              className="chatbot-send"
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim() || isListening}
              aria-label={t('chat_send')}
            >
              {t('chat_send')}
            </button>
          </div>

          {/* ─── Footer ──────────────────────────────────────── */}
          <div className="chatbot-footer">
            <span>{t('chat_powered_by')}</span>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatBot;
