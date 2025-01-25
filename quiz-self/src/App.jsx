import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'

// Temporary components
const Welcome = () => (
  <div className="welcome">
    <h1>Welcome to QuizSelf! 🎉</h1>
    <Link to="/main-menu" className="start-button">Get Started</Link>
  </div>
)

const MainMenu = () => (
  <div className="main-menu">
    <h2>Main Menu</h2>
    <div className="menu-options">
      <button className="menu-btn">Ready-Made Quizzes</button>
      <button className="menu-btn">Upload File (PDF/DOCX/XLSX/Images)</button>
    </div>
  </div>
)

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/main-menu" element={<MainMenu />} />
      </Routes>
    </Router>
  )
}

export default App