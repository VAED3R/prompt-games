'use client';
import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
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
  const router = useRouter();
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
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const timerRef = useRef(null);
  const [userId, setUserId] = useState(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);

  // Load user progress on component mount
  useEffect(() => {
    const loadUserProgress = async () => {
      try {
        console.log('Loading user progress...');
        
        // Get user ID from localStorage (set during registration)
        const storedUserId = localStorage.getItem('userId');
        console.log('Stored userId from localStorage:', storedUserId);
        
        if (storedUserId) {
          setUserId(storedUserId);
          
          // Get user progress from Firebase
          console.log('Fetching user document from Firebase...');
          const userDoc = await getDoc(doc(db, 'users', storedUserId));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('User data from Firebase:', userData);
            
            if (userData.gameProgress) {
              const progress = userData.gameProgress;
              console.log('Found game progress:', progress);
              
              // Restore game state
              setCurrentMovieIndex(progress.currentMovieIndex || 0);
              setTimer(progress.timer || 0);
              setMessages(progress.messages || []);
              setObjectives(progress.objectives || MOVIES.map((movie, index) => ({ 
                movie, 
                status: index === 0 ? 'current' : 'pending',
                revealed: false 
              })));
              setGameCompleted(progress.gameCompleted || false);
              setIsTimerRunning(progress.isTimerRunning || false);
              
              console.log('Game progress loaded successfully');
            } else {
              console.log('No game progress found, starting fresh game');
            }
          } else {
            console.log('User document not found in Firebase');
          }
        } else {
          console.log('No userId found in localStorage');
        }
      } catch (error) {
        console.error('Error loading progress:', error);
        console.error('Error details:', {
          errorMessage: error.message,
          errorCode: error.code
        });
      } finally {
        setIsLoadingProgress(false);
      }
    };

    loadUserProgress();
  }, []);

  // Save progress to Firebase
  const saveProgress = async () => {
    if (!userId) {
      console.log('No userId available, skipping save');
      return;
    }
    
    try {
      console.log('Attempting to save progress for user:', userId);
      
      const progress = {
        currentMovieIndex,
        timer,
        messages,
        objectives,
        gameCompleted,
        isTimerRunning,
        lastSaved: new Date().toISOString()
      };

      console.log('Progress data to save:', progress);

      await updateDoc(doc(db, 'users', userId), {
        gameProgress: progress
      });
      
      console.log('Progress saved successfully for user:', userId);
    } catch (error) {
      console.error('Error saving progress:', error);
      console.error('Error details:', {
        userId,
        errorMessage: error.message,
        errorCode: error.code
      });
    }
  };

  // Save progress for other state changes (not timer)
  useEffect(() => {
    if (!isLoadingProgress && userId && !isTimerRunning) {
      // Save progress when other state changes (messages, objectives, etc.)
      // Timer is saved separately in the timer effect
      saveProgress();
    }
  }, [currentMovieIndex, messages, objectives, gameCompleted, userId, isLoadingProgress]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Timer effect
  useEffect(() => {
    if (isTimerRunning && !gameCompleted) {
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          const newTimer = prev + 1;
          return newTimer;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning, gameCompleted]);

  // Save timer to database whenever it changes
  useEffect(() => {
    if (userId && !isLoadingProgress && timer > 0) {
      saveProgress();
    }
  }, [timer, userId, isLoadingProgress]);

  // Function to pause timer
  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  // Function to resume timer
  const resumeTimer = () => {
    setIsTimerRunning(true);
  };

  // Function to format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
        
        // Add a celebratory message for correct answers
        setTimeout(() => {
          const progress = Math.round(((currentMovieIndex + 1) / MOVIES.length) * 100);
          setMessages(prev => [...prev, { 
            text: `✨ Great job! You're ${progress}% through the game! ✨\n\n🎬 Next movie coming up...`, 
            from: "ai" 
          }]);
        }, 1000);
        
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
          
          // Pause timer while generating clue
          pauseTimer();
          
          // Show loading message for next clue
          setMessages(prev => [...prev, { 
            text: "🎬 Generating clue for the next movie...", 
            from: "ai" 
          }]);
          
          // Automatically get the next clue
          setTimeout(async () => {
            try {
              const res = await fetch("/api/ai-charades", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                  message: "Give me a clue for the next movie",
                  currentMovie: MOVIES[currentMovieIndex + 1]
                }),
              });
              const data = await res.json();
              if (data.message) {
                // Replace the loading message with the actual clue
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = { text: data.message, from: "ai" };
                  return newMessages;
                });
                
                // Resume timer after clue is ready
                resumeTimer();
              } else if (data.error) {
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = { text: `Error: ${data.error}`, from: "ai" };
                  return newMessages;
                });
                
                // Resume timer even on error
                resumeTimer();
              }
            } catch (err) {
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { text: `Error: ${err.message}`, from: "ai" };
                return newMessages;
              });
              
              // Resume timer even on error
              resumeTimer();
            }
          }, 1000); // 1 second delay before showing next clue
          
        } else {
          // Game completed - stop timer
          setGameCompleted(true);
          setIsTimerRunning(false);
          
          const finalTime = timer;
          const completionTime = new Date().toISOString();
          
          setMessages(prev => [...prev, { 
            text: `🎊 Congratulations! You've completed all the movies in ${formatTime(timer)}! 🎊`, 
            from: "ai" 
          }]);
          
          // Add a celebratory completion message
          setTimeout(() => {
            setMessages(prev => [...prev, { 
              text: `🏆 Amazing job! You've mastered all ${MOVIES.length} movies! 🏆\n\n⏱️ Final Time: ${formatTime(timer)}\n🎯 Movies Completed: ${MOVIES.length}\n\n🌟 You're a true movie charades champion! 🌟`, 
              from: "ai" 
            }]);
          }, 2000);
          
          // Save completion data to database
          try {
            if (userId) {
              const completionData = {
                gameCompleted: true,
                completionTime: completionTime,
                finalTime: finalTime,
                finalTimeFormatted: formatTime(finalTime),
                totalMovies: MOVIES.length,
                completedAt: completionTime
              };
              
              await updateDoc(doc(db, 'users', userId), {
                gameProgress: {
                  currentMovieIndex,
                  timer: finalTime,
                  messages,
                  objectives,
                  gameCompleted: true,
                  isTimerRunning: false,
                  lastSaved: completionTime
                },
                completionData: completionData
              });
              
              console.log('Game completion saved to database:', completionData);
            }
          } catch (error) {
            console.error('Error saving completion data:', error);
          }
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
          
          // Start timer on first AI response
          if (!isTimerRunning && messages.length === 0) {
            setIsTimerRunning(true);
          }
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

  // Show loading screen while loading progress
  if (isLoadingProgress) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', color: '#4f8cff' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎭</div>
          <div>Loading your progress...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.background} />
      <div className={styles.container}>
        <div className={styles.logoArea}>
          <span className={styles.logoIcon} role="img" aria-label="Charades">🎭</span>
          <span style={{ fontWeight: 600, fontSize: '1.25rem', color: '#4f8cff', letterSpacing: '0.01em' }}>AI Charades</span>
        </div>
        <h1 className={styles.heading}>Movie Charades with Emoji Clues</h1>
        
        {/* Timer Display */}
        <div className={styles.timerContainer}>
          <div className={styles.timer}>
            <span className={styles.timerLabel}>Time:</span>
            <span className={styles.timerValue}>{formatTime(timer)}</span>
          </div>
        </div>
        
        <div className={styles.pageContent}>
          <div className={styles.chatBox}>
            <div className={styles.messages}>
              {messages.length === 0 ? (
                <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎭</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#4f8cff', marginBottom: '1rem' }}>
                    Welcome to AI Movie Charades!
                  </div>
                  <div style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
                    🎬 <strong>How to Play:</strong><br/>
                    • The AI will give you emoji clues for movies<br/>
                    • Try to guess the movie name from the clues<br/>
                    • Ask questions like "Is it a Disney movie?" or "What genre?"<br/>
                    • Type "Start" to begin your first clue!
                  </div>
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
