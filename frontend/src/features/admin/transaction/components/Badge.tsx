export const TypeBadge = ({ type }: { type: string }) => {
  const styles = {
    Purchase: 'bg-yellow-100 text-yellow-700',
    'Top-up': 'bg-green-100 text-green-800',
    Remittance: 'bg-sky-100 text-sky-700',
  };

  return (
    <div
      className={`px-4 py-1 rounded-full text-sm font-medium ${
        styles[type as keyof typeof styles]
      }`}
    >
      {type}
    </div>
  );
};
