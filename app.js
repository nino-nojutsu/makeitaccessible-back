require('dotenv').config();
require('./models/connection');

var express = require('express');
const passport = require('passport');
require('./config/passport');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var usersRouter = require('./routes/users');
var auditRouter = require('./routes/audit');
var testRouter = require('./routes/test');
var authRouter = require('./routes/auth');
var siteRouter = require('./routes/site');


var app = express();
app.use(passport.initialize());

const cors = require('cors');
app.use(cors());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/users', usersRouter);
app.use('/audit', auditRouter);
app.use('/test', testRouter);
app.use('/auth', authRouter);
app.use('/sites', siteRouter);

module.exports = app;
