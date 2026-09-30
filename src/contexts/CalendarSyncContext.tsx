import { createContext, useContext, useState, ReactNode } from 'react';

interface CalendarSyncContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const CalendarSyncContext = createContext<CalendarSyncContextType | undefined>(undefined);

export function CalendarSyncProvider({ children }: { children: ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <CalendarSyncContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </CalendarSyncContext.Provider>
  );
}

export function useCalendarSync() {
  const context = useContext(CalendarSyncContext);
  if (context === undefined) {
    throw new Error('useCalendarSync must be used within a CalendarSyncProvider');
  }
  return context;
}
