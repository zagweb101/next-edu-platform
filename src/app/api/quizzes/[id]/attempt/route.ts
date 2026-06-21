/**
 * POST /api/quizzes/[id]/attempt — Submit a quiz attempt
 *
 * Body:
 *   { answers: [{ questionId, selectedOptionId }] }
 *
 * Auto-grades the attempt and returns score + correct answers.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { id: quizId } = await params;
  const body = await req.json();

  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: true,
      lesson: {
        include: {
          module: { select: { courseId: true } },
        },
      },
    },
  });

  if (!quiz) {
    return NextResponse.json({ error: 'QUIZ_NOT_FOUND' }, { status: 404 });
  }

  // Check enrollment
  const enrollment = await db.enrollment.findUnique({
    where: {
      courseId_studentId: {
        courseId: quiz.lesson.module.courseId,
        studentId: session.user.id,
      },
    },
  });

  if (!enrollment) {
    return NextResponse.json({ error: 'NOT_ENROLLED' }, { status: 403 });
  }

  // Check max attempts
  if (quiz.maxAttempts > 0) {
    const attemptsCount = await db.quizAttempt.count({
      where: {
        quizId,
        studentId: session.user.id,
      },
    });
    if (attemptsCount >= quiz.maxAttempts) {
      return NextResponse.json({ error: 'MAX_ATTEMPTS_REACHED' }, { status: 400 });
    }
  }

  // Grade the answers
  const answers = body.answers || [];
  let earnedPoints = 0;
  let totalPoints = 0;

  const gradedAnswers = answers.map((ans: { questionId: string; selectedOptionId: string }) => {
    const question = quiz.questions.find(q => q.id === ans.questionId);
    if (!question) return null;

    totalPoints += question.points;
    const isCorrect = question.correctAnswer === ans.selectedOptionId;
    if (isCorrect) earnedPoints += question.points;

    return {
      questionId: ans.questionId,
      selectedOptionId: ans.selectedOptionId,
      correct: isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    };
  }).filter(Boolean);

  const score = totalPoints === 0 ? 0 : Math.round((earnedPoints / totalPoints) * 100);
  const passed = score >= quiz.passScore;

  // Save the attempt
  const attempt = await db.quizAttempt.create({
    data: {
      quizId,
      studentId: session.user.id,
      answers: gradedAnswers,
      score,
      passed,
      completedAt: new Date(),
    },
  });

  // If passed, mark the lesson as completed
  if (passed) {
    await db.lessonProgress.upsert({
      where: {
        enrollmentId_lessonId: {
          enrollmentId: enrollment.id,
          lessonId: quiz.lessonId,
        },
      },
      update: { completed: true, lastWatchedAt: new Date() },
      create: {
        enrollmentId: enrollment.id,
        lessonId: quiz.lessonId,
        completed: true,
      },
    });
  }

  return NextResponse.json({
    attempt,
    score,
    passed,
    passScore: quiz.passScore,
    gradedAnswers,
  });
}
