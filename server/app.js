var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');

var morgan = require('morgan');
const winston = require('./common/winston');

// History
const history = require('connect-history-api-fallback');
const staticFileMiddleware = express.static(path.join(__dirname + '/public'));


var app = express();
app.use(staticFileMiddleware);
app.use(history());
// app.use(history({
//   disableDotRule: true,
//   verbose: true
// }));
app.use(staticFileMiddleware);

app.get('/', function (req, res) {
  res.render(path.join(__dirname + '/public/index.html'));
});

// dot env
require('dotenv').config();

// express-session
var session = require('express-session');
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
  resave: false,
  saveUninitialized:false,
  secret:process.env.COOKIE_SECRET,
  rolling:true,
  cookie: {
    httpOnly: true,
    secure: false,
    _expires : 3600000 // 3600000 - 1시간
  }
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use(morgan('combined', { stream: winston.stream }));
// app.use(morgan('combined', {stream: winston.stream})); // morgan http 로그 미들웨어 추가

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
