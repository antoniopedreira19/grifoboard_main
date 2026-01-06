
import { DayOfWeek, TaskStatus } from "../../types";

export const dayNameMap: Record<DayOfWeek, string> = {
  mon: "Seg",
  tue: "Ter",
  wed: "Qua",
  thu: "Qui",
  fri: "Sex",
  sat: "Sáb",
  sun: "Dom"
};

export const getFullDayName = (day: DayOfWeek): string => {
  const map: Record<DayOfWeek, string> = {
    mon: "Segunda",
    tue: "Terça",
    wed: "Quarta",
    thu: "Quinta",
    fri: "Sexta",
    sat: "Sábado",
    sun: "Domingo"
  };
  return map[day];
};

export const getStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case "completed":
      return "bg-green-500 border-green-600";
    case "planned":
      return "bg-blue-500 border-blue-600";
    case "not_done":
      return "bg-red-500 border-red-600";
    case "not_planned":
    default:
      return "bg-gray-200 border-gray-300";
  }
};
