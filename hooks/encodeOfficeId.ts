export const encodeOfficeId = (officeId: number) => {
  return btoa(officeId.toString())
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}