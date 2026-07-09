export function isValidSku(sku: string): boolean { return /^[0-9]{3,}$/.test(sku); }
