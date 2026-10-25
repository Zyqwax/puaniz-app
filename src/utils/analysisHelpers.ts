import { EXAM_CONFIG } from "../constants";

export interface ExamData {
  id?: string;
  name?: string;
  title?: string;
  type: string;
  date: string;
  totalNet: number;
  scores?: Record<string, { net: number; correct?: number; incorrect?: number; d?: number; y?: number }>;
  subjects?: Record<string, { net: number; correct?: number; incorrect?: number; d?: number; y?: number }>;
}

export interface SubjectStat {
  avg: string;
  max: number;
  min: number;
}

export const calculateSubjectStats = (
  exams: ExamData[],
  type = "TYT"
): Record<string, SubjectStat> => {
  const filteredExams = exams.filter((e) => e.type === type);
  if (filteredExams.length === 0) return {};

  const subjects: Record<
    string,
    { netSum: number; count: number; max: number; min: number }
  > = {};

  filteredExams.forEach((exam) => {
    const scores = exam.scores || exam.subjects || {};
    Object.keys(scores).forEach((subject) => {
      if (!subjects[subject]) {
        subjects[subject] = { netSum: 0, count: 0, max: -Infinity, min: Infinity };
      }
      const net = scores[subject]?.net ?? 0;
      subjects[subject].netSum += net;
      subjects[subject].count += 1;
      subjects[subject].max = Math.max(subjects[subject].max, net);
      subjects[subject].min = Math.min(subjects[subject].min, net);
    });
  });

  const stats: Record<string, SubjectStat> = {};
  Object.keys(subjects).forEach((sub) => {
    stats[sub] = {
      avg: (subjects[sub].netSum / subjects[sub].count).toFixed(2),
      max: subjects[sub].max,
      min: subjects[sub].min,
    };
  });

  return stats;
};

export const prepareTrendData = (
  exams: ExamData[],
  type = "TYT",
  subject = "total"
) => {
  return exams
    .filter((e) => e.type === type)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((e) => {
      let val = 0;
      const scores = e.scores || e.subjects || {};
      if (subject === "total") {
        val = e.totalNet;
      } else {
        val = scores[subject]?.net || 0;
      }
      return {
        name: e.date,
        value: val,
        examName: e.name || e.title || "Deneme",
      };
    });
};

export const prepareRadarData = (
  stats: Record<string, SubjectStat>,
  type = "TYT"
) => {
  const config = EXAM_CONFIG[type as keyof typeof EXAM_CONFIG] as Record<string, number> | undefined;

  return Object.keys(stats).map((subject) => {
    let fullMark = 40;

    if (config && config[subject]) {
      fullMark = config[subject];
    } else if (subject === "fen" || subject === "sosyal") {
      fullMark = 20;
    }

    const avg = parseFloat(stats[subject].avg);
    const percentage = fullMark > 0 ? (avg / fullMark) * 100 : 0;

    return {
      subjectId: subject,
      subject: subject.charAt(0).toUpperCase() + subject.slice(1),
      A: parseFloat(percentage.toFixed(1)),
      fullMark,
      originalNet: avg,
    };
  });
};
