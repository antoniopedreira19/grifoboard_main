
import { DayOfWeek } from "../../types";

// Get the start date (Monday) from a given date
export const getWeekStartDate = (date: Date): Date => {
  const dayOfWeek = date.getDay(); // 0 for Sunday, 1 for Monday, etc.
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days, otherwise go back to Monday
  
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysToSubtract);
  
  return monday;
};

// Get the end date (Sunday) from a given date's week
export const getWeekEndDate = (date: Date): Date => {
  const startDate = getWeekStartDate(date);
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 6);
  
  return endDate;
};

// Format date as a string for display
export const formatDateRange = (startDate: Date, endDate: Date): string => {
  const startDay = startDate.getDate().toString().padStart(2, '0');
  const startMonth = (startDate.getMonth() + 1).toString().padStart(2, '0');
  
  const endDay = endDate.getDate().toString().padStart(2, '0');
  const endMonth = (endDate.getMonth() + 1).toString().padStart(2, '0');
  
  return `${startDay}/${startMonth} - ${endDay}/${endMonth}`;
};

export const getCurrentWeekDates = (): { start: Date, end: Date } => {
  const today = new Date();
  const startDate = getWeekStartDate(today);
  const endDate = getWeekEndDate(today);
  
  return { start: startDate, end: endDate };
};

// Navigate to previous week
export const getPreviousWeekDates = (currentStart: Date): { start: Date, end: Date } => {
  const newStart = new Date(currentStart.getFullYear(), currentStart.getMonth(), currentStart.getDate() - 7);
  const newEnd = new Date(newStart.getFullYear(), newStart.getMonth(), newStart.getDate() + 6);
  
  return { start: newStart, end: newEnd };
};

// Navigate to next week
export const getNextWeekDates = (currentStart: Date): { start: Date, end: Date } => {
  const newStart = new Date(currentStart.getFullYear(), currentStart.getMonth(), currentStart.getDate() + 7);
  const newEnd = new Date(newStart.getFullYear(), newStart.getMonth(), newStart.getDate() + 6);
  
  return { start: newStart, end: newEnd };
};
