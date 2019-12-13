import mkdirp from 'mkdirp';
import {writeFile, readFile, access, R_OK} from 'fs';
import {dirname} from 'path';
import pify from 'pify';

const writep = pify(writeFile);
const readp = pify(readFile);
const accessp = pify(access);
const mkdirpp = pify(mkdirp);

export function read (path) {
  return accessp(path, R_OK)
    .then(() => readp(path, {encoding: 'utf8'}))
    .catch(() => 'false')
    .then(input => input || 'false'); // Empty files are cache miss
}

export function write (path, content) {
  console.log("content ", content)

  return mkdirpp(dirname(path)).then(() => writep(path, content, {encoding: 'utf8', flag: 'w'}));
}
