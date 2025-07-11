export function isValidConvexId(id: string): boolean {
  return /^[a-zA-Z0-9]{28}$/.test(id);
}
