import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';
import './UserDashboard.css';
import FlashcardViewer from '../Components/FlashcardViewer';
import DocumentViewer from '../Components/DocumentViewer';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const AGENTS = [
  { id: 'general', name: 'General', desc: 'General assistant' },
  { id: 'legal', name: 'Legal', desc: 'Legal document analysis' },
  { id: 'education', name: 'Education', desc: 'Learning & flashcards' },
  { id: 'finance', name: 'Finance', desc: 'Portfolio & investments' },
];
const DEMO_MODE = import.meta?.env?.VITE_DEMO_MODE === 'true';

const Svg = ({ children, size = 18, className, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
  stroke="currentColor" strokeWidth="2" className={className} {...rest}>{children}</svg>
);
const SendIcon = () => (
  <Svg strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </Svg>
);
const PlusIcon   = () => <Svg><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Svg>;
const BotIcon    = () => <Svg size={16}><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="3"/></Svg>;
const UserIcon   = () => <Svg size={20}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Svg>;
const MenuIcon   = () => <Svg><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></Svg>;
const ClipIcon   = () => <Svg><path d="M21.44 11.05l-9.19 9.19a5 5 0 0 1-7.07-7.07l9.19-9.19a3 3 0 0 1 4.24 4.24l-9.2 9.19a1 1 0 0 1-1.42-1.42l8.49-8.48"/></Svg>;
const XIcon      = () => <Svg size={13}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Svg>;
const FileIcon   = () => <Svg size={14}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></Svg>;
const LogoutIcon = () => <Svg size={16}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Svg>;
const ChatIcon   = () => <Svg size={14}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Svg>;
const PencilIcon = () => <Svg size={13}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Svg>;
const TrashIcon  = () => <Svg size={13}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></Svg>;
const CheckIcon  = () => <Svg size={13}><polyline points="20 6 9 17 4 12"/></Svg>;
const ChevronLeftIcon = () => <Svg><polyline points="15 18 9 12 15 6"/></Svg>;
const FileTextIcon = () => <Svg><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><path d="M10 9 9 9 8 9"/></Svg>;
const SearchIcon = () => <Svg size={14}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Svg>;

const fmtBytes = (b) => !b ? '' : b < 1024 ? `${b}B` : b < 1048576 ? `${(b/1024).toFixed(1)}KB` : `${(b/1048576).toFixed(1)}MB`;

const fmtDate = (d) => {
  if (!d) return '';
  const dt = new Date(d), now = new Date();
  if (dt.toDateString() === now.toDateString())
    return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return dt.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const sessionLabel = (s) => {
  if (s?.title) return s.title;
  const m = s?.lastMessage?.message;
  if (m) return m.length > 32 ? m.slice(0, 32) + '…' : m;
  return `Chat ${(s?.sessionId || '').slice(0, 8)}`;
};

const Dots = () => <span className="dots"><span/><span/><span/></span>;

const FileChip = ({ file, progress, onRemove }) => (
  <div className="chip">
    <FileIcon/>
    <span className="chip-name">{file.name}</span>
    {file.size !== undefined && <span className="chip-sz">{fmtBytes(file.size)}</span>}
    {progress !== undefined && progress < 100 && (
      <div className="chip-progress">
        <div className="chip-progress-bar" style={{ width: `${progress}%` }}/>
      </div>
    )}
    {onRemove && <button className="chip-x" onClick={onRemove}><XIcon/></button>}
  </div>
);

const BotMsg = ({ text }) => {
  if (!text) return null;
  return (
    <div className="bot-markdown">
      <Markdown components={{
        p: ({node, ...props}) => <p style={{margin: 0, marginBottom: '8px'}} {...props} />,
        br: () => <br />,
      }}>
        {text}
      </Markdown>
    </div>
  );
};

const extractFlashcards = (text) => {
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].question) {
        return parsed;
      }
    }
    if (text.trim().startsWith('[')) {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed[0]?.question) {
        return parsed;
      }
    }
  } catch (e) {}
  return null;
};

