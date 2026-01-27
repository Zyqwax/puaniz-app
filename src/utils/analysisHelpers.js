import { EXAM_CONFIG } from "../constants";

export const calculateSubjectStats = (exams, type = "TYT") => {
  const filteredExams = exams.filter((e) => e.type === type);
  if (filteredExams.length === 0) return {};

  const subjects = {};

  // Initialize subjects from first exam or known list
  // Depending on data structure, exam.scores keys are subjects

  filteredExams.forEach((exam) => {
    Object.keys(exam.scores || {}).forEach((subject) => {
      if (!subjects[subject]) {
        subjects[subject] = { netSum: 0, count: 0, max: -Infinity, min: Infinity };
      }
      const net = exam.scores[subject].net;
      subjects[subject].netSum += net;
      subjects[subject].count += 1;
      subjects[subject].max = Math.max(subjects[subject].max, net);
      subjects[subject].min = Math.min(subjects[subject].min, net);
    });
  });

  const stats = {};
  Object.keys(subjects).forEach((sub) => {
    stats[sub] = {
      avg: (subjects[sub].netSum / subjects[sub].count).toFixed(2),
      max: subjects[sub].max,
      min: subjects[sub].min,
    };
  });

  return stats;
};

export const prepareTrendData = (exams, type = "TYT", subject = "total") => {
  // Returns array for Recharts: [{ name: 'Date', value: Net }]
  return exams
    .filter((e) => e.type === type)
    .sort((a, b) => new Date(a.date) - new Date(b.date)) // Ensure chronological order
    .map((e) => {
      let val = 0;
      if (subject === "total") {
        val = e.totalNet;
      } else {
        val = e.scores[subject]?.net || 0;
      }
      return {
        name: e.date, // or e.name
        value: val,
        examName: e.name,
      };
    });
};

export const prepareRadarData = (stats, type = "TYT") => {
  // Transform stats object to array for RadarChart
  return Object.keys(stats).map((subject) => {
    let fullMark = 40;

    if (EXAM_CONFIG[type] && EXAM_CONFIG[type][subject]) {
      fullMark = EXAM_CONFIG[type][subject];
    } else if (subject === "fen" || subject === "sosyal") {
      // Legacy support
      fullMark = 20;
    }

    const avg = parseFloat(stats[subject].avg);
    const percentage = fullMark > 0 ? (avg / fullMark) * 100 : 0;

    return {
      subject: subject.charAt(0).toUpperCase() + subject.slice(1),
      A: parseFloat(percentage.toFixed(1)),
      fullMark,
      originalNet: avg,
    };
  });
};
