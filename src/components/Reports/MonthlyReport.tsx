import React from 'react';
import { RehabReport } from './RehabReport';
import { MonthlyReportData } from '@/services/reportService';

interface MonthlyReportProps {
  data: MonthlyReportData;
}

export const MonthlyReport: React.FC<MonthlyReportProps> = ({ data }) => {
  return <RehabReport data={data} />;
};
