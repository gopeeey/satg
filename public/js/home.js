import loader from "./loader.js";
import { raceEvents } from "./events.js";

export const getRenderer = (socket) => () => {
  const root = document.getElementById("main");
  if (!root) return;

  // Main action buttons on the home screen
  const buttons = [
    {
      title: "Race",
      image: "race",
      id: "join_race",
      action: () => socket.emit(raceEvents.joinRace, false),
    },
    {
      title: "Practise",
      image: "track",
      id: "practise",
      action: () => socket.emit(raceEvents.joinRace, true),
    },
    {
      title: "Create room",
      image: "group",
      id: "create_room",
      action: () => console.log("Coming soon!"),
    },
  ];

  // Add the buttons to root element
  root.innerHTML = `
        <div id="home">
            ${buttons
              .map(
                (button) => `<div class="option" id="${button.id}">
                    <img src="public/images/${button.image}.svg" alt="${button.image}-icon" />
                    ${button.title}
                </div>`
              )
              .join(" ")}
        </div>
    `;

  for (const button of buttons) {
    const el = document.getElementById(button.id);
    if (!el) continue;
    el.onclick = () => {
      loader.show();
      button.action();
    };
  }
};

export default {
  getRenderer,
};
