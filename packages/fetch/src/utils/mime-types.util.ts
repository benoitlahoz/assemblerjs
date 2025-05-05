// See: https://medium.com/@anatoliiyatsenko/understanding-fetch-api-response-methods-and-the-content-type-header-6dcbe7b24ded

import { ResponseMethod } from '@/decorators/parse.decorator';

interface MimeParts {
  type: string;
  subtype: string;
  encoding: string | null;
}

const fetchParserMethodName: any = {
  '*': {
    '*': 'text',
  },
  text: {
    '*': 'text',
  },
  audio: {
    '*': 'blob',
  },
  video: {
    '*': 'blob',
  },
  font: {
    '*': 'blob',
  },
  application: {
    '*': 'blob',
    javascript: 'text', // Could use 'blob', implementation left to the user.
    xml: 'text', // Could use 'blob', implementation left to the user.
    'xhtml+xml': 'text', // Could use 'blob', implementation left to the user.
    json: 'json',
    'x-www-form-urlencoded': 'text',
    'ld+json': 'json',
    EDIFACT: 'text', // Could use 'blob', implementation left to the user.
  },
  image: {
    '*': 'blob',
    'svg+xml': 'text',
  },
  multipart: {
    '*': 'blob',
    'form-data': 'formData',
    related: 'blob',
  },
};

const parseMimeType = (mime: string): MimeParts => {
  const parts = mime.split('/');

  if (parts.length > 1)
    return {
      type: parts[0].trim(),
      subtype: parts[1]?.split(';')[0].trim(),
      encoding: parts[1]?.split(';')[1]?.replace('charset=', '').trim(),
    };

  return {
    type: '*',
    subtype: '*',
    encoding: null,
  };
};

export const registerMethodName = (
  mime: string,
  method: ResponseMethod
): void => {
  const parsed = parseMimeType(mime);
  const existing = fetchParserMethodName[parsed.type];

  if (typeof existing === 'undefined') {
    // Create default with passed method.

    fetchParserMethodName[parsed.type] = {
      '*': method,
    };
  }

  fetchParserMethodName[parsed.type] = {
    ...fetchParserMethodName[parsed.type],
    [parsed.subtype]: method,
  };
};

export const replaceMethodName = (
  mime: string,
  method: ResponseMethod
): void => {
  const parsed = parseMimeType(mime);
  const existing = fetchParserMethodName[parsed.type];

  if (typeof existing === 'undefined') {
    return registerMethodName(mime, method);
  }

  existing[parsed.subtype] = method;
};

export const methodNameForType = (mime: string): ResponseMethod => {
  const parsed = parseMimeType(mime);
  const handler = fetchParserMethodName[parsed.type];

  const subtype = parsed.subtype;

  if (Object.keys(handler).includes(subtype)) {
    return handler[parsed.subtype];
  } else if (Object.keys(handler).includes('*')) {
    // Return default.
    return handler['*'];
  }

  throw new Error(
    `Content type '${mime}' is not handled. Register it before any call to 'fetch' ` +
      `or use the 'ParseMethod' decorator to force the resolution.`
  );
};

// Defaults.
// See: https://medium.com/@anatoliiyatsenko/understanding-fetch-api-response-methods-and-the-content-type-header-6dcbe7b24ded

registerMethodName('*/*', 'blob');
registerMethodName('text/*', 'text');
registerMethodName('audio/*', 'blob');
registerMethodName('video/*', 'blob');
registerMethodName('font/*', 'blob');
registerMethodName('application/*', 'blob');
registerMethodName('application/javascript', 'text'); // Could use 'blob', implementation left to the user.
registerMethodName('application/xml', 'text'); // Could use 'blob', implementation left to the user.
registerMethodName('application/xhtml+xml', 'text'); // Could use 'blob', implementation left to the user.
registerMethodName('application/json', 'json');
registerMethodName('application/ld+json', 'json');
registerMethodName('application/x-www-form-urlencoded', 'text');
registerMethodName('application/EDIFACT', 'text'); // Could use 'blob', implementation left to the user.
registerMethodName('image/*', 'blob');
registerMethodName('image/svg+xml', 'text');
registerMethodName('multipart/*', 'blob');
registerMethodName('multipart/form-data', 'formData');
registerMethodName('multipart/related', 'blob');
