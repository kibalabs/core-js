
export const downloadFileFromBrowser = async (filename: string, content: string): Promise<void> => {
  const blob = new Blob([content]);
  const href = await URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// see https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API#Example
export const isDocumentVisible = (): boolean => {
  let hiddenKey: string | undefined;
  if (document.hidden !== undefined) {
    hiddenKey = 'hidden';
  // @ts-ignore
  } else if (document.msHidden !== undefined) {
    hiddenKey = 'msHidden';
  // @ts-ignore
  } else if (document.webkitHidden !== undefined) {
    hiddenKey = 'webkitHidden';
  }
  // @ts-ignore
  return hiddenKey ? !document[hiddenKey] : true;
};
