import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './Chatbot.css';

const API_BASE_URL = 'https://aws-billing-platform.onrender.com';

function Chatbot() {
  const [messages, setMessages] = useState([
    { 
      text: "👋 Hi! Ask me about your billing data:\n\n- Total spending\n- Top services\n- Top projects\n- Monthly trend\n- Current month\n- [Service name] cost\n- Environment breakdown", 
      sender: 'bot' 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages(prev => [...prev, { text: input, sender: 'user' }]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/chatbot/ask`, null, {
        params: { query: input }
      });

      setMessages(prev => [...prev, { 
        text: response.data.response, 
        sender: 'bot' 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        text: "❌ Error: Could not get response. Make sure the backend is running.", 
        sender: 'bot' 
      }]);
    }
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <span>🤖 Billing Assistant</span>
        <small>Ask me anything about your data</small>
      </div>
      
      <div className="chatbot-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.sender}`}>
            <div className="message-bubble">
              {msg.text.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < msg.text.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
        {loading && (
          <div className="message bot">
            <div className="message-bubble typing">
              <span>.</span><span>.</span><span>.</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chatbot-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask a question..."
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading}>
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

export default Chatbot;
