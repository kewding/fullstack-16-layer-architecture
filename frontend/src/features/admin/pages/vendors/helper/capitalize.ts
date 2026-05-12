export const capitalizeFirst = (value: string): string => {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export const capitalizeNameFields = <
  T extends { first_name: string; middle_name: string; last_name: string },
>(
  data: T,
): T => ({
  ...data,
  first_name: capitalizeFirst(data.first_name),
  middle_name: capitalizeFirst(data.middle_name),
  last_name: capitalizeFirst(data.last_name),
});

export function capitalizeWords(value?: string | null): string {
  if (!value) return '';

  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}