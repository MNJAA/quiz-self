const quizzes = [
    { id: 1, title: "General Knowledge Quiz", description: "Test your general knowledge." },
    { id: 2, title: "Math Quiz", description: "Solve fun math problems." },
    { id: 3, title: "Science Quiz", description: "Explore science topics." }
  ];
  
  const ReadyQuizzes = () => (
    <div className="ready-quizzes">
      <h2>Ready-Made Quizzes</h2>
      <div className="quiz-list">
        {quizzes.map(quiz => (
          <div key={quiz.id} className="quiz-card">
            <h3>{quiz.title}</h3>
            <p>{quiz.description}</p>
            <button className="start-quiz-btn">Start Quiz</button>
          </div>
        ))}
      </div>
    </div>
  );
  
  export default ReadyQuizzes;