export const getInitials = (name: string | undefined) => {
  if (!name) return "U"; // Default fallback for missing names
  const [firstName, lastName] = name
    .replaceAll("undefined", "")
    .trim()
    .split(" ");
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
};
