export function splitTags(input) {
  if (!input) {
    return [];
  }

  return String(input)
    .split(/[\s,，、；;\u3000]+/u)
    .map(tag => tag.trim())
    .filter(Boolean);
}
