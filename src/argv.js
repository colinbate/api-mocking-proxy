/* globals process */
import minimist from 'minimist';

const argv = minimist(process.argv.slice(2), {alias: {
  root: ['r', 'data'],
  config: ['c'],
  name: ['n']
}});

if (argv.config) {
  process.env.NODE_CONFIG_DIR = argv.config;
}
if (argv.name) {
  process.env.NODE_ENV = argv.name;
}

export default argv;
