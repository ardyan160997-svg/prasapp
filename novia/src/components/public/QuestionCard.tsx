'use client';

import { cn } from '@/lib/utils';
import { Heart, Sparkles, ArrowRight, ChevronLeft, ChevronRight, X, CheckCircle, MessageSquare, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Question {
  id: string;
  text: string;
  category: string;
  order: number;
}

interface QuestionCardProps {
  question: Question;
  index: number;
  total: number;
  onAnswer: (questionId: string, answer: string) => void;
  onSkip: (questionId: string) => void;
  onNext: (questionId: string) => void;
  onBack?: () => void;
  answeredQuestions: Set<string>;
  initialAnswer?: string;
}

export function QuestionCard({ question, index, total, onAnswer, onSkip, onNext, onBack, answeredQuestions, initialAnswer = '' }: QuestionCardProps) {
  const [answer, setAnswer] = useState(initialAnswer);
  const [showConfetti, setShowConfetti] = useState(false);
  const isAnswered = answeredQuestions.has(question.id);

  // When initialAnswer changes (navigating back to answered question), update answer state
  useEffect(() => {
    if (initialAnswer) {
      setAnswer(initialAnswer);
    }
  }, [initialAnswer]);

  const categoryLabel = question.category.charAt(0).toUpperCase() + question.category.slice(1);
  const categoryEmoji = { icebreaker: '❄️', fun: '😄', values: '💎', deep: '🌊', relationship: '💕' }[question.category] || '💭';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.trim() && !isAnswered) {
      onAnswer(question.id, answer.trim());
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1000);
    }
  };

  const progress = ((index + 1) / total) * 100;

  // When already answered, show read-only mode with "Lanjut" button
  const showReadOnly = isAnswered && !!initialAnswer;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative">
      {/* Progress hearts */}
      <div className="mb-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-pink-600 dark:text-pink-300">
            Pertanyaan {index + 1} dari {total}
          </span>
          <span className="text-sm font-medium text-pink-600 dark:text-pink-300">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="progress-heart">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>

      {/* Category badge */}
      <div className="mb-4 animate-in delay-100">
        <span className={cn(
          'px-4 py-1.5 rounded-full text-sm font-medium border',
          {
            'bg-blue-100 text-blue-800 border-blue-200': question.category === 'icebreaker',
            'bg-yellow-100 text-yellow-800 border-yellow-200': question.category === 'fun',
            'bg-purple-100 text-purple-800 border-purple-200': question.category === 'values',
            'bg-teal-100 text-teal-800 border-teal-200': question.category === 'deep',
            'bg-pink-100 text-pink-800 border-pink-200': question.category === 'relationship',
          }
        )}>
          {categoryEmoji} {categoryLabel}
        </span>
      </div>

      {/* Question Card */}
      <div className={cn(
        'card-cute w-full max-w-md p-8 animate-in delay-200 relative overflow-hidden',
        isAnswered && 'ring-2 ring-pink-300'
      )}>
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="confetti-piece"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  background: ['#ec4899', '#a78bfa', '#5eead4', '#f472b6', '#fde047'][Math.floor(Math.random() * 5)],
                  animationDelay: `${Math.random() * 0.3}s`,
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            ))}
          </div>
        )}

        <div className="relative z-10">
          <p className="text-xl md:text-2xl font-display font-semibold text-center text-gray-800 dark:text-pink-100 leading-relaxed mb-6">
            {question.text}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={answer}
              onChange={showReadOnly ? undefined : (e) => setAnswer(e.target.value)}
              placeholder="Tulis jawabanmu di sini... 💭"
              className={cn(
                'input-cute min-h-[100px] resize-none focus:ring-pink-200',
                showReadOnly && 'bg-gray-50 dark:bg-gray-800 cursor-default'
              )}
              rows={4}
              autoFocus={!showReadOnly}
              readOnly={showReadOnly}
            />
            
            <div className="flex gap-3">
              {showReadOnly ? (
                // Already answered - show "Lanjut" button (only advance, don't mark answered)
                <button
                  type="button"
                  onClick={() => onNext(question.id)}
                  className="btn-cute btn-cute-primary flex-1"
                >
                  Lanjut ❤️
                </button>
              ) : (
                // Not answered yet - show "Lewati" and "Simpan & Lanjut"
                <>
                  <button
                    type="button"
                    onClick={() => onSkip(question.id)}
                    className="btn-cute btn-cute-secondary flex-1"
                    disabled={isAnswered}
                  >
                    Lewati
                  </button>
                  <button
                    type="submit"
                    className="btn-cute btn-cute-primary flex-1"
                    disabled={!answer.trim() || isAnswered}
                  >
                    {isAnswered ? (
                      <span className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5" /> Sudah Dijawab
                      </span>
                    ) : (
                      'Simpan & Lanjut ❤️'
                    )}
                  </button>
                </>
              )}
            </div>
          </form>
        </div>

        {/* Cute illustration at bottom */}
        <div className="mt-6 text-center illustration-float" style={{ animationDelay: '0.5s' }}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="35" fill="var(--primary-light)" opacity="0.3"/>
            <path d="M40 20C31.7 20 25 26.7 25 35C25 40.5 30 44.5 35 48L40 55L45 48C50 44.5 55 40.5 55 35C55 26.7 48.3 20 40 20Z" fill="var(--primary)" opacity="0.2"/>
            <path d="M33 33C31.9 33 31 33.9 31 35C31 36.1 31.9 37 33 37C34.1 37 35 36.1 35 35C35 33.9 34.1 33 33 33Z" fill="var(--primary)"/>
            <path d="M47 33C45.9 33 45 33.9 45 35C45 36.1 45.9 37 47 37C48.1 37 49 36.1 49 35C49 33.9 48.1 33 47 33Z" fill="var(--primary)"/>
            <path d="M33 42C33 40.9 33.9 40 35 40C36.1 40 37 40.9 37 42C37 43.1 36.1 44 35 44C33.9 44 33 43.1 33 42Z" fill="var(--primary)" opacity="0.5"/>
          </svg>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between w-full max-w-md animate-in delay-300">
        <button
          onClick={() => onBack?.()}
          className="btn-cute btn-cute-secondary px-4 py-2"
          disabled={index === 0}
        >
          <ChevronLeft className="w-5 h-5" /> Kembali
        </button>
        
        <div className="flex gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-300',
                i === index
                  ? 'bg-pink-500 w-6'
                  : answeredQuestions.has(Array.from({ length: total }, (_, i) => `seed-${i + 1}`)[i]) || false
                  ? 'bg-pink-300'
                  : 'bg-pink-100 dark:bg-pink-900/30'
              )}
            />
          ))}
        </div>

        {index === total - 1 ? (
          <Link href="/ending" className="btn-cute btn-cute-primary px-4 py-2">
            Selesai! <ArrowRight className="w-5 h-5 ml-1" />
          </Link>
        ) : (
          <span className="w-24" />
        )}
      </div>
    </div>
  );
}