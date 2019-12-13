import {parse} from 'url';
import querystring from 'querystring';
import qs from 'qs';
import {join} from 'path';

// Utility methods
function stripSpecialChars (val) {
  if (!val) {
    return val;
  }
  return val.replace(/\?/g, '--').replace(/\//g, '__').replace(/:/g, '~~').replace(/\*/g, '%2A');
}

function getUrlPath (urlParts) {
  return stripSpecialChars((urlParts.pathname || '').replace('/', ''));
}

function matchDeepProps(props, match) {
  let pobj = {};

  function recursion(m) {
    if (match.indexOf(m) > -1) {
      pobj[m] = props[m];
    } else if (Array.isArray(props[m]) || typeof props[m] === 'object' && props[m] !== null) {
      pobj = Object.assign({}, pobj, matchDeepProps(props[m], match));
    } else if (typeof m === 'object' && m !== null) {
      pobj = Object.assign({}, pobj, matchDeepProps(m, match));
    }
  }

  if (Array.isArray(props)) {
    for (let m = 0; m < props.length; m++) {
      recursion(props[m])
    }
  } else if (typeof props === 'object') {
    for (let m in props) {
      if (props.hasOwnProperty(m)) {
        recursion(m)
      }
    }
  }
  return pobj;
}


function getPropsRecursive(req, match, ignore) {
  if (req.props === null) {
    return '';
  }

  let serialized;
  let pobj = {};

  if (Array.isArray(match)) {
    pobj = matchDeepProps(req.props, match);
  } else if (match !== false) {
    pobj = req.props;
  }
  if (Array.isArray(ignore)) {
    for (let p of ignore) {
      delete pobj[p];
    }
  }
  serialized = querystring.stringify(qs.stringify(pobj));
  return stripSpecialChars(serialized);
}


function getProps (req, match, ignore) {
  let qs;
  let pobj = {};
  if (Array.isArray(match)) {
    for (let m of match) {
      if (m in req.props) {
        pobj[m] = req.props[m];
      }
    }
  } else if (match !== false) {
    pobj = req.props;
  }
  if (Array.isArray(ignore)) {
    for (let p of ignore) {
      delete pobj[p];
    }
  }
  qs = querystring.stringify(pobj);
  return stripSpecialChars(qs);
}

function getReqHeaders (req, match) {
  let headers = '';
  if (Array.isArray(match)) {
    for (let header of match) {
      let presenseOnly = false;
      if (header.startsWith('@')) {
        presenseOnly = true;
        header = header.substring(1);
      }
      if (header in req.headers) {
        if (presenseOnly) {
          headers = join(headers, stripSpecialChars(header));
        } else {
          headers = join(headers, stripSpecialChars(header + '/' + req.headers[header]));
        }
      }
    }
  } else {
    for (let key in req.headers) {
      headers = join(headers, stripSpecialChars(key + '/' + req.headers[key]));
    }
  }
  return headers;
}

export function shouldIgnore ({url}) {
  return url === '' || url === '/' || url.startsWith('/__');
}

export function resolveMockPath (req, dataRoot) {
  // Mock data directory associated with the API call
  let path = join(req.conf.dir, req.method);
  if (!path) {
    return null;
  }

  // Custom headers
  if (req.conf.matchHeaders) {
    const headers = getReqHeaders(req, req.conf.matchHeaders);
    if (headers) {
      path = join(path, headers);
    }
  }

  // Meta info regarding the request's url, including the query string
  const parts = parse(req.urlToProxy, true);

  if (parts) {
    // REST parameters
    const urlPath = getUrlPath(parts);
    if (urlPath) {
      path = join(path, urlPath);
    } else {
      path = join(path, 'index');
    }

    // Query string
    const props = !req.conf.matchPropsRecursive ?
      getProps(req, req.conf.matchProps, req.conf.ignoreProps) :
      getPropsRecursive(req, req.conf.matchProps, req.conf.ignoreProps);

    if (props) {
      path = join(path, props);
    }
  }

  path = join(dataRoot, path + '.mock');
  console.log(path);
  return path;
}

export function passthru (res, options) {
  const zlib = require('zlib');
  try {
    res.writeHead(options.code || 200, options.headers);
    if (options.headers['content-encoding'] && options.headers['content-encoding'] === 'gzip') {
      zlib.gzip(options.body, function (_, result) {
        res.end(result);
      });
    } else {
      res.write(options.body);
      res.end();
    }
  } catch (e) {
    console.warn('Error writing response', e);
    res.end();
  }
}

export function errorHandler (res, err) {
  console.error('Request failed: ' + err);
  res.writeHead(500, {'Content-Type': 'text/plain'});
  res.write('An error has occured, please review the logs.');
  res.end();
}
