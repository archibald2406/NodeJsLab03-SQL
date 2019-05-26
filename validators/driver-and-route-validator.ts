import {DriverModel} from "../models/driver.model";
import {RouteModel} from "../models/route.model";

class Validator {
    static isDriver(driver: any): driver is DriverModel {
        const condition1: boolean = 'name' in driver && 'surname' in driver;
        let condition2: boolean = false;
        if (condition1) {
            condition2 = /^[a-zA-Z ]+$/.test(driver.name) && /^[a-zA-Z ]+$/.test(driver.surname);
        }
        return condition1 && condition2;
    }

    static isRoute(route: any): route is RouteModel {
        const condition1: boolean = 'title' in route && 'time' in route;
        let condition2: boolean = false;
        if (condition1) {
            condition2 = /^[a-zA-Z ]+$/.test(route.title) && /^[1-9]+[0-9]*$/.test(route.time);
        }
        return condition1 && condition2;
    }
}

export default Validator;