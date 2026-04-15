/**
 * Normaliza datas de CVs para o formato YYYY-MM (JSON Resume padrão).
 */
const PT_MONTHS: Record<string, string> = {
  janeiro: "01", jan: "01",
  fevereiro: "02", fev: "02",
  março: "03", mar: "03",
  abril: "04", abr: "04",
  maio: "05", mai: "05",
  junho: "06", jun: "06",
  julho: "07", jul: "07",
  agosto: "08", ago: "08",
  setembro: "09", set: "09",
  outubro: "10", out: "10",
  novembro: "11", nov: "11",
  dezembro: "12", dez: "12",
};

const EN_MONTHS: Record<string, string> = {
  january: "01", jan: "01",
  february: "02", feb: "02",
  march: "03", mar: "03",
  april: "04", apr: "04",
  may: "05",
  june: "06", jun: "06",
  july: "07", jul: "07",
  august: "08", aug: "08",
  september: "09", sep: "09",
  october: "10", oct: "10",
  november: "11", nov: "11",
  december: "12", dec: "12",
};

const MONTH_MAP = { ...PT_MONTHS, ...EN_MONTHS };

export function normalizeDate(raw: string | undefined): string | undefined {
  if (!raw) return undefined;

  const value = raw.trim().toLowerCase();

  if (/^(atual|present|current|hoje|atualmente)$/i.test(value)) return "Present";
  if (/^\d{4}-\d{2}$/.test(value)) return value;
  if (/^\d{4}$/.test(value)) return value;

  const monthYear = value.match(/^(\d{1,2})[/-](\d{4})$/);
  if (monthYear) return `${monthYear[2]}-${monthYear[1].padStart(2, "0")}`;

  const yearMonth = value.match(/^(\d{4})[/-](\d{1,2})$/);
  if (yearMonth) return `${yearMonth[1]}-${yearMonth[2].padStart(2, "0")}`;

  const namedMonth = value.match(/^([a-záéíóúâêîôûãõàç]+)\.?\s+(?:de\s+)?(\d{4})$/);
  if (namedMonth) {
    const month = MONTH_MAP[namedMonth[1]];
    if (month) return `${namedMonth[2]}-${month}`;
  }

  const yearRange = value.match(/^(\d{4})\s*[–\-/]\s*(?:\d{4}|atual|present)/);
  if (yearRange) return yearRange[1];

  const year = value.match(/\b(20\d{2}|19\d{2})\b/);
  if (year) return year[1];

  return undefined;
}

export function normalizeDateRange(text: string): {
  startDate?: string;
  endDate?: string;
} {
  const isPresent = /atual|present|current|hoje/i.test(text);
  const years = [...text.matchAll(/\b(20\d{2}|19\d{2})\b/g)].map((match) => match[1]);
  const monthYearPattern =
    /(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|january|february|march|april|may|june|july|august|september|october|november|december)[a-z]*\.?\s+(?:de\s+)?(?:20|19)\d{2}/gi;
  const monthMatches = [...text.matchAll(monthYearPattern)].map((match) =>
    normalizeDate(match[0])
  );

  if (monthMatches.length >= 2) {
    return {
      startDate: monthMatches[0],
      endDate: isPresent ? "Present" : monthMatches[monthMatches.length - 1],
    };
  }

  if (monthMatches.length === 1) {
    return {
      startDate: monthMatches[0],
      endDate: isPresent ? "Present" : undefined,
    };
  }

  const uniqueYears = [...new Set(years)];
  if (uniqueYears.length === 0) return {};
  if (uniqueYears.length === 1) {
    return {
      startDate: uniqueYears[0],
      endDate: isPresent ? "Present" : undefined,
    };
  }

  return {
    startDate: uniqueYears[0],
    endDate: isPresent ? "Present" : uniqueYears[uniqueYears.length - 1],
  };
}
