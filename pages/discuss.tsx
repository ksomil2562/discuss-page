// Discussion.tsx
"use client";
import React, { useEffect, useState, CSSProperties } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, query, orderBy, onSnapshot, doc, getDocs } from 'firebase/firestore';

interface QuestionData {
  id: string;
  question: string;
  answers: AnswerData[];
}

interface AnswerData {
  id: string;
  answer: string;
  timestamp: any;
}

const Discussion: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [question, setQuestion] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [listeners, setListeners] = useState<{ [key: string]: () => void }>({});

  useEffect(() => {
    const q = query(collection(db, 'questions'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const questionsData: QuestionData[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        question: doc.data().question,
        answers: [],
      }));
      setQuestions(questionsData);
    });

    return () => {
      unsubscribe();
      Object.values(listeners).forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const handleQuestionSelection = (id: string) => {
    if (selectedQuestionId === id) {
      setSelectedQuestionId(null);
      listeners[id]?.();
      setListeners((prev) => {
        const updatedListeners = { ...prev };
        delete updatedListeners[id];
        return updatedListeners;
      });
    } else {
      setSelectedQuestionId(id);

      if (!listeners[id]) {
        const answersCollection = collection(db, 'questions', id, 'answers');
        const unsubscribe = onSnapshot(query(answersCollection, orderBy('timestamp', 'asc')), (snapshot) => {
          setQuestions((prevQuestions) =>
            prevQuestions.map((q) =>
              q.id === id
                ? {
                    ...q,
                    answers: snapshot.docs.map((doc) => ({
                      id: doc.id,
                      answer: doc.data().answer,
                      timestamp: doc.data().timestamp,
                    })),
                  }
                : q
            )
          );
        });
        setListeners((prev) => ({ ...prev, [id]: unsubscribe }));
      }
    }
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      await addDoc(collection(db, 'questions'), {
        question,
        timestamp: new Date(),
      });
      setQuestion('');
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent, questionId: string) => {
    e.preventDefault();
    if (answer.trim()) {
      const answerRef = collection(doc(db, 'questions', questionId), 'answers');
      await addDoc(answerRef, {
        answer,
        timestamp: new Date(),
      });
      setAnswer('');
    }
  };

  return (
    <div style={styles.outerContainer} className="wavy-lines">
      <div style={styles.container}>
        <h1 style={styles.title}>Discuss</h1>
        <div style={styles.formContainer}>
          <h2 style={styles.formTitle}>Ask a Question</h2>
          <form onSubmit={handleSubmitQuestion}>
            <textarea
              placeholder="Post your question here..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              style={styles.textarea}
            />
            <button type="submit" style={styles.button}>Post Question</button>
          </form>
        </div>

        <div style={styles.filters}>
          <button style={{ ...styles.filterButton, ...styles.activeFilterButton }}>Recent</button>
          <button style={styles.filterButton}>Popular</button>
        </div>

        <h2 style={styles.sectionTitle}>Recent Questions</h2>
        {questions.map(({ id, question, answers }) => (
          <div key={id} style={styles.questionCard}>
            <h2 style={styles.questionText}>{question}</h2>
            <p style={styles.metaText}>Posted by User123 on Oct 25, 2024</p>
            <div style={styles.tags}>
              <span style={styles.tag}>Dynamic Programming</span>
              <span style={styles.tag}>Optimization</span>
            </div>
            <span
              style={styles.toggleButton}
              onClick={() => handleQuestionSelection(id)}
            >
              {selectedQuestionId === id ? 'Hide Replies' : 'View Replies'}
            </span>
            {selectedQuestionId === id && (
              <div style={styles.answerContainer}>
                <form onSubmit={(e) => handleSubmitAnswer(e, id)} style={styles.answerForm}>
                  <textarea
                    placeholder="Write your answer here..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    rows={2}
                    style={styles.answerTextarea}
                  />
                  <button type="submit" style={styles.answerButton}>Submit Answer</button>
                </form>
                {answers.map((ans, index) => (
                  <div key={ans.id} style={styles.answerCard}>
                    <div style={styles.answerHeader}>
                      <span style={styles.answerUsername}>User{index + 1}</span>
                      <span style={styles.answerTimestamp}>{new Date(ans.timestamp.seconds * 1000).toLocaleString()}</span>
                    </div>
                    <p style={styles.answerText}>{ans.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Define CSS styles with proper typing
const styles: { [key: string]: CSSProperties } = {
  outerContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f0fdfa',
    color: '#333',
    position: 'relative',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  title: {
    color: '#0d9488',
    fontSize: '2rem',
    textAlign: 'center',
    marginBottom: '20px',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    marginBottom: '20px',
  },
  formTitle: {
    fontSize: '1.25rem',
    color: '#333',
    marginBottom: '10px',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #d1d5db',
    borderRadius: '5px',
    resize: 'vertical',
    fontSize: '1rem',
    color: '#333',
    marginBottom: '10px',
  },
  button: {
    backgroundColor: '#0d9488',
    color: '#fff',
    padding: '10px 20px',
    fontSize: '1rem',
    borderRadius: '5px',
    cursor: 'pointer',
    border: 'none',
    transition: 'background-color 0.3s',
  },
  questionCard: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    padding: '15px',
    marginBottom: '15px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
  },
  questionText: {
    color: '#1d4ed8',
    fontSize: '1.25rem',
    marginBottom: '10px',
  },
  metaText: {
    fontSize: '0.9rem',
    color: '#4b5563',
  },
  answerContainer: {
    paddingLeft: '20px',
    marginTop: '10px',
  },
  answerForm: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '20px',
  },
  answerTextarea: {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    resize: 'vertical',
    fontSize: '1rem',
    color: '#333',
    marginBottom: '10px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  answerButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#0d9488',
    color: '#fff',
    padding: '8px 16px',
    fontSize: '0.9rem',
    borderRadius: '5px',
    cursor: 'pointer',
    border: 'none',
    transition: 'background-color 0.3s',
  },
  answerCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '10px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  answerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  answerUsername: {
    fontWeight: 'bold',
    fontSize: '0.9rem',
    color: '#0d9488',
  },
  answerTimestamp: {
    fontSize: '0.8rem',
    color: '#6b7280',
  },
  answerText: {
    fontSize: '1rem',
    color: '#333',
    lineHeight: '1.5',
  },
  toggleButton: {
    color: '#0d9488',
    fontSize: '0.9rem',
    cursor: 'pointer',
    textDecoration: 'underline',
    marginTop: '10px',
    display: 'inline-block',
  },
  tags: {
    marginTop: '10px',
  },
  tag: {
    display: 'inline-block',
    backgroundColor: '#e0f2fe',
    color: '#0c4a6e',
    fontSize: '0.75rem',
    padding: '5px 10px',
    margin: '5px 5px 0 0',
    borderRadius: '5px',
  },
  filters: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    justifyContent: 'center',
  },
  filterButton: {
    padding: '10px 15px',
    fontSize: '0.9rem',
    border: '1px solid #0d9488',
    borderRadius: '5px',
    backgroundColor: 'transparent',
    color: '#0d9488',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  activeFilterButton: {
    backgroundColor: '#0d9488',
    color: '#ffffff',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    color: '#333',
    marginBottom: '10px',
  },
};

// CSS for animated SVG wavy lines
const svgWavyLines = `
.wavy-lines::before, .wavy-lines::after {
  content: '';
  position: fixed;
  top: 0;
  bottom: 0;
  width: 6px;
  background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="6" height="200"><path fill="none" stroke="%2300A6A6" stroke-width="3" d="M3 0c0 66.667 0 133.333 0 200"/></svg>');
  background-repeat: repeat-y;
  animation: scrollWaves 5s linear infinite;
}
.wavy-lines::before {
  left: 0;
}
.wavy-lines::after {
  right: 0;
}

@keyframes scrollWaves {
  0% { background-position: 0 0; }
  100% { background-position: 0 200px; }
}
`;

// Inject the CSS into the page
document.head.insertAdjacentHTML('beforeend', `<style>${svgWavyLines}</style>`);

export default Discussion;
