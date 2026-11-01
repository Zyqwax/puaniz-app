export interface StudentExamSummaryInput {
  type: string;
  date: string;
  totalNet: number;
}

/** Date inputs use YYYY-MM-DD; both endpoints are inclusive. */
export function filterStudentExams<T extends StudentExamSummaryInput>(exams: readonly T[], from = "", to = ""): T[] {
  return exams.filter(exam => (!from || exam.date >= from) && (!to || exam.date <= to));
}

export function summarizeStudentPeriod<T extends StudentExamSummaryInput>(exams: readonly T[], type: string, from = "", to = "") {
  const period = filterStudentExams(exams, from, to)
    .filter(exam => exam.type === type)
    .sort((a, b) => a.date.localeCompare(b.date));
  const average = period.length ? period.reduce((sum, exam) => sum + exam.totalNet, 0) / period.length : 0;
  let previousAverage: number | null = null;
  if (from && to && to >= from) {
    const start = Date.parse(from);
    const duration = Date.parse(to) - start + 86400000;
    const previous = exams.filter(exam => {
      const date = Date.parse(exam.date);
      return exam.type === type && date >= start - duration && date < start;
    });
    if (previous.length) previousAverage = previous.reduce((sum, exam) => sum + exam.totalNet, 0) / previous.length;
  }
  const comparison = !period.length ? null
    : previousAverage !== null ? average - previousAverage
    : period.length > 1 ? period.at(-1)!.totalNet - period.at(-2)!.totalNet
    : null;
  return { period, average, previousAverage, comparison };
}
