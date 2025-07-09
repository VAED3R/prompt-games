'use client';
import React, { useState, useRef, useEffect } from 'react'
import styles from './page.module.css'

const MOVIES = [
  'The Lion King',
  'Jurassic Park',
  'Titanic',
  'Avatar',
  'Frozen',
  'The Matrix',
  'Star Wars',
];

const page = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [objectives, setObjectives] = useState(
    MOVIES.map((movie, index) => ({ 
      movie, 
      status: index === 0 ? 'current' : 'pending',
      revealed: false 
    }))
  );
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);
  const messagesEndRef = useRef(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Function to censor movie names
  const censorMovie = (movieName) => {
    return movieName.replace(/[a-zA-Z]/g, '*');
  };

  // Function to check if user's guess matches current movie
  const checkMovieGuess = (userGuess) => {
    const currentMovie = MOVIES[currentMovieIndex];
    const normalizedGuess = userGuess.toLowerCase();
    
    // Split movie name into words and check if all words are present
    const movieWords = currentMovie.toLowerCase().split(/\s+/);
    const userWords = normalizedGuess.split(/\s+/);
    
    // Check if all movie words are present in user's message
    const allMovieWordsFound = movieWords.every(movieWord => 
      userWords.some(userWord => userWord.includes(movieWord) || movieWord.includes(userWord))
    );
    
    // Also check for exact matches and variations
    const exactMatch = normalizedGuess === currentMovie.toLowerCase() ||
                      normalizedGuess === currentMovie.toLowerCase().replace(/^the\s+/i, '') ||
                      normalizedGuess === `the ${currentMovie.toLowerCase()}`;
    
    return allMovieWordsFound || exactMatch;
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
    
    const userMessage = input;
    setMessages(prev => [...prev, { text: userMessage, from: "user" }]);
    setInput("");
    setLoading(true);

    try {
      // Check if user is guessing the current movie
      if (checkMovieGuess(userMessage)) {
        // Correct guess!
        setMessages(prev => [...prev, { 
          text: `🎉 Correct! You guessed "${MOVIES[currentMovieIndex]}" correctly!`, 
          from: "ai" 
        }]);
        
        // Update objectives
        setObjectives(prev => 
          prev.map((obj, index) => 
            index === currentMovieIndex 
              ? { ...obj, status: 'completed', revealed: true }
              : index === currentMovieIndex + 1
              ? { ...obj, status: 'current' }
              : obj
          )
        );
        
        // Move to next movie
        if (currentMovieIndex < MOVIES.length - 1) {
          setCurrentMovieIndex(prev => prev + 1);
        } else {
          setMessages(prev => [...prev, { 
            text: "🎊 Congratulations! You've completed all the movies! 🎊", 
            from: "ai" 
          }]);
        }
      } else {
        // Regular API call for emoji clues
        const res = await fetch("/api/ai-charades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            message: userMessage,
            currentMovie: MOVIES[currentMovieIndex]
          }),
        });
        const data = await res.json();
        if (data.message) {
          setMessages(prev => [...prev, { text: data.message, from: "ai" }]);
        } else if (data.error) {
          setMessages(prev => [...prev, { text: `Error: ${data.error}`, from: "ai" }]);
        }
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

  const getCurrentMovie = () => {
    return MOVIES[currentMovieIndex];
  };

  return (
    <>
      <div className={styles.background} />
      <div className={styles.container}>
        <div className={styles.logoArea}>
          <span className={styles.logoIcon} role="img" aria-label="Charades">🎭</span>
          <span style={{ fontWeight: 600, fontSize: '1.25rem', color: '#4f8cff', letterSpacing: '0.01em' }}>AI Charades</span>
        </div>
        <h1 className={styles.heading}>Movie Charades with Emoji Clues</h1>
        <div className={styles.pageContent}>
          <div className={styles.chatBox}>
            <div className={styles.messages}>
              {messages.length === 0 ? (
                <div style={{ color: '#888' }}>
                  Welcome to Movie Charades! 🎬<br/>
                  The AI will give you emoji clues for movies. Try to guess the movie name!<br/>
                  Current movie: {censorMovie(getCurrentMovie())}
                </div>
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
                  <span className={styles.bubble} style={{ color: '#888' }}>AI is thinking...</span>
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
                placeholder="Type your movie guess or ask for clues..."
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
            <div className={styles.objectivesTitle}>Movies</div>
            {objectives.map((obj, index) => (
              <div key={obj.movie} className={styles.objectiveRow}>
                <span className={`${styles.objectiveWord} ${
                  obj.status === 'completed' ? styles.completed : 
                  obj.status === 'current' ? styles.current : 
                  styles.pending
                }`}>
                  {obj.revealed ? obj.movie : censorMovie(obj.movie)}
                  {obj.status === 'current' && ' (Current)'}
                  {obj.status === 'completed' && ' ✅'}
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
