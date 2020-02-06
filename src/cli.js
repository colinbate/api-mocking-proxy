/* globals process */
import minimist from 'minimist';
import cacher from './cacher';
import server from './serve';
import config from 'config';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const argv = minimist(process.argv.slice(2), {alias: {root: ['r', 'data']}});

if (argv.root) {
  cacher.root = argv.root;
}

if (!config.has('mappings')) {
  console.log('You have no proxy mappings defined... create a default.toml file.');
  process.exit(0);
}
server();
