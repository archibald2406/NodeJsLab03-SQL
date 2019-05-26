import express from 'express';
import bodyParser from 'body-parser';
import mysql from 'mysql';
import expressValidator from 'express-validator';
const createError = require('http-errors');
import DriversController from "./routes/drivers-CRUD";
import RoutesController from "./routes/routes-CRUD";
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const app = express();
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(expressValidator());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

export const mysqlConnection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'pass123',
    database: 'nodejslabs'
});

mysqlConnection.connect(err => {
    if (!err) console.log('DB connection succeeded.');
    else console.log(`DB connection failed.\nError: ${JSON.stringify(err,undefined,2)}`);
});
let healthCheck: Date;

app.listen(3000, () => {
    console.log('Server started at port: 3000');
    healthCheck = new Date();
});

app.use('/drivers', new DriversController().router);
app.use('/routes', new RoutesController().router);
app.all('/health-check',(req, res) => {
    res.setHeader('Server-start-time', `${healthCheck}`);
    res.setHeader('Time-of-last-request', `${new Date()}`);
    res.setHeader('Server-work-duration', `${new Date().getTime() - healthCheck.getTime()} ms`);
    res.send();
});
app.all('/**', (req, res) => {
    res.writeHead(404,'Route not found.');
    res.end();
});

app.use((req, res, next) => {
    next(createError(404));
});

app.use((err: any, req: any, res: any, next: any) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
});