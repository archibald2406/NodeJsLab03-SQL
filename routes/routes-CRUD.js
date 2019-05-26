"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app_1 = require("../app");
const driver_and_route_validator_1 = __importDefault(require("../validators/driver-and-route-validator"));
class RoutesController {
    constructor() {
        this.router = express_1.default.Router();
        this.getAllRoutes = (req, res) => {
            app_1.mysqlConnection.query('select * from routes', (err, rows) => {
                if (err)
                    throw err;
                res.send(rows);
            });
        };
        this.createRoute = (req, res) => {
            let route;
            if (driver_and_route_validator_1.default.isRoute(req.body)) {
                route = req.body;
                app_1.mysqlConnection.query(`insert into routes(title, time) VALUES('${route.title}', ${route.time})`, (err) => {
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
        this.getRouteById = (req, res) => {
            app_1.mysqlConnection.query(`select * from routes where id = ${req.params.id}`, (err, rows) => {
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
        this.updateRouteById = (req, res) => {
            let route;
            if (driver_and_route_validator_1.default.isRoute(req.body)) {
                route = req.body;
                const query = `update routes set title = '${route.title}', time = ${route.time} where id = ${req.params.id}`;
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
        this.removeRouteById = (req, res) => {
            app_1.mysqlConnection.query(`delete from routes where id = ${req.params.id}`, (err) => {
                if (err)
                    throw err;
                res.send('Deleted successfully.');
            });
        };
        this.getRouteDrivers = (req, res) => {
            const query = `select drivers.id, drivers.name, drivers.surname, drivers.totalHours from drivers
                       join driverAndRoute on driverAndRoute.driverId = drivers.id
                       join (select id from routes where id = ${req.params.id}) route on route.id = driverAndRoute.routeId;`;
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
        this.getRouteDriversOfLastMonth = (req, res) => {
            const query = `select drivers.id, drivers.name, drivers.surname, drivers.totalHours from drivers
        join (select driverId, routeId from driverAndRoute where dateOfRecording > DATE_ADD(NOW(), INTERVAL -1 MONTH))
        drAndRo on drAndRo.driverId = drivers.id
        join (select id from routes where id = ${req.params.id}) route on route.id = drAndRo.routeId;`;
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
        this.intializeRoutes();
    }
    intializeRoutes() {
        this.router.get('/', this.getAllRoutes);
        this.router.post('/', this.createRoute);
        this.router.get('/:id', this.getRouteById);
        this.router.put('/:id', this.updateRouteById);
        this.router.delete('/:id', this.removeRouteById);
        this.router.get('/:id/drivers', this.getRouteDrivers);
        this.router.get('/:id/drivers-last-month', this.getRouteDriversOfLastMonth);
    }
}
exports.default = RoutesController;
