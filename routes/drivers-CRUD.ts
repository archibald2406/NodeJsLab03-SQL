import {DriverModel} from "../models/driver.model";
import {RouteModel} from "../models/route.model";
import moment from 'moment';
import express from 'express';
import {mysqlConnection} from "../app";
import {DriverAndRouteModel} from "../models/driverAndRoute.model";
import Validator from "../validators/driver-and-route-validator";

class DriversController {
    public router = express.Router();

    constructor() {
        this.intializeRoutes();
    }

    public intializeRoutes() {
        this.router.get('/', this.getAllDrivers);
        this.router.post('/', this.createDriver);
        this.router.get('/:id', this.getDriverById);
        this.router.put('/:id', this.updateDriverById);
        this.router.delete('/:id', this.removeDriverById);

        this.router.get('/:id/routes', this.getDriverRoutes);
        this.router.put('/:driverId/routes/:routeId', this.addDriverToRoute);
        this.router.delete('/:driverId/routes/:routeId', this.removeDriverFromRoute);
    }

    getAllDrivers = (req: express.Request, res: express.Response) => {
        let numRows: number;
        let numPerPage = parseInt(req.query.limit, 10) || 1;
        let page = parseInt(req.query.page, 10) || 0;
        let numPages: number;
        let skip = page * numPerPage;
        let limit = skip + ',' + numPerPage;

        mysqlConnection.query('select count(*) as numRows from drivers', (err, rows) => {
            numRows = rows[0].numRows;
            numPages = Math.ceil(numRows / numPerPage);

            mysqlConnection.query(`select * from drivers limit ${limit}`, (err, rows) => {
                let responsePayload: any = {
                    results: rows
                };
                if (page < numPages) {
                    responsePayload.pagination = {
                        current: page,
                        perPage: numPerPage,
                        previous: page > 0 ? page - 1 : undefined,
                        next: page < numPages - 1 ? page + 1 : undefined
                    }
                } else responsePayload.pagination = {
                    err: 'queried page ' + page + ' is >= to maximum page number ' + numPages
                };
                res.json(responsePayload);
            });
        });
    };

    createDriver = (req: express.Request, res: express.Response) => {
        let driver: DriverModel;
        if (Validator.isDriver(req.body)) {
            driver = req.body;
            mysqlConnection.query(`insert into drivers(name, surname) VALUES('${driver.name}', '${driver.surname}')`, (err) => {
                if (err) throw err;
                res.send('1 record successfully inserted.');
            });
        } else {
            res.writeHead(500,'Invalid data in request.');
            res.end();
        }
    };

    getDriverById = (req: express.Request, res: express.Response) => {
        mysqlConnection.query(`select * from drivers where id = ${req.params.id}`, (err, rows) => {
            if (err) throw err;
            if (rows.length) {
                res.send(rows);
            } else {
                res.writeHead(404,'Record not found.');
                res.end();
            }
        });
    };

    updateDriverById = (req: express.Request, res: express.Response) => {
        let driver: DriverModel;
        if (Validator.isDriver(req.body)) {
            driver = req.body;
            const query = `update drivers set name = '${driver.name}', surname = '${driver.surname}' where id = ${req.params.id}`;
            mysqlConnection.query(query, (err) => {
                if (err) throw err;
                res.send('Table successfully updated.');
            });
        } else {
            res.writeHead(500,'Invalid data in request.');
            res.end();
        }
    };

    removeDriverById = (req: express.Request, res: express.Response) => {
        mysqlConnection.query(`delete from drivers where id = ${req.params.id}`, (err) => {
            if (err) throw err;
            res.send('Deleted successfully.');
        });
    };

