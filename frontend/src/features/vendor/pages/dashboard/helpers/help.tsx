// ── helpers ───────────────────────────────────────────────────────────────────

export const peso = (v: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(v);

export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-PH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
  });

export function StarRating({ rating }: { rating: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const filled = i <= Math.floor(rating);
    const half = !filled && i === Math.ceil(rating) && rating % 1 !== 0;
    stars.push(
      <span key={i} className="relative inline-block text-lg leading-none">
        <span className="text-[#e2c97e]/30">★</span>
        {(filled || half) && (
          <span
            className="absolute inset-0 overflow-hidden text-[#e2c97e]"
            style={{ width: half ? '50%' : '100%' }}
          >
            ★
          </span>
        )}
      </span>,
    );
  }
  return <span className="flex gap-0.5">{stars}</span>;
}
