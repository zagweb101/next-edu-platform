'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, PlayCircle, Lock, FileText, HelpCircle, ChevronDown, ChevronLeft } from 'lucide-react';
import { formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';

interface LessonWithProgress {
  id: string;
  title: string;
  type: string;
  videoDuration: number;
  isPreview: boolean;
  progress?: { completed: boolean; watchedSeconds: number };
}

interface ModuleWithLessons {
  id: string;
  title: string;
  order: number;
  lessons: LessonWithProgress[];
}

interface LessonSidebarProps {
  modules: ModuleWithLessons[];
  courseSlug: string;
  currentLessonId: string;
  locale: string;
}

export function LessonSidebar({ modules, courseSlug, currentLessonId, locale }: LessonSidebarProps) {
  const router = useRouter();
  const [openModules, setOpenModules] = useState<Set<string>>(() => {
    // Open the module that contains the current lesson
    for (const m of modules) {
      if (m.lessons.some(l => l.id === currentLessonId)) return new Set([m.id]);
    }
    return new Set([modules[0]?.id]);
  });

  function toggleModule(moduleId: string) {
    setOpenModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }

  function selectLesson(lessonId: string) {
    router.push(`/courses/${courseSlug}/learn?lesson=${lessonId}`);
    // Note: in a full implementation, this would update the player via URL param
  }

  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const completedLessons = modules.reduce(
    (sum, m) => sum + m.lessons.filter(l => l.progress?.completed).length,
    0,
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="font-bold text-sm mb-1">
          {locale === 'ar' ? 'محتوى الكورس' : 'Course content'}
        </h2>
        <p className="text-xs text-muted-foreground">
          {completedLessons} / {totalLessons} {locale === 'ar' ? 'درس' : 'lessons'}
        </p>
      </div>

      {/* Modules list */}
      <div className="flex-1 overflow-y-auto divide-y">
        {modules.map((module, mIdx) => {
          const isOpen = openModules.has(module.id);
          const moduleCompleted = module.lessons.every(l => l.progress?.completed);
          return (
            <div key={module.id}>
              <button
                onClick={() => toggleModule(module.id)}
                className="w-full p-3 flex items-center gap-2 hover:bg-muted/30 text-start"
              >
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    !isOpen && '-rotate-90',
                  )}
                />
                <span className="text-xs font-medium text-muted-foreground">
                  {locale === 'ar' ? `الوحدة ${mIdx + 1}` : `Module ${mIdx + 1}`}
                </span>
                <span className="text-sm font-medium flex-1 truncate">{module.title}</span>
                {moduleCompleted && (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                )}
              </button>

              {isOpen && (
                <div className="bg-muted/10">
                  {module.lessons.map((lesson, lIdx) => {
                    const isActive = lesson.id === currentLessonId;
                    const isCompleted = lesson.progress?.completed;
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => selectLesson(lesson.id)}
                        className={cn(
                          'w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/30 text-start transition-colors',
                          isActive && 'bg-primary/10 border-s-2 border-primary',
                        )}
                      >
                        <div className="shrink-0">
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : lesson.type === 'VIDEO' ? (
                            <PlayCircle className="h-4 w-4 text-muted-foreground" />
                          ) : lesson.type === 'QUIZ' ? (
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-sm truncate',
                            isActive ? 'text-primary font-medium' : 'text-foreground',
                          )}>
                            <span className="text-muted-foreground text-xs me-1">
                              {mIdx + 1}.{lIdx + 1}
                            </span>
                            {lesson.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDuration(lesson.videoDuration, locale)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
