import React, { useState, useEffect, useRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import './userDashboard.css';

const PaperClipIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.59a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
);
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
);
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
const BotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect x="4" y="12" width="16" height="8" rx="2"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M12 12v-2a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v2Z"/></svg>
);
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

export default function UserDashboard() {
  const [userId] = useState(() => {
    let storedUserId = localStorage.getItem('paperMindUserId');
    if (!storedUserId) {
      storedUserId = `user_${uuidv4()}`;
      localStorage.setItem('paperMindUserId', storedUserId);
    }
    return storedUserId;
  });

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    try {
      const savedChats = localStorage.getItem('paperMindChats');
      if (savedChats) {
        const parsedChats = JSON.parse(savedChats);
        setChats(parsedChats);
        if (parsedChats.length > 0) {
          setActiveChatId(parsedChats.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0].id);
        } else {
            createNewChat();
        }
      } else {
        createNewChat();
      }
    } catch (error) {
      console.error("Failed to load chats from localStorage:", error);
      createNewChat();
    }
  }, []);

  useEffect(() => {
    try {
        if (chats.length > 0) {
            localStorage.setItem('paperMindChats', JSON.stringify(chats));
        }
    } catch (error) {
      console.error("Failed to save chats to localStorage:", error);
    }
  }, [chats]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, activeChatId]);

  const createNewChat = () => {
    const newChatId = uuidv4();
    const newChat = {
      id: newChatId,
      title: 'New Analysis',
      messages: [],
      createdAt: new Date().toISOString()
    };
    setChats(prevChats => [newChat, ...prevChats]);
    setActiveChatId(newChatId);
    setSelectedFile(null);
    setUserInput('');
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };
  
  const activeChat = useMemo(() => {
    return chats.find(chat => chat.id === activeChatId);
  }, [chats, activeChatId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || !selectedFile || isLoading) return;

    setIsLoading(true);
    const userMessage = { role: 'user', content: userInput, file: selectedFile.name };

    setChats(prevChats =>
        prevChats.map(chat => {
            if (chat.id === activeChatId) {
                const newTitle = chat.messages.length === 0 ? userInput.substring(0, 35) : chat.title;
                return { ...chat, title: newTitle, messages: [...chat.messages, userMessage] };
            }
            return chat;
        })
    );
    
    const currentQuery = userInput;
    setUserInput('');

    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('query', currentQuery);
    formData.append('document', selectedFile);

    try {
      const response = await fetch('http://localhost:3001/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Backend request failed');
      }

      const data = await response.json();
      const botMessage = { role: 'bot', content: data.response };
      
      setChats(prevChats => prevChats.map(chat => {
        if(chat.id === activeChatId) {
             return { ...chat, messages: [...chat.messages, botMessage] };
        }
        return chat;
      }));

    } catch (error) {
      console.error('Error contacting backend:', error);
      const errorMessage = { role: 'bot', content: `**Error:** An issue occurred while contacting the analysis service.\n\n*Details: ${error.message}*` };
      setChats(prevChats => prevChats.map(chat => {
        if (chat.id === activeChatId) {
          return { ...chat, messages: [...chat.messages, errorMessage] };
        }
        return chat;
      }));
    } finally {
      setIsLoading(false);
    }
  };
  
  const MessageContent = ({ content }) => {
    const chartContainerId = useMemo(() => `chart-${uuidv4()}`, []);
    const jsCodeBlockRegex = /```javascript\s*([\s\S]*?)```/;
    const match = content.match(jsCodeBlockRegex);
  
    useEffect(() => {
      if (match && match[1]) {
        const scriptContent = match[1];
        const chartContainer = document.getElementById(chartContainerId);
        
        if (chartContainer) {
          chartContainer.innerHTML = '';
          const plotlyScriptId = 'plotly-script';
          if (!document.getElementById(plotlyScriptId)) {
            const plotlyScript = document.createElement('script');
            plotlyScript.id = plotlyScriptId;
            plotlyScript.src = 'https://cdn.plot.ly/plotly-latest.min.js';
            plotlyScript.async = true;
            document.body.appendChild(plotlyScript);
            plotlyScript.onload = () => executeScript();
          } else {
             executeScript();
          }
        }
        
        const executeScript = () => {
           try {
             const sandboxedScript = scriptContent.replace(
               /Plotly\.newPlot\s*\(\s*['"]([^'"]+)['"]/,
               `Plotly.newPlot('${chartContainerId}'`
             );
             new Function(sandboxedScript)();
           } catch (e) {
             console.error("Error executing chart script:", e);
             if(chartContainer) chartContainer.innerText = "Failed to render interactive chart.";
           }
        };
      }
    }, [content, match, chartContainerId]);
  
    const sanitizedMarkdown = DOMPurify.sanitize(marked.parse(content.replace(jsCodeBlockRegex, '')));
  
    return (
      <div className="prose">
        <div dangerouslySetInnerHTML={{ __html: sanitizedMarkdown }} />
        {match && <div id={chartContainerId} className="chart-container"></div>}
      </div>
    );
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">PaperMind.ai</h1>
        </div>
        <div className="sidebar-new-chat">
            <button onClick={createNewChat} className="new-chat-button">
                <PlusIcon/> New Analysis
            </button>
        </div>
        <nav className="sidebar-nav">
          {chats.map(chat => (
            <div
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              className={`chat-list-item ${activeChatId === chat.id ? 'active' : ''}`}
            >
              {chat.title}
            </div>
          ))}
        </nav>
      </aside>

      <main className="chat-area">
        {!activeChatId || !activeChat ? (
            <div className="chat-placeholder">
                <p>Select a chat or start a new analysis.</p>
            </div>
        ) : (
          <>
            <header className="chat-header">
                <h2 className="chat-title">{activeChat.title}</h2>
            </header>
            <div className="message-container">
                {activeChat.messages.length === 0 && (
                    <div className="message-placeholder">
                        Upload a document and ask a question to begin the analysis.
                    </div>
                )}
                {activeChat.messages.map((msg, index) => (
                    <div key={index} className={`message-wrapper ${msg.role === 'user' ? 'user' : 'bot'}`}>
                       {msg.role === 'bot' && <div className="message-icon bot"><BotIcon/></div>}
                        <div className={`message-content ${msg.role}`}>
                           {msg.role === 'user' ? (
                                <div>
                                    <p className="user-query">{msg.content}</p>
                                    <p className="user-file-info"><strong>File:</strong> {msg.file}</p>
                                </div>
                           ) : (
                                <MessageContent content={msg.content} />
                           )}
                        </div>
                        {msg.role === 'user' && <div className="message-icon user"><UserIcon/></div>}
                    </div>
                ))}
                {isLoading && (
                    <div className="message-wrapper bot">
                         <div className="message-icon bot"><BotIcon/></div>
                         <div className="message-content bot">
                            <div className="loading-indicator">
                                <div className="loading-dot"></div>
                                <div className="loading-dot"></div>
                                <div className="loading-dot"></div>
                            </div>
                         </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
            <footer className="chat-footer">
                <form onSubmit={handleSubmit} className="chat-form">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="attach-button">
                        <PaperClipIcon />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="file-input" />
                    <div className="message-input-wrapper">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder={selectedFile ? `Ask about ${selectedFile.name}` : "First, attach a document..."}
                            className="message-input"
                            disabled={!selectedFile || isLoading}
                        />
                    </div>
                    <button type="submit" className="send-button" disabled={!userInput.trim() || !selectedFile || isLoading}>
                        <SendIcon />
                    </button>
                </form>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}