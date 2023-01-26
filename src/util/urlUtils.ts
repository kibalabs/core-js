export const getUrlDisplayString = (url: string): string => {
  let cleanUrl = url;
  if (cleanUrl.startsWith('http://')) {
    cleanUrl = cleanUrl.slice('http://'.length);
  }
  if (cleanUrl.startsWith('https://')) {
    cleanUrl = cleanUrl.slice('https://'.length);
  }
  while (cleanUrl.endsWith('/')) {
    cleanUrl = cleanUrl.slice(0, cleanUrl.length - 1);
  }
  return cleanUrl;
};

export const getLinkableUrl = (url: string): string => {
  let linkableUrl = url;
  if (!linkableUrl.startsWith('http://') && !linkableUrl.startsWith('https://')) {
    linkableUrl = `http://${linkableUrl}`;
  }
  return linkableUrl;
};

export const resolveUrl = (url: string): string => {
  return url.startsWith('ipfs://') ? url.replace('ipfs://', 'https://pablo-images.kibalabs.com/v1/ipfs/') : url;
};

export const createSearchParams = (params: { [key: string]: string | string[] }): URLSearchParams => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]: [string, string | string[]]): void => {
    if (Array.isArray(value)) {
      value.forEach((innerValue: string): void => {
        searchParams.append(key, innerValue);
      });
    } else {
      searchParams.append(key, value);
    }
  });
  return searchParams;
};

export const updateQueryString = (url: string, values: Record<string, string | number | boolean>): string => {
  const newUrl = new URL(url);
  Object.keys(values).forEach((key: string): void => {
    newUrl.searchParams.set(key, String(values[key]));
  });
  return newUrl.toString();
};
