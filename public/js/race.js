import { raceEvents } from "./events.js";
import { scaleNumber } from "./helpers.js";
import loader from "./loader.js";

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
  #done = false;
  #countDownTimeout = null;
  #clearRaceFn;
  endPlayerIds = [];

  constructor({ user, raceData, backToHomeFn, socket, clearRaceFn }) {
    this.data = raceData;
    this.#user = user;
    this.#socket = socket;
    this.#backToHomeFn = () => {
      socket.emit(raceEvents.leaveRace, this.data._id);
      if (this.#countDownTimeout) clearInterval(this.#countDownTimeout);
      clearRaceFn();
      backToHomeFn();
    };
    this.#clearRaceFn = clearRaceFn;
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
          return `<span class="button leaveButton" id="${this._id}">Leave race</span>`;
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
                new Date().getTime() < new Date(raceData.startTime).getTime() ||
                new Date().getTime() >= new Date(raceData.endTime).getTime()
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
              <div class="section topTaskBar" >
                <span id="countDown">Starts in</span>

                <div class="actions" id="gameActions">${
                  eventElements.leaveRace.element
                }
                </div>
                
              </div>

              <div class="section trackRoot">
              ${this.data.players
                .sort((a, b) => {
                  if (a.userId === this.#user.data._id) {
                    return -1;
                  } else if (b.userId === this.#user.data._id) {
                    return 1;
                  } else {
                    return 0;
                  }
                })
                .map(
                  (player) =>
                    `
                    <div class="track" id="track_${player.userId}">
                        <span class="wpm"><span id="wpm_${
                          player.userId
                        }">0</span> <span class="label">WPM</span></span>
                        <span class="car" id="${player.userId}">
                          <span class="username">${
                            player.userId === this.#user.data._id
                              ? "you"
                              : player.username
                          }</span>

                          <span class="position-hidden" id="${
                            player.userId
                          }_position">2nd</span>
                          <img src="/public/images/${player.avatar}" alt="car"/>
                        </span>
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

  showSummary({ position, accuracy, wpm, finishedTimeStamp }) {
    const el = document.getElementById("race");
    if (!el) return;
    const diff =
      (finishedTimeStamp.getTime() - new Date(this.data.startTime).getTime()) /
      1000;

    const div = document.createElement("div");
    div.innerHTML = `
      <div class="summaryTitle">Race summary</div>
      ${[
        { name: "Position", value: this.#positionifyNum(position) },
        { name: "WPM", value: wpm + " WPM" },
        { name: "Accuracy", value: Math.floor(accuracy) + "%" },
        { name: "Time", value: this.#secondsToDurationStr(diff) },
      ]
        .map(
          (field) => `
          <p className="field">
            <span class="fieldName">${field.name}:</span>
            <span class="fieldValue"> ${field.value}</span>
          </p>`
        )
        .join(" ")}
    `;
    div.classList.add("summary");

    el.appendChild(div);
  }

  startCountDown = () => {
    this.#countDownTimeout = setInterval(() => {
      const now = new Date();
      const startTime = new Date(this.data.startTime);
      const diff = startTime.getTime() - now.getTime();
      const seconds = Math.ceil(diff / 1000);
      const el = document.getElementById("countDown");

      if (!el) return;
      if (seconds > -3) {
        el.innerHTML = seconds > 0 ? seconds : "GO!";
        if (seconds <= 0) el.classList.add("go");
      } else {
        const endTime = new Date(this.data.endTime);
        el.classList.remove("go");

        if (endTime.getTime() <= now.getTime()) {
          clearInterval(this.#countDownTimeout);
          this.#countDownTimeout = null;
          el.innerHTML = "Race ended";
          el.classList.add("ended");
        } else {
          const diff = (endTime.getTime() - now.getTime()) / 1000;
          el.innerHTML = this.#secondsToDurationStr(diff);
          if (diff < 10) el.classList.add("about-to-end");
        }
      }
    }, 1000);
  };

  updateGameActionsOnEnd = () => {
    const container = document.getElementById("gameActions");
    if (!container) return;
    const eventElements = {
      leaveRace: {
        _id: `leave_${this.data._id}`,
        events: [{ event: "onclick", handler: this.#backToHomeFn }],
        get element() {
          return `<span class="button button-outlined" id="${this._id}">Leave race</span>`;
        },
      },

      raceAgain: {
        _id: `raceAgain`,
        events: [
          {
            event: "onclick",
            handler: () => {
              if (this.#countDownTimeout) clearInterval(this.#countDownTimeout);
              this.#countDownTimeout = null;
              this.#clearRaceFn();
              loader.show();
              this.#socket.emit(raceEvents.joinRace, this.data.practice);
            },
          },
        ],
        get element() {
          return `<span class="button" id="${this._id}">Race again</span>`;
        },
      },
    };

    container.innerHTML = `
      ${eventElements.leaveRace.element}
      ${eventElements.raceAgain.element}
    `;

    for (const key in eventElements) {
      const obj = eventElements[key];
      const el = document.getElementById(obj._id);
      if (!el) continue;
      for (const ev of obj.events) {
        if (typeof ev.handler === "function")
          el[ev.event] = (e) => ev.handler(e);
      }
    }
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
  updatePlayerProgress = ({ playerId, progress, position }) => {
    const car = document.getElementById(playerId);
    if (!car) return;
    const track = document.getElementById(`track_${playerId}`);
    if (!track) return;

    const trackLength = track.offsetWidth;
    const actualTrackLength = trackLength - 2 * car.offsetWidth;
    const actualTrackPercent = (actualTrackLength / trackLength) * 100;
    const actualPosition = scaleNumber(progress, 0, 100, 0, actualTrackPercent);

    car.style.left = `${actualPosition}%`;

    if (position) {
      const posEl = document.getElementById(`${playerId}_position`);
      if (!posEl) return;
      posEl.classList.add("position");
      if (position === 1) posEl.classList.add("first");
      let posStr = this.#positionifyNum(position);
      posEl.innerHTML = posStr;

      this.endPlayerIds.push(playerId);
      if (this.endPlayerIds.length >= this.data.userIds.length) {
        this.data.endTime = new Date().toISOString();
      }
    }
  };

  handlePlayerProgressUpdate = (progressUpdate) => {
    const { userId, adjustedWpm, progress, lastInput, position, accuracy } =
      progressUpdate;

    // Update player's car progress on screen
    this.updatePlayerProgress({ playerId: userId, progress, position });

    // Update the player's stats
    this.updateWpm({ playerId: userId, wpm: adjustedWpm });

    // In the case of a reload/reconnection, update player's text progress
    if (userId === this.#user.data._id && lastInput !== this.#typedText) {
      this.setInputText(lastInput);
      this.handleTextChange(lastInput);
    }

    // When the player has completed the race, update the game actions
    // and show their summary
    if (userId === this.#user.data._id && position) {
      this.updateGameActionsOnEnd();
      this.showSummary({
        accuracy,
        position,
        wpm: adjustedWpm,
        finishedTimeStamp: new Date(),
      });
    }
  };

  handleNewPlayer = (newPlayer) => {
    this.data.players.push(newPlayer);
    this.render();
  };

  #positionifyNum(num) {
    let posStr = num.toString();
    if (num === 1) posStr += "st";
    if (num === 2) posStr += "nd";
    if (num === 3) posStr += "rd";
    if (num > 3) posStr += "th";

    return posStr;
  }

  #secondsToDurationStr(secs) {
    let minutes = Math.floor(secs / 60).toString();
    let seconds = Math.floor(secs % 60).toString();
    if (minutes.length < 2) minutes = "0" + minutes;
    if (seconds.length < 2) seconds = "0" + seconds;
    return `${minutes}:${seconds}`;
  }
}

export default Race;
