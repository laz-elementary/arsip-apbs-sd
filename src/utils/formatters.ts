export const formatRupiah = (val: number): string => {
  if (isNaN(val)) return "Rp 0";
  return "Rp " + val.toLocaleString("id-ID");
};
