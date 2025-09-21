import React, { useState, useEffect, useRef, useMemo } from 'react';

const PaperClipIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.59a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22,2 15,22 11,13 2,9"></polygon>
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const BotIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <circle cx="12" cy="5" r="2"></circle>
    <path d="M12 7v4"></path>
    <line x1="8" y1="16" x2="8" y2="16"></line>
    <line x1="16" y1="16" x2="16" y2="16"></line>
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const MessageContent = ({ content }) => {
  return (
    <div className="prose">
      <div dangerouslySetInnerHTML={{ __html: content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }} />
    </div>
  );
};

export default function UserDashboard() {
  const [userId] = useState(() => {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return id;
  });

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    createNewChat();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, activeChatId]);

  const createNewChat = () => {
    const newChatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newChat = { 
      id: newChatId, 
      title: `Chat ${chats.length + 1}`, 
      messages: [], 
      createdAt: new Date().toISOString() 
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChatId);
    setSelectedFile(null);
    setUserInput('');
  };

  const handleFileChange = (event) => setSelectedFile(event.target.files[0]);

  const activeChat = useMemo(() => chats.find(chat => chat.id === activeChatId), [chats, activeChatId]);

  const handleSubmit = async () => {
    if (!userInput.trim() || !selectedFile || isLoading) return;

    setIsLoading(true);
    const userMessage = { role: 'user', content: userInput, file: selectedFile.name };
    
    setChats(prev =>
      prev.map(chat => {
        if (chat.id === activeChatId) {
          const newTitle = chat.messages.length === 0 ? userInput.substring(0, 35) : chat.title;
          return { ...chat, title: newTitle, messages: [...chat.messages, userMessage] };
        }
        return chat;
      })
    );

    const currentQuery = userInput;
    setUserInput('');

    try {
      const simulatedResponse = `Analysis of ${selectedFile.name}: This is a simulated response for "${currentQuery}". The document has been processed and analyzed successfully.`;
      
      setTimeout(() => {
        const botMessage = { role: 'bot', content: simulatedResponse };
        setChats(prev =>
          prev.map(chat => (chat.id === activeChatId ? { ...chat, messages: [...chat.messages, botMessage] } : chat))
        );
        setIsLoading(false);
      }, 2000);
    } catch (error) {
      const errorMessage = { role: 'bot', content: `**Error:** An issue occurred.\n\n*Details: ${error.message}*` };
      setChats(prev =>
        prev.map(chat => (chat.id === activeChatId ? { ...chat, messages: [...chat.messages, errorMessage] } : chat))
      );
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      margin: 0,
      padding: 0,
      display: 'flex',
      backgroundColor: '#ffffff',
      color: '#333333',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      zIndex: 1000
    }}>
      <div style={{
        width: '320px',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        borderRight: '1px solid #e1e5e9',
        height: '100vh',
        position: 'relative'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e1e5e9',
          backgroundColor: '#ffffff'
        }}>
          <div style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: '#f86f03',
            margin: '0 0 1rem 0',
            textAlign: 'center'
          }}>
            PaperMind.ai
          </div>
          
          <button 
            onClick={createNewChat}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.875rem 1rem',
              borderRadius: '0.75rem',
              color: '#ffffff',
              backgroundColor: '#525fe1',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#414ab0';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#525fe1';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <PlusIcon />
            <span>New Chat</span>
          </button>
        </div>
        
        <div style={{
          flex: '1',
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          {chats.map(chat => (
            <div
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              style={{
                padding: '0.875rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: activeChatId === chat.id ? '#f86f03' : '#ffffff',
                color: activeChatId === chat.id ? '#ffffff' : '#333333',
                border: '1px solid #e1e5e9',
                borderColor: activeChatId === chat.id ? '#f86f03' : '#e1e5e9'
              }}
              onMouseOver={(e) => {
                if (activeChatId !== chat.id) {
                  e.target.style.backgroundColor = '#ffa41b';
                  e.target.style.color = '#ffffff';
                  e.target.style.transform = 'translateX(4px)';
                }
              }}
              onMouseOut={(e) => {
                if (activeChatId !== chat.id) {
                  e.target.style.backgroundColor = '#ffffff';
                  e.target.style.color = '#333333';
                  e.target.style.transform = 'translateX(0)';
                }
              }}
            >
              <div style={{
                fontWeight: '600',
                fontSize: '0.9rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginBottom: '0.25rem'
              }}>
                {chat.title}
              </div>
              <div style={{
                fontSize: '0.75rem',
                opacity: '0.8'
              }}>
                {new Date(chat.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        height: '100vh',
        position: 'relative'
      }}>
        {!activeChatId || !activeChat ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%'
          }}>
            <div style={{ textAlign: 'center', maxWidth: '400px' }}>
              <div style={{ color: '#2d3748', marginBottom: '0.75rem', fontSize: '1.5rem', fontWeight: '600' }}>Welcome to PaperMind.ai</div>
              <div style={{ color: '#6c757d', lineHeight: '1.6' }}>Select a chat from the sidebar or start a new chat to begin.</div>
            </div>
          </div>
        ) : (
          <React.Fragment>
            <div style={{
              padding: '1.25rem 2rem',
              backgroundColor: '#ffffff',
              borderBottom: '1px solid #e1e5e9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{
                fontSize: '1.375rem',
                fontWeight: '600',
                margin: '0',
                color: '#2d3748'
              }}>
                {activeChat.title}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                {selectedFile && (
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#6c757d',
                    backgroundColor: '#f1f3f4',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '0.375rem'
                  }}>
                    File: {selectedFile.name}
                  </span>
                )}
              </div>
            </div>
            
            <div style={{
              flex: '1',
              overflowY: 'auto',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              backgroundColor: '#fafbfc'
            }}>
              {activeChat.messages.length === 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%'
                }}>
                  <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                    <div style={{ color: '#2d3748', marginBottom: '0.75rem', fontSize: '1.25rem', fontWeight: '600' }}>Ready to analyze your document</div>
                    <div style={{ color: '#6c757d', lineHeight: '1.6' }}>Upload a document and ask a question to begin the analysis.</div>
                  </div>
                </div>
              )}
              
              {activeChat.messages.map((msg, index) => (
                <div key={index} style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: '0',
                    backgroundColor: msg.role === 'bot' ? '#525fe1' : '#f86f03',
                    color: '#ffffff'
                  }}>
                    {msg.role === 'bot' ? <BotIcon /> : <UserIcon />}
                  </div>
                  <div style={{
                    maxWidth: '75%',
                    padding: '1rem 1.25rem',
                    borderRadius: '1rem',
                    lineHeight: '1.6',
                    backgroundColor: msg.role === 'user' ? '#f86f03' : '#ffffff',
                    color: msg.role === 'user' ? '#ffffff' : '#333333',
                    border: msg.role === 'bot' ? '1px solid #e1e5e9' : 'none',
                    borderBottomRightRadius: msg.role === 'user' ? '0.25rem' : '1rem',
                    borderBottomLeftRadius: msg.role === 'bot' ? '0.25rem' : '1rem'
                  }}>
                    {msg.role === 'user' ? (
                      <div style={{ margin: '0' }}>
                        <div style={{ margin: '0 0 0.5rem 0', fontWeight: '500' }}>{msg.content}</div>
                        <div style={{ margin: '0', fontSize: '0.85rem', opacity: '0.9' }}>
                          <strong>Analyzing:</strong> {msg.file}
                        </div>
                      </div>
                    ) : (
                      <MessageContent content={msg.content} />
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: '0',
                    backgroundColor: '#525fe1',
                    color: '#ffffff'
                  }}>
                    <BotIcon />
                  </div>
                  <div style={{
                    maxWidth: '75%',
                    padding: '1rem 1.25rem',
                    borderRadius: '1rem',
                    lineHeight: '1.6',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e1e5e9',
                    borderBottomLeftRadius: '0.25rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      gap: '0.375rem',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#525fe1',
                        animation: 'pulse 1.5s ease-in-out infinite'
                      }}></div>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#525fe1',
                        animation: 'pulse 1.5s ease-in-out infinite 0.3s'
                      }}></div>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#525fe1',
                        animation: 'pulse 1.5s ease-in-out infinite 0.6s'
                      }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            
            <div style={{
              padding: '1.25rem 2rem',
              backgroundColor: '#ffffff',
              borderTop: '1px solid #e1e5e9'
            }}>
              <div style={{
                display: 'flex',
                width: '100%',
                alignItems: 'center',
                gap: '0.75rem',
                maxWidth: '1000px',
                margin: '0 auto'
              }}>
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    backgroundColor: '#6c757d',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.875rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s ease',
                    minWidth: '48px',
                    minHeight: '48px'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
                  title="Attach document"
                >
                  <PaperClipIcon />
                </button>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  style={{ display: 'none' }}
                  accept=".pdf,.doc,.docx,.txt"
                />
                
                <div style={{ flex: '1' }}>
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={selectedFile ? `Ask about ${selectedFile.name}` : "First, attach a document..."}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1.125rem',
                      border: '2px solid #e1e5e9',
                      borderRadius: '0.75rem',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s ease',
                      outline: 'none',
                      backgroundColor: (!selectedFile || isLoading) ? '#f8f9fa' : '#ffffff',
                      color: (!selectedFile || isLoading) ? '#6c757d' : '#333333',
                      boxSizing: 'border-box'
                    }}
                    disabled={!selectedFile || isLoading}
                    onFocus={(e) => e.target.style.borderColor = '#525fe1'}
                    onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                  />
                </div>
                
                <button 
                  type="button"
                  onClick={handleSubmit}
                  disabled={!userInput.trim() || !selectedFile || isLoading}
                  style={{
                    backgroundColor: (!userInput.trim() || !selectedFile || isLoading) ? '#b3baff' : '#525fe1',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.875rem',
                    borderRadius: '0.5rem',
                    cursor: (!userInput.trim() || !selectedFile || isLoading) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    minWidth: '48px',
                    minHeight: '48px'
                  }}
                  onMouseOver={(e) => {
                    if (!(!userInput.trim() || !selectedFile || isLoading)) {
                      e.target.style.backgroundColor = '#414ab0';
                      e.target.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!(!userInput.trim() || !selectedFile || isLoading)) {
                      e.target.style.backgroundColor = '#525fe1';
                      e.target.style.transform = 'translateY(0)';
                    }
                  }}
                  title="Send message"
                >
                  <SendIcon />
                </button>
              </div>
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}