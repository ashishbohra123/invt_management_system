export function isValidSku(sku: string): boolean { return /^[A-Z0-9-]{3,50}$/i.test(sku); }
