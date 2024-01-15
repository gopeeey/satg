import { raceEvents, userEvents } from "./events.js";
import loader from "./loader.js";
import Practice from "./practice.js";
import Race from "./race.js";
import User from "./user.js";

class RaceManager {
  currentRace;
  #socket;
  #backToHomeFn;
  #user;

  constructor({ socket, backToHome }) {
    this.#backToHomeFn = backToHome;
    this.#user = new User(socket, backToHome);
    this.#socket = socket;

    // Add event listeners to the socket;
    this.#socket.on(userEvents.session, this.#handleSession.bind(this));
    this.#socket.on(userEvents.update, this.#user.update.bind(this.#user));
    this.#socket.on(raceEvents.newPlayer, this.#handleNewPlayer.bind(this));
    this.#socket.on(
      raceEvents.playerUpdate,
      this.#handleRaceProgressUpdate.bind(this)
    );
  }

  #handleNewPlayer({ newPlayer, race, wordLength }) {
    loader.hide();
    if (this.currentRace) {
      if (race._id !== this.currentRace.data._id) return;

      // Add the new player
      this.currentRace.handleNewPlayer(newPlayer);
    } else {
      const leaveFn = () => {
        this.currentRace = null;
        this.#backToHomeFn();
      };

      if (race.practice) {
        this.currentRace = new Practice({
          user: this.#user,
          backToHomeFn: leaveFn,
          socket: this.#socket,
          raceData: race,
          wordLength,
        });
      } else {
        this.currentRace = new Race({
          user: this.#user,
          backToHomeFn: leaveFn,
          socket: this.#socket,
          raceData: race,
          wordLength,
        });
      }

      this.currentRace.render.apply(this.currentRace);
    }
  }

  #handleRaceProgressUpdate(progressUpdate) {
    if (this.currentRace) {
      this.currentRace.handlePlayerProgressUpdate(progressUpdate);
    }
  }

  #handleSession({ user, ongoingRace }) {
    this.#user.handleSession(user);
    if (!ongoingRace) return;
    const { race, progresses, wordLength } = ongoingRace;
    this.#handleNewPlayer({ newPlayer: null, race, wordLength });
    for (const prog of progresses) {
      this.#handleRaceProgressUpdate(prog);
    }
  }
}

export default RaceManager;
