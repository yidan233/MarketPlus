import React, { useState, useRef, useEffect } from 'react'
import styles from './FloatingChatbot.module.css'

const FloatingChatbot = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hi! I\'m your stock screening assistant. Ask me about which index to use, screening criteria, or investment strategies! 🤖📈',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [position, setPosition] = useState({ x: window.innerWidth - 100, y: window.innerHeight - 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  
  const chatRef = useRef(null)
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!isExpanded) {
        setPosition(prev => ({
          x: Math.min(prev.x, window.innerWidth - 100),
          y: Math.min(prev.y, window.innerHeight - 100)
        }))
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isExpanded])

  const handleMouseDown = (e) => {
    if (!isExpanded) {
      setIsDragging(true)
      const rect = chatRef.current.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging && !isExpanded) {
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y
      
      // Keep within window bounds
      const maxX = window.innerWidth - 60
      const maxY = window.innerHeight - 60
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:5000/api/v1/chatbot/advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: inputValue })
      })

      const data = await response.json()

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: data.success ? data.advice : 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Sorry, I\'m having trouble connecting. Please check your internet connection and try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const toggleChat = () => {
    setIsExpanded(!isExpanded)
  }

  const clearChat = () => {
    setMessages([
      {
        id: Date.now(),
        type: 'bot',
        content: 'Hi! I\'m your stock screening assistant. Ask me about which index to use, screening criteria, or investment strategies! 🤖📈',
        timestamp: new Date()
      }
    ])
  }

  return (
    <div 
      className={`${styles.floatingChatbot} ${isExpanded ? styles.expanded : ''} ${isDragging ? styles.dragging : ''}`}
      style={{ 
        left: isExpanded ? 'auto' : position.x, 
        top: isExpanded ? 'auto' : position.y,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      ref={chatRef}
    >
      {/* Chat Button (when collapsed) */}
      {!isExpanded && (
        <div 
          className={styles.chatButton}
          onClick={toggleChat}
          onMouseDown={handleMouseDown}
        >
          <div className={styles.chatIcon}>🤖</div>
          <div className={styles.chatLabel}>Stock Assistant</div>
        </div>
      )}

      {/* Chat Window (when expanded) */}
      {isExpanded && (
        <div className={styles.chatWindow}>
          {/* Header */}
          <div className={styles.chatHeader}>
            <div className={styles.chatTitle}>
              <span className={styles.botIcon}>🤖</span>
              Stock Screening Assistant
            </div>
            <div className={styles.chatActions}>
              <button 
                className={styles.clearButton}
                onClick={clearChat}
                title="Clear chat"
              >
                🗑️ clear history              </button>
              <button 
                className={styles.closeButton}
                onClick={toggleChat}
                title="Close chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className={styles.messagesContainer}>
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`${styles.message} ${styles[message.type]}`}
              >
                <div className={styles.messageContent}>
                  {message.content}
                </div>
                <div className={styles.messageTime}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className={`${styles.message} ${styles.bot}`}>
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className={styles.inputContainer}>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about stock screening..."
              className={styles.messageInput}
              disabled={isLoading}
              rows={1}
            />
            <button 
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              className={styles.sendButton}
            >
              {isLoading ? '⏳' : '📤'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default FloatingChatbot 