import { scaleNumber } from "./helpers.js";

const textInputId = "thisisthetextinputid";
const textRootId = "thisisthetextrootid";
const untypedTextId = "untypedText";

class Practice {
  #data;
  #user;
  #backToHomeFn;
  #socket;
  #correctText = "";
  #typedText = "";
  #wrongTypedText = "";
  #typingTimeout = null;

  constructor({ user, raceData, backToHomeFn, socket }) {
    this.#data = raceData;
    this.#user = user;
    this.#backToHomeFn = backToHomeFn;
    this.#socket = socket;
  }

  render() {
    const root = document.getElementById("main");
    if (!root) return;

    const raceData = this.#data;

    const eventElements = {
      leaveRace: {
        _id: `leave_${this.#data._id}`,
        events: [{ event: "onclick", handler: () => this.#backToHomeFn() }],
        get element() {
          return `<span id="${this._id}">Leave game</span>`;
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
                <span class="button leaveButton" id="${
                  eventElements.leaveRace._id
                }">Quit race</span>
              </div>

              <div class="section trackRoot">
              ${[...this.#data.players, ...this.#data.players]
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
                        ${this.#data.excerpt.body}
                      </span>
                      
                  </div>

                  <div class="excerptInfo">
                    - ${this.#data.excerpt.author}${
      this.#data.excerpt.title ? `, ${this.#data.excerpt.title}` : ``
    }${this.#data.excerpt.year ? `. ${this.#data.excerpt.year}.` : `.`}
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
  }

  handleTextChange = (newText) => {
    let correct = "";
    let wrong = "";
    let actualWrong = "";
    const raceText = this.#data.excerpt.body;

    if (this.#correctText.length > newText.length) {
      newText = this.#correctText;
      const inputEl = document.getElementById(textInputId);
      if (inputEl) inputEl.value = newText;
    }

    if (this.#correctText.length === this.#data.excerpt.body.length) {
      const inputEl = document.getElementById(textInputId);
      if (inputEl) inputEl.value = this.#correctText;
      return;
    }

    for (let i = 0; i < newText.length; i++) {
      if (raceText[i] === newText[i]) {
        if (wrong.length) {
          wrong += raceText[i] || "";
          continue;
        }
        correct += raceText[i] || "";
      } else {
        wrong += raceText[i] || "";
        actualWrong += raceText[i] || "";
      }
    }

    if (correct.length > this.#correctText.length) this.#correctText = correct;

    const el = document.getElementById(textRootId);
    if (!el) return;
    el.innerHTML = `
        <span class="correct">${correct}</span><span class="wrong">${wrong}</span><span id="${untypedTextId}" class="untyped typing">${raceText.slice(
      correct.length + wrong.length,
      raceText.length
    )}</span>
    `;
    // Update car progress
    const progressPercentage =
      (this.#correctText.length / this.#data.excerpt.body.length) * 100;

    const car = document.getElementById(this.#user.data._id);
    if (!car) return;
    const track = document.getElementById(`track_${this.#user.data._id}`);
    if (!track) return;

    const trackLength = track.offsetWidth;
    const actualTrackLength = trackLength - 2 * car.offsetWidth;
    const actualTrackPercent = (actualTrackLength / trackLength) * 100;
    const actualPosition = scaleNumber(
      progressPercentage,
      0,
      100,
      0,
      actualTrackPercent
    );

    car.style.left = `${actualPosition}%`;

    // Animate typing cursor
    if (this.#typingTimeout) clearTimeout(this.#typingTimeout);
    const untypedEl = document.getElementById(untypedTextId);
    if (!untypedEl) return;
    untypedEl.classList.remove("typing");
    this.#typingTimeout = setTimeout(() => {
      untypedEl.classList.add("typing");
    }, 1000);

    this.#typedText = newText;
    this.#wrongTypedText = actualWrong;
    this.calculateWpm();
  };

  calculateWpm = () => {
    const minutes =
      (new Date().getTime() - new Date(this.#data.startTime).getTime()) / 60000;

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
}

export default Practice;
