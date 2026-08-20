'use client';

import { useEffect, useState } from 'react';
import { Heart, Sparkles, Star, Flower2, Gift, Music, Crown, Zap, Smile, MessageSquare, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'novia_answers';
const ANSWERED_KEY = 'novia_answered';

export default function EndingPage() {
  const [showContent, setShowContent] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showHearts, setShowHearts] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<Array<{id: number, left: number, delay: number, size: number, color: string}>>([]);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [showMessageCard, setShowMessageCard] = useState(false);
  const [userName, setUserName] = useState('');

  // Load user's name from localStorage (first answer)
  useEffect(() => {
    try {
      const savedAnswers = localStorage.getItem(STORAGE_KEY);
      if (savedAnswers) {
        const answers = JSON.parse(savedAnswers);
        const firstAnswer = Object.values(answers)[0] as string;
        if (firstAnswer) setUserName(firstAnswer.split(' ')[0]);
      }
    } catch (e) {
      console.error('Failed to load name:', e);
    }
  }, []);

  const handleStartOver = () => {
    // Clear localStorage to start fresh - server answers are preserved in database
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ANSWERED_KEY);
    // Navigate to home page which will fetch fresh questions from DB
    window.location.href = '/';
  };

  const messages = [
    `Terima kasih ${userName ? userName + ' ' : ''}udah mau meluangkan waktu buat menjawab ini... 💕`,
    'Setiap jawabanmu bikin aku makin kenal kamu lebih dalam.',
    'Aku nggak sabar bacanya nanti~ 💕',
    'Kamu lucu, jujur, dan bikin hati ini gembira. 💖',
  ];

  useEffect(() => {
    setShowContent(true);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
    
    setTimeout(() => setShowHearts(true), 500);
    setTimeout(() => setShowStats(true), 1000);
    setTimeout(() => setShowMessageCard(true), 1800);
  }, []);

  // Floating hearts animation
  useEffect(() => {
    if (!showHearts) return;
    const interval = setInterval(() => {
      setFloatingHearts(prev => {
        const newHeart = {
          id: Date.now(),
          left: Math.random() * 100,
          delay: Math.random() * 0.5,
          size: 16 + Math.random() * 24,
          color: ['#ec4899', '#f472b6', '#fb7185', '#a78bfa', '#fde047'][Math.floor(Math.random() * 5)],
        };
        return [...prev.slice(-14), newHeart];
      });
    }, 400);
    return () => clearInterval(interval);
  }, [showHearts]);

  // Rotate messages
  useEffect(() => {
    if (!showMessageCard) return;
    const interval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % messages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [showMessageCard]);

  const iconComponents = [Heart, Sparkles, Star, Flower2, Gift, Music, Crown, Zap, Smile];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-pink-900/20 dark:via-gray-900 dark:to-purple-900/20 relative overflow-hidden flex items-center justify-center p-4">
      {/* Floating decorations background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 12 }).map((_, i) => {
          const Icon = iconComponents[i % iconComponents.length];
          return (
            <div
              key={i}
              className="absolute animate-float-gentle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${6 + Math.random() * 4}s`,
                opacity: 0.15,
              }}
            >
              <Icon className="w-10 h-10 text-pink-400" />
            </div>
          );
        })}
      </div>

      {/* Confetti burst */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10%`,
                background: ['#ec4899', '#a78bfa', '#5eead4', '#f472b6', '#fde047', '#fb7185', '#fbbf24'][Math.floor(Math.random() * 7)],
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random() * 1.5}s`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          ))}
        </div>
      )}

      {/* Floating hearts from bottom */}
      {showHearts && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
          {floatingHearts.map(heart => (
            <div
              key={heart.id}
              className="absolute bottom-[-10%] animate-float-up"
              style={{
                left: `${heart.left}%`,
                fontSize: `${heart.size}px`,
                color: heart.color,
                animationDelay: `${heart.delay}s`,
                animationDuration: `${4 + Math.random() * 3}s`,
              }}
            >
              ♡
            </div>
          ))}
        </div>
      )}

      <div className={cn('relative z-20 max-w-lg w-full text-center px-4', showContent ? 'animate-in' : 'opacity-0')}>
        {/* Main illustration with pulsating heart */}
        <div className="relative mb-8">
          <div className="w-48 h-48 mx-auto illustration-float relative">
            {/* Outer glow rings */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 opacity-20 animate-pulse-gentle" style={{ animationDelay: '0s' }} />
            <div className="absolute inset-4 rounded-full bg-gradient-to-r from-pink-300 to-purple-300 opacity-15 animate-pulse-gentle" style={{ animationDelay: '0.5s' }} />
            <div className="absolute inset-8 rounded-full bg-gradient-to-r from-pink-200 to-purple-200 opacity-10 animate-pulse-gentle" style={{ animationDelay: '1s' }} />
            
            {/* Heart SVG */}
            <svg viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full relative z-10">
              <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <linearGradient id="heartGradient" x1="0" y1="0" x2="192" y2="192" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#ec4899"/>
                  <stop offset="50%" stopColor="#f472b6"/>
                  <stop offset="100%" stopColor="#a78bfa"/>
                </linearGradient>
              </defs>
              <circle cx="96" cy="96" r="80" fill="#fce7f3" filter="url(#glow)"/>
              <path 
                d="M96 52C78.5 52 64 66.5 64 84C64 95 78 105 96 128L96 128L96 128C114 105 128 95 128 84C128 66.5 113.5 52 96 52Z" 
                fill="url(#heartGradient)" 
                filter="url(#glow)"
              />
              <path d="M124 74L96 106L68 74" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
            </svg>
            
            {/* Sparkles around heart */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-5 h-5 animate-ping"
                style={{
                  left: `${50 + Math.cos(i * Math.PI / 4) * 70}%`,
                  top: `${50 + Math.sin(i * Math.PI / 4) * 70}%`,
                  animationDelay: `${i * 0.2}s`,
                }}
              >
                <Sparkles className="w-full h-full text-yellow-300" />
              </div>
            ))}
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold gradient-text mb-4 animate-in delay-100">
          {userName ? `${userName}, Kamu Luar Biasa!` : 'Kamu Luar Biasa!'} 🎉
        </h1>

        {/* Subtitle */}
        <div className="space-y-2 mb-10 animate-in delay-200">
          <p className="text-lg md:text-xl text-gray-600 dark:text-pink-200 leading-relaxed">
            Terima kasih ya sudah menjawab semua pertanyaannya dengan jujur 💕
          </p>
          <p className="text-base text-pink-500 dark:text-pink-400 font-medium italic">
            "Jawabanmu sudah tersimpan aman di hatiku... eh, di database maksudnya 🤭"
          </p>
        </div>

        {/* Rotating Message Card */}
        <div 
          className={cn(
            'card-cute p-8 mb-10 bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-pink-900/30 dark:via-gray-900/20 dark:to-purple-900/30 border-pink-200 dark:border-pink-800 relative overflow-hidden animate-in delay-400',
            showMessageCard ? 'animate-slide-up' : 'opacity-0 translate-y-4'
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-pink-100/50 to-purple-100/50 dark:from-pink-900/20 dark:to-purple-900/20" />
          <div className="relative z-10">
            <MessageSquare className="w-14 h-14 mx-auto text-pink-500 mb-6 animate-bounce-gentle" />
            <p 
              className="text-center text-gray-700 dark:text-pink-200 leading-relaxed text-xl transition-opacity duration-700"
              style={{ opacity: showMessageCard ? 1 : 0 }}
            >
              "{messages[currentMessage]}"
            </p>
          </div>
        </div>

        {/* Start Over Action */}
        <div className="space-y-4 animate-in delay-600">
          <button
            onClick={handleStartOver}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 px-10 py-4 text-white font-bold shadow-[0_0_40px_rgba(217,70,239,0.4)] transition-all duration-300 hover:scale-[1.05] hover:shadow-[0_0_50px_rgba(217,70,239,0.5)] active:scale-95"
          >
            <RotateCcw className="w-6 h-6" />
            <span className="text-lg">Mulai Lagi</span>
          </button>
          <p className="text-sm text-pink-400/80 dark:text-pink-500/80 max-w-sm mx-auto leading-relaxed">
            Klik buat isi ulang pertanyaan terbaru yang ada di editor.<br />
            Jawaban sebelumnya **tetap aman** di database kamu 💕
          </p>
        </div>

        {/* Love Footer */}
        <div className="mt-16 animate-in delay-700">
          <p className="text-sm text-pink-400/60 dark:text-pink-500/60 mb-3 flex items-center justify-center gap-2">
            <span className="w-8 h-px bg-pink-200 dark:bg-pink-800" />
            Made with ❤️ for you
            <span className="w-8 h-px bg-pink-200 dark:bg-pink-800" />
          </p>
          <div className="flex items-center justify-center gap-3 text-pink-400 dark:text-pink-500 font-medium">
            <Heart className="w-5 h-5 animate-heartbeat fill-pink-400/20" />
            <span className="tracking-widest uppercase text-xs">novia adriyani</span>
            <Heart className="w-5 h-5 animate-heartbeat fill-pink-400/20" style={{ animationDelay: '0.5s' }} />
          </div>
        </div>
      </div>

      <style jsx>{`
        .animate-slide-up {
          animation: slideUp 0.6s ease-out forwards;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float-up {
          animation: floatUp 6s ease-out forwards;
        }
        @keyframes floatUp {
          from { opacity: 0; transform: translateY(100vh); }
          to { opacity: 1; transform: translateY(-10vh); }
        }
        .animate-bounce-gentle {
          animation: bounceGentle 2s ease-in-out infinite;
        }
        @keyframes bounceGentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-pulse-gentle {
          animation: pulseGentle 3s ease-in-out infinite;
        }
        @keyframes pulseGentle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
        .animate-heartbeat {
          animation: heartbeat 1.5s ease-in-out infinite;
        }
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          15% { transform: scale(1.2); }
          30% { transform: scale(1); }
          45% { transform: scale(1.15); }
        }
        .animate-float-gentle {
          animation: floatGentle 8s ease-in-out infinite;
        }
        @keyframes floatGentle {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(15px, -15px); }
        }
        .animate-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .confetti-piece {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: confettiFall 3.5s ease-out forwards;
        }
        @keyframes confettiFall {
          0% { opacity: 1; transform: translateY(0) rotate(0deg); }
          100% { opacity: 0; transform: translateY(100vh) rotate(720deg); }
        }
        .illustration-float {
          animation: illustrationFloat 5s ease-in-out infinite;
        }
        @keyframes illustrationFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
      `}</style>
    </div>
  );
}
