import express from 'express';
import favicon from 'serve-favicon';
import {join} from 'path';
import bodyParser from 'body-parser';
import logger from 'morgan';

import mappings from './mappings';
import props from './props';
import cache from './cache-middleware';
import mockproxy from './mock-proxy';
import delay from './delay-middleware';

var appRoot = join(__dirname, '..');

// Initialization
var app = express();
app.use(favicon(join(appRoot, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.raw(mappings.bodyParserConfig));
// Setup proxy middleware
app.use(mappings());
app.use(delay());
app.use(props());
app.use(cache());
app.use(mockproxy());

app.use(bodyParser.json());
app.use(express.static(join(appRoot, 'public')));

// View engine setup
app.set('views', join(appRoot, 'views'));
app.set('view engine', 'ejs');

/* Routing */
// GET home page
app.get('/', (req, res) => {
  res.render('index', { title: 'API Mocking Proxy Server', mappings: Array.from(mappings.mappings.values()) });
});

export default app;
