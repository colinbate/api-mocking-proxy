import request from 'request';
import pify from 'pify';
import { hasBody } from 'type-is';
import config from 'config';
import cacher from './cacher';
import {passthru, errorHandler, shouldIgnore} from './app-utils';

const proxyConfig = config.has('proxy') ? config.get('proxy') : {};
const timeout = proxyConfig.timeout || 5000;
const disabled = !!proxyConfig.disable;

// Add OPTIONS convenience wrapper
request.options = (opts, callback) => {
  opts.method = 'OPTIONS';
  return request(opts, callback);
};

const requestp = pify(request, {multiArgs: true});

const eh = (res) => (err) => errorHandler(res, err);

const responseHandler = (req, res) => ([retRes, body]) => {
  // payload prepended with text so backwards compatibility checks do not fail
  var data = {
    payload: 'Original request body :: ' + JSON.stringify(req.props),
    code: retRes.statusCode,
    headers: retRes.headers,
    body: body
  };
  cacher.set(req, data).then(() => passthru(res, data), eh(res));
};

const middleware = () => (req, res, next) => {
  if (shouldIgnore(req)) {
    return next();
  }
  if (disabled || req.conf.noproxy) {
    res.writeHead(204);
    res.end();
    return;
  }
  const url = req.conf.host.replace(/\/+$/, "") + "/" + req.urlToProxy.replace(/^\/+/, "");

  const method = req.method.toLowerCase();
  const urlConf = {url, timeout, headers: req.headers};
  if (urlConf.headers['accept-encoding'] && urlConf.headers['accept-encoding'] === 'gzip') {
    urlConf.gzip = true;
  }
  // Remove encoding because we've processed the body already.
  delete urlConf.headers['content-encoding'];
  // Reset host
  delete urlConf.headers.host;
  if (hasBody(req)) {
    urlConf.body = req.body;
  }

  console.log("urlConf", urlConf);

  // This fetches the request then passes data to response handler
  requestp[method](urlConf).then(responseHandler(req, res));
};

export default middleware;
