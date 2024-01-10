import { raceEvents } from "./events.js";
import { scaleNumber } from "./helpers.js";

const textInputId = "thisisthetextinputid";
const textRootId = "thisisthetextrootid";
const untypedTextId = "untypedText";

class Race {
  data;
  #user;
  #backToHomeFn;
  #socket;
  #typedText = "";
  #wrongTypedText = "";
  #typingTimeout = null;
  #errorCount = 0;
  #started = false;
  #done = false;
  #countDownTimeout = null;

  constructor({ user, raceData, backToHomeFn, socket, wordLength }) {
    this.data = raceData;
    this.#user = user;
    this.#backToHomeFn = backToHomeFn;
    this.#socket = socket;
  }

  render() {
    const root = document.getElementById("main");
    if (!root) return;

    const raceData = this.data;
    if (this.#countDownTimeout) clearInterval(this.#countDownTimeout);

    const eventElements = {
      leaveRace: {
        _id: `leave_${this.data._id}`,
        events: [{ event: "onclick", handler: () => this.#backToHomeFn() }],
        get element() {
          return `<span class="button leaveButton" id="${this._id}">Quit race</span>`;
        },
      },

      autoFocus: {
        _id: textInputId,
        get element() {
          return `<input onselect="return false" onselectstart="return false" onpaste="return false;" oncopy="return false" oncut="return false" ondrag="return false" ondrop="return false" autocomplete=off type="text" class="inputBox" id="${this._id}" />`;
        },
        events: [
          {
            event: "onblur",
            handler: (e) => {
              setTimeout(() => {
                e.target.focus();
              }, 10);
            },
          },
          {
            event: "oninput",
            handler: (e) => this.handleTextChange(e.target.value),
          },
        ],
        load() {
          setTimeout(() => {
            const el = document.getElementById(this._id);
            if (!el) return;
            el.addEventListener("keydown", (e) => {
              if (
                new Date().getTime() < new Date(raceData.startTime).getTime()
              ) {
                return e.preventDefault();
              }
              switch (e.key) {
                case "ArrowLeft":
                case "ArrowRight":
                case "ArrowUp":
                case "ArrowDown":
                  e.preventDefault();
                  break;
              }
            });
            el.focus();
          }, 100);
        },
      },
    };

    root.innerHTML = `
          <div id="race">
              <div class="section topTaskBar">
                <span id="countDown">Starts in</span>

                ${eventElements.leaveRace.element}
              </div>

              <div class="section trackRoot">
              ${[...this.data.players]
                .map(
                  (player) =>
                    `
                    <div class="track" id="track_${player.userId}">
                        <span class="wpm"><span id="wpm_${player.userId}">0</span> <span class="label">WPM</span></span>
                        <img src="/public/images/${player.avatar}" alt="car" class="car" id="${player.userId}" />
                    </div>
                    `
                )
                .join("")}
              </div>

              <div class="section textRoot">
                

                <div class="textBox">
                  <div class="display" id="${textRootId}">
                      <span class="correct">
                      </span>

                      <span class="wrong">
                      </span>

                      <span class="untyped typing" id="${untypedTextId}">
                        ${this.data.excerpt.body}
                      </span>
                      
                  </div>

                  <div class="excerptInfo">
                    - ${this.data.excerpt.author}${
      this.data.excerpt.title ? `, ${this.data.excerpt.title}` : ``
    }${this.data.excerpt.year ? `. ${this.data.excerpt.year}.` : `.`}
                  </div>

                  ${eventElements.autoFocus.element}
                  
                </div>
              </div>
          </div>
      `;

    // Add event listeners to the action elements defined
    for (const key in eventElements) {
      const obj = eventElements[key];
      const el = document.getElementById(obj._id);
      if (!el) continue;
      for (const ev of obj.events) {
        if (typeof ev.handler === "function")
          el[ev.event] = (e) => ev.handler(e);
      }

      if (typeof obj.load === "function") obj.load();
    }

    this.startCountDown();
  }

  startCountDown = () => {
    this.#countDownTimeout = setInterval(() => {
      console.log("tick");
      const now = new Date();
      const startTime = new Date(this.data.startTime);
      const diff = startTime.getTime() - now.getTime();
      const seconds = Math.ceil(diff / 1000);
      const el = document.getElementById("countDown");

      if (seconds > -3) {
        el.innerHTML = seconds > 0 ? seconds : "GO!";
        if (seconds <= 0) el.classList.add("go");
      } else {
        clearInterval(this.#countDownTimeout);
        this.#countDownTimeout = null;
        el.style.opacity = "0";
        el.classList.remove("go");
      }
    }, 1000);
  };

  setInputText = (newText) => {
    let inputEl = document.getElementById(textInputId);
    if (inputEl) inputEl.value = newText;
  };

  handleTextChange = (newText) => {
    const raceText = this.data.excerpt.body;
    if (this.#done || newText.length > raceText.length) return;
    let correctText = "";
    let wrongText = "";
    let untypedText = raceText.slice(newText.length, raceText.length);

    if (raceText.startsWith(newText)) {
      correctText = newText;
      this.#errorCount = 0;
      if (raceText === newText) {
        // Prevent further updates if the player has reached the end of the excerpt
        this.setInputText("");
      }
    } else {
      for (let i = 0; i < newText.length; i++) {
        if (raceText[i] === newText[i]) {
          correctText += newText[i];
        } else {
          break;
        }
      }
      wrongText = raceText.slice(correctText.length, newText.length);
      this.#errorCount = wrongText.length;
    }

    // Update typing progress on the screen
    const el = document.getElementById(textRootId);
    if (!el) return;
    el.innerHTML = `
        <span class="correct">${correctText}</span><span class="wrong">${wrongText}</span><span id="${untypedTextId}" class="untyped typing">${untypedText}</span>
    `;

    // Animate typing cursor
    if (this.#typingTimeout) clearTimeout(this.#typingTimeout);
    const untypedEl = document.getElementById(untypedTextId);
    if (!untypedEl) return;
    untypedEl.classList.remove("typing");
    this.#typingTimeout = setTimeout(() => {
      untypedEl.classList.add("typing");
    }, 1000);

    if (this.#errorCount > 5) {
      return this.setInputText(this.#typedText);
    }

    this.#typedText = newText;
    if (newText.length % 3 === 0 || newText.length === raceText.length) {
      // Emit new text event to backend
      this.#socket.emit(raceEvents.playerInput, {
        inputText: newText,
        raceId: this.data._id,
        userId: this.#user.data._id,
      });
    }

    this.#done = raceText === newText;
  };

  calculateWpm = () => {
    const minutes =
      (new Date().getTime() - new Date(this.data.startTime).getTime()) / 60000;

    const wpm = Math.round(
      (this.#typedText.length / 5 - this.#wrongTypedText.length) / minutes
    );
    this.updateWpm({ playerId: this.#user.data._id, wpm });
  };

  updateWpm = ({ playerId, wpm }) => {
    const el = document.getElementById(`wpm_${playerId}`);
    if (!el) return;
    el.innerHTML = wpm;
  };

  // Updates the player's car progress on screen
  updatePlayerProgress = ({ playerId, progress }) => {
    const car = document.getElementById(playerId);
    if (!car) return;
    const track = document.getElementById(`track_${playerId}`);
    if (!track) return;

    const trackLength = track.offsetWidth;
    const actualTrackLength = trackLength - 2 * car.offsetWidth;
    const actualTrackPercent = (actualTrackLength / trackLength) * 100;
    const actualPosition = scaleNumber(progress, 0, 100, 0, actualTrackPercent);

    car.style.left = `${actualPosition}%`;
  };

  handlePlayerProgressUpdate = (progressUpdate) => {
    const { userId, avgWpm, adjustedAvgWpm, progress, accuracy } =
      progressUpdate;

    // Update player's progress on screen
    // if (userId !== this.#user.data._id)
    this.updatePlayerProgress({ playerId: userId, progress });

    // Update the player's stats
    this.updateWpm({ playerId: userId, wpm: adjustedAvgWpm });
  };

  handleNewPlayer = (newPlayer) => {
    this.data.players.push(newPlayer);
    this.render();
  };
}

export default Race;
