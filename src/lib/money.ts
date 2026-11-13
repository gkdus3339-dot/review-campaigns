export function formatWon(amount: number | null | undefined): string {
  if (amount == null) return "";
  return `${amount.toLocaleString("ko-KR")}원`;
}

/** Compact form for chart labels: 125000 -> "12.5만". */
export function formatManwon(amount: number): string {
  if (amount === 0) return "0";
  if (amount < 10000) return `${(amount / 10000).toFixed(1).replace(/\.0$/, "")}만`;
  const man = amount / 10000;
  return `${man >= 100 ? Math.round(man) : Number(man.toFixed(1))}만`;
}
