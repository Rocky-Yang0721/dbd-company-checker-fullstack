const HISTORY_KEY = "dbd_company_checker_history";

export const getHistory = () => {
  const raw = localStorage.getItem(HISTORY_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveHistory = (record) => {
  const currentHistory = getHistory();

  const newHistory = [
    {
      id: Date.now(),
      checkedAt: new Date().toLocaleString("th-TH"),
      ...record,
    },
    ...currentHistory,
  ];

  localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory.slice(0, 30)));

  return newHistory;
};

export const clearHistory = () => {
  localStorage.removeItem(HISTORY_KEY);
};