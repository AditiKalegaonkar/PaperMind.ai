import React, { useState, useEffect, useRef, useMemo } from 'react';
import './UserDashboard.css';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000';

const safeJsonParse = (jsonString, fallback = {}) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parse error:', error);
    return fallback;
  }
};

// ---------------- Icons ----------------
const PaperClipIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a5 5 0 01-7.07-7.07l9.19-9.19a3 3 0 014.24 4.24l-9.2 9.19a1 1 0 01-1.42-1.42l8.49-8.48"/>
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const BotIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="3" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="7" r="4" />
    <path d="M5.5 20c1.5-4 5-6 6.5-6s5 2 6.5 6" />
  </svg>
);

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

// ---------- Render bot analysis + plots ----------
const BotMessageContent = ({ analysisSteps, plotCode }) => {
  const plotContainerRef = useRef(null);

  useEffect(() => {
    if (plotCode && plotContainerRef.current) {
      plotContainerRef.current.innerHTML = '<p>Chart visualization would go here</p>';
    }
  }, [plotCode]);

  return (
    <div className="bot-message-container">
      {analysisSteps?.map((step, index) => (
        <div key={index} className="analysis-step">
          <strong>Output from: {step.agent}</strong>
          <pre className="prose-output">{step.text}</pre>
        </div>
      ))}
      {plotCode && <div ref={plotContainerRef} className="plot-container"></div>}
    </div>
  );
};

// ======================== MAIN COMPONENT =============================

