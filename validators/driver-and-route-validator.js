"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Validator {
    static isDriver(driver) {
        const condition1 = 'name' in driver && 'surname' in driver;
        let condition2 = false;
        if (condition1) {
            condition2 = /^[a-zA-Z ]+$/.test(driver.name) && /^[a-zA-Z ]+$/.test(driver.surname);
        }
        return condition1 && condition2;
    }
    static isRoute(route) {
        const condition1 = 'title' in route && 'time' in route;
        let condition2 = false;
        if (condition1) {
            condition2 = /^[a-zA-Z ]+$/.test(route.title) && /^[1-9]+[0-9]*$/.test(route.time);
        }
        return condition1 && condition2;
    }
}
exports.default = Validator;
