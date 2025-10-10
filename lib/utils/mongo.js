export function isObjectIdLike(id) {
  return /^[0-9a-fA-F]{24}$/.test(String(id || ''));
}
