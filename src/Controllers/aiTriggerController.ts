import type { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import { cacheManager } from '../utils/cacheManager.js';
import { safeTriggerAgent } from '../services/agentService.js';

import { Course } from '../models/courseModel.js';
import { CourseModule } from '../models/courseModuleModel.js';
import { Recommendation } from '../models/recommendationModel.js';
import { LearningPath } from '../models/learningPathModel.js';
import { Quiz } from '../models/quizModel.js';
import { CompletedCourse } from '../models/completedcourseModel.js';

interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    id?: string;
    [key: string]: any;
  };
}

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

export const triggerRecommendations = catchAsync(
  async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const userId = req.user!._id.toString();

    // Cache hit — return immediately (already-generated, fresh)
    const cached = await cacheManager.get(`ai:recommendations:${userId}`);
    if (cached) {
      return _res.status(200).json({
        status: 'success',
        data: cached,
        cached: true,
      });
    }

    // Upsert a pending marker BEFORE triggering — the client can poll the get
    // endpoint and see status='pending' instead of a misleading null.
    await Recommendation.findOneAndUpdate(
      { userId },
      { $set: { status: 'pending', userId } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // Context for the agent: the catalog to recommend from + the courses the
    // user has already completed (to exclude). Embedded in the trigger so the
    // agent needs no extra authenticated round-trip.
    const [availableCourses, completed] = await Promise.all([
      Course.find().select('title description level aiTags').limit(100).lean(),
      CompletedCourse.find({ userId }).select('courseId').lean(),
    ]);
    const completedCourseIds = completed
      .map((c: any) => c.courseId?.toString())
      .filter(Boolean);

    const triggered = await safeTriggerAgent(
      'course-recommender',
      {
        userId,
        initiatedBy: `user:${userId}`,
        context: {
          availableCourses: availableCourses.map((c: any) => ({
            courseId: c._id.toString(),
            title: c.title,
            description: c.description,
            level: c.level,
            tags: c.aiTags ?? [],
          })),
          completedCourseIds,
        },
      },
      `triggerRecommendations:${userId}`,
    );

    if (!triggered) {
      // Mark the doc failed so the client doesn't poll forever.
      await Recommendation.updateOne({ userId }, { $set: { status: 'failed' } });
      return next(new AppError('Agent service unavailable. Try again shortly.', 503));
    }

    _res.status(202).json({
      status: 'success',
      message: 'Recommendations are being generated. Check back shortly.',
    });
  },
);

export const getRecommendations = catchAsync(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const userId = req.user!._id.toString();

    const cached = await cacheManager.get(`ai:recommendations:${userId}`);
    if (cached) {
      return res.status(200).json({ status: 'success', data: cached, generationStatus: 'ready' });
    }

    const doc = await Recommendation.findOne({ userId });
    if (!doc) {
      return res.status(200).json({
        status: 'success',
        data: null,
        generationStatus: 'not_requested',
        message: 'No recommendations generated yet. Trigger generation first.',
      });
    }

    res.status(200).json({
      status: 'success',
      data: doc.status === 'ready' ? doc.recommendations : null,
      generationStatus: doc.status,
    });
  },
);

// ---------------------------------------------------------------------------
// Learning Path
// ---------------------------------------------------------------------------