    getDriverRoutes = (req: express.Request, res: express.Response) => {
        const query = `select routes.id, routes.title, routes.time from routes
                       join driverAndRoute on driverAndRoute.routeId = routes.id
                       join (select id from drivers where id = ${req.params.id})
                       driver on driver.id = driverAndRoute.driverId;`;
        mysqlConnection.query(query, (err, rows) => {
            if (err) throw err;
            if (rows.length) {
                res.send(rows);
            } else {
                res.writeHead(404, {'Message': 'Records not found.'});
                res.end();
            }
        });
    };

    addDriverToRoute = (req: express.Request, res: express.Response) => {
        const record: DriverAndRouteModel = {
            driverId: req.params.driverId,
            routeId: req.params.routeId
        };

        mysqlConnection.query(`select * from driverandroute where driverId = ${record.driverId} and routeId = ${record.routeId}`,
            (err, rows) => {
            if (err) throw err;
            if (!rows.length) {
                this.getRecord(record.driverId, 'drivers', (err: Error, result: []) => {
                    if (result.length) {
                        const driver: DriverModel = result[0];
                        if (driver.totalHours < 20) {
                            this.getRecord(record.routeId, 'routes', (err: Error, result: []) => {
                                if (result.length) {
                                    const route: RouteModel = result[0];
                                    if (route.time + driver.totalHours <= 20) {
                                        const dateOfRec = moment(new Date()).format('YYYY-MM-DD');
                                        mysqlConnection.query(`insert into driverandroute(driverId, routeId, dateOfRecording)
                                                           values(${record.driverId}, ${record.routeId}, '${dateOfRec}')`,
                                            (err) => {
                                            if (err) throw err;
                                        });

                                        driver.totalHours += route.time;
                                        const query = `update drivers set totalHours = '${driver.totalHours}' where id = ${record.driverId}`;
                                        mysqlConnection.query(query, (err) => {
                                            if (err) throw err;
                                        });

                                        res.send('1 record successfully inserted.');
                                    } else {
                                        res.writeHead(500, {'Message': 'Driver does not have enough time to write on this route.'});
                                        res.end();
                                    }
                                } else {
                                    res.writeHead(404, {'Message': 'Route with given id not exists.'});
                                    res.end();
                                }
                            });
                        } else {
                            res.writeHead(500, {'Message': 'Driver has reached the maximum number of hours.'});
                            res.end();
                        }
                    } else {
                        res.writeHead(404, {'Message': 'Driver with given id not exists.'});
                        res.end();
                    }
                });
            } else {
                res.writeHead(500, {'Message': 'Driver is already on this route.'});
                res.end();
            }
        });
    };

    removeDriverFromRoute = (req: express.Request, res: express.Response) => {
        const record: DriverAndRouteModel = {
            driverId: req.params.driverId,
            routeId: req.params.routeId
        };

        mysqlConnection.query(`select * from driverandroute where driverId = ${record.driverId} and routeId = ${record.routeId}`,
            (err, rows) => {
                if (err) throw err;
                if (rows.length) {
                    this.getRecord(record.driverId, 'drivers', (err: Error, result: []) => {
                        const driver: DriverModel = result[0];
                        this.getRecord(record.routeId, 'routes', (err: Error, result: []) => {
                            const route: RouteModel = result[0];
                            driver.totalHours -= route.time;

                            mysqlConnection.query(`delete from driverandroute where driverId = ${record.driverId} and routeId = ${record.routeId}`,
                                (err) => {
                                if (err) throw err;
                            });

                            const query = `update drivers set totalHours = '${driver.totalHours}' where id = ${record.driverId}`;
                            mysqlConnection.query(query, (err) => {
                                if (err) throw err;
                            });

                            res.send('Deleted successfully.');
                        });
                    });
                } else {
                    res.writeHead(404, {'Message': 'Driver is not recorded for this route.'});
                    res.end();
                }
        });
    };

    private getRecord(id: number, tableName: string, callback: Function) {
        mysqlConnection.query(`select * from ${tableName} where id = ${id}`, (err, rows) => {
            if (err) callback(err, null);
            else callback(null, rows);
        });
    };
}

export default DriversController;