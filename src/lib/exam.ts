import type { ExamType } from "@/constants";

/** Net = doğru − yanlış/4. Pure, so it can live outside the server-action files. */
export const calculateNet = (correct: number, incorrect: number): number =>
  correct - incorrect / 4;

export const isExamType = (value: unknown): value is ExamType =>
  value === "TYT" || value === "AYT";
