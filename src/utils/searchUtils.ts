export const normalizeText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const IST_PREFIX_REG = /^ist\d+/i;

export const isIstIdQuery = (query: string): boolean => IST_PREFIX_REG.test(query.trim());

export const normalizeIstId = (value: string): string =>
  value.replace(/^ist/i, "").replace(/\D/g, "");
