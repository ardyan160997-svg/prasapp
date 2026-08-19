'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus, Trash2, Edit, Eye, EyeOff, GripVertical, Loader2, CheckCircle,
  FileText, MessageSquare, ArrowUpDown, X
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Question {
  id: string;
  text: string;
  category: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  _count?: {
    answers: number;
  };
}

interface Stats {
  totalQuestions: number;
  totalAnswers: number;
  activeQuestions: number;
}

interface FormData {
  text: string;
  category: string;
  order: number;
  isActive: boolean;
}

interface SortableQuestionProps {
  question: Question;
  index: number;
  onEdit: (question: Question) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, isActive: boolean) => void;
}

function SortableQuestion({ question, index, onEdit, onDelete, onToggle }: SortableQuestionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const categoryColors: Record<string, string> = {
    icebreaker: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    fun: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
    values: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
    deep: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',
    relationship: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group card-cute p-4 transition-all duration-200 hover:shadow-lg"
    >
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-1 p-2 text-pink-400 hover:text-pink-600 cursor-grab active:cursor-grabbing transition-colors"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        {/* Question content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              #{question.order}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium border ${categoryColors[question.category] || 'bg-gray-100 text-gray-800 border-gray-200'}`}
            >
              {question.category}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${question.isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
              {question.isActive ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>
          <p className="text-gray-800 dark:text-gray-200 mb-2 line-clamp-2">{question.text}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {question._count?.answers || 0} jawaban
            </span>
            <span className="flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" />
              Order: {question.order}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(question)}
            className="p-2 text-gray-400 hover:text-pink-500 transition-colors rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20"
            aria-label="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onToggle(question.id, !question.isActive)}
            className={`p-2 transition-colors rounded-lg ${question.isActive ? 'text-pink-500' : 'text-gray-400 hover:text-pink-500'}`}
            aria-label={question.isActive ? 'Nonaktifkan' : 'Aktifkan'}
          >
            {question.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onDelete(question.id)}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
            aria-label="Hapus"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EditorDashboardPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalQuestions: 0,
    totalAnswers: 0,
    activeQuestions: 0,
  });
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState<FormData>({
    text: '',
    category: 'icebreaker',
    order: 0,
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    { value: 'icebreaker', label: '❄️ Icebreaker' },
    { value: 'fun', label: '😄 Fun' },
    { value: 'values', label: '💎 Values' },
    { value: 'deep', label: '🌊 Deep' },
    { value: 'relationship', label: '💕 Relationship' },
  ];

  const fetchData = useCallback(async () => {
    try {
      const [questionsRes, answersRes] = await Promise.all([
        fetch('/api/questions?includeInactive=true').then(r => r.json()),
        fetch('/api/answers').then(r => r.json()),
      ]);
      
      if (questionsRes.questions) {
        const fetchedQuestions = questionsRes.questions as Question[];
        setQuestions(fetchedQuestions);
        setStats({
          totalQuestions: fetchedQuestions.length,
          totalAnswers: answersRes.answers?.length || 0,
          activeQuestions: fetchedQuestions.filter((q: Question) => q.isActive).length,
        });
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex(q => q.id === active.id);
      const newIndex = questions.findIndex(q => q.id === over.id);
      const newQuestions = arrayMove(questions, oldIndex, newIndex);
      
      // Update order locally first
      const updatedQuestions = newQuestions.map((q, i) => ({ ...q, order: i + 1 }));
      setQuestions(updatedQuestions);
      
      // Update each question's order in database
      try {
        await Promise.all(
          updatedQuestions.map((q, i) =>
            fetch(`/api/questions/${q.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ order: i + 1 }),
            })
          )
        );
      } catch (err) {
        console.error('Failed to update order:', err);
        fetchData(); // Revert on error
      }
    }
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      text: question.text,
      category: question.category,
      order: question.order,
      isActive: question.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin mau hapus pertanyaan ini?')) return;
    
    try {
      await fetch(`/api/questions/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/questions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      fetchData();
    } catch (err) {
      console.error('Failed to toggle:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const url = editingQuestion
        ? `/api/questions/${editingQuestion.id}`
        : '/api/questions';
      const method = editingQuestion ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menyimpan');
      }

      setShowModal(false);
      setEditingQuestion(null);
      setFormData({ text: '', category: 'icebreaker', order: 0, isActive: true });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openNewModal = () => {
    setEditingQuestion(null);
    setFormData({
      text: '',
      category: 'icebreaker',
      order: questions.length + 1,
      isActive: true,
    });
    setShowModal(true);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/editor" className="card-cute p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
              <FileText className="w-6 h-6 text-pink-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Pertanyaan</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{stats.totalQuestions}</p>
            </div>
          </div>
        </Link>
        <Link href="/editor" className="card-cute p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Aktif</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{stats.activeQuestions}</p>
            </div>
          </div>
        </Link>
        <Link href="/editor" className="card-cute p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Jawaban</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{stats.totalAnswers}</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Questions List */}
      <div className="card-cute">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-semibold text-gray-800 dark:text-gray-100">
            Daftar Pertanyaan
          </h2>
          <button
            onClick={openNewModal}
            className="btn-cute btn-cute-primary"
          >
            <Plus className="w-5 h-5 mr-2" /> Tambah Pertanyaan
          </button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={questions.map(q => q.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {questions.map((question, index) => (
                <SortableQuestion
                  key={question.id}
                  question={question}
                  index={index}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                />
              ))}
              {questions.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>Belum ada pertanyaan. Tambahin yuk! 💕</p>
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card-cute w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="sticky top-0 bg-white dark:bg-[#2a1a2e] border-b border-pink-100 dark:border-pink-900/30 p-4 flex items-center justify-between">
              <h3 className="text-xl font-display font-semibold text-gray-800 dark:text-gray-100">
                {editingQuestion ? 'Edit Pertanyaan' : 'Tambah Pertanyaan Baru'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingQuestion(null);
                  setFormData({ text: '', category: 'icebreaker', order: 0, isActive: true });
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pertanyaan <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  placeholder="Tulis pertanyaan di sini..."
                  className="input-cute min-h-[100px] resize-none"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kategori
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-cute"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Urutan
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="input-cute"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-pink-500 border-pink-300 rounded focus:ring-pink-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                  Aktif (tampil di halaman publik)
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-pink-100 dark:border-pink-900/30">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingQuestion(null);
                    setFormData({ text: '', category: 'icebreaker', order: 0, isActive: true });
                  }}
                  className="btn-cute btn-cute-secondary flex-1"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-cute btn-cute-primary flex-1"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Menyimpan...
                    </span>
                  ) : (
                    editingQuestion ? 'Update' : 'Simpan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}