import { raceEvents } from "./events.js";
import loader from "./loader.js";
import Practice from "./practice.js";
import Race from "./race.js";

class RaceManager {
  currentRace;
  #socket;
  #backToHomeFn;
  #user;

  constructor({ socket, backToHome, user }) {
    this.#backToHomeFn = backToHome;
    this.#socket = socket;
    this.#user = user;

    // Add event listeners to the socket;
    this.#socket.on(raceEvents.newPlayer, this.#handleNewPlayer.bind(this));
    this.#socket.on(
      raceEvents.playerUpdate,
      this.#handleRaceProgressUpdate.bind(this)
    );
  }

  #handleNewPlayer({ newPlayer, race, wordLength }) {
    loader.hide();
    if (this.currentRace) {
      console.log("I GET CALLED NEW PLAYER BEFORE");
      if (race._id !== this.currentRace.data._id) return;
      console.log("I GET CALLED NEW PLAYER AFTER");

      // Add the new player
      this.currentRace.handleNewPlayer(newPlayer);
    } else {
      if (race.practice) {
        this.currentRace = new Practice({
          user: this.#user,
          backToHomeFn: () => {
            this.currentRace = null;
            this.#backToHomeFn();
          },
          socket: this.#socket,
          raceData: race,
          wordLength,
        });
      } else {
        this.currentRace = new Race({
          user: this.#user,
          backToHomeFn: () => {
            this.currentRace = null;
            this.#backToHomeFn();
          },
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
}

export default RaceManager;
