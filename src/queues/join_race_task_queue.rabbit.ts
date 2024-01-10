import {
  JoinRaceTaskQueueInterface,
  JoinRaceTaskType,
} from "@races/service/interfaces";
import { RabbitTaskQueue } from "./task_queue.rabbit";

export class RabbitJoinRaceTaskQueue
  extends RabbitTaskQueue<JoinRaceTaskType>
  implements JoinRaceTaskQueueInterface
{
  constructor() {
    super({ name: "join_race", concurrency: 1 });
  }
}
