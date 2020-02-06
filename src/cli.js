/* globals process */
import minimist from 'minimist';
import cacher from './cacher';
import server from './serve';
import config from 'config';

const argv = minimist(process.argv.slice(2), {alias: {root: ['r', 'data']}});

if (argv.root) {
  cacher.root = argv.root;
}

if (!config.has('mappings')) {
  console.log('You have no proxy mappings defined... create a default.toml file.');
  process.exit(0);
}

export const temporarilyDisableSSLSecurity = async function(secureBool, next) {
  if (secureBool) {
    return next();
  }
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
  const returnResult = await next();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = 1;
  return returnResult;
};

server();
