import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { getLocalProfile } from './storage';

const RESULTS_KEY = 'ws_test_results';

export interface TestResult {
  id: string;
  name: string;
  skill: string;
  testType: 'iq' | 'attention' | 'concentration_stroop' | 'concentration_sequence' | 'concentration_reaction' | 'mindset' | 'goals';
  testLabel: string;
  score: number;
  maxScore: number;
  percentage: number;
  timeTakenSeconds: number | null;
  details: Record<string, any>; // extra data per test type
  completedAt: string; // ISO date
  mode: 'practice' | 'selection';
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Save result locally + try Supabase
export async function saveResult(
  testType: TestResult['testType'],
  testLabel: string,
  score: number,
  maxScore: number,
  timeTakenSeconds: number | null,
  details: Record<string, any> = {},
  mode: 'practice' | 'selection' = 'practice',
): Promise<TestResult> {
  const profile = await getLocalProfile();

  const result: TestResult = {
    id: generateId(),
    name: profile?.name || 'Ismeretlen',
    skill: profile?.skill || 'Ismeretlen',
    testType,
    testLabel,
    score,
    maxScore,
    percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
    timeTakenSeconds,
    details,
    completedAt: new Date().toISOString(),
    mode,
  };

  // Save locally
  const existing = await getLocalResults();
  existing.unshift(result);
  await AsyncStorage.setItem(RESULTS_KEY, JSON.stringify(existing));

  // Try Supabase (won't fail if not configured)
  try {
    await supabase.from('test_results').insert({
      user_name: result.name,
      user_skill: result.skill,
      test_type: result.testType,
      test_label: result.testLabel,
      score: result.score,
      max_score: result.maxScore,
      percentage: result.percentage,
      time_taken_seconds: result.timeTakenSeconds,
      details: result.details,
      mode: result.mode,
      completed_at: result.completedAt,
    });
  } catch {
    // Supabase not configured yet, that's OK
  }

  return result;
}

// Get all local results
export async function getLocalResults(): Promise<TestResult[]> {
  const data = await AsyncStorage.getItem(RESULTS_KEY);
  if (!data) return [];
  return JSON.parse(data);
}

// Get results for current user
export async function getMyResults(): Promise<TestResult[]> {
  const profile = await getLocalProfile();
  const all = await getLocalResults();
  if (!profile) return all;
  return all.filter((r) => r.name === profile.name);
}

// Clear all local results
export async function clearLocalResults(): Promise<void> {
  await AsyncStorage.removeItem(RESULTS_KEY);
}

// Get all results from Supabase (for admin)
export async function getAllResultsFromSupabase(): Promise<TestResult[]> {
  try {
    const { data, error } = await supabase
      .from('test_results')
      .select('*')
      .order('completed_at', { ascending: false });

    if (error || !data) return [];

    return data.map((r: any) => ({
      id: r.id,
      name: r.user_name,
      skill: r.user_skill,
      testType: r.test_type,
      testLabel: r.test_label,
      score: r.score,
      maxScore: r.max_score,
      percentage: r.percentage,
      timeTakenSeconds: r.time_taken_seconds,
      details: r.details || {},
      completedAt: r.completed_at,
      mode: r.mode || 'practice',
    }));
  } catch {
    return [];
  }
}
