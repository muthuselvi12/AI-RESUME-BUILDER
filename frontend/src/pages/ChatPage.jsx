import React, { useState, useRef, useEffect, useCallback } from 'react';
import { aiService, historyService } from '../services/api';
import { useToast } from '../context/ToastContext';

const SUGGESTIONS = [
  { icon: '📝', text: 'Improve my resume summary' },
  { icon: '💡', text: 'Skills for a frontend developer' },
  { icon: '✉️', text: 'Write a cover letter for React role' },
  { icon: '❓', text: 'How to explain a career gap?' },
  { icon: '🎤', text: 'Interview preparation tips' },
  { icon: '💰', text: 'Salary negotiation advice' },
  { icon: '🎯', text: 'How to pass ATS screening?' },
  { icon: '🔄', text: 'Tips for career change' },
];

// ── Single Message Bubble ─────────────────────────────────────────────────────
function MessageBubble({ msg, onCopy }) {
  const isUser = msg.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.();
    } catch { /* ignore */ }
  };

  // Format AI response — convert **bold** and bullet points
  const formatText = (text) => {
    return text.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <br key={i} />;

      // Bold text **word**
      const parts = trimmed.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      // Bullet points
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
        return (
          <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '3px', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>•</span>
            <span>{parts}</span>
          </div>
        );
      }

      // Numbered list
      if (/^\d+\./.test(trimmed)) {
        return (
          <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '3px', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 700, flexShrink: 0, minWidth: '18px' }}>{trimmed.match(/^\d+/)[0]}.</span>
            <span>{parts}</span>
          </div>
        );
      }

      return <p key={i} style={{ marginBottom: '4px', lineHeight: 1.6 }}>{parts}</p>;
    });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      gap: '4px',
      animation: 'fadeIn 0.3s ease forwards',
    }}>
      {/* Sender label */}
      <span style={{ fontSize: '10px', color: 'var(--text3)', paddingLeft: isUser ? 0 : '4px', paddingRight: isUser ? '4px' : 0 }}>
        {isUser ? 'You' : '🤖 AI Assistant'} · {msg.time}
      </span>

      {/* Bubble */}
      <div style={{
        maxWidth: '80%',
        padding: '10px 14px',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        fontSize: '13px',
        lineHeight: 1.6,
        background: isUser ? 'var(--primary)' : 'var(--bg2)',
        color: isUser ? '#fff' : 'var(--text)',
        border: isUser ? 'none' : '1px solid var(--border)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        position: 'relative',
      }}>
        {isUser ? (
          <p style={{ margin: 0, lineHeight: 1.6 }}>{msg.content}</p>
        ) : (
          <div style={{ margin: 0 }}>{formatText(msg.content)}</div>
        )}

        {/* Copy button — only for AI messages */}
        {!isUser && (
          <button
            onClick={handleCopy}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              marginTop: '8px', padding: '3px 8px',
              border: '1px solid var(--border)', borderRadius: '6px',
              background: 'var(--bg)', cursor: 'pointer',
              fontSize: '10px', color: copied ? '#059669' : 'var(--text3)',
              transition: 'all 0.2s',
            }}
          >
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Typing Indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
      <span style={{ fontSize: '10px', color: 'var(--text3)', paddingLeft: '4px' }}>🤖 AI Assistant</span>
      <div style={{ padding: '12px 16px', borderRadius: '16px 16px 16px 4px', background: 'var(--bg2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}

// ── Main Chat Page ────────────────────────────────────────────────────────────
export default function ChatPage() {
  const { toast } = useToast();
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  const [messages,  setMessages]  = useState([{
    role: 'assistant',
    content: "Hi! I'm your AI career coach 🤖\n\nI can help you with:\n• **Resume improvement** — stronger language and ATS optimization\n• **Skill suggestions** — for any role or industry\n• **Cover letters** — tailored to specific jobs\n• **Interview prep** — common questions and answers\n• **Career advice** — transitions, salary, growth\n\nWhat would you like help with today?",
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [chatId,    setChatId]    = useState(null);
  const [chatList,  setChatList]  = useState([]);
  const [isMobile,  setIsMobile]  = useState(window.innerWidth < 768);
  const [showSidebar, setShowSidebar] = useState(false);

  // Responsive
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Load chat list on mount
  useEffect(() => {
    historyService.getChats()
      .then(r => setChatList(r.data.chats || []))
      .catch(() => {});
  }, []);

  // Send message
  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setInput('');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Add user message immediately
    setMessages(prev => [...prev, { role: 'user', content: msg, time }]);
    setLoading(true);

    try {
      const { data } = await aiService.chat({ message: msg, chatId });
      setChatId(data.chatId);

      // Add AI response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);

      // Refresh chat list
      historyService.getChats()
        .then(r => setChatList(r.data.chats || []))
        .catch(() => {});

    } catch (err) {
      const errMsg = err.response?.data?.error || 'Something went wrong. Please try again.';
      toast(errMsg, 'error');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please check your API key and try again.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, loading, chatId]);

  // Enter key to send
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Load a past chat session
  const loadChat = async (id) => {
    try {
      const { data } = await historyService.getChatById(id);
      const mapped = data.chat.messages.map(m => ({
        role:    m.role,
        content: m.content,
        time:    new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }));
      setMessages(mapped);
      setChatId(id);
      setShowSidebar(false);
    } catch {
      toast('Could not load chat', 'error');
    }
  };

  // Delete a chat session
  const deleteChat = async (e, id) => {
    e.stopPropagation();
    try {
      await historyService.deleteChat(id);
      setChatList(prev => prev.filter(c => c._id !== id));
      if (chatId === id) startNewChat();
      toast('Chat deleted');
    } catch {
      toast('Delete failed', 'error');
    }
  };

  // Start a new chat
  const startNewChat = () => {
    setMessages([{
      role: 'assistant',
      content: "New conversation started! How can I help you with your resume or career today? 🚀",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
    setChatId(null);
    setInput('');
    setShowSidebar(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const sidebarStyle = {
    width: isMobile ? '100%' : '210px',
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flexShrink: 0,
  };

  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      height: 'calc(100vh - 110px)',
      overflow: 'hidden',
      position: 'relative',
    }}>

      {/* ══ SIDEBAR — Chat History ══ */}
      {(!isMobile || showSidebar) && (
        <div style={{
          ...sidebarStyle,
          position: isMobile ? 'absolute' : 'relative',
          top: 0, left: 0, bottom: 0,
          zIndex: isMobile ? 100 : 'auto',
          boxShadow: isMobile ? '4px 0 20px rgba(0,0,0,0.15)' : 'none',
        }}>
          {/* New Chat button */}
          <button
            onClick={startNewChat}
            style={{ width: '100%', padding: '9px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            ✏️ New Chat
          </button>

          <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
            Recent Chats
          </p>

          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {chatList.length === 0 ? (
              <p style={{ fontSize: '11px', color: 'var(--text3)', textAlign: 'center', marginTop: '20px', lineHeight: 1.6 }}>
                No chat history yet.<br />Start a conversation!
              </p>
            ) : (
              chatList.map(c => (
                <div
                  key={c._id}
                  onClick={() => loadChat(c._id)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: chatId === c._id ? 'var(--primary-light)' : 'transparent',
                    border: `1px solid ${chatId === c._id ? 'var(--primary)' : 'transparent'}`,
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    group: 'chat-item',
                  }}
                  onMouseEnter={e => { if (chatId !== c._id) e.currentTarget.style.background = 'var(--bg3)'; }}
                  onMouseLeave={e => { if (chatId !== c._id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '12px', color: chatId === c._id ? 'var(--primary)' : 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: chatId === c._id ? 600 : 400 }}>
                      {c.title}
                    </p>
                    <p style={{ fontSize: '10px', color: 'var(--text3)' }}>
                      {new Date(c.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={e => deleteChat(e, c._id)}
                    style={{ flexShrink: 0, width: '22px', height: '22px', borderRadius: '4px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}
                    title="Delete chat"
                  >🗑</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Mobile overlay to close sidebar */}
      {isMobile && showSidebar && (
        <div
          onClick={() => setShowSidebar(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99 }}
        />
      )}

      {/* ══ MAIN CHAT AREA ══ */}
      <div style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Chat header */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isMobile && (
              <button onClick={() => setShowSidebar(s => !s)} style={{ padding: '5px 8px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg2)', cursor: 'pointer', fontSize: '13px' }}>
                ☰
              </button>
            )}
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🤖</div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>AI Career Coach</p>
              <p style={{ fontSize: '10px', color: loading ? '#f59e0b' : '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: loading ? '#f59e0b' : '#10b981', display: 'inline-block' }} />
                {loading ? 'Thinking...' : 'Online'}
              </p>
            </div>
          </div>
          <button
            onClick={startNewChat}
            style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg2)', cursor: 'pointer', fontSize: '11px', color: 'var(--text2)', fontWeight: 500 }}
          >
            ✏️ New Chat
          </button>
        </div>

        {/* Quick suggestion chips */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '6px', overflowX: 'auto', flexShrink: 0 }}>
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => sendMessage(s.text)}
              disabled={loading}
              style={{ padding: '5px 12px', border: '1px solid var(--border)', borderRadius: '20px', background: 'var(--bg2)', color: 'var(--text2)', fontSize: '11px', cursor: loading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s', opacity: loading ? 0.5 : 1 }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg2)'; e.currentTarget.style.color = 'var(--text2)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <span>{s.icon}</span> {s.text}
            </button>
          ))}
        </div>

        {/* Messages area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {messages.map((m, i) => (
            <MessageBubble
              key={i}
              msg={m}
              onCopy={() => toast('Copied to clipboard!')}
            />
          ))}

          {/* Typing indicator */}
          {loading && <TypingIndicator />}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border)', background: 'var(--bg)', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your resume, career advice, interview tips... (Enter to send, Shift+Enter for new line)"
              rows={2}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                background: 'var(--bg2)',
                color: 'var(--text)',
                fontSize: '13px',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                maxHeight: '120px',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                padding: '10px 18px',
                background: loading || !input.trim() ? 'var(--bg3)' : 'var(--primary)',
                color: loading || !input.trim() ? 'var(--text3)' : '#fff',
                border: 'none',
                borderRadius: '10px',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
                alignSelf: 'flex-end',
                transition: 'all 0.2s',
              }}
            >
              {loading
                ? <><span className="spinner" /> Thinking</>
                : <>Send ↑</>
              }
            </button>
          </div>
          <p style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '6px', textAlign: 'center' }}>
            Enter to send · Shift+Enter for new line · Powered by Google Gemini AI
          </p>
        </div>
      </div>
    </div>
  );
}