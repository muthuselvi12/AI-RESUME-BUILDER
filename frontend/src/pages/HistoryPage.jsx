import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { historyService } from '../services/api';
import { useToast } from '../context/ToastContext';

const TEMPLATE_COLORS = {
  modern:       '#6366f1',
  classic:      '#1a1a2e',
  minimal:      '#6b7280',
  'ats-optimal':'#059669',
  technical:    '#0891b2',
  executive:    '#7c3aed',
};

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ type, onAction }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.4 }}>
        {type === 'resumes' ? '📄' : '💬'}
      </div>
      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
        {type === 'resumes' ? 'No resumes yet' : 'No chat history yet'}
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '20px' }}>
        {type === 'resumes'
          ? 'Create your first AI-powered resume to see it here'
          : 'Start a conversation with the AI career coach'}
      </p>
      <button
        onClick={onAction}
        style={{ padding: '10px 20px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
      >
        {type === 'resumes' ? '+ Create Resume' : '+ Start Chat'}
      </button>
    </div>
  );
}

// ── Resume Card ───────────────────────────────────────────────────────────────
function ResumeCard({ resume, onDelete, onEdit, onExport }) {
  const [deleting, setDeleting] = useState(false);
  const [hover,    setHover]    = useState(false);
  const color = TEMPLATE_COLORS[resume.template] || '#6366f1';

  const handleDelete = async () => {
    if (!window.confirm('Delete this resume? This cannot be undone.')) return;
    setDeleting(true);
    await onDelete(resume._id);
    setDeleting(false);
  };

  return (
    <div
      style={{
        background: 'var(--bg)',
        border: `1px solid ${hover ? color : 'var(--border)'}`,
        borderRadius: '14px',
        padding: '16px',
        marginBottom: '10px',
        transition: 'all 0.2s ease',
        transform: hover ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: hover ? '0 4px 16px rgba(0,0,0,0.08)' : 'none',
        animation: 'fadeIn 0.3s ease forwards',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>

        {/* Icon */}
        <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
          📄
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {resume.title}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 600, background: `${color}18`, color, textTransform: 'capitalize' }}>
              {resume.template}
            </span>
            {resume.inputData?.name && (
              <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
                👤 {resume.inputData.name}
              </span>
            )}
            <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
              🕐 {new Date(resume.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          <button
            onClick={() => onEdit(resume._id)}
            title="Edit resume"
            style={{ padding: '7px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg2)', cursor: 'pointer', fontSize: '12px', color: 'var(--text)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            ✏️ Edit
          </button>
          <button
            onClick={() => onExport(resume._id)}
            title="Export PDF"
            style={{ padding: '7px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg2)', cursor: 'pointer', fontSize: '12px', color: 'var(--text)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            📄 PDF
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Delete resume"
            style={{ padding: '7px 10px', border: '1px solid #fca5a5', borderRadius: '8px', background: '#fef2f2', cursor: deleting ? 'not-allowed' : 'pointer', fontSize: '12px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px', opacity: deleting ? 0.6 : 1 }}
          >
            {deleting ? '...' : '🗑'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Chat Card ─────────────────────────────────────────────────────────────────
function ChatCard({ chat, onDelete, onOpen }) {
  const [deleting, setDeleting] = useState(false);
  const [hover,    setHover]    = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Delete this chat? This cannot be undone.')) return;
    setDeleting(true);
    await onDelete(chat._id);
    setDeleting(false);
  };

  return (
    <div
      style={{
        background: 'var(--bg)',
        border: `1px solid ${hover ? '#059669' : 'var(--border)'}`,
        borderRadius: '14px',
        padding: '16px',
        marginBottom: '10px',
        transition: 'all 0.2s ease',
        transform: hover ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: hover ? '0 4px 16px rgba(0,0,0,0.08)' : 'none',
        animation: 'fadeIn 0.3s ease forwards',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>

        {/* Icon */}
        <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
          💬
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {chat.title}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
              🕐 {new Date(chat.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 600, background: '#ecfdf5', color: '#059669' }}>
              AI Chat
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          <button
            onClick={() => onOpen(chat._id)}
            style={{ padding: '7px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg2)', cursor: 'pointer', fontSize: '12px', color: 'var(--text)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            → Open
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{ padding: '7px 10px', border: '1px solid #fca5a5', borderRadius: '8px', background: '#fef2f2', cursor: deleting ? 'not-allowed' : 'pointer', fontSize: '12px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px', opacity: deleting ? 0.6 : 1 }}
          >
            {deleting ? '...' : '🗑'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main History Page ─────────────────────────────────────────────────────────
export default function HistoryPage() {
  const { toast }  = useToast();
  const navigate   = useNavigate();

  const [tab,      setTab]     = useState('resumes');
  const [resumes,  setResumes] = useState([]);
  const [chats,    setChats]   = useState([]);
  const [search,   setSearch]  = useState('');
  const [loading,  setLoading] = useState(true);
  const [filter,   setFilter]  = useState('all');
  const [isMobile, setIsMobile]= useState(window.innerWidth < 600);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  // Fetch data
  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      historyService.getResumes(),
      historyService.getChats(),
    ])
      .then(([r, c]) => {
        setResumes(r.data.resumes || []);
        setChats(c.data.chats || []);
      })
      .catch(() => toast('Failed to load history', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Delete resume
  const deleteResume = async (id) => {
    try {
      await historyService.deleteResume(id);
      setResumes(prev => prev.filter(r => r._id !== id));
      toast('Resume deleted');
    } catch {
      toast('Delete failed', 'error');
    }
  };

  // Delete chat
  const deleteChat = async (id) => {
    try {
      await historyService.deleteChat(id);
      setChats(prev => prev.filter(c => c._id !== id));
      toast('Chat deleted');
    } catch {
      toast('Delete failed', 'error');
    }
  };

  // Export resume PDF (navigate to builder with id)
  const exportResume = (id) => {
    navigate(`/builder/${id}`);
    toast('Open the resume and click Export PDF', 'info');
  };

  // Filter + search resumes
  const filteredResumes = resumes.filter(r => {
    const matchSearch = !search ||
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.inputData?.name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || r.template === filter;
    return matchSearch && matchFilter;
  });

  // Filter + search chats
  const filteredChats = chats.filter(c =>
    !search || c.title?.toLowerCase().includes(search.toLowerCase())
  );

  const tabBtn = (active) => ({
    flex: 1,
    padding: '9px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    background: active ? 'var(--bg)' : 'transparent',
    color: active ? 'var(--primary)' : 'var(--text2)',
    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  });

  return (
    <div>

      {/* ── Header ── */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
          📁 History
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text3)' }}>
          All your saved resumes and chat sessions
        </p>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Total Resumes', value: resumes.length,                                                           icon: '📄', color: '#6366f1' },
          { label: 'Total Chats',   value: chats.length,                                                             icon: '💬', color: '#059669' },
          { label: 'This Month',    value: resumes.filter(r => new Date(r.createdAt) > new Date(Date.now() - 30*24*60*60*1000)).length, icon: '📅', color: '#f59e0b' },
          { label: 'Templates',     value: [...new Set(resumes.map(r => r.template))].length,                        icon: '🎨', color: '#7c3aed' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <p style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 500 }}>{s.label}</p>
              <span style={{ fontSize: '18px' }}>{s.icon}</span>
            </div>
            <p style={{ fontSize: '22px', fontWeight: 700, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--bg2)', borderRadius: '10px', padding: '4px', marginBottom: '16px', maxWidth: '340px' }}>
        <button style={tabBtn(tab === 'resumes')} onClick={() => setTab('resumes')}>
          📄 Resumes
          <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '20px', padding: '1px 7px', fontSize: '10px' }}>{resumes.length}</span>
        </button>
        <button style={tabBtn(tab === 'chats')} onClick={() => setTab('chats')}>
          💬 Chats
          <span style={{ background: '#059669', color: '#fff', borderRadius: '20px', padding: '1px 7px', fontSize: '10px' }}>{chats.length}</span>
        </button>
      </div>

      {/* ── Search + Filter ── */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {/* Search bar */}
        <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg)' }}>
          <span style={{ fontSize: '15px', color: 'var(--text3)' }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={tab === 'resumes' ? 'Search resumes...' : 'Search chats...'}
            style={{ flex: 1, border: 'none', background: 'none', color: 'var(--text)', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: '16px', padding: 0 }}>✕</button>
          )}
        </div>

        {/* Template filter — only for resumes tab */}
        {tab === 'resumes' && (
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <option value="all">All Templates</option>
            <option value="modern">Modern</option>
            <option value="classic">Classic</option>
            <option value="minimal">Minimal</option>
            <option value="ats-optimal">ATS Optimal</option>
            <option value="technical">Technical</option>
            <option value="executive">Executive</option>
          </select>
        )}

        {/* Create new button */}
        <button
          onClick={() => navigate(tab === 'resumes' ? '/builder' : '/chat')}
          style={{ padding: '9px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
        >
          {tab === 'resumes' ? '+ New Resume' : '+ New Chat'}
        </button>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <span className="spinner" style={{ width: '28px', height: '28px', borderWidth: '3px' }} />
          <p style={{ color: 'var(--text3)', fontSize: '13px', marginTop: '12px' }}>Loading history...</p>
        </div>
      ) : tab === 'resumes' ? (
        filteredResumes.length === 0 ? (
          <EmptyState
            type="resumes"
            onAction={() => navigate('/builder')}
          />
        ) : (
          <div>
            {search && (
              <p style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '12px' }}>
                Found {filteredResumes.length} result{filteredResumes.length !== 1 ? 's' : ''} for "{search}"
              </p>
            )}
            {filteredResumes.map(r => (
              <ResumeCard
                key={r._id}
                resume={r}
                onDelete={deleteResume}
                onEdit={id => navigate(`/builder/${id}`)}
                onExport={exportResume}
              />
            ))}
          </div>
        )
      ) : (
        filteredChats.length === 0 ? (
          <EmptyState
            type="chats"
            onAction={() => navigate('/chat')}
          />
        ) : (
          <div>
            {search && (
              <p style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '12px' }}>
                Found {filteredChats.length} result{filteredChats.length !== 1 ? 's' : ''} for "{search}"
              </p>
            )}
            {filteredChats.map(c => (
              <ChatCard
                key={c._id}
                chat={c}
                onDelete={deleteChat}
                onOpen={() => navigate('/chat')}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}