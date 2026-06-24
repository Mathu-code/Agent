import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'agent',
      text: 'Ayubowan! 👋 Welcome to Kapruka Shopping Agent. What can I help you find today?',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: input,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Send to backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      })
      const data = await response.json()
      
      // Add agent response
      const agentMessage = {
        id: messages.length + 2,
        type: 'agent',
        text: data.reply,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, agentMessage])
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, {
        id: messages.length + 2,
        type: 'agent',
        text: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <div className="chat-container">
        <div className="chat-header">
          <h1>🛍️ Kapruka Shopping Agent</h1>
        </div>
        
        <div className="messages">
          {messages.map(msg => (
            <div key={msg.id} className={`message ${msg.type}`}>
              <div className="message-content">
                {msg.text}
              </div>
              <div className="message-time">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          {loading && (
            <div className="message agent">
              <div className="message-content">
                <div className="typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            Send
          </button>
        </form>
      </div>
    </div>
  )
}

export default App
