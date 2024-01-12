import home from "./home.js";
import * as loader from "./loader.js";
import RaceManager from "./race_manager.js";
const socket = io("", { autoConnect: false });

const homeRenderer = home.getRenderer(socket);

const init = () => {
  loader.show();
  new RaceManager({
    socket,
    backToHome: homeRenderer,
  });
  socket.connect();
};

init();

const assetAttributions = [
  `<a
    href="https://www.flaticon.com/free-icons/arrow-key"
    title="arrow-key icons"
  >
    Arrow-key icons created by Freepik - Flaticon
  </a>`,
  `<a href="https://www.flaticon.com/free-icons/arrow-key" title="arrow-key icons">Arrow-key icons created by Freepik - Flaticon</a>`,
  `<a href="https://www.flaticon.com/free-icons/keyboard" title="keyboard icons">Keyboard icons created by Freepik - Flaticon</a>`,
  `<a href="https://www.flaticon.com/free-icons/shift" title="shift icons">Shift icons created by Freepik - Flaticon</a>`,
  `<a href="https://www.flaticon.com/free-icons/enter" title="enter icons">Enter icons created by Lizel Arina - Flaticon</a>`,
  `<a href="https://www.flaticon.com/free-icons/keyboard" title="keyboard icons">Keyboard icons created by Bamicon - Flaticon</a>`,
  `<a href="https://www.flaticon.com/free-icons/wireless-keyboard" title="wireless keyboard icons">Wireless keyboard icons created by Nuricon - Flaticon</a>`,
  `<a href="https://www.flaticon.com/free-icons/delete" title="delete icons">Delete icons created by Freepik - Flaticon</a>`,
  `<a href="https://www.flaticon.com/free-icons/function" title="function icons">Function icons created by Freepik - Flaticon</a>`,
  `<a href="https://www.flaticon.com/free-icons/tab" title="tab icons">Tab icons created by Freepik - Flaticon</a>`,
  `<a href="https://www.flaticon.com/free-icons/enter" title="enter icons">Enter icons created by Freepik - Flaticon</a>`,
  `<a href="https://www.flaticon.com/free-icons/shift" title="shift icons">Shift icons created by Freepik - Flaticon</a>`,
  `<a href="https://www.flaticon.com/free-icons/ctrl" title="ctrl icons">Ctrl icons created by Freepik - Flaticon</a>`,
  `<a href="https://www.flaticon.com/free-icons/car" title="car icons">Car icons created by Freepik - Flaticon</a>`,
  `<a href="https://www.flaticon.com/free-icons/race-track" title="race track icons">Race track icons created by Freepik - Flaticon</a>`,
  `<a href="https://www.flaticon.com/free-icons/user" title="user icons">User icons created by Freepik - Flaticon</a>`,
  `<a href="https://www.flaticon.com/free-icons/cars" title="cars icons">Cars icons created by BZZRINCANTATION - Flaticon</a>`,
  `<a href="https://www.flaticon.com/free-icons/truck" title="truck icons">Truck icons created by Freepik - Flaticon</a>`,
];
