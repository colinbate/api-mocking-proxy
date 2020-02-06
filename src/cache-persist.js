// Serializes and deserializes requests for caching.

const parse = input => {
  if (input === 'false') {
    return false;
  }
  if (input[0] === '{') {
    // Backward compatibility
    return JSON.parse(input);
  }
  // Defaults
  const res = {
    code: 200,
    headers: {},
    body: ''
  };

  const parts = input.split(/\r?\n\r?\n/);

  if (parts.length) {
    let firstCharCode = parts[0].charCodeAt(0); // ascii
    if (firstCharCode === 79) {
      // remove payload if exits, backwards compatible. Exactly letter 'O'
      parts.shift();
    }
  }

  if (parts.length) {
    let firstCodeCode = parts[0].charCodeAt(0); // ascii
    if (firstCodeCode >= 49 && firstCodeCode <= 53) {
      // Between 1 and 5 inclusive
      res.code = parseInt(parts[0], 10);
      parts.shift();
    }
  }

  if (parts.length) {
    if (/^\S+:\s*\S+/.test(parts[0])) {
      parts[0].split(/\r?\n/).forEach(header => {
        const colon = header.indexOf(':');
        res.headers[header.substr(0, colon)] = header.substr(colon + 1).replace(/^\s+/, '');
      });
      parts.shift();
    }
  }

  if (parts.length) {
    res.body = parts.join('\n\n');
  }

  return res;
};

const stringify = input => {
  let results = [];

  if (input.payload) {
    results.push(input.payload);
  }

  if (input.code) {
    results.push(input.code);
  }

  if (input.headers) {
    results.push(Object.keys(input.headers).map(key => `${key}: ${input.headers[key]}`).join('\n'));
  }
  if (input.body) {
    if (typeof input.body !== 'string') {
      input.body = JSON.stringify(input.body);
    }
    results.push(input.body);
  }
  const result = results.join('\n\n');
  return result;
};

export {parse, stringify};

/*
200

Header: value
Header1: value

Body
*/