export default function UserDashboard() {
  const navigate    = useNavigate();
  const msgEnd      = useRef(null);
  const fileInput   = useRef(null);
  const textarea    = useRef(null);
  const dropZone    = useRef(null);

  const [user,        setUser]        = useState(null);
  const [sessions,    setSessions]    = useState([]);
  const [activeId,    setActiveId]    = useState(null);
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState('');
  const [files,       setFiles]       = useState([]);
  const [fileProgress,setFileProgress]= useState({});
  const [agent,       setAgent]       = useState('general');
  const [sending,     setSending]     = useState(false);
  const [streaming,   setStreaming]   = useState(false);
  const [histLoad,    setHistLoad]    = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [docSidebarOpen, setDocSidebarOpen] = useState(false);
  const dragCounter  = useRef(0);
  const [dragging,    setDragging]    = useState(false);

  const [renamingId,  setRenamingId]  = useState(null);
  const [renameVal,   setRenameVal]   = useState('');

  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    fetch(`${API}/auth/user`, { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error('Network error');
        return r.json();
      })
      .then(d => {
        if (d.user) {
          setUser(d.user);
        } else if (DEMO_MODE) {
          const demoUser = { email: 'demo@example.com', firstName: 'Demo' };
          setUser(demoUser);
          setSessions([{ sessionId: 'demo', title: 'Demo Session', updatedAt: new Date().toISOString(), messageCount: 0 }]);
          setActiveId('demo');
          setMessages([]);
        } else {
          navigate('/login');
        }
      })
      .catch(err => {
        console.error('Auth error:', err);
        setAuthError(err.message);
        if (DEMO_MODE) {
          const demoUser = { email: 'demo@example.com', firstName: 'Demo' };
          setUser(demoUser);
          setSessions([{ sessionId: 'demo', title: 'Demo Session', updatedAt: new Date().toISOString(), messageCount: 0 }]);
          setActiveId('demo');
          setMessages([]);
        } else {
          navigate('/login');
        }
      })
      .finally(() => setAuthLoading(false));
  }, [navigate]);

  const loadSessions = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/sessions`, { credentials: 'include' });
      if (!r.ok) throw new Error('Failed to load sessions');
      const d = await r.json();
      setSessions(Array.isArray(d?.sessions) ? d.sessions : []);
    } catch { setSessions([]); }
  }, []);

  useEffect(() => { if (user) loadSessions(); }, [user, loadSessions]);

  useEffect(() => {
    if (!activeId) { setMessages([]); setFiles([]); return; }
    setHistLoad(true);
    setFiles([]);
    const session = sessions.find(s => s.sessionId === activeId);
    if (session?.agent) setAgent(session.agent);
    if (session?.documents) {
      setUploadedDocs(session.documents.map(name => ({ name, size: 0 })));
    }
    fetch(`${API}/api/chat/${activeId}`, { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error('Failed to load chat');
        return r.json();
      })
      .then(d => setMessages(
        (d.messages || []).flatMap(m => [
          { role: 'user', content: m.message, ts: m.timestamp, files: m.files },
          { role: 'bot',  content: m.answer,  ts: m.timestamp },
        ])
      ))
      .catch(() => setMessages([]))
      .finally(() => setHistLoad(false));
  }, [activeId, sessions]);

  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, sending]);

  useEffect(() => {
    const el = textarea.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }, [input]);

  if (authLoading) {
    return (
      <div className="pm-layout skeleton-loading" style={{ padding: 20, height: '100vh' }}>
        <div className="skeleton-card" style={{ height: 200, width: '60%' }} />
        <div className="skeleton-text" style={{ width: '40%', height: 14, marginTop: 12 }} />
        <div className="skeleton-text" style={{ width: '70%', height: 14, marginTop: 8 }} />
      </div>
    );
  }

  if (authError) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F5F6FF' }}>
        <div style={{ color: '#D63031', fontSize: '18px' }}>Error: {authError}</div>
      </div>
    );
  }

  const onDragEnter = (e) => { e.preventDefault(); dragCounter.current += 1; setDragging(true); };
  const onDragOver  = (e) => { e.preventDefault(); };
  const onDragLeave = (e) => {
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setDragging(false);
  };
  const onDrop = (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter(f =>
      /\.(pdf|doc|docx|txt|png|jpe?g)$/i.test(f.name)
    );
    if (dropped.length) {
      const newDocs = dropped.map(f => ({ name: f.name, size: f.size, file: f }));
      setUploadedDocs(prev => [...prev, ...newDocs]);
      setFiles(prev => [...prev, ...dropped]);
    }
  };

  const simulateProgress = (indices) => {
    const tick = (idx, val) => {
      if (val >= 90) return;
      setFileProgress(prev => ({ ...prev, [idx]: val }));
      setTimeout(() => tick(idx, Math.min(val + Math.random() * 15 + 5, 90)), 200);
    };
    indices.forEach(i => tick(i, 0));
  };

  const finalizeProgress = (indices) => {
    setFileProgress(prev => {
      const next = { ...prev };
      indices.forEach(i => { next[i] = 100; });
      return next;
    });
    setTimeout(() => setFileProgress({}), 800);
  };

  const send = async () => {
    const text = input.trim();
    if ((!text && files.length === 0) || sending || streaming) return;

    const pendingFiles = [...files];
    const fileIndices  = pendingFiles.map((_, i) => i);

    setMessages(prev => [...prev, {
      role: 'user', content: text, ts: new Date().toISOString(),
      files: pendingFiles.map(f => ({ name: f.name, size: f.size })),
    }]);
    setInput('');
    setSending(true);

    simulateProgress(fileIndices);

     let newSessionId = null;
     try {
       const form = new FormData();
       form.append('agent', agent);
       form.append('question', text);
       form.append('stream', 'true');
       if (activeId) form.append('sessionId', activeId);
       pendingFiles.forEach(f => {
        form.append('files', f);
        form.append('documents', f.name);
      });

       
       const sessionDocs = sessions.find(s => s.sessionId === activeId)?.documents || [];
       sessionDocs.forEach(d => form.append('documents', d));

       const r = await fetch(`${API}/api/chat`, {
         method: 'POST', credentials: 'include', body: form,
       });

       finalizeProgress(fileIndices);

       if (!r.ok) {
         const err = await r.json().catch(() => ({}));
         throw new Error(err.error || `HTTP ${r.status}`);
       }

       newSessionId = r.headers.get('x-session-id') || r.headers.get('X-Session-Id');
       if (!activeId && newSessionId) {
         setActiveId(newSessionId);
       }

       const reader   = r.body?.getReader();
       if (!reader) throw new Error('No response body');
       const decoder  = new TextDecoder();
       let   botIndex = null;
       setStreaming(true);

       while (true) {
         const { done, value } = await reader.read();
         if (done) break;

         const lines = decoder.decode(value).split('\n');
         for (const line of lines) {
           if (!line.startsWith('data: ')) continue;
           const token = line.slice(6);
           if (token === '[DONE]') break;

           setMessages(prev => {
             if (botIndex === null) {
               botIndex = prev.length;
               return [...prev, { role: 'bot', content: token, ts: new Date().toISOString() }];
             }
             return prev.map((m, i) =>
               i === botIndex ? { ...m, content: m.content + token } : m
             );
           });
         }
       }

       setStreaming(false);
       setSending(false);
       setFiles([]);
       const uploadedFileNames = uploadedDocs.map(d => d.name);
       const currentSessionId = newSessionId || activeId;
       if (currentSessionId) {
         const newDocs = uploadedFileNames.length > 0 ? [...(sessions.find(s => s.sessionId === currentSessionId)?.documents || []), ...uploadedFileNames] : undefined;
         setSessions(prev => prev.map(s =>
           s.sessionId === currentSessionId
             ? { ...s, lastMessage: { message: text }, updatedAt: new Date().toISOString(), messageCount: (s.messageCount || 0) + 1, documents: newDocs !== undefined ? newDocs : s.documents }
             : s
         ));
         if (uploadedFileNames.length > 0) {
           updateSessionMetadata(currentSessionId, agent, newDocs);
         }
       } else if (newSessionId) {
         await loadSessions();
       }
     } catch (err) {
       finalizeProgress(fileIndices);
       setSending(false);
       setStreaming(false);
       setFiles([]);
       setUploadedDocs([]);
       setMessages(prev => [...prev, {
         role: 'bot', content: `⚠ ${err.message}`, ts: new Date().toISOString(), isError: true,
       }]);
     } finally {
       setTimeout(() => textarea.current?.focus(), 50);
     }
  };

  const handleKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
  const newChat   = () => { setActiveId(null); setMessages([]); setFiles([]); setUploadedDocs([]); setFileProgress({}); textarea.current?.focus(); };
  const logout = async () => {
    try {
      await fetch(`${API}/auth/logout`, { 
        credentials: 'include',
        method: 'GET',
        mode: 'cors'
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
    setUser(null);
    setSessions([]);
    setMessages([]);
    navigate('/login', { replace: true });
  };

  const startRename = (e, s) => {
    e.stopPropagation();
    setRenamingId(s.sessionId);
    setRenameVal(s.title || sessionLabel(s));
  };

  const commitRename = async (sessionId) => {
    const title = renameVal.trim();
    if (!title) { setRenamingId(null); return; }
    try {
      await fetch(`${API}/api/chat/${sessionId}/rename`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      setSessions(prev => prev.map(s => s.sessionId === sessionId ? { ...s, title } : s));
    } catch { /* silent */ }
    setRenamingId(null);
  };

  const deleteSession = async (e, sessionId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this chat?')) return;
    try {
      await fetch(`${API}/api/chat/${sessionId}`, { method: 'DELETE', credentials: 'include' });
      setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
      if (activeId === sessionId) { setActiveId(null); setMessages([]); }
    } catch { /* silent */ }
  };

  const removeDoc = (index) => {
    setUploadedDocs(prev => prev.filter((_, i) => i !== index));
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateSessionMetadata = async (sessionId, newAgent, newDocs) => {
    if (!sessionId || !user?.email) return;
    try {
      await fetch(`${API}/api/chat/${sessionId}/metadata`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: newDocs }),
      });
      setSessions(prev => prev.map(s => 
        s.sessionId === sessionId 
          ? { ...s, agent: newAgent ?? s.agent, documents: newDocs ?? s.documents } 
          : s
      ));
    } catch { /* silent */ }
  };

  const openDocViewer = (doc) => {
    setViewingDoc(doc);
    setDocSidebarOpen(true);
  };

  const handleAskSelection = (selectedText) => {
    const formattedInput = `"${selectedText}"\n\n`;
    setInput(prev => prev ? prev + '\n\n' + formattedInput : formattedInput);
    setViewingDoc(null);
    textarea.current?.focus();
  };

  const activeSession = sessions.find(s => s.sessionId === activeId);
  const busy = sending || streaming;

  const filteredSessions = sessions.filter(s => {
    const label = sessionLabel(s).toLowerCase();
    return label.includes(searchQuery.toLowerCase());
  });

  return (
    <div
      className={`pm-layout ${dragging ? 'pm-dragging' : ''}`}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      ref={dropZone}
    >
      {dragging && (
        <div className="pm-drop-overlay">
          <div className="pm-drop-msg">
            <ClipIcon/> Drop files here
          </div>
        </div>
      )}

      {/* Left Sidebar - Chat Sessions */}
      <aside className={`pm-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* User section at top */}
        <div className="pm-sb-user-section">
          <div className="pm-user-icon">
            <UserIcon/>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="pm-sb-new-chat">
          <button className="pm-new-btn" onClick={newChat}>
            <PlusIcon/> New Chat
          </button>
        </div>

        {/* Search Bar */}
        <div className="pm-sb-search">
          <div className="pm-search-row">
            <SearchIcon/>
            <input
              type="text"
              className="pm-search-input"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="pm-search-clear" onClick={() => setSearchQuery('')}>
                <XIcon/>
              </button>
            )}
          </div>
        </div>

        {/* Chat Sessions List - Scrollable Rectangle */}
        <div className="pm-sessions-container">
          <div className="pm-sessions-rectangle">
            <nav className="pm-session-list">
              {filteredSessions.length === 0 && <p className="pm-empty">
                {searchQuery ? 'No matching chats found' : 'No chats yet. Start one!'}
              </p>}
              {filteredSessions.map(s => (
                <div
                  key={s.sessionId}
                  className={`pm-session ${activeId === s.sessionId ? 'pm-session--active' : ''}`}
                  onClick={() => renamingId !== s.sessionId && setActiveId(s.sessionId)}
                >
                  <ChatIcon/>

                  {renamingId === s.sessionId ? (
                    <div className="pm-rename-row" onClick={e => e.stopPropagation()}>
                      <input
                        className="pm-rename-input"
                        value={renameVal}
                        autoFocus
                        onChange={e => setRenameVal(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') commitRename(s.sessionId);
                          if (e.key === 'Escape') setRenamingId(null);
                        }}
                      />
                      <button className="pm-action-btn" onClick={() => commitRename(s.sessionId)}><CheckIcon/></button>
                      <button className="pm-action-btn" onClick={() => setRenamingId(null)}><XIcon/></button>
                    </div>
                  ) : (
                    <>
                      <div className="pm-session-info">
                        <span className="pm-session-label">{sessionLabel(s)}</span>
                        <span className="pm-session-meta">
                          {s.agent && <span className="pm-session-domain">{s.agent}</span>}
                          {s.messageCount > 0 && <>{s.messageCount} msg{s.messageCount !== 1 ? 's' : ''} · </>}
                          {fmtDate(s.updatedAt || s.createdAt)}
                        </span>
                      </div>
                      <div className="pm-session-actions">
                        <button className="pm-action-btn" onClick={(e) => startRename(e, s)} title="Rename"><PencilIcon/></button>
                        <button className="pm-action-btn pm-action-btn--del" onClick={(e) => deleteSession(e, s.sessionId)} title="Delete"><TrashIcon/></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* Logout Button at bottom */}
        <div className="pm-sb-foot">
          <button className="pm-logout-btn" onClick={logout}>
            <LogoutIcon/>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Toggle button for left sidebar when closed */}
      {!sidebarOpen && (
        <button 
          className="pm-sidebar-toggle-closed" 
          onClick={() => setSidebarOpen(true)}
          title="Open sidebar"
        >
          <MenuIcon/>
        </button>
      )}

      {/* Main chat area */}
      <div className="pm-chat">
        <header className="pm-topbar">
          {sidebarOpen && (
            <button className="pm-icon-btn" onClick={() => setSidebarOpen(false)}>
              <ChevronLeftIcon/>
            </button>
          )}
          <span className="pm-topbar-title">
            {activeSession ? sessionLabel(activeSession) : 'New conversation'}
          </span>
          
          {/* Domain Dropdown */}
          <div className="pm-domain-selector">
            <label className="pm-domain-label">Domain:</label>
            <div className="pm-domain-dropdown">
              <select 
                className="pm-domain-select"
                value={agent}
                onChange={(e) => {
                  const newAgent = e.target.value;
                  setAgent(newAgent);
                  if (activeId) updateSessionMetadata(activeId, newAgent);
                }}
                disabled={busy}
              >
                {AGENTS.map(a => (
                  <option key={a.id} value={a.id} className="quicksand">
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        <div className="pm-messages">
          {histLoad && <div className="pm-center"><Dots/></div>}

          {!histLoad && messages.length === 0 && (
            <div className="pm-welcome">
              <div className="pm-welcome-glyph">✦</div>
              <h2>What can I help with?</h2>
              <p>Drop a document or ask anything. Drag files anywhere to attach.</p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`pm-msg pm-msg--${m.role}`}>
              <div className="pm-msg-avatar">
                {m.role === 'user' ? <UserIcon/> : <BotIcon/>}
              </div>
              <div className={`pm-bubble pm-bubble--${m.role}${m.isError ? ' pm-bubble--err' : ''}`}>
                {m.role === 'user' ? (
                  <>
                    {m.content && <p className="pm-user-text">{m.content}</p>}
                    {m.files?.length > 0 && (
                      <div className="pm-msg-files">
                        {m.files.map((f, fi) => <FileChip key={fi} file={f}/>)}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <BotMsg text={m.content}/>
                    {(() => {
                      const cards = extractFlashcards(m.content);
                      return cards ? <FlashcardViewer flashcards={cards} /> : null;
                    })()}
                  </>
                )}
              </div>
            </div>
          ))}

          {sending && (
            <div className="pm-msg pm-msg--bot">
              <div className="pm-msg-avatar"><BotIcon/></div>
              <div className="pm-bubble pm-bubble--bot pm-bubble--thinking"><Dots/></div>
            </div>
          )}

          <div ref={msgEnd}/>
        </div>

        <div className="pm-input-area">
          {files.length > 0 && (
            <div className="pm-file-preview">
              {files.map((f, i) => (
                <FileChip key={i} file={f} progress={fileProgress[i]}
                  onRemove={() => removeDoc(i)}/>
              ))}
            </div>
          )}

          <div className="pm-input-row">
            <input type="file" ref={fileInput}
              onChange={e => { 
                const newFiles = Array.from(e.target.files);
                setFiles(p => [...p, ...newFiles]);
                setUploadedDocs(prev => [...prev, ...newFiles.map(f => ({ name: f.name, size: f.size, file: f }))]);
                e.target.value=''; 
              }}
              style={{ display:'none' }} multiple accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"/>
            <button className="pm-icon-btn pm-attach" onClick={() => fileInput.current?.click()} disabled={busy}
              title="Attach files (or drag & drop)"><ClipIcon/></button>
            <textarea ref={textarea} className="pm-textarea" value={input}
              onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder="Ask anything… or drop files anywhere" disabled={busy} rows={1} align="center"/>
            <button
              className={`pm-send ${(!input.trim() && files.length === 0) || busy ? 'pm-send--off' : ''}`}
              onClick={send} disabled={busy || (!input.trim() && files.length === 0)}>
              {streaming ? <Dots/> : <SendIcon/>}
            </button>
          </div>
          <p className="pm-hint">Enter to send · Shift+Enter for new line · Drag files anywhere</p>
        </div>
      </div>

      {/* Document Sidebar - RIGHT SIDE */}
      <aside className={`pm-doc-sidebar ${docSidebarOpen ? 'open' : ''}`}>
        <div className="pm-doc-sb-head">
          <div className="pm-doc-title">
            <FileTextIcon/>
            <span>Documents</span>
          </div>
          <button className="pm-doc-toggle" onClick={() => setDocSidebarOpen(false)}>
            <XIcon/>
          </button>
        </div>

        <div className="pm-doc-list">
          {uploadedDocs.length === 0 && <p className="pm-doc-empty">No documents uploaded</p>}
          {uploadedDocs.map((doc, idx) => (
            <div key={idx} className="pm-doc-item" onClick={() => openDocViewer(doc)}>
              <FileIcon/>
              <div className="pm-doc-info">
                <span className="pm-doc-name">{doc.name}</span>
                <span className="pm-doc-size">{fmtBytes(doc.size)}</span>
              </div>
              <button className="pm-doc-remove" onClick={(e) => { e.stopPropagation(); removeDoc(idx); }}>
                <XIcon/>
              </button>
            </div>
          ))}
        </div>

        <div className="pm-doc-actions">
          <button className="pm-doc-clear" onClick={() => { setUploadedDocs([]); setFiles([]); }}>
            Clear All Documents
          </button>
        </div>
      </aside>

      {/* Toggle button for document sidebar when closed */}
      {!docSidebarOpen && (
        <button className="pm-doc-toggle-closed" onClick={() => setDocSidebarOpen(true)}>
          <FileTextIcon/>
        </button>
      )}

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <DocumentViewer
          file={viewingDoc.file || viewingDoc}
          onAskSelection={handleAskSelection}
          onClose={() => setViewingDoc(null)}
          open={true}
        />
      )}
    </div>
  );
}
