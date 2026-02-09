/**
 * SM2 Spaced Repetition Algorithm
 * 
 * Quality ratings:
 * 0 - Complete blackout, no recognition
 * 1 - Incorrect, but recognized
 * 2 - Incorrect, but seemed easy to recall
 * 3 - Correct, but with serious difficulty
 * 4 - Correct, with some hesitation
 * 5 - Perfect response, no hesitation
 */

export interface SM2Result {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewAt: Date;
}

export interface SM2Input {
  quality: number; // 0-5
  easeFactor: number;
  interval: number;
  repetitions: number;
}

export function calculateSM2(input: SM2Input): SM2Result {
  const { quality, easeFactor: currentEF, interval: currentInterval, repetitions: currentReps } = input;
  
  let newEaseFactor = currentEF;
  let newInterval: number;
  let newRepetitions: number;

  if (quality >= 3) {
    // Correct response
    if (currentReps === 0) {
      newInterval = 1; // First review: 1 day
    } else if (currentReps === 1) {
      newInterval = 6; // Second review: 6 days
    } else {
      newInterval = Math.round(currentInterval * currentEF);
    }
    
    newRepetitions = currentReps + 1;
    
    // Update ease factor
    newEaseFactor = currentEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    
    // Ensure ease factor doesn't go below 1.3
    if (newEaseFactor < 1.3) {
      newEaseFactor = 1.3;
    }
  } else {
    // Incorrect response - reset
    newInterval = 1;
    newRepetitions = 0;
    // Keep ease factor unchanged on failure
  }

  // Calculate next review date
  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);

  return {
    easeFactor: Math.round(newEaseFactor * 100) / 100,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewAt,
  };
}

/**
 * Get cards due for review
 */
export function isDueForReview(nextReviewAt: Date | string): boolean {
  const reviewDate = new Date(nextReviewAt);
  const now = new Date();
  return reviewDate <= now;
}

/**
 * Format interval for display
 */
export function formatInterval(days: number): string {
  if (days === 0) return 'Now';
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  if (days < 30) {
    const weeks = Math.round(days / 7);
    return weeks === 1 ? '1 week' : `${weeks} weeks`;
  }
  if (days < 365) {
    const months = Math.round(days / 30);
    return months === 1 ? '1 month' : `${months} months`;
  }
  const years = Math.round(days / 365);
  return years === 1 ? '1 year' : `${years} years`;
}

/**
 * Get quality rating label
 */
export function getQualityLabel(quality: number): string {
  switch (quality) {
    case 0: return 'Again';
    case 1: return 'Hard';
    case 2: return 'Difficult';
    case 3: return 'Good';
    case 4: return 'Easy';
    case 5: return 'Perfect';
    default: return 'Unknown';
  }
}

/**
 * Get button variant based on quality
 */
export function getQualityVariant(quality: number): 'destructive' | 'outline' | 'secondary' | 'default' {
  if (quality <= 1) return 'destructive';
  if (quality === 2) return 'outline';
  if (quality <= 4) return 'secondary';
  return 'default';
}
