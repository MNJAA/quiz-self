import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Temporary components
const Welcome = () => (
  <div className="welcome">
    <h1>Welcome to QuizSelf! 🎉</h1>
    <Link to="/main-menu" className="start-button">Get Started</Link>
  </div>
);

const APITestButton = () => {
  const [response, setResponse] = useState('');

  const testOpenAI = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/test-openai', {
        method: 'POST'
      });
      const data = await res.json();
      setResponse(data.question || data.error);
    } catch (err) {
      setResponse('Connection failed');
    }
  };

  return (
    <div className="api-test">
      <button onClick={testOpenAI} className="menu-btn">
        Test OpenAI Connection
      </button>
      {response && <p className="response">API Response: {response}</p>}
    </div>
  );
};

const MainMenu = () => (
  <div className="main-menu">
    <h2>Main Menu</h2>
    <div className="menu-options">
      <button className="menu-btn">Ready-Made Quizzes</button>
      <button className="menu-btn">Upload File (PDF/DOCX/XLSX/Images)</button>
      <APITestButton />
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/main-menu" element={<MainMenu />} />
      </Routes>
    </Router>
  );
}

export default App;