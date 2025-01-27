import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import FileUpload from './components/FileUpload';
import ReadyQuizzes from './components/ReadyQuizzes';
import QuizInterface from './components/QuizInterface';

// Temporary components
const Welcome = () => (
  <div className="welcome">
    <h1>Welcome to QuizSelf! 🎉</h1>
    <p>Create or take quizzes in seconds. No sign-up required.</p>
    <Link to="/main-menu" className="start-button">Get Started</Link>
  </div>
);

const MainMenu = () => (
  <div className="main-menu">
    <h2>Main Menu</h2>
    <div className="menu-options">
      <Link to="/ready-quizzes" className="menu-btn">
        Ready-Made Quizzes
      </Link>
      <FileUpload />
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/main-menu" element={<MainMenu />} />
        <Route path="/ready-quizzes" element={<ReadyQuizzes />} />
        <Route path="/quiz" element={<QuizInterface />} />
      </Routes>
    </Router>
  );
}

export default App;