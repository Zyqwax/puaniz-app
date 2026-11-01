import LearningReportPage,{type ReportSearchParams} from '@/components/learning/LearningReportPage';
export const metadata={title:'Dönem Raporları'};
export default function Page({searchParams}:{searchParams:ReportSearchParams}){return <LearningReportPage role="teacher" searchParams={searchParams}/>;}
