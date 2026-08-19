'use client';

import { useEffect, useState } from 'react';
import { Heart, Sparkles, Star, Flower2, Gift, Music, Crown, Zap, Smile, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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
      const savedAnswers = localStorage.getItem('novia_answers');
      if (savedAnswers) {
        const answers = JSON.parse(savedAnswers);
        const firstAnswer = answers['seed-1'];
        if (firstAnswer) setUserName(firstAnswer.split(' ')[0]);
      }
    } catch (e) {
      console.error('Failed to load name:', e);
    }
  }, []);

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
        <p className="text-lg md:text-xl text-gray-600 dark:text-pink-200 mb-10 leading-relaxed animate-in delay-200">
          Kamu baru saja menjawab <span className="font-semibold text-pink-600 dark:text-pink-400">28 pertanyaan</span> dengan jujur dan manis.<br />
          Jawabanmu sudah tersimpan dengan aman 💕
        </p>

        {/* Stats Cards - Animated entrance */}
        <div 
          className={cn(
            'card-cute p-6 mb-8 animate-in delay-300',
            showStats ? 'animate-slide-up' : 'opacity-0 translate-y-4'
          )}
        >
          <div className="flex items-center justify-center gap-6 text-center">
            <div className="flex-1">
              <div className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent animate-count">28</div>
              <div className="text-sm text-pink-500 dark:text-pink-400 mt-1">Pertanyaan</div>
            </div>
            <div className="w-px h-16 bg-gradient-to-b from-pink-200 to-purple-200 dark:from-pink-800 dark:to-purple-800" />
            <div className="flex-1">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent animate-count">100%</div>
              <div className="text-sm text-purple-500 dark:text-purple-400 mt-1">Selesai</div>
            </div>
            <div className="w-px h-16 bg-gradient-to-b from-pink-200 to-purple-200 dark:from-pink-800 dark:to-purple-800" />
            <div className="flex-1">
              <div className="text-4xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent animate-count">∞</div>
              <div className="text-sm text-teal-500 dark:text-teal-400 mt-1">Cinta</div>
            </div>
          </div>
        </div>

        {/* Rotating Message Card - The Main Focus */}
        <div 
          className={cn(
            'card-cute p-8 mb-8 bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-pink-900/30 dark:via-gray-900/20 dark:to-purple-900/30 border-pink-200 dark:border-pink-800 relative overflow-hidden animate-in delay-400',
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
            
            {/* Decorative quotes */}
            <div className="flex items-center justify-center gap-4 mt-8 opacity-50">
              <span className="text-4xl">💕</span>
              <span className="text-3xl">✨</span>
              <span className="text-4xl">💕</span>
            </div>
          </div>
        </div>

        {/* Cute illustration row */}
        <div className="flex items-center justify-center gap-3 mb-8 animate-in delay-500" style={{ opacity: showMessageCard ? 1 : 0 }}>
          {[Heart, Sparkles, Star, Flower2, Gift].map((Icon, i) => (
            <div 
              key={i} 
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 flex items-center justify-center animate-bounce-gentle border border-pink-200 dark:border-pink-800"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <Icon className="w-7 h-7 text-pink-500" />
            </div>
          ))}
        </div>

        {/* Simple footer - just love note */}
        <div className="mt-10 animate-in delay-600">
          <p className="text-sm text-pink-400/80 dark:text-pink-500/80 mb-2">
            Dibuat dengan ❤️ khusus buat kamu
          </p>
          <div className="flex items-center justify-center gap-2 text-pink-400/60 dark:text-pink-500/60">
            <Heart className="w-4 h-4 animate-heartbeat" />
            <span className="text-xs">novia adriyani</span>
            <Heart className="w-4 h-4 animate-heartbeat" style={{ animationDelay: '0.5s' }} />
          </div>
        </div>
      </div>

      <style jsx>{`
        .animate-count {
          animation: countUp 1.5s ease-out forwards;
        }
        @keyframes countUp {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
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
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-120vh) scale(0.5); opacity: 0; }
        }
        .confetti-piece {
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 2px;
          animation: confettiFall linear forwards;
        }
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}