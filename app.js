"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const mysql_1 = __importDefault(require("mysql"));
const express_validator_1 = __importDefault(require("express-validator"));
const createError = require('http-errors');
const drivers_CRUD_1 = __importDefault(require("./routes/drivers-CRUD"));
const routes_CRUD_1 = __importDefault(require("./routes/routes-CRUD"));
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const app = express_1.default();
app.use(logger('dev'));
app.use(body_parser_1.default.json());
app.use(express_validator_1.default());
app.use(express_1.default.urlencoded({ extended: false }));
app.use(cookieParser());
exports.mysqlConnection = mysql_1.default.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'pass123',
    database: 'nodejslabs'
});
exports.mysqlConnection.connect(err => {
    if (!err)
        console.log('DB connection succeeded.');
    else
        console.log(`DB connection failed.\nError: ${JSON.stringify(err, undefined, 2)}`);
});
let healthCheck;
app.listen(3000, () => {
    console.log('Server started at port: 3000');
    healthCheck = new Date();
});
app.use('/drivers', new drivers_CRUD_1.default().router);
app.use('/routes', new routes_CRUD_1.default().router);
app.all('/health-check', (req, res) => {
    res.setHeader('Server-start-time', `${healthCheck}`);
    res.setHeader('Time-of-last-request', `${new Date()}`);
    res.setHeader('Server-work-duration', `${new Date().getTime() - healthCheck.getTime()} ms`);
    res.send();
});
app.all('/**', (req, res) => {
    res.writeHead(404, 'Route not found.');
    res.end();
});
app.use((req, res, next) => {
    next(createError(404));
});
app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
});
