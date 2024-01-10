"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitJoinRaceTaskQueue = void 0;
const task_queue_rabbit_1 = require("./task_queue.rabbit");
class RabbitJoinRaceTaskQueue extends task_queue_rabbit_1.RabbitTaskQueue {
    constructor() {
        super({ name: "join_race", concurrency: 1 });
    }
}
exports.RabbitJoinRaceTaskQueue = RabbitJoinRaceTaskQueue;
