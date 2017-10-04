import config from 'config';
import app from './index';

export default function () {
  const server = config.has('server') ? config.get('server') : {};

  const port = server.port || 8088;
  const host = server.host || 'localhost';
  const ignoreSSL = server.ignoreSSL;
  if (ignoreSSL) {
    console.log('[WARNING] ignoring SSL certs, use with caution!');
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
  console.log('Starting server: [http://%s:%s]', host, port);
  app.listen(port, host);
}
