import {RouteModel} from "../models/route.model";
import express from 'express';
import {mysqlConnection} from "../app";
import Validator from "../validators/driver-and-route-validator";

class RoutesController {
    public router = express.Router();

    constructor() {
        this.intializeRoutes();
    }

    public intializeRoutes() {
        this.router.get('/', this.getAllRoutes);
        this.router.post('/', this.createRoute);
        this.router.get('/:id', this.getRouteById);
        this.router.put('/:id', this.updateRouteById);
        this.router.delete('/:id', this.removeRouteById);

        this.router.get('/:id/drivers', this.getRouteDrivers);
        this.router.get('/:id/drivers-last-month', this.getRouteDriversOfLastMonth);
    }

    getAllRoutes = (req: express.Request, res: express.Response) => {
        mysqlConnection.query('select * from routes', (err, rows) => {
            if (err) throw err;
            res.send(rows);
        });
    };

    createRoute = (req: express.Request, res: express.Response) => {
        let route: RouteModel;
        if (Validator.isRoute(req.body)) {
            route = req.body;
            mysqlConnection.query(`insert into routes(title, time) VALUES('${route.title}', ${route.time})`, (err) => {
                if (err) throw err;
                res.send('1 record successfully inserted.');
            });
        } else {
            res.writeHead(500,'Invalid data in request.');
            res.end();
        }
    };

    getRouteById = (req: express.Request, res: express.Response) => {
        mysqlConnection.query(`select * from routes where id = ${req.params.id}`, (err, rows) => {
            if (err) throw err;
            if (rows.length) {
                res.send(rows);
            } else {
                res.writeHead(404,'Record not found.');
                res.end();
            }
        });
    };

    updateRouteById = (req: express.Request, res: express.Response) => {
        let route: RouteModel;
        if (Validator.isRoute(req.body)) {
            route = req.body;
            const query = `update routes set title = '${route.title}', time = ${route.time} where id = ${req.params.id}`;
            mysqlConnection.query(query, (err) => {
                if (err) throw err;
                res.send('Table successfully updated.');
            });
        } else {
            res.writeHead(500,'Invalid data in request.');
            res.end();
        }
    };

    removeRouteById = (req: express.Request, res: express.Response) => {
        mysqlConnection.query(`delete from routes where id = ${req.params.id}`, (err) => {
            if (err) throw err;
            res.send('Deleted successfully.');
        });
    };

    getRouteDrivers = (req: express.Request, res: express.Response) => {
        const query = `select drivers.id, drivers.name, drivers.surname, drivers.totalHours from drivers
                       join driverAndRoute on driverAndRoute.driverId = drivers.id
                       join (select id from routes where id = ${req.params.id}) route on route.id = driverAndRoute.routeId;`;
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

    getRouteDriversOfLastMonth = (req: express.Request, res: express.Response) => {
        const query = `select drivers.id, drivers.name, drivers.surname, drivers.totalHours from drivers
        join (select driverId, routeId from driverAndRoute where dateOfRecording > DATE_ADD(NOW(), INTERVAL -1 MONTH))
        drAndRo on drAndRo.driverId = drivers.id
        join (select id from routes where id = ${req.params.id}) route on route.id = drAndRo.routeId;`;

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
}

export default RoutesController;