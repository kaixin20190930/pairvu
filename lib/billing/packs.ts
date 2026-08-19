export const CHECK_PACK_CODES = ["pack_50", "pack_200", "pack_500"] as const;

export type CheckPackCode = (typeof CHECK_PACK_CODES)[number];

export interface CheckPack {
  code: CheckPackCode;
  name: string;
  credits: number;
  priceCents: number;
  validityDays: number;
}

export const CHECK_PACKS: Record<CheckPackCode, CheckPack> = {
  pack_50: {
    code: "pack_50",
    name: "50-check pack",
    credits: 50,
    priceCents: 900,
    validityDays: 365,
  },
  pack_200: {
    code: "pack_200",
    name: "200-check pack",
    credits: 200,
    priceCents: 2900,
    validityDays: 365,
  },
  pack_500: {
    code: "pack_500",
    name: "500-check pack",
    credits: 500,
    priceCents: 5900,
    validityDays: 365,
  },
};

export function isCheckPackCode(value: string): value is CheckPackCode {
  return CHECK_PACK_CODES.includes(value as CheckPackCode);
}
