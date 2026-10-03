'use client';

import { useEffect, useMemo, useState } from 'react';
import { Edit, Filter, Loader2, MessageSquare, Save, Search, Sparkles, Trash2, X, PenSquare, Tag } from 'lucide-react';

interface AnswerItem {
  id: string;
  answerText: string;
  createdAt: string;
  question: {
    text: string;
    category: string;
  };
  liveQuestion?: {
    text: string;
    category: string;
  };
}

const categoryLabels: Record<string, string> = {
  icebreaker: '❄️ Icebreaker',
  fun: '😄 Fun',
  values: '💎 Values',
  deep: '🌊 Deep',
  relationship: '💕 Relationship',
};

const categoryOptions = [
  { value: 'icebreaker', label: '❄️ Icebreaker' },
  { value: 'fun', label: '😄 Fun' },
  { value: 'values', label: '💎 Values' },
  { value: 'deep', label: '🌊 Deep' },
  { value: 'relationship', label: '💕 Relationship' },
];

export default function EditorAnswersPage() {
  const [answers, setAnswers] = useState<AnswerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [editingAnswer, setEditingAnswer] = useState<AnswerItem | null>(null);
  const [draftAnswer, setDraftAnswer] = useState('');
  const [draftQuestionText, setDraftQuestionText] = useState('');
  const [draftQuestionCategory, setDraftQuestionCategory] = useState('icebreaker');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchAnswers = async () => {
    try {
      const res = await fetch('/api/answers');
      const data: { answers?: AnswerItem[] } = await res.json();
      setAnswers(data.answers || []);
    } catch (err) {
      console.error('Failed to fetch answers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnswers();
  }, []);

  const filteredAnswers = useMemo(() => {
    return answers.filter((answer) => {
      const matchesCategory = category === 'all' || answer.question.category === category;
      const haystack = `${answer.question.text} ${answer.answerText}`.toLowerCase();
      const matchesQuery = haystack.includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [answers, category, query]);

  const totalCategories = new Set(answers.map((answer) => answer.question.category)).size;

  const openEditModal = (answer: AnswerItem) => {
    setEditingAnswer(answer);
    setDraftAnswer(answer.answerText);
    setDraftQuestionText(answer.question.text);
    setDraftQuestionCategory(answer.question.category);
    setError('');
  };

  const closeModal = () => {
    setEditingAnswer(null);
    setDraftAnswer('');
    setDraftQuestionText('');
    setDraftQuestionCategory('icebreaker');
    setError('');
  };

  const handleSave = async () => {
    if (!editingAnswer) return;
    if (!draftAnswer.trim()) {
      setError('Jawaban tidak boleh kosong');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      const res = await fetch(`/api/answers/${editingAnswer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answerText: draftAnswer.trim(),
          questionText: draftQuestionText.trim(),
          questionCategory: draftQuestionCategory,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal update jawaban');
      }

      const data: { answer: AnswerItem } = await res.json();
      setAnswers((prev) => prev.map((item) => (item.id === data.answer.id ? data.answer : item)));
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (answer: AnswerItem) => {
    if (!confirm('Yakin mau hapus jawaban ini?')) return;

    try {
      const res = await fetch(`/api/answers/${answer.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal hapus jawaban');
      }

      setAnswers((prev) => prev.filter((item) => item.id !== answer.id));
      if (editingAnswer?.id === answer.id) closeModal();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan saat menghapus');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-pink-500 dark:text-pink-300 mb-2">Inbox Jawaban 💌</p>
            <h1 className="text-3xl font-display font-bold text-gray-800 dark:text-gray-100">Jawaban dari Novia</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Lihat, edit, atau hapus jawaban yang sudah masuk per pertanyaan.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto md:min-w-[420px]">
            <div className="card-cute p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Jawaban</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{answers.length}</p>
            </div>
            <div className="card-cute p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Hasil Filter</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{filteredAnswers.length}</p>
            </div>
            <div className="card-cute p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Kategori Terisi</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{totalCategories}</p>
            </div>
          </div>
        </div>

        <div className="card-cute p-4 md:p-5">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
            <label className="relative block">
              <Search className="w-4 h-4 text-pink-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari isi jawaban atau pertanyaan..."
                className="input-cute pl-11"
              />
            </label>
            <label className="relative block">
              <Filter className="w-4 h-4 text-pink-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-cute pl-11"
              >
                <option value="all">Semua kategori</option>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="space-y-4">
          {filteredAnswers.map((answer, index) => (
            <div key={answer.id} className="card-cute p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 px-3 py-1 text-xs font-medium">
                      <Sparkles className="w-3 h-3" /> Jawaban #{filteredAnswers.length - index}
                    </span>
                    <span className="inline-flex rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-3 py-1 text-xs font-medium">
                      {categoryLabels[answer.question.category] || answer.question.category}
                    </span>
                    {answer.liveQuestion && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-1 text-xs font-medium">
                        <Tag className="w-3 h-3" /> Snapshot
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Pertanyaan (snapshot)</p>
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 leading-relaxed">{answer.question.text}</h2>
                  {answer.liveQuestion && answer.liveQuestion.text !== answer.question.text && (
                    <div className="text-xs text-amber-600 dark:text-amber-400 mb-2">
                      Live: {answer.liveQuestion.text}
                    </div>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Jawaban</p>
                  <div className="rounded-2xl bg-white/70 dark:bg-[#221625] border border-pink-100 dark:border-pink-900/30 p-4">
                    <p className="whitespace-pre-wrap break-words text-gray-700 dark:text-pink-100 leading-7">{answer.answerText}</p>
                  </div>
                </div>
                <div className="shrink-0 md:w-48 space-y-3">
                  <div className="rounded-2xl bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-900/30 p-4">
                    <p className="text-xs uppercase tracking-wide text-pink-500 dark:text-pink-300 mb-2">Waktu Masuk</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-pink-100 leading-6">
                      {new Date(answer.createdAt).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(answer)}
                      className="btn-cute btn-cute-secondary text-sm px-3 py-2"
                    >
                      <Edit className="w-4 h-4 mr-1" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(answer)}
                      className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
                    >
                      <Trash2 className="w-4 h-4 mr-1 inline" /> Hapus
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredAnswers.length === 0 && (
            <div className="card-cute p-10 text-center text-gray-500 dark:text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p className="text-lg font-medium mb-2">Belum ada jawaban yang cocok</p>
              <p>Coba ganti filter atau tunggu jawaban baru masuk yaa 💕</p>
            </div>
          )}
        </div>
      </div>

      {editingAnswer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card-cute w-full max-w-2xl animate-scale-in">
            <div className="sticky top-0 bg-white dark:bg-[#2a1a2e] border-b border-pink-100 dark:border-pink-900/30 p-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-display font-semibold text-gray-800 dark:text-gray-100">Edit Jawaban</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Kamu bisa rapikan atau koreksi isi jawaban & snapshot pertanyaannya di sini.</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pertanyaan (snapshot)</p>
                  <PenSquare className="w-4 h-4 text-pink-400" />
                </div>
                <textarea
                  value={draftQuestionText}
                  onChange={(e) => setDraftQuestionText(e.target.value)}
                  className="input-cute min-h-[80px] resize-none"
                  rows={3}
                  placeholder="Teks pertanyaan pada saat jawaban ini dikirim"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  Kategori (snapshot)
                  <Tag className="w-4 h-4 text-pink-400" />
                </label>
                <select
                  value={draftQuestionCategory}
                  onChange={(e) => setDraftQuestionCategory(e.target.value)}
                  className="input-cute"
                >
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Jawaban
                </label>
                <textarea
                  value={draftAnswer}
                  onChange={(e) => setDraftAnswer(e.target.value)}
                  className="input-cute min-h-[180px] resize-none"
                  rows={7}
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-cute btn-cute-secondary flex-1"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="btn-cute btn-cute-primary flex-1"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Menyimpan...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Save className="w-5 h-5" />
                      Simpan Perubahan
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}