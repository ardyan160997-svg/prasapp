'use client';

import { useState, useEffect, useCallback } from 'react';
import { QuestionCard } from '@/components/public/QuestionCard';
import { Heart, Sparkles, Music, Star, RotateCcw } from 'lucide-react';
import Link from 'next/link';

interface Question {
  id: string;
  text: string;
  category: string;
  order: number;
}

interface AnswerCache {
  [questionId: string]: string;
}

const STORAGE_KEY = 'novia_answers';
const ANSWERED_KEY = 'novia_answered';

export default function HomePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
  const [answersCache, setAnswersCache] = useState<AnswerCache>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showHero, setShowHero] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedAnswers = localStorage.getItem(STORAGE_KEY);
      const savedAnswered = localStorage.getItem(ANSWERED_KEY);
      if (savedAnswers) setAnswersCache(JSON.parse(savedAnswers));
      if (savedAnswered) setAnsweredQuestions(new Set(JSON.parse(savedAnswered)));
    } catch (e) {
      console.error('Failed to load cache:', e);
    }
  }, []);

  // Fetch questions (only once on mount)
  useEffect(() => {
    fetch('/api/questions')
      .then(res => res.json())
      .then((data: { questions?: Question[] }) => {
        const fetchedQuestions = data.questions || [];
        setQuestions(fetchedQuestions);
        setIsLoading(false);

        // Auto-advance to first unanswered question (only on initial load)
        const answered = Array.from(answeredQuestions);
        const firstUnanswered = fetchedQuestions.findIndex((q: Question) => !answered.includes(q.id));
        if (firstUnanswered !== -1 && firstUnanswered > 0) {
          setCurrentIndex(firstUnanswered);
        }
      })
      .catch(err => {
        console.error('Failed to fetch questions:', err);
        setIsLoading(false);
      });
  }, []); // Empty dependency array - only run once on mount

  // Save to localStorage whenever answers/answered change
  const saveToCache = useCallback((newAnswers: AnswerCache, newAnswered: Set<string>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newAnswers));
      localStorage.setItem(ANSWERED_KEY, JSON.stringify(Array.from(newAnswered)));
    } catch (e) {
      console.error('Failed to save cache:', e);
    }
  }, []);

  // Sync to server in background
  const syncToServer = useCallback(async (questionId: string, answer: string) => {
    try {
      await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, answerText: answer }),
      });
    } catch (err) {
      console.error('Background sync failed:', err);
    }
  }, []);

  const handleAnswer = async (questionId: string, answer: string) => {
    try {
      const res = await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, answerText: answer }),
      });
      if (!res.ok) throw new Error('Failed to save');

      // Update local state immediately
      setAnswersCache(prev => ({ ...prev, [questionId]: answer }));
      setAnsweredQuestions(prev => {
        const next = new Set(prev);
        next.add(questionId);
        saveToCache({ ...answersCache, [questionId]: answer }, next);
        return next;
      });

      if (currentIndex < questions.length - 1) {
        setTimeout(() => setCurrentIndex(prev => prev + 1), 800);
      }
    } catch (err) {
      console.error('Save answer failed:', err);
      alert('Gagal menyimpan jawaban, coba lagi ya 😢');
    }
  };

  const handleSkip = (questionId: string) => {
    const nextAnswered = new Set(answeredQuestions);
    nextAnswered.add(questionId);
    setAnsweredQuestions(nextAnswered);
    saveToCache(answersCache, nextAnswered);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleNext = (questionId: string) => {
    // Just advance to next question without marking as answered
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleClearCache = () => {
    if (confirm('Yakin mau hapus semua jawaban tersimpan? Ini gak bisa di-undo 😢')) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ANSWERED_KEY);
      setAnswersCache({});
      setAnsweredQuestions(new Set());
      setCurrentIndex(0);
      setShowHero(true);
    }
  };

  // Get cached answer for current question
  const getCachedAnswer = (questionId: string) => answersCache[questionId] || '';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-pink-900/20 dark:via-gray-900 dark:to-purple-900/20">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 animate-bounce-gentle">
            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="40" r="35" fill="#fce7f3"/>
              <path d="M40 20C31.7 20 25 26.7 25 35C25 40.5 30 44.5 35 48L40 55L45 48C50 44.5 55 40.5 55 35C55 26.7 48.3 20 40 20Z" fill="#ec4899" opacity="0.3"/>
              <path d="M33 33C31.9 33 31 33.9 31 35C31 36.1 31.9 37 33 37C34.1 37 35 36.1 35 35C35 33.9 34.1 33 33 33Z" fill="#ec4899"/>
              <path d="M47 33C45.9 33 45 33.9 45 35C45 36.1 45.9 37 47 37C48.1 37 49 36.1 49 35C49 33.9 48.1 33 47 33Z" fill="#ec4899"/>
              <path d="M33 42C33 40.9 33.9 40 35 40C36.1 40 37 40.9 37 42C37 43.1 36.1 44 35 44C33.9 44 33 43.1 33 42Z" fill="#ec4899" opacity="0.5"/>
            </svg>
          </div>
          <p className="text-pink-600 dark:text-pink-300 font-medium">Memuat pertanyaan manis... 💕</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-pink-900/20 dark:via-gray-900 dark:to-purple-900/20 p-4">
        <div className="text-center card-cute p-8 max-w-md">
          <p className="text-xl font-display font-semibold text-gray-800 dark:text-pink-100 mb-4">
            Belum ada pertanyaan nih 😢
          </p>
          <p className="text-pink-600 dark:text-pink-300 mb-6">
            Mintain si editor (kamu!) buat nambahin pertanyaan di dashboard editor ya~
          </p>
          <Link href="/editor/login" className="btn-cute btn-cute-primary inline-block">
            Ke Dashboard Editor
          </Link>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const answeredCount = answeredQuestions.size;
  const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${showHero ? 'bg-gradient-to-br from-[#170d18] via-[#231126] to-[#0d1324]' : 'bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-pink-900/20 dark:via-gray-900 dark:to-purple-900/20'}`}>
      {/* Floating decorations */}
      <div className={`fixed inset-0 pointer-events-none overflow-hidden transition-opacity duration-500 ${showHero ? 'opacity-0' : 'opacity-100'}`}>
        <div className="absolute top-10 left-10 w-16 h-16 opacity-20 animate-float" style={{ animationDelay: '0s' }}>
          <Heart className="w-full h-full text-pink-400" />
        </div>
        <div className="absolute top-20 right-16 w-12 h-12 opacity-15 animate-float" style={{ animationDelay: '1s' }}>
          <Sparkles className="w-full h-full text-purple-400" />
        </div>
        <div className="absolute bottom-20 left-16 w-14 h-14 opacity-15 animate-float" style={{ animationDelay: '2s' }}>
          <Music className="w-full h-full text-pink-300" />
        </div>
        <div className="absolute bottom-10 right-10 w-10 h-10 opacity-10 animate-float" style={{ animationDelay: '3s' }}>
          <Star className="w-full h-full text-yellow-400" />
        </div>
      </div>

      {/* Progress indicator at top */}
      <div className={`fixed top-0 left-0 right-0 z-30 backdrop-blur-sm border-b transition-colors duration-500 ${showHero ? 'bg-transparent border-pink-200/10' : 'bg-white/80 dark:bg-[#1a1017]/80 border-pink-100 dark:border-pink-900/30'}`}>
        <div className="max-w-md mx-auto px-4 py-2">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-medium ${showHero ? 'text-pink-200/80' : 'text-pink-600 dark:text-pink-300'}`}>
              Progress: {answeredCount} / {questions.length} ({progress}%)
            </span>
            {answeredCount > 0 && !showHero && (
              <button
                onClick={handleClearCache}
                className="text-xs text-pink-500 hover:text-pink-700 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>
          <div className={`h-1.5 rounded-full overflow-hidden ${showHero ? 'bg-fuchsia-200/10' : 'bg-pink-100 dark:bg-pink-900/30'}`}>
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Hero Section */}
      {showHero && (
        <div className="fixed inset-0 flex items-center justify-center z-20 animate-in px-6 pt-16" style={{ animationDelay: '0ms' }}>
          <div className="text-center p-8 max-w-md mx-4">
            <div className="w-28 h-28 mx-auto mb-7 illustration-float">
              <svg viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="64" cy="64" r="56" fill="#fce7f3"/>
                <path d="M64 32C46.3 32 32 46.3 32 64C32 74.5 40 82.5 52 88L64 100L76 88C88 82.5 96 74.5 96 64C96 46.3 81.7 32 64 32Z" fill="#ec4899" opacity="0.2"/>
                <path d="M52 52C48.7 52 46 54.7 46 58C46 61.3 48.7 64 52 64C55.3 64 58 61.3 58 58C58 54.7 55.3 52 52 52Z" fill="#ec4899"/>
                <path d="M74 52C70.7 52 68 54.7 68 58C68 61.3 70.7 64 74 64C77.3 64 80 61.3 80 58C80 54.7 77.3 52 74 52Z" fill="#ec4899"/>
                <path d="M52 68C52 64.7 54.7 62 58 62C61.3 62 64 64.7 64 68C64 71.3 61.3 74 58 74C54.7 74 52 71.3 52 68Z" fill="#ec4899" opacity="0.5"/>
              </svg>
            </div>
            <p className="inline-flex items-center gap-2 rounded-full border border-pink-300/20 bg-pink-300/10 px-4 py-2 text-xs md:text-sm font-medium tracking-wide text-pink-100/80 mb-5 animate-in delay-75">
              💌 Ini adalah website khusus untuk diisi oleh Novia Adriyani saja
            </p>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 animate-in delay-100 bg-gradient-to-r from-pink-300 via-fuchsia-200 to-violet-200 bg-clip-text text-transparent leading-tight drop-shadow-[0_0_18px_rgba(244,114,182,0.18)]">
              haiii 💕
            </h1>
            <p className="text-base md:text-lg leading-8 text-pink-100/90 mb-8 animate-in delay-200 max-w-md mx-auto">
              ✨ Bantu aku yuk biar bisa lebih mengenal kamu lebih dekat<br />
              🫶 Harus jujur yaa... dijawab apa adanya<br />
              💭 Aku lebih pilih jawaban jujur walaupun gk enak daripada jawaban manis tapi dibuat buat, anjayy class🤘
              {answeredCount > 0 && <br />}
              {answeredCount > 0 && (
                <span className="text-sm text-pink-300/80">Kamu sudah jawab {answeredCount} pertanyaan. Lanjut dari tempat terakhir yaa 💕</span>
              )}
            </p>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setShowHero(false); }}
              className="inline-flex flex-col items-center justify-center gap-1 rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 px-10 py-4 text-white font-semibold shadow-[0_0_40px_rgba(217,70,239,0.35)] transition-transform duration-300 hover:scale-[1.02] animate-in delay-300"
            >
              <span>{answeredCount > 0 ? 'Lanjut Yuk!' : 'Mulai Yuk!'}</span>
              <Heart className="w-5 h-5 ml-2 animate-heartbeat" />
            </button>
          </div>
        </div>
      )}

      {/* Question Cards */}
      {!showHero && (
        <main id="start" className="relative z-10 pt-16">
          <QuestionCard
            key={currentQuestion.id}
            question={currentQuestion}
            index={currentIndex}
            total={questions.length}
            onAnswer={handleAnswer}
            onSkip={handleSkip}
            onNext={handleNext}
            onBack={handleBack}
            answeredQuestions={answeredQuestions}
            initialAnswer={getCachedAnswer(currentQuestion.id)}
          />
        </main>
      )}

      {/* Footer */}
      <footer className={`fixed bottom-0 left-0 right-0 p-4 text-center text-xs pointer-events-none transition-colors duration-500 ${showHero ? 'text-pink-200/45' : 'text-pink-400/50 dark:text-pink-500/50'}`}>
        Dibuat dengan ❤️ buat kamu
      </footer>
    </div>
  );
}