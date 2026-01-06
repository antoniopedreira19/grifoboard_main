
// This file re-exports everything from the pcp directory
// to maintain backward compatibility

// Import all modules to selectively re-export
import * as dateUtils from './pcp/dateUtils';
import * as textUtils from './pcp/textUtils';
import * as pcpCalculator from './pcp/pcpCalculator';
import * as mockDataGenerator from './pcp/mockDataGenerator';

// Re-export date utilities
export const {
  getWeekStartDate,
  getPreviousWeekDates,
  getNextWeekDates,
  formatDateRange
} = dateUtils;

// Re-export text utilities
export const {
  dayNameMap,
  getFullDayName,
  getStatusColor
} = textUtils;

// Re-export calculator utilities
export const {
  calculatePCP,
  storeHistoricalPCPData,
  // Only export this once
  generateWeeklyPCPData
} = pcpCalculator;

// Re-export mock data generator
export const {
  generateMockTasks
} = mockDataGenerator;
