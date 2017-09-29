/* globals process */
import argv from './argv';
import cacher from './cacher';
import server from './serve';
import config from 'config';

if (argv.root) {
  cacher.root = argv.root;
}

if (!config.has('mappings')) {
  console.log('You have no proxy mappings defined... create a default.toml file.');
  process.exit(0);
}
server();
