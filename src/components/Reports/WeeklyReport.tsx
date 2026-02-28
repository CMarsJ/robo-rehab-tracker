import React from 'react';
import { RehabReport } from './RehabReport';
import { WeeklyReportData } from '@/services/reportService';

interface WeeklyReportProps {
  data: WeeklyReportData;
}

export const WeeklyReport: React.FC<WeeklyReportProps> = ({ data }) => {
  return <RehabReport data={data} />;
};
