import React, { useState, useEffect, useRef, useMemo } from 'react';
import './UserDashboard.css';
import { useNavigate } from 'react-router-dom';
const API_URL = 'http://localhost:5000';

// Safe JSON parser
const safeJsonParse = (jsonString, fallback = {}) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parse error:', error);
    return fallback;
  }
};

// --- Icon Components ---
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000';

// Safe JSON parser
const safeJsonParse = (jsonString, fallback = {}) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parse error:', error);
    return fallback;
  }
};

// --- Icon Components ---
const PaperClipIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.59a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
  </svg> 
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.59a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22,2 15,22 11,13 2,9"></polygon>
  </svg>

  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22,2 15,22 11,13 2,9"></polygon>
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const BotIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8V4H8" />
    <rect x="4" y="12" width="16" height="8" rx="2" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="M12 18v2" />
  </svg>
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8V4H8" />
    <rect x="4" y="12" width="16" height="8" rx="2" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="M12 18v2" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);


const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

// --- Safe Bot message rendering ---
const BotMessageContent = ({ analysisSteps, plotCode }) => {
  const plotContainerRef = useRef(null);

  useEffect(() => {
    // SECURITY: Instead of executing arbitrary code, render safe content
    if (plotCode && plotContainerRef.current) {
      try {
        // Only allow safe rendering - avoid script execution
        console.log('Plot code received:', plotCode);
        // You should implement a safe plotting library here instead
        plotContainerRef.current.innerHTML = '<p>Chart visualization would go here</p>';
      } catch (error) {
        console.error("Error rendering plot:", error);
        plotContainerRef.current.innerHTML = '<p>Error rendering visualization</p>';
      }
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
// --- Safe Bot message rendering ---
const BotMessageContent = ({ analysisSteps, plotCode }) => {
  const plotContainerRef = useRef(null);

  useEffect(() => {
    // SECURITY: Instead of executing arbitrary code, render safe content
    if (plotCode && plotContainerRef.current) {
      try {
        // Only allow safe rendering - avoid script execution
        console.log('Plot code received:', plotCode);
        // You should implement a safe plotting library here instead
        plotContainerRef.current.innerHTML = '<p>Chart visualization would go here</p>';
      } catch (error) {
        console.error("Error rendering plot:", error);
        plotContainerRef.current.innerHTML = '<p>Error rendering visualization</p>';
      }
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

function UserDashboard() {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [user, setUser] = useState(null);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const navigate = useNavigate();
  // --- Load user & chat sessions from server ---
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/user`, { credentials: 'include' });
        if (!res.ok) throw new Error('Not authenticated');

        const data = await res.json();
        if (!data.user) return navigate('/login');

        setUser(data.user);

        // Safely transform MongoDB chats to UI format
        const chatData = data.chats.map(chat => {
          const messages = [];
          
          chat.sessions.forEach(session => {
            session.messages.forEach(msg => {
              // Add user message
              messages.push({
                role: "user",
                content: msg.message,
                timestamp: msg.timestamp
              });
              
              // Parse and add bot response safely
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

        setChats(chatData);
        if (chatData.length > 0) setActiveChatId(chatData[0].id);
      } catch (err) {
        console.error('Fetch user data error:', err);
        navigate('/login');
      }
    };
    
    fetchUserData();
  }, [navigate]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, activeChatId, isLoading]);
  const navigate = useNavigate();

  // --- Load user & chat sessions from server ---
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/user`, { credentials: 'include' });
        if (!res.ok) throw new Error('Not authenticated');

        const data = await res.json();
        if (!data.user) return navigate('/login');

        setUser(data.user);

        // Safely transform MongoDB chats to UI format
        const chatData = data.chats.map(chat => {
          const messages = [];
          
          chat.sessions.forEach(session => {
            session.messages.forEach(msg => {
              // Add user message
              messages.push({
                role: "user",
                content: msg.message,
                timestamp: msg.timestamp
              });
              
              // Parse and add bot response safely
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

        setChats(chatData);
        if (chatData.length > 0) setActiveChatId(chatData[0].id);
      } catch (err) {
        console.error('Fetch user data error:', err);
        navigate('/login');
      }
    };
    
    fetchUserData();
  }, [navigate]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, activeChatId, isLoading]);

  const createNewChat = () => {
    const newChatId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newChat = { 
      id: newChatId, 
      title: "New Chat", 
      messages: [], 
      createdAt: new Date().toISOString() 
    };
    
    setChats(prev => [newChat, ...prev.filter(c => c.messages.length > 0)]);
    const newChatId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newChat = { 
      id: newChatId, 
      title: "New Chat", 
      messages: [], 
      createdAt: new Date().toISOString() 
    };
    
    setChats(prev => [newChat, ...prev.filter(c => c.messages.length > 0)]);
    setActiveChatId(newChatId);
    setSelectedFile(null);
    setUserInput('');
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type !== 'application/pdf') {
      alert('Please select a PDF file only.');
      return;
    }
    setSelectedFile(file);
  };

  const activeChat = useMemo(() => 
    chats.find(chat => chat.id === activeChatId), 
    [chats, activeChatId]
  );

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type !== 'application/pdf') {
      alert('Please select a PDF file only.');
      return;
    }
    setSelectedFile(file);
  };

  const activeChat = useMemo(() => 
    chats.find(chat => chat.id === activeChatId), 
    [chats, activeChatId]
  );

  const handleSubmit = async () => {
    if (!userInput.trim() || !selectedFile || isLoading) return;
    
    
    setIsLoading(true);

    // Add user message to UI
    const userMessage = { 
      role: 'user', 
      content: userInput, 
      file: selectedFile.name,
      timestamp: new Date().toISOString()
    };
    // Add user message to UI
    const userMessage = { 
      role: 'user', 
      content: userInput, 
      file: selectedFile.name,
      timestamp: new Date().toISOString()
    };
    
    setChats(prev =>
      prev.map(chat => 
        chat.id === activeChatId 
          ? { ...chat, messages: [...chat.messages, userMessage], title: chat.title === "New Chat" ? userInput : chat.title }
          : chat
      )
    );

    // Prepare form data
    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('query', userInput);
    formData.append('session_id', activeChatId);
    formData.append('username', user?.firstName || 'User');

    // Clear input
      prev.map(chat => 
        chat.id === activeChatId 
          ? { ...chat, messages: [...chat.messages, userMessage], title: chat.title === "New Chat" ? userInput : chat.title }
          : chat
      )
    );

    // Prepare form data
    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('query', userInput);
    formData.append('session_id', activeChatId);
    formData.append('username', user?.firstName || 'User');

    // Clear input
    setUserInput('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    try {
      const response = await fetch(`${API_URL}/receive`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
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
      const errorMessage = { 
        role: 'bot', 
        analysisSteps: [{ agent: 'Error', text: `Analysis failed: ${err.message}` }], 
        plotCode: null,
        timestamp: new Date().toISOString()
      };
      
      setChats(prev => 
        prev.map(chat => 
          chat.id === activeChatId 
            ? { ...chat, messages: [...chat.messages, errorMessage] }
            : chat
        )
      );
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    try {
      const response = await fetch(`${API_URL}/receive`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
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
      const errorMessage = { 
        role: 'bot', 
        analysisSteps: [{ agent: 'Error', text: `Analysis failed: ${err.message}` }], 
        plotCode: null,
        timestamp: new Date().toISOString()
      };
      
      setChats(prev => 
        prev.map(chat => 
          chat.id === activeChatId 
            ? { ...chat, messages: [...chat.messages, errorMessage] }
            : chat
        )
      );
    } finally {
      setIsLoading(false);
    }
  };


  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      handleSubmit(); 
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      navigate('/login');
    }
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      handleSubmit(); 
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      navigate('/login');
    }
  };

  return (
    <div className="container-d quicksand">
      {/* Sidebar */}
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
    <div className="container-d quicksand">
      {/* Sidebar */}
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
            <span>{user?.firstName || 'User'}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
        <div className="sidebar-footer">
          <div className="user-info">
            <UserIcon />
            <span>{user?.firstName || 'User'}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="main-chat">
        <div className="chat-header">
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="menu-btn">
            <MenuIcon />
          </button>
          <h3>{activeChat?.title || 'Select a Chat'}</h3>
        </div>

        <div className="chat-messages">
          {activeChat?.messages.map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              <div className="message-icon">
                {message.role === 'user' ? <UserIcon /> : <BotIcon />}
      </div>

      {/* Main Chat Area */}
      <div className="main-chat">
        <div className="chat-header">
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="menu-btn">
            <MenuIcon />
          </button>
          <h3>{activeChat?.title || 'Select a Chat'}</h3>
        </div>

        <div className="chat-messages">
          {activeChat?.messages.map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              <div className="message-icon">
                {message.role === 'user' ? <UserIcon /> : <BotIcon />}
              </div>
              <div className="message-content">
                {message.role === 'user' ? (
                  <div>
                    <p>{message.content}</p>
                    {message.file && <small> {message.file}</small>}
                  </div>
                ) : (
                  <BotMessageContent 
                    analysisSteps={message.analysisSteps} 
                    plotCode={message.plotCode} 
                  />
                )}
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
              <div className="message-content">
                {message.role === 'user' ? (
                  <div>
                    <p>{message.content}</p>
                    {message.file && <small> {message.file}</small>}
                  </div>
                ) : (
                  <BotMessageContent 
                    analysisSteps={message.analysisSteps} 
                    plotCode={message.plotCode} 
                  />
                )}
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
              onKeyPress={handleKeyPress}
              placeholder={selectedFile ? `Ask about ${selectedFile.name}...` : "Upload a PDF and ask a question..."}
              className="message-input"
              disabled={isLoading}
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={selectedFile ? `Ask about ${selectedFile.name}...` : "Upload a PDF and ask a question..."}
              className="message-input"
              disabled={isLoading}
            />
            
            <button 
              onClick={handleSubmit} 
              className="send-btn"
              disabled={!userInput.trim() || !selectedFile || isLoading}
            >
            
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
              <button onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}>×</button>
            </div>
          )}
        </div>
      </div>
          </div>
          
          {selectedFile && (
            <div className="selected-file">
               {selectedFile.name}
              <button onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}>×</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;