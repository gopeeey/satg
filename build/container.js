"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildContainer = void 0;
const join_race_task_queue_rabbit_1 = require("./queues/join_race_task_queue.rabbit");
const repo_1 = require("./races/repo");
const _service_1 = require("./races/service/_service");
const repo_2 = require("./users/repo");
const _service_2 = require("./users/service/_service");
// Builds a dependency container by instantiating repos, services, queues...
// and passing along their required dependencies
const buildContainer = (socket) => {
    // Instantiate queues
    const joinRaceQueue = new join_race_task_queue_rabbit_1.RabbitJoinRaceTaskQueue();
    // Instantiate repos and services
    const userRepo = new repo_2.UserRepo();
    const userService = new _service_2.UserService({ repo: userRepo });
    const raceRepo = new repo_1.RaceRepo();
    const raceService = new _service_1.RaceService({
        repo: raceRepo,
        socket,
        getUserById: userService.getUserById.bind(userService),
        publishRaceJoinTask: joinRaceQueue.publish.bind(joinRaceQueue),
    });
    // Consume queues
    joinRaceQueue.consume.apply(joinRaceQueue, [
        raceService.handleRaceJoinRequest.bind(raceService),
    ]);
    const container = {
        userService,
        raceService,
    };
    // A container serves as the context on which the app runs
    return container;
};
exports.buildContainer = buildContainer;
