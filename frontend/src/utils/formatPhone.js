/*
 * The API stores Irish numbers in E.164 (+353871234567). People read them the
 * local way: 087 123 4567 for mobiles. Anything else is shown as stored.
 */
export function formatIrishPhone(e164) {
  if (typeof e164 !== "string" || !e164.startsWith("+353")) return e164 || "";
  const national = `0${e164.slice(4)}`;
  /* Mobiles: 08X XXX XXXX */
  if (/^08\d{8}$/.test(national)) {
    return `${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`;
  }
  /* Dublin landlines: 01 XXX XXXX */
  if (/^01\d{7}$/.test(national)) {
    return `${national.slice(0, 2)} ${national.slice(2, 5)} ${national.slice(5)}`;
  }
  return national;
}
