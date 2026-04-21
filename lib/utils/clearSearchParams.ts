export const clearSearchParams = (notRemoveParams?: string[]) => {
  const url = new URL(window.location.href);
  const currentParams = new URLSearchParams(url.search);

  // Create a new URLSearchParams object to hold preserved params
  const newParams = new URLSearchParams();

  if (notRemoveParams && notRemoveParams.length > 0) {
    for (const key of notRemoveParams) {
      const value = currentParams.get(key);
      if (value !== null) {
        newParams.set(key, value);
      }
    }
  }

  url.search = newParams.toString();
  window.history.replaceState({}, "", url.toString());
};
