import React, { useState, useEffect, useRef, useMemo } from 'react';
import './UserDashboard.css';

const PaperClipIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.59a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
);
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22,2 15,22 11,13 2,9"></polygon></svg>
);
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
const BotIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect x="4" y="12" width="16" height="8" rx="2" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="M12 18v2" /></svg>
);
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);
const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
);

const MessageContent = ({ content }) => {
  const formattedContent = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />');
  return <div className="prose" dangerouslySetInnerHTML={{ __html: formattedContent }} />;
};

function UserDashboard() {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => { createNewChat(); }, []);
  
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chats, activeChatId, isLoading]);

  const createNewChat = () => {
    const newChatId = `chat_${Date.now()}`;
    const newChat = { id: newChatId, title: `New Chat Session`, messages: [], createdAt: new Date().toISOString() };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChatId);
    setSelectedFile(null);
    setUserInput('');
  };

  const handleFileChange = (event) => { setSelectedFile(event.target.files[0]); };
  
  const activeChat = useMemo(() => chats.find(chat => chat.id === activeChatId), [chats, activeChatId]);

  const handleSubmit = async () => {
    if (!userInput.trim() || !selectedFile || isLoading) return;
    setIsLoading(true);

    const userMessage = { role: 'user', content: userInput, file: selectedFile.name };
    
    setChats(prev =>
      prev.map(chat => {
        if (chat.id === activeChatId) {
          const isFirstMessage = chat.messages.length === 0;
          const newTitle = isFirstMessage ? userInput.substring(0, 35) : chat.title;
          return { ...chat, title: newTitle, messages: [...chat.messages, userMessage] };
        }
        return chat;
      })
    );
    setUserInput('');
    
    try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const botText = `I have analyzed **${selectedFile.name}**. Based on your query about "${userInput}", here are my findings:\n\n- **Key Point 1:** Details extracted from the document.\n- **Key Point 2:** Another insight from the analysis.`;
        const botMessage = { role: 'bot', content: botText };
        setChats(prev => prev.map(chat => (chat.id === activeChatId ? { ...chat, messages: [...chat.messages, botMessage] } : chat)));
    } catch (error) {
        const errorMessage = { role: 'bot', content: `**Error:** Could not process the document.` };
        setChats(prev => prev.map(chat => (chat.id === activeChatId ? { ...chat, messages: [...chat.messages, errorMessage] } : chat)));
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  return (
    <div className="container-d">
      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-content">
            <header className="sidebar-header">
                <div className="sidebar-header-controls">
                    <h1 className="sidebar-title">PaperMind.ai</h1>
                    <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="sidebar-toggle" title="Toggle Sidebar">
                        <MenuIcon />
                    </button>
                </div>
              <button onClick={createNewChat} className="new-chat-button">
                <PlusIcon />
                {!isSidebarCollapsed && <span>New Chat</span>}
              </button>
            </header>
            <div className="sidebar-nav">
              {chats.map(chat => (
                <div
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className={`chat-list-item ${activeChatId === chat.id ? 'active' : ''}`}
                >
                  <div className="chat-list-item-title">{chat.title}</div>
                  <div className="chat-list-item-date">{new Date(chat.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
        </div>
      </aside>

      <main className="chat-area">
          <header className="chat-header">
          {activeChat && <h2 className="chat-title">{activeChat.title}</h2>}
          {selectedFile && activeChat && (
            <span className="file-indicator">File: <strong>{selectedFile.name}</strong></span>
          )}
        </header>
        
        <div className="message-container-wrapper">
            {!activeChat || activeChat.messages.length === 0 ? (
              <div className="empty-chat-container">
                <div>
                    <div className="empty-chat-title">Welcome to PaperMind.ai</div>
                    <p className="empty-chat-text">Attach a document and ask a question to get started.</p>
                </div>
              </div>
            ) : (
                <div className="message-container">
                  {activeChat.messages.map((msg, index) => (
                    <div key={index} className={`message-wrapper ${msg.role}`}>
                      <div className={`message-avatar ${msg.role}`}>
                        {msg.role === 'bot' ? <BotIcon /> : <UserIcon />}
                      </div>
                      <div className={`message-content ${msg.role}`}>
                        {msg.role === 'user' ? (
                          <div>
                            <p className="user-message-text">{msg.content}</p>
                            <p className="user-message-file-info"><strong>Analyzing:</strong> {msg.file}</p>
                          </div>
                        ) : (
                          <MessageContent content={msg.content} />
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="message-wrapper bot">
                      <div className="message-avatar bot"><BotIcon /></div>
                      <div className="message-content bot">
                        <div className="message-loading">
                          <div className="loading-dot"></div>
                          <div className="loading-dot"></div>
                          <div className="loading-dot"></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
            )}
        </div>

        <footer className="chat-footer">
          <form className="chat-form" onSubmit={(e) => e.preventDefault()}>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="attach-button" title="Attach document">
              <PaperClipIcon />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{display: 'none'}} accept=".pdf,.doc,.docx,.txt" />
            <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={selectedFile ? `Ask about ${selectedFile.name}...` : "First, attach a document..."}
                className="message-input"
                disabled={!selectedFile || isLoading}
            />
            <button type="button" onClick={handleSubmit} disabled={!userInput.trim() || !selectedFile || isLoading} className="send-button" title="Send message">
              <SendIcon />
            </button>
          </form>
        </footer>
      </main>
    </div>
  );
}

export default UserDashboard;