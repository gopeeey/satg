import { Logger } from "@lib/logger";
import { ConsumerHandlerType, TaskQueueInterface } from "@races/service";
import * as rabbit from "amqplib";
import { Message } from "amqplib";
import config from "src/config";
// import * as rabbit from ""

// const rabbit = require("amqplib") as typeof rabbitImp;

const rabbitConfig = config.thirdParty.rabbitMq;

// RabbitMQ implementation of a task queue
export class RabbitTaskQueue<M> implements TaskQueueInterface<M> {
  name: TaskQueueInterface<M>["name"];
  concurrency: TaskQueueInterface<M>["concurrency"];
  debugger: Logger;

  constructor({
    name,
    concurrency,
  }: Pick<TaskQueueInterface<M>, "name" | "concurrency">) {
    this.name = name;
    this.concurrency = concurrency;
    this.debugger = new Logger("task_queue:" + name);
  }

  // Publishes messages to the queue
  async publish(message: M) {
    try {
      const connection = await rabbit.connect(rabbitConfig.connectionUrl);
      const channel = await connection.createChannel();
      await channel.assertQueue(this.name, { durable: true });
      channel.sendToQueue(this.name, Buffer.from(JSON.stringify(message)), {
        persistent: true,
      });
      setTimeout(async () => {
        await connection.close();
      });
    } catch (err) {
      this.debugger.debugErr(err);
      throw err;
    }
  }

  // Consumes messages from the queue. Accepts a callback that processes said messages
  async consume(callback: ConsumerHandlerType<M>) {
    try {
      const connection = await rabbit.connect(rabbitConfig.connectionUrl);
      const channel = await connection.createChannel();
      await channel.prefetch(this.concurrency);
      await channel.assertQueue(this.name, { durable: true });
      await channel.consume(
        this.name,
        async (msg: Message | null) => {
          if (!msg) return;

          try {
            await callback(JSON.parse(msg.content.toString()));
          } catch (err) {
            console.log(err);
            return channel.nack(msg);
          }

          channel.ack(msg);
        },
        { noAck: false }
      );
    } catch (err) {
      this.debugger.debugErr(err);
      throw err;
    }
  }
}
