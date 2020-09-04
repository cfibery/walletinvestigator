export function formatName(name) {
  return name.length > 20 ? name.slice(0, 17).concat('...') : name;
}
