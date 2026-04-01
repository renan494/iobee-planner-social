export type ViewMode = "day" | "week" | "month" | "quarter" | "semester" | "year";

export const VIEW_LABELS: Record<ViewMode, string> = {
  day: "Dia",
  week: "Semana",
  month: "Mês",
  quarter: "Trimestre",
  semester: "Semestre",
  year: "Ano",
};
