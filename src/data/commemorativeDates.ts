// Datas comemorativas brasileiras — feriados nacionais + datas comerciais/marketing
// month: 0-indexed (0=Jan, 11=Dec)

export interface CommemorativeDate {
  month: number;
  day: number;
  label: string;
  icon: string;
  type: "feriado" | "comercial";
}

// Fixed dates (repeat every year)
export const FIXED_COMMEMORATIVE_DATES: CommemorativeDate[] = [
  // Feriados nacionais
  { month: 0, day: 1, label: "Ano Novo", icon: "🎆", type: "feriado" },
  { month: 3, day: 21, label: "Tiradentes", icon: "🇧🇷", type: "feriado" },
  { month: 4, day: 1, label: "Dia do Trabalho", icon: "⚒️", type: "feriado" },
  { month: 8, day: 7, label: "Independência do Brasil", icon: "🇧🇷", type: "feriado" },
  { month: 9, day: 12, label: "N. Sra. Aparecida", icon: "🙏", type: "feriado" },
  { month: 10, day: 2, label: "Finados", icon: "🕯️", type: "feriado" },
  { month: 10, day: 15, label: "Proclamação da República", icon: "🇧🇷", type: "feriado" },
  { month: 10, day: 20, label: "Dia da Consciência Negra", icon: "✊🏿", type: "feriado" },
  { month: 11, day: 25, label: "Natal", icon: "🎄", type: "feriado" },

  // Datas comerciais / marketing
  { month: 1, day: 14, label: "Valentine's Day (Internacional)", icon: "💕", type: "comercial" },
  { month: 2, day: 8, label: "Dia da Mulher", icon: "👩", type: "comercial" },
  { month: 2, day: 15, label: "Dia do Consumidor", icon: "🛍️", type: "comercial" },
  { month: 3, day: 22, label: "Dia da Terra", icon: "🌍", type: "comercial" },
  { month: 5, day: 5, label: "Dia do Meio Ambiente", icon: "🌱", type: "comercial" },
  { month: 5, day: 12, label: "Dia dos Namorados", icon: "❤️", type: "comercial" },
  { month: 6, day: 20, label: "Dia do Amigo", icon: "🤝", type: "comercial" },
  { month: 7, day: 11, label: "Dia dos Pais", icon: "👨", type: "comercial" },
  { month: 8, day: 15, label: "Dia do Cliente", icon: "🤩", type: "comercial" },
  { month: 9, day: 12, label: "Dia das Crianças", icon: "👧", type: "comercial" },
  { month: 9, day: 15, label: "Dia do Professor", icon: "📚", type: "comercial" },
  { month: 9, day: 31, label: "Halloween", icon: "🎃", type: "comercial" },
  { month: 10, day: 19, label: "Dia do Empreendedor", icon: "🚀", type: "comercial" },
];

// Variable dates by year (Carnival, Easter, Mother's Day, etc.)
const VARIABLE_DATES: Record<number, CommemorativeDate[]> = {
  2025: [
    { month: 2, day: 1, label: "Carnaval", icon: "🎭", type: "feriado" },
    { month: 2, day: 2, label: "Carnaval", icon: "🎭", type: "feriado" },
    { month: 2, day: 3, label: "Carnaval", icon: "🎭", type: "feriado" },
    { month: 2, day: 4, label: "Quarta de Cinzas", icon: "✝️", type: "feriado" },
    { month: 3, day: 18, label: "Sexta-feira Santa", icon: "✝️", type: "feriado" },
    { month: 3, day: 20, label: "Páscoa", icon: "🐣", type: "comercial" },
    { month: 4, day: 11, label: "Dia das Mães", icon: "💐", type: "comercial" },
    { month: 5, day: 19, label: "Corpus Christi", icon: "✝️", type: "feriado" },
    { month: 10, day: 28, label: "Black Friday", icon: "🏷️", type: "comercial" },
  ],
  2026: [
    { month: 1, day: 14, label: "Carnaval", icon: "🎭", type: "feriado" },
    { month: 1, day: 15, label: "Carnaval", icon: "🎭", type: "feriado" },
    { month: 1, day: 16, label: "Carnaval", icon: "🎭", type: "feriado" },
    { month: 1, day: 17, label: "Carnaval", icon: "🎭", type: "feriado" },
    { month: 1, day: 18, label: "Quarta de Cinzas", icon: "✝️", type: "feriado" },
    { month: 3, day: 3, label: "Sexta-feira Santa", icon: "✝️", type: "feriado" },
    { month: 3, day: 5, label: "Páscoa", icon: "🐣", type: "comercial" },
    { month: 4, day: 10, label: "Dia das Mães", icon: "💐", type: "comercial" },
    { month: 5, day: 4, label: "Corpus Christi", icon: "✝️", type: "feriado" },
    { month: 10, day: 27, label: "Black Friday", icon: "🏷️", type: "comercial" },
  ],
  2027: [
    { month: 1, day: 6, label: "Carnaval", icon: "🎭", type: "feriado" },
    { month: 1, day: 7, label: "Carnaval", icon: "🎭", type: "feriado" },
    { month: 1, day: 8, label: "Carnaval", icon: "🎭", type: "feriado" },
    { month: 1, day: 9, label: "Carnaval", icon: "🎭", type: "feriado" },
    { month: 1, day: 10, label: "Quarta de Cinzas", icon: "✝️", type: "feriado" },
    { month: 2, day: 26, label: "Sexta-feira Santa", icon: "✝️", type: "feriado" },
    { month: 2, day: 28, label: "Páscoa", icon: "🐣", type: "comercial" },
    { month: 4, day: 9, label: "Dia das Mães", icon: "💐", type: "comercial" },
    { month: 4, day: 27, label: "Corpus Christi", icon: "✝️", type: "feriado" },
    { month: 10, day: 26, label: "Black Friday", icon: "🏷️", type: "comercial" },
  ],
};

/**
 * Returns commemorative dates for a specific date key (yyyy-MM-dd).
 */
export function getCommemorativeDatesForDay(dateKey: string): CommemorativeDate[] {
  const [yearStr, monthStr, dayStr] = dateKey.split("-");
  const year = parseInt(yearStr);
  const month = parseInt(monthStr) - 1; // 0-indexed
  const day = parseInt(dayStr);

  const results: CommemorativeDate[] = [];

  // Check fixed dates
  for (const cd of FIXED_COMMEMORATIVE_DATES) {
    if (cd.month === month && cd.day === day) {
      results.push(cd);
    }
  }

  // Check variable dates for the year
  const variable = VARIABLE_DATES[year];
  if (variable) {
    for (const cd of variable) {
      if (cd.month === month && cd.day === day) {
        results.push(cd);
      }
    }
  }

  return results;
}