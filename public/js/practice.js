import { raceEvents } from "./events.js";
import { scaleNumber } from "./helpers.js";
import loader from "./loader.js";

const textInputId = "thisisthetextinputid";
const textRootId = "thisisthetextrootid";
const untypedTextId = "untypedText";

class Practice {
  isPractice = true;
  #user;
  #backToHomeFn;
  #socket;
  #typedText = "";
  #typingTimeout = null;
  #done = false;
  #countDownTimeout = null;
  #clearRaceFn;
  #startTime = new Date(new Date().getTime() + 10000);
  #excerpt = "";
  #avatar = "";
  #progress = 0;
  #accuracy = 100;
  #wpm = 0;
  #correctEntries = 0;
  #totalEntries = 0;
  #wordLength = 5;

  constructor({ user, excerpt, avatar, backToHomeFn, socket, clearRaceFn }) {
    this.#excerpt = excerpt;
    this.#avatar = avatar;
    this.#user = user;
    this.#socket = socket;
    this.#backToHomeFn = () => {
      if (this.#countDownTimeout) clearInterval(this.#countDownTimeout);
      clearRaceFn();
      backToHomeFn();
    };
    this.#clearRaceFn = clearRaceFn;
  }

  render() {
    const root = document.getElementById("main");
    if (!root) return;

    if (this.#countDownTimeout) clearInterval(this.#countDownTimeout);

    const startTime = this.#startTime;

    const eventElements = {
      leaveRace: {
        _id: `leave_practice`,
        events: [{ event: "onclick", handler: this.#backToHomeFn }],
        get element() {
          return `<span class="button leaveButton" id="${this._id}">Back to home</span>`;
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
                e.target.focus({ preventScroll: true });
              }, 10);
            },
          },
          {
            event: "oninput",
            handler: (e) => this.handleTextChange(e.target.value),
          },
          {
            event: "onclick",
            handler: (e) => {
              const val = e.target.value;
              this.setInputText("");
              setTimeout(() => {
                this.setInputText(val);
              }, 100);
            },
          },
        ],
        load() {
          setTimeout(() => {
            const el = document.getElementById(this._id);
            if (!el) return;
            el.addEventListener("keydown", (e) => {
              if (new Date().getTime() < startTime.getTime()) {
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
            el.focus({ preventScroll: true });
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
                <div class="track" id="track_${this.#user.data._id}">
                        <span class="wpm"><span id="wpm_${
                          this.#user.data._id
                        }">0</span> <span class="label">WPM</span></span>
                        <span class="car" id="${this.#user.data._id}">
                          <img src="/public/images/${this.#avatar}" alt="car"/>
                        </span>
                </div>
              </div>

              <div class="section textRoot">
                

                <div class="textBox">
                  <div class="display" id="${textRootId}">
                      <span class="correct">
                      </span>

                      <span class="wrong">
                      </span>

                      <span class="untyped typing" id="${untypedTextId}">
                        ${this.#excerpt.body}
                      </span>
                      
                  </div>

                  <div class="excerptInfo">
                    - ${this.#excerpt.author}${
      this.#excerpt.title ? `, ${this.#excerpt.title}` : ``
    }${this.#excerpt.year ? `. ${this.#excerpt.year}.` : `.`}
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

  showSummary({ accuracy, wpm, finishedTimeStamp }) {
    const el = document.getElementById("race");
    if (!el) return;
    const diff =
      (finishedTimeStamp.getTime() - new Date(this.#startTime).getTime()) /
      1000;

    const div = document.createElement("div");
    div.innerHTML = `
      <div class="summaryTitle">Race summary</div>
      ${[
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
      const startTime = new Date(this.#startTime);
      const diff = startTime.getTime() - now.getTime();
      const seconds = Math.ceil(diff / 1000);
      const el = document.getElementById("countDown");

      if (!el) return;
      if (seconds > -3) {
        el.innerHTML = seconds > 0 ? seconds : "GO!";
        if (seconds <= 0) el.classList.add("go");
      } else {
        el.classList.remove("go");

        if (this.#done) {
          if (this.#countDownTimeout) clearInterval(this.#countDownTimeout);
          this.#countDownTimeout = null;
          el.innerHTML = "Finished!";
        } else {
          const diff = (now.getTime() - startTime.getTime()) / 1000;
          el.innerHTML = this.#secondsToDurationStr(diff);
        }
      }
    }, 1000);
  };

  updateGameActionsOnEnd = () => {
    const container = document.getElementById("gameActions");
    if (!container) return;
    const eventElements = {
      leaveRace: {
        _id: `leave_practice`,
        events: [{ event: "onclick", handler: this.#backToHomeFn }],
        get element() {
          return `<span class="button button-outlined" id="${this._id}">Back to home</span>`;
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
              this.#socket.emit(raceEvents.joinRace, true);
            },
          },
        ],
        get element() {
          return `<span class="button" id="${this._id}">Practice again</span>`;
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
    const raceText = this.#excerpt.body;
    if (this.#done || newText.length > raceText.length) return;
    let correctText = "";
    let wrongText = "";
    let untypedText = raceText.slice(newText.length, raceText.length);
    let errorCount = 0;

    if (raceText.startsWith(newText)) {
      correctText = newText;
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
      errorCount = wrongText.length;
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

    if (errorCount > 5) {
      return this.setInputText(this.#typedText);
    }

    // Calculate total entries and correct entries
    const match = newText.match(
      this.#typedText.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&")
    );
    if (match) {
      const newCharsStart = this.#typedText.length;
      const newChars = newText.slice(newCharsStart, newText.length);
      this.#totalEntries += newChars.length;
      let newCorrectChars = correctText.slice(newCharsStart, newText.length);
      this.#correctEntries += newCorrectChars.length;
    }
    this.#typedText = newText;

    // Calculate accuracy
    this.#accuracy = (this.#correctEntries / this.#totalEntries) * 100;

    // Calculate the player's wpm
    const minutes = (new Date().getTime() - this.#startTime.getTime()) / 60000;
    this.#wpm = Math.round(correctText.length / this.#wordLength / minutes);
    this.updateWpm(this.#wpm);

    // Calculate the player's progress percentage
    this.#progress = Math.max(
      this.#progress,
      (correctText.length / this.#excerpt.body.length) * 100
    );
    this.updatePlayerProgress(this.#progress);

    this.#done = raceText === newText;

    if (this.#done) {
      this.updateGameActionsOnEnd();
      this.showSummary({
        accuracy: this.#accuracy,
        wpm: this.#wpm,
        finishedTimeStamp: new Date(),
      });
    }
  };

  updateWpm = (wpm) => {
    const el = document.getElementById(`wpm_${this.#user.data._id}`);
    if (!el) return;
    el.innerHTML = wpm;
  };

  // Updates the player's car progress on screen
  updatePlayerProgress = (progress) => {
    const car = document.getElementById(this.#user.data._id);
    if (!car) return;
    const track = document.getElementById(`track_${this.#user.data._id}`);
    if (!track) return;

    const trackLength = track.offsetWidth;
    const actualTrackLength = trackLength - 2 * car.offsetWidth;
    const actualTrackPercent = (actualTrackLength / trackLength) * 100;
    const actualPosition = scaleNumber(progress, 0, 100, 0, actualTrackPercent);

    car.style.left = `${actualPosition}%`;
  };

  #secondsToDurationStr(secs) {
    let minutes = Math.floor(secs / 60).toString();
    let seconds = Math.floor(secs % 60).toString();
    if (minutes.length < 2) minutes = "0" + minutes;
    if (seconds.length < 2) seconds = "0" + seconds;
    return `${minutes}:${seconds}`;
  }
}

export default Practice;