function UserDashboard() {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(null);

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  // ---------------- Fetch USER ----------------
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/user`, { credentials: 'include' });
        const data = await res.json();

        if (!data.user) return navigate('/login');

        setUser(data.user);

        // Now load chats from separate DB
        fetchChats(data.user.id);
      } catch (err) {
        console.error('Fetch user data error:', err);
        navigate('/login');
      }
    };

    fetchUserData();
  }, [navigate]);


  // ---------------- Fetch CHATS FROM CHAT DATABASE ----------------
  const fetchChats = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/chats/${userId}`, { credentials: 'include' });

      if (!res.ok) {
        console.warn("No chats found or chat DB unreachable!");
        setChats([]);
        return;
      }

      const dbData = await res.json();
      const chatList = dbData.chats || [];

      const formattedChats = chatList.map(chat => {
        const messages = [];

        chat.sessions?.forEach(session => {
          session.messages?.forEach(msg => {
            messages.push({
              role: "user",
              content: msg.message,
              timestamp: msg.timestamp
            });

            const botResponse = safeJsonParse(msg.answer);
            messages.push({
              role: "bot",
              analysisSteps: botResponse.analysis_steps || [],
              plotCode: botResponse.code || null,
              timestamp: msg.timestamp
            });
          });
        });

        return {
          id: chat._id,
          title: messages[0]?.content || "New Chat",
          messages,
          createdAt: chat.createdAt
        };
      });

      setChats(formattedChats);
      if (formattedChats.length > 0) {
        setActiveChatId(formattedChats[0].id);
      }
    } catch (err) {
      console.error("Chat fetch error:", err);
      setChats([]);
    }
  };


  // --------- Auto-scroll ---------
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, activeChatId, isLoading]);


  // Active Chat Memoized
  const activeChat = useMemo(() =>
    chats.find(chat => chat.id === activeChatId),
    [chats, activeChatId]
  );


  // ---------- Create a new chat -----------
  const createNewChat = () => {
    const newChatId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newChat = {
      id: newChatId,
      title: "New Chat",
      messages: [],
      createdAt: new Date().toISOString()
    };

    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChatId);
    setSelectedFile(null);
    setUserInput('');
  };


  // ---------- Handle file input ----------
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type !== 'application/pdf') {
      alert('Please select a PDF only.');
      return;
    }
    setSelectedFile(file);
  };


  // ---------- Send message ----------
  const handleSubmit = async () => {
    if (!userInput.trim() || !selectedFile || isLoading) return;

    setIsLoading(true);

    const userMessage = {
      role: 'user',
      content: userInput,
      file: selectedFile.name,
      timestamp: new Date().toISOString()
    };

    // Add user message
    setChats(prev =>
      prev.map(chat =>
        chat.id === activeChatId
          ? { ...chat, messages: [...chat.messages, userMessage] }
          : chat
      )
    );

    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('query', userInput);
    formData.append('session_id', activeChatId);
    formData.append('username', user?.firstName || 'User');

    setUserInput('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    try {
      const res = await fetch(`${API_URL}/receive`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await res.json();

      const botMessage = {
        role: 'bot',
        analysisSteps: data.analysis_steps || [],
        plotCode: data.code || null,
        timestamp: new Date().toISOString()
      };

      setChats(prev =>
        prev.map(chat =>
          chat.id === activeChatId
            ? { ...chat, messages: [...chat.messages, botMessage] }
            : chat
        )
      );

    } catch (err) {
      console.error('Submit error:', err);

      const errMessage = {
        role: 'bot',
        analysisSteps: [{ agent: 'Error', text: `Analysis failed: ${err.message}` }],
        plotCode: null
      };

      setChats(prev =>
        prev.map(chat =>
          chat.id === activeChatId
            ? { ...chat, messages: [...chat.messages, errMessage] }
            : chat
        )
      );
    }

    setIsLoading(false);
  };


  // ---------- Logout ----------
  const handleLogout = async () => {
    await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
    navigate('/login');
  };


  // =================== JSX =======================
  return (
    <div className="container-d quicksand">
      {/* -------- SIDEBAR -------- */}
      <div className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>

        <div className="sidebar-header">
          <h2>PaperMind.ai</h2>
          <button onClick={createNewChat} className="new-chat-btn">
            <PlusIcon /> New Chat
          </button>
        </div>

        <div className="chat-list">
          {chats.map(chat => (
            <div
              key={chat.id}
              className={`chat-item ${activeChatId === chat.id ? 'active' : ''}`}
              onClick={() => setActiveChatId(chat.id)}
            >
              <div className="chat-title">{chat.title}</div>
              <div className="chat-preview">
                {chat.messages[0]?.content?.substring(0, 50) || "No messages"}...
              </div>
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

      </div>

      {/* -------- MAIN CHAT AREA -------- */}
      <div className="main-chat">

        <div className="chat-header">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="menu-btn"
          >
            <MenuIcon />
          </button>

          <h3>{activeChat?.title || 'Select a Chat'}</h3>
        </div>

        <div className="chat-messages">

          {activeChat?.messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              <div className="message-icon">
                {msg.role === 'user' ? <UserIcon /> : <BotIcon />}
              </div>

              <div className="message-content">
                {msg.role === 'user'
                  ? (
                    <>
                      <p>{msg.content}</p>
                      {msg.file && <small>Attached: {msg.file}</small>}
                    </>
                  )
                  : (
                    <BotMessageContent
                      analysisSteps={msg.analysisSteps}
                      plotCode={msg.plotCode}
                    />
                  )
                }
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message bot">
              <div className="message-icon"><BotIcon /></div>
              <div className="message-content">
                <div className="loading">Analyzing document...</div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />

        </div>

        {/* -------- INPUT AREA -------- */}
        <div className="input-area">
          <div className="input-container">

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf"
              style={{ display: 'none' }}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="file-btn"
              disabled={isLoading}
            >
              <PaperClipIcon />
            </button>

            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey ? handleSubmit() : null}
              placeholder={selectedFile ? `Ask about ${selectedFile.name}...` : "Upload a PDF and ask a question..."}
              className="message-input"
              disabled={isLoading}
            />

            <button
              onClick={handleSubmit}
              className="send-btn"
              disabled={!userInput.trim() || !selectedFile || isLoading}
            >
              <SendIcon />
            </button>

          </div>

          {selectedFile && (
            <div className="selected-file">
              {selectedFile.name}
              <button onClick={() => { setSelectedFile(null); fileInputRef.current.value = ''; }}>×</button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

export default UserDashboard;