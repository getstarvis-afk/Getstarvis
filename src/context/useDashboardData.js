import { useContext } from 'react';
import { DashboardDataContext } from './DashboardDataContextValue';

export function useDashboardData() {
  const value = useContext(DashboardDataContext);
  if (!value) {
    throw new Error('useDashboardData must be used inside DashboardDataProvider');
  }
  return value;
}
