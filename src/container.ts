import { RabbitJoinRaceTaskQueue } from "@queues/join_race_task_queue.rabbit";
import { RaceRepo } from "@races/repo";
import { RaceServiceInterface } from "@races/service";
import { RaceService } from "@races/service/_service";
import { SocketInterface } from "@socket/interfaces";
import { UserRepo } from "@users/repo";
import { UserService } from "@users/service/_service";
import { UserServiceInterface } from "@users/service/interfaces";

export interface ContainerInterface {
  userService: UserServiceInterface;
  raceService: RaceServiceInterface;
}

// Builds a dependency container by instantiating repos, services, queues...
// and passing along their required dependencies
export const buildContainer = (socket: SocketInterface) => {
  // Instantiate queues
  const joinRaceQueue = new RabbitJoinRaceTaskQueue();

  // Instantiate repos and services
  const userRepo = new UserRepo();
  const userService = new UserService({ repo: userRepo });

  const raceRepo = new RaceRepo();
  const raceService = new RaceService({
    repo: raceRepo,
    socket,
    getUserById: userService.getUserById.bind(userService),
    publishRaceJoinTask: joinRaceQueue.publish.bind(joinRaceQueue),
  });

  // Consume queues
  joinRaceQueue.consume.apply(joinRaceQueue, [
    raceService.handleRaceJoinRequest.bind(raceService),
  ]);

  const container: ContainerInterface = {
    userService,
    raceService,
  };

  // A container serves as the context on which the app runs
  return container;
};
