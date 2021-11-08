export const CHARACTERS_NUMERIC = '1234567890';
export const CHARACTERS_ALPHA_LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
export const CHARACTERS_ALPHA_UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const CHARACTERS_ALPHA = `${CHARACTERS_ALPHA_LOWERCASE}${CHARACTERS_ALPHA_UPPERCASE}`;
export const CHARACTERS_ALPHANUMERIC = `${CHARACTERS_ALPHA}${CHARACTERS_NUMERIC}`;
export const CHARACTERS_HEX = `${CHARACTERS_NUMERIC}abcdef`;

export const generateRandomString = (length: number, characters: string = CHARACTERS_ALPHANUMERIC): string => {
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += characters[Math.floor(Math.random() * characters.length)];
  }
  return result;
};

export const generateUUID = (shouldIncludeDashes = true): string => {
  let uuid = generateRandomString(32, CHARACTERS_HEX);
  if (shouldIncludeDashes) {
    uuid = [
      uuid.substring(0, 8),
      uuid.substring(8, 12),
      uuid.substring(12, 16),
      uuid.substring(16, 20),
      uuid.substring(20)]
      .join('-');
  }
  return uuid;
};

export const isValidEmail = (email: string): boolean => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
};

export const camelCaseToKebabCase = (value: string): string => {
  return value.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
};

export const truncateMiddle = (text: string, maxLength: number): string => {
  const diff = text.length - maxLength;
  if (diff > 0) {
    const start = text.substring(0, Math.ceil(maxLength / 2.0));
    const end = text.substring(text.length - Math.floor(maxLength / 2.0), text.length);
    return `${start}...${end}`;
  }
  return text;
};

export const truncateStart = (text: string, maxLength: number): string => {
  const diff = text.length - maxLength;
  if (diff > 0) {
    const start = text.substring(0, maxLength);
    return `${start}...`;
  }
  return text;
};
