export interface FeeBreakdown {
  approvedPrice: number;
  sellerAmount: number;
  resellerAmount: number;
  platformAmount: number;
  sellerPct: number;
  resellerPct: number;
  platformPct: number;
}

export function calculateFees(approvedPrice: number): FeeBreakdown {
  let sellerPct: number;
  let resellerPct: number;
  const platformPct = 10;

  if (approvedPrice <= 150) {
    sellerPct = 50;
    resellerPct = 40;
  } else if (approvedPrice <= 500) {
    sellerPct = 55;
    resellerPct = 35;
  } else {
    sellerPct = 60;
    resellerPct = 30;
  }

  const sellerAmount = parseFloat(((approvedPrice * sellerPct) / 100).toFixed(2));
  const resellerAmount = parseFloat(((approvedPrice * resellerPct) / 100).toFixed(2));
  const platformAmount = parseFloat((approvedPrice - sellerAmount - resellerAmount).toFixed(2));

  return {
    approvedPrice,
    sellerAmount,
    resellerAmount,
    platformAmount,
    sellerPct,
    resellerPct,
    platformPct,
  };
}

export function getTierLabel(approvedPrice: number): string {
  if (approvedPrice <= 150) return "€60–€150";
  if (approvedPrice <= 500) return "€151–€500";
  return "€501+";
}
