import { useState, useEffect } from 'react';
import { generateQuiz } from '../services/gemini';
import { Loader2, CheckCircle, XCircle, Brain, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function Quiz({ videoTitle, videoDescription, courseId, videoId }) {
    const { currentUser } = useAuth();
    const [quizData, setQuizData] = useState(null);
    const [activeQuestion, setActiveQuestion] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [quizSubmitted, setQuizSubmitted] = useState(false);

    useEffect(() => {
        setQuizData(null);
        setSelectedAnswers({});
        setShowResults(false);
        setActiveQuestion(0);
        setError(null);
        setQuizSubmitted(false);
    }, [videoId]);

    async function handleGenerateQuiz() {
        setLoading(true);
        setError(null);
        setQuizSubmitted(false);
        try {
            const data = await generateQuiz(videoTitle, videoDescription);
            if (data && data.questions) {
                setQuizData(data);
            } else {
                throw new Error("Invalid quiz data received");
            }
        } catch (err) {
            console.error(err);
            setError("Failed to generate quiz. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    function handleAnswerSelect(questionIndex, option) {
        if (showResults) return;
        setSelectedAnswers(prev => ({
            ...prev,
            [questionIndex]: option
        }));
    }

    function calculateScore() {
        let correct = 0;
        quizData.questions.forEach((q, idx) => {
            if (selectedAnswers[idx] === q.correctAnswer) correct++;
        });
        return correct;
    }

    async function handleSubmitQuiz() {
        if (!currentUser || quizSubmitted) return;
        
        const score = calculateScore();
        const xpEarned = score * 5;
        
        try {
            const userRef = doc(db, "users", currentUser.uid);
            await updateDoc(userRef, {
                "learningStats.quizzesTaken": increment(1),
                "learningStats.xp": increment(xpEarned)
            });
            setQuizSubmitted(true);
        } catch (err) {
            console.error("Error updating quiz stats:", err);
        }
        
        setShowResults(true);
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary-600" />
                <p>Generating a unique quiz for this video...</p>
            </div>
        );
    }

    if (!quizData) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-full mb-4">
                    <Brain className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Test Your Knowledge</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                    Generate an AI-powered quiz based on "<strong>{videoTitle}</strong>" to reinforce what you've learned.
                </p>
                <button
                    onClick={handleGenerateQuiz}
                    className="inline-flex items-center justify-center rounded-md bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-all hover:scale-105"
                >
                    Generate Quiz
                </button>
                {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
            </div>
        );
    }

    const score = calculateScore();

    return (
        <div className="max-w-3xl mx-auto p-4 space-y-8">
            {!showResults ? (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Question {activeQuestion + 1} of {quizData.questions.length}</h3>
                        <span className="text-sm text-gray-500">Topic: {videoTitle}</span>
                    </div>

                    <div key={activeQuestion}>
                        <p className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                            {quizData.questions[activeQuestion].question}
                        </p>
                        <div className="space-y-3">
                            {quizData.questions[activeQuestion].options.map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswerSelect(activeQuestion, option)}
                                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selectedAnswers[activeQuestion] === option
                                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800'
                                        }`}
                                >
                                    <div className="flex items-center">
                                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center mr-3 ${selectedAnswers[activeQuestion] === option
                                            ? 'border-primary-600 bg-primary-600 text-white'
                                            : 'border-gray-400'
                                            }`}>
                                            {selectedAnswers[activeQuestion] === option && <div className="w-2 h-2 bg-white rounded-full" />}
                                        </div>
                                        <span className="text-gray-900 dark:text-gray-100">{option}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
                        <button
                            disabled={activeQuestion === 0}
                            onClick={() => setActiveQuestion(prev => prev - 1)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white disabled:opacity-50"
                        >
                            Previous
                        </button>
                        {activeQuestion === quizData.questions.length - 1 ? (
                            <button
                                onClick={handleSubmitQuiz}
                                disabled={Object.keys(selectedAnswers).length < quizData.questions.length}
                                className="px-6 py-2 rounded-md bg-primary-600 text-white font-medium hover:bg-primary-500 disabled:opacity-50"
                            >
                                Submit Quiz
                            </button>
                        ) : (
                            <button
                                onClick={() => setActiveQuestion(prev => prev + 1)}
                                className="px-6 py-2 rounded-md bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:bg-gray-800 dark:hover:bg-gray-100"
                            >
                                Next
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 mb-4">
                            <span className="text-3xl font-bold">{Math.round((score / quizData.questions.length) * 100)}%</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                            You scored {score} out of {quizData.questions.length}
                        </h3>
                        <button
                            onClick={handleGenerateQuiz}
                            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500 font-medium"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Generate New Quiz
                        </button>
                    </div>

                    <div className="space-y-6">
                        {quizData.questions.map((q, qIdx) => (
                            <div key={qIdx} className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                                <p className="font-medium text-gray-900 dark:text-white mb-4">
                                    {qIdx + 1}. {q.question}
                                </p>
                                <div className="space-y-2">
                                    {q.options.map((opt, oIdx) => {
                                        const isSelected = selectedAnswers[qIdx] === opt;
                                        const isCorrect = q.correctAnswer === opt;

                                        let styleClass = "border-gray-200 dark:border-gray-700 opacity-50";
                                        let Icon = null;

                                        if (isCorrect) {
                                            styleClass = "border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-500/50";
                                            Icon = CheckCircle;
                                        } else if (isSelected && !isCorrect) {
                                            styleClass = "border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-500/50";
                                            Icon = XCircle;
                                        }

                                        return (
                                            <div key={oIdx} className={`flex items-center justify-between p-3 rounded-md border text-sm ${styleClass}`}>
                                                <span className={isCorrect || isSelected ? "font-medium text-gray-900 dark:text-white" : "text-gray-500"}>
                                                    {opt}
                                                </span>
                                                {Icon && <Icon className={`w-5 h-5 ${isCorrect ? 'text-green-500' : 'text-red-500'}`} />}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-sm rounded-md">
                                    <strong>Explanation:</strong> {q.explanation}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