export const triggerLearningPath = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!._id.toString();
    const { goal } = req.body as { goal?: string };

    if (!goal || typeof goal !== 'string' || !goal.trim()) {
      return next(new AppError('goal is required', 400));
    }

    // Fetch available published courses as context for the agent
    const availableCourses = await Course.find()
      .select('title description level aiTags aiSummary')
      .limit(100)
      .lean();

    // Create pending doc up-front so the client has something to poll on.
    const pending = await LearningPath.create({
      userId,
      goal: goal.trim(),
      status: 'pending',
    });

    const triggered = await safeTriggerAgent(
      'learning-path-builder',
      {
        userId,
        goal: goal.trim(),
        learningPathId: pending._id.toString(),
        initiatedBy: `user:${userId}`,
        context: {
          availableCourses: availableCourses.map((c: any) => ({
            courseId: c._id.toString(),
            title: c.title,
            description: c.description,
            level: c.level,
            tags: c.aiTags ?? [],
          })),
        },
      },
      `triggerLearningPath:${userId}`,
    );

    if (!triggered) {
      await LearningPath.updateOne({ _id: pending._id }, { $set: { status: 'failed' } });
      return next(new AppError('Agent service unavailable. Try again shortly.', 503));
    }

    res.status(202).json({
      status: 'success',
      learningPathId: pending._id.toString(),
      message: 'Learning path is being generated. Check back shortly.',
    });
  },
);

export const getLearningPath = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const doc = await LearningPath.findById(id);
    if (!doc) return next(new AppError('Learning path not found', 404));

    res.status(200).json({
      status: 'success',
      data: doc,
      generationStatus: doc.status,
    });
  },
);

export const getMyLearningPaths = catchAsync(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const userId = req.user!._id.toString();
    const paths = await LearningPath.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', data: paths });
  },
);

// ---------------------------------------------------------------------------
// Quiz Generation
// ---------------------------------------------------------------------------

export const triggerQuizGeneration = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { id, moduleIndex } = req.params;
    const modIdx = parseInt(moduleIndex, 10);

    if (isNaN(modIdx) || modIdx < 1) {
      return next(new AppError('moduleIndex must be a positive integer', 400));
    }

    const courseModule = await CourseModule.findOne({
      courseId: id,
      moduleIndex: modIdx,
    });
    if (!courseModule) {
      return next(new AppError('Module not found', 404));
    }

    const moduleDoc = courseModule as any;
    const lessonTitles: string[] = (moduleDoc.lessons ?? []).map(
      (l: any) => l.title,
    );

    if (lessonTitles.length === 0) {
      return next(new AppError('Module has no lessons to generate a quiz from', 400));
    }

    // Upsert pending marker
    await Quiz.findOneAndUpdate(
      { courseId: id, moduleIndex: modIdx },
      { $set: { status: 'pending', courseId: id, moduleIndex: modIdx } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    const triggered = await safeTriggerAgent(
      'quiz-generator',
      {
        courseId: id,
        moduleIndex: modIdx,
        initiatedBy: req.user ? `user:${req.user._id}` : 'api',
        context: {
          lessonTitles,
          moduleTitle: (courseModule as any).title,
        },
      },
      `triggerQuizGeneration:${id}:${modIdx}`,
    );

    if (!triggered) {
      await Quiz.updateOne(
        { courseId: id, moduleIndex: modIdx },
        { $set: { status: 'failed' } },
      );
      return next(new AppError('Agent service unavailable. Try again shortly.', 503));
    }

    res.status(202).json({
      status: 'success',
      message: 'Quiz is being generated. Check back shortly.',
    });
  },
);

export const getQuiz = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { id, moduleIndex } = req.params;
    const modIdx = parseInt(moduleIndex, 10);

    const cacheKey = `quiz:${id}:${modIdx}`;
    const cached = await cacheManager.get(cacheKey);
    if (cached) return res.status(200).json({ status: 'success', data: cached, generationStatus: 'ready' });

    const quiz = await Quiz.findOne({ courseId: id, moduleIndex: modIdx });
    if (!quiz) {
      return res.status(200).json({
        status: 'success',
        data: null,
        generationStatus: 'not_requested',
        message: 'No quiz generated yet for this module.',
      });
    }

    if (quiz.status === 'ready') {
      await cacheManager.set(cacheKey, quiz);
    }

    res.status(200).json({
      status: 'success',
      data: quiz.status === 'ready' ? quiz : null,
      generationStatus: quiz.status,
    });
  },
);
