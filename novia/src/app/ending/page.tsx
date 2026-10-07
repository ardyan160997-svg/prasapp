'use client';

import { useEffect, useState, useRef } from 'react';
import { Heart, Sparkles, Star, Flower2, Gift, Music, Crown, Zap, Smile, MessageSquare, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'novia_answers';
const ANSWERED_KEY = 'novia_answered';
const PROPOSAL_KEY = 'novia_proposal_answered';

export default function EndingPage() {
  const [showContent, setShowContent] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showHearts, setShowHearts] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<Array<{id: number, left: number, delay: number, size: number, color: string}>>([]);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [showMessageCard, setShowMessageCard] = useState(false);
  const [userName, setUserName] = useState('');
  const [showProposal, setShowProposal] = useState(false);
  const [proposalAnswered, setProposalAnswered] = useState(false);
  const [noButtonPos, setNoButtonPos] = useState({ x: 0, y: 0 });
  const [burstConfetti, setBurstConfetti] = useState(false);
  const [burstParticles, setBurstParticles] = useState<Array<{id: number, left: number, top: number, color: string, delay: number, duration: number, rotation: number}>>([]);
  const noBtnRef = useRef<HTMLButtonElement>(null);
  const proposalContainerRef = useRef<HTMLDivElement>(null);

  // Load user's name from localStorage (first answer)
  useEffect(() => {
    try {
      const savedAnswers = localStorage.getItem(STORAGE_KEY);
      if (savedAnswers) {
        const answers = JSON.parse(savedAnswers);
        const firstAnswer = Object.values(answers)[0] as string;
        if (firstAnswer) setUserName(firstAnswer.split(' ')[0]);
      }
      // Check if proposal was already answered
      const proposalDone = localStorage.getItem(PROPOSAL_KEY);
      if (proposalDone) setProposalAnswered(true);
    } catch (e) {
      console.error('Failed to load name:', e);
    }
  }, []);

  const handleStartOver = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ANSWERED_KEY);
    window.location.href = '/';
  };

  const showProposalScreen = () => {
    setShowProposal(true);
    // Position "Tidak" button initially at center of container
    setTimeout(() => {
      if (proposalContainerRef.current) {
        const rect = proposalContainerRef.current.getBoundingClientRect();
        setNoButtonPos({ x: rect.width / 2, y: rect.height / 2 + 80 });
      }
    }, 100);
  };

  const handleNoHover = () => {
    if (!proposalContainerRef.current) return;
    const containerRect = proposalContainerRef.current.getBoundingClientRect();
    const btnWidth = 120;
    const btnHeight = 48;
    const maxX = containerRect.width - btnWidth - 20;
    const maxY = containerRect.height - btnHeight - 20;
    const newX = Math.max(btnWidth / 2 + 10, Math.random() * maxX);
    const newY = Math.max(btnHeight / 2 + 10, Math.random() * maxY);
    setNoButtonPos({ x: newX, y: newY });
  };

  const generateBurstParticles = () => {
    const colors = ['#ec4899', '#a78bfa', '#5eead4', '#f472b6', '#fde047', '#fb7185', '#fbbf24', '#ec4899', '#a78bfa', '#5eead4'];
    const particles = [...Array(120)].map((_, i) => ({
      id: i,
      left: 50 + (Math.random() - 0.5) * 90,
      top: 50 + (Math.random() - 0.5) * 90,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.3,
      duration: 2 + Math.random() * 2,
      rotation: Math.random() * 360,
    }));
    setBurstParticles(particles);
  };

  const handleYes = () => {
    generateBurstParticles();
    setBurstConfetti(true);
    setTimeout(() => {
      localStorage.setItem(PROPOSAL_KEY, 'yes');
      setProposalAnswered(true);
      setShowProposal(false);
    }, 2000);
  };

  const handleNoClick = () => {
    handleNoHover();
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

  // Burst confetti animation
  useEffect(() => {
    if (!burstConfetti) return;
    const timer = setTimeout(() => setBurstConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, [burstConfetti]);

  const iconComponents = [Heart, Sparkles, Star, Flower2, Gift, Music, Crown, Zap, Smile];

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mobile-specific "No" button handler - moves on tap instead of hover
  const handleNoTap = () => {
    if (!isMobile || !proposalContainerRef.current) return;
    const containerRect = proposalContainerRef.current.getBoundingClientRect();
    const btnWidth = 140;
    const btnHeight = 48;
    const maxX = Math.max(btnWidth / 2 + 10, containerRect.width - btnWidth - 20);
    const maxY = Math.max(btnHeight / 2 + 10, containerRect.height - btnHeight - 20);
    const newX = Math.max(btnWidth / 2 + 10, Math.random() * maxX);
    const newY = Math.max(btnHeight / 2 + 10, Math.random() * maxY);
    setNoButtonPos({ x: newX, y: newY });
  };

  // Proposal Screen
  if (showProposal) {
    // Extract responsive buttons to variable to avoid JSX ternary parsing issues
    const proposalButtons = isMobile ? (
      <div className="flex flex-col items-center gap-4 w-full">
        {/* Ya Button - Full width on mobile */}
        <button
          onClick={handleYes}
          className="w-full max-w-xs inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 px-8 py-4 text-white font-bold text-base shadow-[0_0_40px_rgba(217,70,239,0.5)] transition-all duration-300 active:scale-95 z-10"
          style={{ zIndex: 10 }}
        >
          <Heart className="w-5 h-5 fill-current" />
          <span>Ya, Aku Mau! 💖</span>
        </button>

        {/* Tidak Button - Runs away on tap */}
        <button
          ref={noBtnRef}
          onClick={handleNoTap}
          onMouseEnter={handleNoHover}
          className="absolute inline-flex items-center gap-2 rounded-full bg-gray-200 dark:bg-gray-700 px-6 py-2.5 text-gray-600 dark:text-gray-300 font-medium text-sm transition-all duration-300 active:scale-105 cursor-pointer z-5"
          style={{
            left: `${noButtonPos.x}px`,
            top: `${noButtonPos.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <span>Tidak</span>
          <Sparkles className="w-3 h-3 text-gray-400" />
        </button>
      </div>
    ) : (
      <div className="flex flex-col items-center gap-4">
        {/* Ya Button - Fixed position at center */}
        <div className="flex justify-center">
          <button
            onClick={handleYes}
            className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 px-10 py-4 text-white font-bold text-lg shadow-[0_0_40px_rgba(217,70,239,0.5)] transition-all duration-300 hover:scale-[1.05] hover:shadow-[0_0_60px_rgba(217,70,239,0.6)] active:scale-95 z-10"
            style={{ zIndex: 10 }}
          >
            <Heart className="w-6 h-6 fill-current" />
            <span>Ya, Aku Mau! 💖</span>
          </button>
        </div>

        {/* Tidak Button - Runs away on hover */}
        <button
          ref={noBtnRef}
          onMouseEnter={handleNoHover}
          onClick={handleNoClick}
          className="absolute inline-flex items-center gap-2 rounded-full bg-gray-200 dark:bg-gray-700 px-8 py-3 text-gray-600 dark:text-gray-300 font-medium transition-all duration-300 hover:scale-105 cursor-pointer z-5"
          style={{
            left: `${noButtonPos.x}px`,
            top: `${noButtonPos.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <span className="text-sm">Tidak</span>
          <Sparkles className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    );

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

        {/* Burst confetti on Yes - inline styles for proper randomness */}
        {burstConfetti && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-20">
            {burstParticles.map((p) => (
              <div
                key={p.id}
                className="confetti-burst"
                style={{
                  left: `${p.left}%`,
                  top: `${p.top}%`,
                  background: p.color,
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration}s`,
                  transform: `rotate(${p.rotation}deg)`,
                  '--tx': `${(Math.random() - 0.5) * 500}px`,
                  '--ty': `${(Math.random() - 0.5) * 500}px`,
                } as any}
              />
            ))}
          </div>
        )}

        {/* Floating hearts */}
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

        <div className="relative z-20 max-w-lg w-full text-center px-4 animate-in">
          {/* Big heart illustration */}
          <div className="relative mb-6 md:mb-8">
            <div className="w-48 md:w-56 h-48 md:h-56 mx-auto illustration-float relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 opacity-25 animate-pulse-gentle" />
              <div className="absolute inset-6 rounded-full bg-gradient-to-r from-pink-300 to-purple-300 opacity-20 animate-pulse-gentle" style={{ animationDelay: '0.5s' }} />
              <div className="absolute inset-12 rounded-full bg-gradient-to-r from-pink-200 to-purple-200 opacity-15 animate-pulse-gentle" style={{ animationDelay: '1s' }} />
              
              <svg viewBox="0 0 224 224" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full relative z-10">
                <defs>
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                  <linearGradient id="heartGradient" x1="0" y1="0" x2="224" y2="224" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ec4899"/>
                    <stop offset="50%" stopColor="#f472b6"/>
                    <stop offset="100%" stopColor="#a78bfa"/>
                  </linearGradient>
                </defs>
                <circle cx="112" cy="112" r="96" fill="#fce7f3" filter="url(#glow)"/>
                <path 
                  d="M112 60C92 60 76 76 76 96C76 110 92 122 112 148L112 148L112 148C132 122 148 110 148 96C148 76 132 60 112 60Z" 
                  fill="url(#heartGradient)" 
                  filter="url(#glow)"
                />
                <path d="M144 84L112 120L80 84" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
              </svg>

              {/* Sparkles around heart */}
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-5 md:w-6 h-5 md:h-6 animate-ping"
                  style={{
                    left: `${50 + Math.cos(i * Math.PI / 6) * 85}%`,
                    top: `${50 + Math.sin(i * Math.PI / 6) * 85}%`,
                    animationDelay: `${i * 0.15}s`,
                  }}
                >
                  <Sparkles className="w-full h-full text-yellow-300" />
                </div>
              ))}
            </div>
          </div>

          {/* Proposal Question */}
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold gradient-text mb-4 md:mb-6 animate-in delay-100 leading-tight">
            {userName ? `${userName}, ` : ''}maukah kamu menjadi pasanganku? 💕
          </h1>

          <p className="text-base md:text-lg text-gray-600 dark:text-pink-200 mb-8 md:mb-10 leading-relaxed animate-in delay-200 max-w-md mx-auto px-2">
            Jawab dengan jujur ya... aku nggak sabar tau jawabannya 🥺
          </p>

          {/* Buttons - Responsive layout */}
          <div 
            ref={proposalContainerRef}
            className="relative animate-in delay-300" 
            style={{ minHeight: isMobile ? '160px' : '140px' }}
          >
            {proposalButtons}
          </div>

          <p className="text-xs text-pink-400/70 dark:text-pink-500/70 mt-6 md:mt-8 animate-in delay-400">
            {isMobile ? 'Coba tap "Tidak" kalau bisa 😏' : 'Coba klik "Tidak" kalau bisa 😏'}
          </p>
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
          .confetti-burst {
            position: absolute;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            animation: confettiBurst 3s ease-out forwards;
          }
          @keyframes confettiBurst {
            0% { opacity: 1; transform: translate(0, 0) scale(1) rotate(var(--rotation, 0deg)); }
            100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0) rotate(720deg); }
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

  // Main Ending Screen
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

        {/* Proposal Trigger Button (only if not answered yet) */}
        {!proposalAnswered && (
          <div className="mb-8 animate-in delay-500">
            <button
              onClick={showProposalScreen}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-400 to-rose-400 px-8 py-3 text-white font-semibold shadow-[0_0_30px_rgba(244,114,182,0.4)] transition-transform duration-300 hover:scale-[1.02]"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Pesan Rahasia...</span>
            </button>
            <p className="text-xs text-pink-400/70 dark:text-pink-500/70 mt-2">
              Ada pertanyaan terakhir yang cuma buat kamu 💕
            </p>
          </div>
        )}

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
        .confetti-burst {
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          animation: confettiBurst 3s ease-out forwards;
        }
        @keyframes confettiBurst {
          0% { opacity: 1; transform: translate(0, 0) scale(1) rotate(var(--rotation, 0deg)); }
          100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0) rotate(720deg); }
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