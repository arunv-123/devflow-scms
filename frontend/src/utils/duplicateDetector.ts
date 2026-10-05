export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Computes Jaccard + Substring similarity score between 0 and 1
 */
export function computeSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeText(str1);
  const norm2 = normalizeText(str2);
  if (norm1 === norm2) return 1.0;
  if (!norm1 || !norm2) return 0;

  const tokens1 = new Set(norm1.split(' '));
  const tokens2 = new Set(norm2.split(' '));
  const intersection = new Set([...tokens1].filter((x) => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);

  const jaccard = intersection.size / union.size;

  // Substring inclusion bonus if one string contains the other
  if ((norm1.length > 5 && norm2.includes(norm1)) || (norm2.length > 5 && norm1.includes(norm2))) {
    return Math.max(jaccard, 0.85);
  }

  return jaccard;
}

export type ClassificationType = 'NEW' | 'EXISTS' | 'SIMILAR';

export interface ClassificationResult {
  classification: ClassificationType;
  matchedTitle?: string;
  similarityScore: number;
}

export function classifySuggestion<T extends { title: string }>(
  suggestionTitle: string,
  existingItems: T[]
): ClassificationResult {
  let highestScore = 0;
  let bestMatch: string | undefined;

  for (const item of existingItems) {
    const score = computeSimilarity(suggestionTitle, item.title);
    if (score > highestScore) {
      highestScore = score;
      bestMatch = item.title;
    }
  }

  if (highestScore >= 0.9) {
    return { classification: 'EXISTS', matchedTitle: bestMatch, similarityScore: highestScore };
  } else if (highestScore >= 0.5) {
    return { classification: 'SIMILAR', matchedTitle: bestMatch, similarityScore: highestScore };
  }

  return { classification: 'NEW', similarityScore: highestScore };
}

export interface TechStackDiff {
  existing: string[];
  recommended: string[];
  additions: string[];
  removals: string[];
  unchanged: string[];
}

export function computeTechStackDiff(existingStack: string[] = [], recommendedStack: string[] = []): TechStackDiff {
  const existingMap = new Map<string, string>();
  existingStack.forEach((t) => {
    if (t && t.trim()) existingMap.set(t.trim().toLowerCase(), t.trim());
  });

  const recMap = new Map<string, string>();
  recommendedStack.forEach((t) => {
    if (t && t.trim()) recMap.set(t.trim().toLowerCase(), t.trim());
  });

  const additions: string[] = [];
  const unchanged: string[] = [];
  const removals: string[] = [];

  recMap.forEach((originalName, key) => {
    if (existingMap.has(key)) {
      unchanged.push(originalName);
    } else {
      additions.push(originalName);
    }
  });

  existingMap.forEach((originalName, key) => {
    if (!recMap.has(key)) {
      removals.push(originalName);
    }
  });

  return {
    existing: existingStack,
    recommended: recommendedStack,
    additions,
    removals,
    unchanged,
  };
}

