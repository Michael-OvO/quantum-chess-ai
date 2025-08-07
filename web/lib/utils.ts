/**
 * @file utils.ts
 * @purpose Utility functions for the application
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.1
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using clsx and tailwind-merge
 * Ensures Tailwind CSS classes are properly merged without conflicts
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}