'use client';
import React, { useState, useRef, useEffect } from 'react'
import styles from './page.module.css'

const OBJECTIVES = [
  'Elephant',
  'Spaceship',
  'Banana',
  'Guitar',
  'Rainbow',
  'Robot',
  'Volcano',
];

const page = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [objectives, setObjectives] = useState(
    OBJECTIVES.map(word => ({ word, status: null }))
  );
  const messagesEndRef = useRef(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Function to check if AI response contains forbidden words
  const checkForbiddenWords = (aiResponse) => {
    const foundWords = [];
    
    // Clean the response: remove all whitespace, newlines, and symbols
    const cleanedResponse = aiResponse.toLowerCase().replace(/[\s\n\r\t.,!?;:'"`~@#$%^&*()_+\-=\[\]{}|\\/<>]/g, '');
    
    OBJECTIVES.forEach((word, index) => {
      const wordLower = word.toLowerCase();
      
      // Check if the word exists in the cleaned response
      if (cleanedResponse.includes(wordLower)) {
        foundWords.push(index);
      }
    });
    
    return foundWords;
  };

  // Function to convert markdown to HTML
  const formatMessage = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // **bold**
      .replace(/\*(.*?)\*/g, '<em>$1</em>')              // *italic*
      .replace(/`(.*?)`/g, '<code>$1</code>')            // `code`
      .replace(/\n/g, '<br>');                           // line breaks
  };

  const handleSend = async () => {
    if (input.trim() === "") return;
    setMessages(prev => [...prev, { text: input, from: "user" }]);
    const userMessage = input;
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai-charades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages(prev => [...prev, { text: data.message, from: "ai" }]);
        
        // Check for forbidden words in AI response
        const forbiddenWordIndices = checkForbiddenWords(data.message);
        if (forbiddenWordIndices.length > 0) {
          setObjectives(prev => 
            prev.map((obj, index) => 
              forbiddenWordIndices.includes(index) 
                ? { ...obj, status: 'crossed' }
                : obj
            )
          );
        }
      } else if (data.error) {
        setMessages(prev => [...prev, { text: `Error: ${data.error}`, from: "ai" }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { text: `Error: ${err.message}`, from: "ai" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const setObjectiveStatus = (idx, status) => {
    setObjectives(objectives =>
      objectives.map((obj, i) =>
        i === idx ? { ...obj, status } : obj
      )
    );
  };

  return (
    <>
      <div className={styles.background} />
      <div className={styles.container}>
        <div className={styles.logoArea}>
          <span className={styles.logoIcon} role="img" aria-label="Charades">🎭</span>
          <span style={{ fontWeight: 600, fontSize: '1.25rem', color: '#4f8cff', letterSpacing: '0.01em' }}>AI Charades</span>
        </div>
        <h1 className={styles.heading}>This is charades page</h1>
        <div className={styles.pageContent}>
          <div className={styles.chatBox}>
            <div className={styles.messages}>
              {messages.length === 0 ? (
                <div style={{ color: '#888' }}>No messages yet.</div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={
                      msg.from === 'user'
                        ? `${styles.message} ${styles.userMessage}`
                        : msg.from === 'ai'
                        ? `${styles.message} ${styles.aiMessage}`
                        : styles.message
                    }
                  >
                    <span
                      className={
                        msg.from === 'user'
                          ? `${styles.bubble} ${styles.userBubble}`
                          : msg.from === 'ai'
                          ? `${styles.bubble} ${styles.aiBubble}`
                          : styles.bubble
                      }
                      dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }}
                    >
                    </span>
                  </div>
                ))
              )}
              {loading && (
                <div className={styles.message}>
                  <span className={styles.bubble} style={{ color: '#888' }}>AI is typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className={styles.inputRow}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Type your message..."
                className={styles.input}
              />
              <button
                onClick={handleSend}
                className={styles.sendButton}
              >
                Send
              </button>
            </div>
          </div>
          <div className={styles.objectivesSidebar}>
            <div className={styles.objectivesTitle}>Objectives</div>
            {objectives.map((obj) => (
              <div key={obj.word} className={styles.objectiveRow}>
                <span className={`${styles.objectiveWord} ${obj.status === 'crossed' ? styles.crossed : ''}`}>
                  {obj.word}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.footer}>
          &copy; {new Date().getFullYear()} AI Charades &mdash; Powered by Next.js
        </div>
      </div>
    </>
  );
}

export default page
