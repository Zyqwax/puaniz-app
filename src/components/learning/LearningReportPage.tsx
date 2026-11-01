import LearningPeriodReport from './LearningPeriodReport';
import { getLearningReport } from '@/server/actions/learning-report';
import type { LearningReportRole,LearningReportFilters } from '@/lib/learning-report';
export type ReportSearchParams=Promise<Record<string,string|string[]|undefined>>;
export default async function LearningReportPage({role,searchParams}:{role:LearningReportRole;searchParams:ReportSearchParams}) {
 const params=await searchParams;const filters:Partial<LearningReportFilters>={};
 for(const key of ['type','from','to','classId','grade','field','source'] as const){const value=params[key];if(typeof value==='string')Object.assign(filters,{[key]:value});}
 return <LearningPeriodReport key={JSON.stringify(filters)} report={await getLearningReport(role,filters)}/>;
}
