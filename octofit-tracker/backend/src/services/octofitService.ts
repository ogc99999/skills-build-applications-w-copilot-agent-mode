import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function validationError(message: string) {
  const error = new Error(message) as Error & { status: number };
  error.status = 400;
  return error;
}

function notFoundError(message: string) {
  const error = new Error(message) as Error & { status: number };
  error.status = 404;
  return error;
}

function parseObjectId(value: unknown, field: string) {
  if (!value || typeof value !== 'string' || !mongoose.Types.ObjectId.isValid(value)) {
    throw validationError(`${field} must be a valid ObjectId`);
  }
  return new mongoose.Types.ObjectId(value);
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeActivityFocus(type?: string) {
  if (!type) return undefined;
  const focus = type.toLowerCase();
  if (['run', 'cycle', 'swim', 'walk', 'hike', 'cardio'].includes(focus)) return 'endurance';
  if (['strength', 'lift', 'sprint', 'intervals'].includes(focus)) return 'strength';
  if (['mobility', 'stretch', 'yoga', 'recovery'].includes(focus)) return 'mobility';
  return focus;
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw validationError('Activity payload is required');
  }

  const payload = input as Record<string, unknown>;
  const userId = parseObjectId(payload.userId ?? payload.user, 'userId');
  const teamId = parseObjectId(payload.teamId ?? payload.team, 'teamId');
  const type = typeof payload.type === 'string' ? payload.type.trim() : '';
  const minutesValue = Number(payload.minutes);

  if (!type) throw validationError('type is required');
  if (!Number.isFinite(minutesValue) || minutesValue <= 0) {
    throw validationError('minutes must be a positive number');
  }

  const user = await User.findById(userId);
  if (!user) throw validationError('userId must reference an existing user');

  const team = await Team.findById(teamId);
  if (!team) throw validationError('teamId must reference an existing team');

  const occurredAt = payload.occurredAt ? new Date(String(payload.occurredAt)) : new Date();
  if (Number.isNaN(occurredAt.getTime())) {
    throw validationError('occurredAt must be a valid date');
  }

  const activity = await Activity.create({
    user: user._id,
    team: team._id,
    type,
    minutes: minutesValue,
    points: Math.max(1, Math.round(minutesValue)),
    occurredAt,
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().sort({ name: 1 }).lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw validationError('Team payload is required');
  }

  const payload = input as Record<string, unknown>;
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const mascot = typeof payload.mascot === 'string' ? payload.mascot.trim() : '';
  const membersValue = Array.isArray(payload.members) ? payload.members : [];

  if (!name) throw validationError('name is required');
  if (!mascot) throw validationError('mascot is required');

  const members = membersValue.map((member) => parseObjectId(member, 'members[]'));
  const team = await Team.create({ name, mascot, members });
  return team.toObject();
}

export async function getLeaderboard() {
  const leaderboard = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $lookup: { from: 'teams', localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $project: { _id: 0, teamId: '$_id', teamName: '$team.name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return leaderboard.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const normalizedEmail = normalizeEmail(userEmail);
  const user = await User.findOne({ email: normalizedEmail }).lean();
  if (!user) {
    throw notFoundError('User not found');
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const recentType = recentActivities[0]?.type;
  const goalFocus = typeof user.fitnessGoal === 'string' ? user.fitnessGoal.trim().toLowerCase() : '';
  const recentFocus = normalizeActivityFocus(recentType);
  const candidateFocuses = Array.from(new Set([goalFocus, recentFocus, normalizeActivityFocus(recentType), goalFocus].filter(Boolean)));

  const candidateWorkouts = await Workout.find({
    focus: { $in: candidateFocuses },
  }).sort({ minutes: 1 }).lean();

  const workouts = candidateWorkouts.length > 0 ? candidateWorkouts : await Workout.find().sort({ minutes: 1 }).lean();

  return workouts.slice(0, 3).map((workout) => ({
    ...workout,
    reason: `Build ${workout.focus} around your ${recentType ?? (goalFocus || 'recent activity')} pattern so you keep progressing with ${workout.focus}.`,
  }));
}

export { User };
