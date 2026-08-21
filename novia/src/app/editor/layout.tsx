import { ReactNode } from 'react';
import Link from 'next/link';
import { LogOut, LayoutDashboard, List, Settings, MessageSquare } from 'lucide-react';

export default function EditorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-pink-900/20 dark:via-gray-900 dark:to-purple-900/20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#1a1017]/80 backdrop-blur-sm border-b border-pink-100 dark:border-pink-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/editor" className="flex items-center gap-2">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="14" cy="14" r="12" fill="#fce7f3"/>
                  <path d="M14 7C9.03 7 5 11.03 5 16C5 18.5 7.5 20.5 10 22L14 26L18 22C20.5 20.5 23 18.5 23 16C23 11.03 18.97 7 14 7Z" fill="#ec4899" opacity="0.2"/>
                  <path d="M10 14C10 12.9 10.9 12 12 12C13.1 12 14 12.9 14 14C14 15.1 13.1 16 12 16C10.9 16 10 15.1 10 14Z" fill="#ec4899"/>
                  <path d="M18 14C18 12.9 18.9 12 20 12C21.1 12 22 12.9 22 14C22 15.1 21.1 16 20 16C18.9 16 18 15.1 18 14Z" fill="#ec4899"/>
                  <path d="M14 20C12.9 20 12 19.1 12 18C12 16.9 12.9 16 14 16C15.1 16 16 16.9 16 18C16 19.1 15.1 20 14 20Z" fill="#ec4899" opacity="0.5"/>
                </svg>
                <span className="font-display font-bold text-xl gradient-text">Novia Editor</span>
              </Link>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              <Link href="/editor" className="px-3 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-pink-200 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors">
                <LayoutDashboard className="w-4 h-4 inline mr-1" /> Dashboard
              </Link>
              <Link href="/editor/questions" className="px-3 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-pink-200 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors">
                <List className="w-4 h-4 inline mr-1" /> Pertanyaan
              </Link>
              <Link href="/editor/answers" className="px-3 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-pink-200 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors">
                <MessageSquare className="w-4 h-4 inline mr-1" /> Jawaban
              </Link>
              <Link href="/editor/settings" className="px-3 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-pink-200 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors">
                <Settings className="w-4 h-4 inline mr-1" /> Pengaturan
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-pink-500 dark:text-pink-400">
              Mode Editor 🔐
            </span>
            <form action="/api/auth" method="POST" className="inline">
              <input type="hidden" name="action" value="logout" />
              <button type="submit" className="btn-cute btn-cute-secondary px-4 py-1.5 text-sm">
                <LogOut className="w-4 h-4 mr-1" /> Keluar
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="border-t border-pink-100 dark:border-pink-900/30 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-pink-400/70 dark:text-pink-500/70">
          Dibuat dengan ❤️ buat kamu
        </div>
      </footer>
    </div>
  );
}