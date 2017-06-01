import config from 'config';
import {shouldIgnore} from './app-utils';

const mappings = config.has('mappings') ? config.get('mappings') : {};

const mapmap = new Map();

Object.keys(mappings).forEach(key => mapmap.set(key, { key, ...mappings[key] }));

const middleware = () => (req, res, next) => {
  if (shouldIgnore(req)) {
    return next();
  }
  // remove a leading slash if there is any
  const reqUrl = req.url.startsWith('/') ? req.url.substr(1) : req.url;
  const key = reqUrl.split('/')[0];
  if (mappings.has(key)) {
    const mapping = mappings.get(key);
    const conf = {
      key: key,
      dir: mapping.dir || key,
      host: mapping.host,
      matchHeaders: mapping.matchHeaders || false,
      matchProps: mapping.matchProps === false ? false : (mapping.matchProps || true),
      ignoreProps: mapping.ignoreProps,
      contentType: mapping.contentType,
      noproxy: mapping.noproxy,
      nocache: mapping.nocache,
      touchFiles: mapping.touchFiles,
      delay: mapping.delay
    };
    req.conf = conf;
    req.urlToProxy = reqUrl.replace(key, '');
    return next();
  }
  console.log('WARN: No mapping found for ' + key);
  res.writeHead(404, {'Content-Type': 'text/plain'});
  res.write('No proxy mapping found for this URL.');
  res.end();
};

middleware.mappings = mapmap;
middleware.bodyParserConfig = { type: (req) => !shouldIgnore(req) };

export default middleware;
