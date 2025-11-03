export function getCurrentWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = (day + 6) % 7;
  const start = new Date(now);
  start.setDate(now.getDate() - diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}


