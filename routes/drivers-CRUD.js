"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const express_1 = __importDefault(require("express"));
const app_1 = require("../app");
const driver_and_route_validator_1 = __importDefault(require("../validators/driver-and-route-validator"));
class DriversController {
    constructor() {
        this.router = express_1.default.Router();
        this.getAllDrivers = (req, res) => {
            let numRows;
            let numPerPage = parseInt(req.query.limit, 10) || 1;
            let page = parseInt(req.query.page, 10) || 0;
            let numPages;
            let skip = page * numPerPage;
            let limit = skip + ',' + numPerPage;
            app_1.mysqlConnection.query('select count(*) as numRows from drivers', (err, rows) => {
                numRows = rows[0].numRows;
                numPages = Math.ceil(numRows / numPerPage);
                app_1.mysqlConnection.query(`select * from drivers limit ${limit}`, (err, rows) => {
                    let responsePayload = {
                        results: rows
                    };
                    if (page < numPages) {
                        responsePayload.pagination = {
                            current: page,
                            perPage: numPerPage,
                            previous: page > 0 ? page - 1 : undefined,
                            next: page < numPages - 1 ? page + 1 : undefined
                        };
                    }
                    else
                        responsePayload.pagination = {
                            err: 'queried page ' + page + ' is >= to maximum page number ' + numPages
                        };
                    res.json(responsePayload);
                });
            });
        };
        this.createDriver = (req, res) => {
            let driver;
            if (driver_and_route_validator_1.default.isDriver(req.body)) {
                driver = req.body;
                app_1.mysqlConnection.query(`insert into drivers(name, surname) VALUES('${driver.name}', '${driver.surname}')`, (err) => {
                    if (err)
                        throw err;
                    res.send('1 record successfully inserted.');
                });
            }
            else {
                res.writeHead(500, 'Invalid data in request.');
                res.end();
            }
        };
        this.getDriverById = (req, res) => {
            app_1.mysqlConnection.query(`select * from drivers where id = ${req.params.id}`, (err, rows) => {
                if (err)
                    throw err;
                if (rows.length) {
                    res.send(rows);
                }
                else {
                    res.writeHead(404, 'Record not found.');
                    res.end();
                }
            });
        };
        this.updateDriverById = (req, res) => {
            let driver;
            if (driver_and_route_validator_1.default.isDriver(req.body)) {
                driver = req.body;
                const query = `update drivers set name = '${driver.name}', surname = '${driver.surname}' where id = ${req.params.id}`;
                app_1.mysqlConnection.query(query, (err) => {
                    if (err)
                        throw err;
                    res.send('Table successfully updated.');
                });
            }
            else {
                res.writeHead(500, 'Invalid data in request.');
                res.end();
            }
        };
        this.removeDriverById = (req, res) => {
            app_1.mysqlConnection.query(`delete from drivers where id = ${req.params.id}`, (err) => {
                if (err)
                    throw err;
                res.send('Deleted successfully.');
            });
        };
        this.getDriverRoutes = (req, res) => {
            const query = `select routes.id, routes.title, routes.time from routes
                       join driverAndRoute on driverAndRoute.routeId = routes.id
                       join (select id from drivers where id = ${req.params.id})
                       driver on driver.id = driverAndRoute.driverId;`;
            app_1.mysqlConnection.query(query, (err, rows) => {
                if (err)
                    throw err;
                if (rows.length) {
                    res.send(rows);
                }
                else {
                    res.writeHead(404, { 'Message': 'Records not found.' });
                    res.end();
                }
            });
        };
        this.addDriverToRoute = (req, res) => {
            const record = {
                driverId: req.params.driverId,
                routeId: req.params.routeId
            };
            app_1.mysqlConnection.query(`select * from driverandroute where driverId = ${record.driverId} and routeId = ${record.routeId}`, (err, rows) => {
                if (err)
                    throw err;
                if (!rows.length) {
                    this.getRecord(record.driverId, 'drivers', (err, result) => {
                        if (result.length) {
                            const driver = result[0];
                            if (driver.totalHours < 20) {
                                this.getRecord(record.routeId, 'routes', (err, result) => {
                                    if (result.length) {
                                        const route = result[0];
                                        if (route.time + driver.totalHours <= 20) {
                                            const dateOfRec = moment_1.default(new Date()).format('YYYY-MM-DD');
                                            app_1.mysqlConnection.query(`insert into driverandroute(driverId, routeId, dateOfRecording)
                                                           values(${record.driverId}, ${record.routeId}, '${dateOfRec}')`, (err) => {
                                                if (err)
                                                    throw err;
                                            });
                                            driver.totalHours += route.time;
                                            const query = `update drivers set totalHours = '${driver.totalHours}' where id = ${record.driverId}`;
                                            app_1.mysqlConnection.query(query, (err) => {
                                                if (err)
                                                    throw err;
                                            });
                                            res.send('1 record successfully inserted.');
                                        }
                                        else {
                                            res.writeHead(500, { 'Message': 'Driver does not have enough time to write on this route.' });
                                            res.end();
                                        }
                                    }
                                    else {
                                        res.writeHead(404, { 'Message': 'Route with given id not exists.' });
                                        res.end();
                                    }
                                });
                            }
                            else {
                                res.writeHead(500, { 'Message': 'Driver has reached the maximum number of hours.' });
                                res.end();
                            }
                        }
                        else {
                            res.writeHead(404, { 'Message': 'Driver with given id not exists.' });
                            res.end();
                        }
                    });
                }
                else {
                    res.writeHead(500, { 'Message': 'Driver is already on this route.' });
                    res.end();
                }
            });
        };
        this.removeDriverFromRoute = (req, res) => {
            const record = {
                driverId: req.params.driverId,
                routeId: req.params.routeId
            };
            app_1.mysqlConnection.query(`select * from driverandroute where driverId = ${record.driverId} and routeId = ${record.routeId}`, (err, rows) => {
                if (err)
                    throw err;
                if (rows.length) {
                    this.getRecord(record.driverId, 'drivers', (err, result) => {
                        const driver = result[0];
                        this.getRecord(record.routeId, 'routes', (err, result) => {
                            const route = result[0];
                            driver.totalHours -= route.time;
                            app_1.mysqlConnection.query(`delete from driverandroute where driverId = ${record.driverId} and routeId = ${record.routeId}`, (err) => {
                                if (err)
                                    throw err;
                            });
                            const query = `update drivers set totalHours = '${driver.totalHours}' where id = ${record.driverId}`;
                            app_1.mysqlConnection.query(query, (err) => {
                                if (err)
                                    throw err;
                            });
                            res.send('Deleted successfully.');
                        });
                    });
                }
                else {
                    res.writeHead(404, { 'Message': 'Driver is not recorded for this route.' });
                    res.end();
                }
            });
        };
        this.intializeRoutes();
    }
    intializeRoutes() {
        this.router.get('/', this.getAllDrivers);
        this.router.post('/', this.createDriver);
        this.router.get('/:id', this.getDriverById);
        this.router.put('/:id', this.updateDriverById);
        this.router.delete('/:id', this.removeDriverById);
        this.router.get('/:id/routes', this.getDriverRoutes);
        this.router.put('/:driverId/routes/:routeId', this.addDriverToRoute);
        this.router.delete('/:driverId/routes/:routeId', this.removeDriverFromRoute);
    }
    getRecord(id, tableName, callback) {
        app_1.mysqlConnection.query(`select * from ${tableName} where id = ${id}`, (err, rows) => {
            if (err)
                callback(err, null);
            else
                callback(null, rows);
        });
    }
    ;
}
exports.default = DriversController;
