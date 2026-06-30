import API from './api';
import type { BadgesResponse } from '../types';

/** Fetch the badge catalog with the current user's earned/locked state and progress. */
export async function getBadges(): Promise<BadgesResponse> {
  const { data } = await API.get<BadgesResponse>('/badges');
  return data;
}
