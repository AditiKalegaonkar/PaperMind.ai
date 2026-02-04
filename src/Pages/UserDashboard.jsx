import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserDashboard.css';

const API_URL = 'http://localhost:5000';

const PaperClipIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a5 5 0 01-7.07-7.07l9.19-9.19a3 3 0 014.24 4.24l-9.2 9.19a1 1 0 01-1.42-1.42l8.49-8.48"/></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
const BotIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="3" /></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4" /><path d="M5.5 20c1.5-4 5-6 6.5-6s5 2 6.5 6" /></svg>;
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const FileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>;

const BotMessageContent = ({ answer }) => <pre className="prose-output">{answer}</pre>;

const FilePreview = ({ file, onRemove }) => {
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="file-preview-item">
      <div className="file-preview-icon"><FileIcon /></div>
      <div className="file-preview-info">
        <span className="file-preview-name">{file.name}</span>
        <span className="file-preview-size">{formatFileSize(file.size)}</span>
      </div>
      <button className="file-preview-remove" onClick={onRemove} type="button"><CloseIcon /></button>
    </div>
  );
};

function UserDashboard() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState('general');
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const r = await fetch(`${API_URL}/auth/user`, { credentials: 'include' });
        if (!r.ok) {
          navigate('/login');
          return;
        }
        const d = await r.json();
        if (!d.user) {
          navigate('/login');
          return;
        }
        setUser(d.user);
        loadSessions();
      } catch {
        navigate('/login');
      }
    };
    loadUser();
  }, [navigate]);

  const loadSessions = async () => {
    try {
      const r = await fetch(`${API_URL}/api/sessions`, { credentials: 'include' });
      const d = await r.json();
      const list = Array.isArray(d?.sessions) ? d.sessions : Array.isArray(d) ? d : [];
      setSessions(list);
      if (list.length > 0) setActiveSessionId(list[0].sessionId);
    } catch {
      setSessions([]);
    }
  };

  useEffect(() => {
    if (!activeSessionId) return;
    const loadHistory = async () => {
      const r = await fetch(`${API_URL}/api/chat/${activeSessionId}`, { credentials: 'include' });
      const d = await r.json();
      const msgs = (d.messages || []).flatMap(m => ([
        { role: 'user', content: m.message, timestamp: m.timestamp, files: m.files },
        { role: 'bot', content: m.answer, timestamp: m.timestamp }
      ]));
      setMessages(msgs);
    };
    loadHistory();
  }, [activeSessionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const createNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setUploadedFiles([]);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setUploadedFiles(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    if ((!userInput.trim() && uploadedFiles.length === 0) || isLoading) return;
    setIsLoading(true);

    const userMsg = {
      role: 'user',
      content: userInput,
      timestamp: new Date().toISOString(),
      files: uploadedFiles.map(f => ({ name: f.name, size: f.size }))
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const formData = new FormData();
      formData.append('agent', selectedAgent);
      formData.append('question', userInput);
      if (activeSessionId) formData.append('sessionId', activeSessionId);
      uploadedFiles.forEach(file => formData.append('files', file));

      const r = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      const d = await r.json();

      if (!activeSessionId) {
        setActiveSessionId(d.sessionId);
        loadSessions();
      }

      const botMsg = {
        role: 'bot',
        content: d.answer,
        timestamp: d.timestamp
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', content: 'Chat failed', timestamp: new Date().toISOString() }]);
    }

    setUserInput('');
    setUploadedFiles([]);
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await fetch(`${API_URL}/auth/logout`, { credentials: 'include' });
    navigate('/login');
  };

  const activeSession = useMemo(() => Array.isArray(sessions) ? sessions.find(s => s.sessionId === activeSessionId) : undefined, [sessions, activeSessionId]);

  return (
    <div className="container-d quicksand">
      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h2>PaperMind.ai</h2>
          <button onClick={createNewChat} className="new-chat-btn">
            <PlusIcon /> New Chat
          </button>
        </div>
        <div className="chat-list">
          {Array.isArray(sessions) && sessions.map(s => (
            <div key={s.sessionId} className={`chat-item ${activeSessionId === s.sessionId ? 'active' : ''}`} onClick={() => setActiveSessionId(s.sessionId)}>
              <div className="chat-title">{s.sessionId}</div>
            </div>
          ))}
        </div>
        <div className="sidebar-footer">
          <div className="user-info">
            <UserIcon />
            <span>{user?.firstName}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </aside>

      <main className="main-chat">
        <header className="chat-header">
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="menu-btn">
            <MenuIcon />
          </button>
          <h3>{activeSession?.sessionId || 'New chat'}</h3>
        </header>

        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              <div className="message-icon">
                {msg.role === 'user' ? <UserIcon /> : <BotIcon />}
              </div>
              <div className="message-content">
                {msg.role === 'user' ? (
                  <>
                    <p>{msg.content}</p>
                    {msg.files && msg.files.length > 0 && (
                      <div className="message-files">
                        {msg.files.map((file, idx) => (
                          <div key={idx} className="message-file-tag">
                            <FileIcon /> <span>{file.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <BotMessageContent answer={msg.content} />
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message bot">
              <div className="message-icon"><BotIcon /></div>
              <div className="message-content">
                <div className="loading">Thinking...</div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="chat-footer-wrapper">
          <div className="agent-selector">
            {['general', 'legal', 'education', 'finance'].map(a => (
              <button key={a} className={selectedAgent === a ? 'agent-btn active' : 'agent-btn'} onClick={() => setSelectedAgent(a)} disabled={isLoading}>
                {a}
              </button>
            ))}
          </div>
          {uploadedFiles.length > 0 && (
            <div className="file-preview-container">
              {uploadedFiles.map((file, index) => (
                <FilePreview key={index} file={file} onRemove={() => removeFile(index)} />
              ))}
            </div>
          )}
          <div className="input-area">
            <div className="input-container">
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} multiple accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" />
              <button onClick={triggerFileInput} className="attach-btn" disabled={isLoading} title="Attach files">
                <PaperClipIcon />
              </button>
              <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' ? handleSubmit() : null} placeholder="Ask something..." className="message-input" disabled={isLoading} />
              <button onClick={handleSubmit} className="send-btn" disabled={(!userInput.trim() && uploadedFiles.length === 0) || isLoading}>
                <SendIcon />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default UserDashboard;