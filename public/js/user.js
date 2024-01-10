import loader from "./loader.js";
import { userEvents } from "./events.js";

class User {
  data;
  #idStorageKey = "userId";
  #backToHomeFn;

  constructor(socket, backToHome) {
    // Get and add the userId to the auth object of the socket
    const userId = this.#getUserId();
    socket.auth = { userId };
    this.#backToHomeFn = backToHome;

    // Add event handlers to the socket
    socket.on(userEvents.session, this.#handleSession.bind(this));
  }

  // Gets the userId from session storage
  #getUserId() {
    return sessionStorage.getItem(this.#idStorageKey);
  }

  // Persists the userId in session storage
  #setUserId(userId) {
    sessionStorage.setItem(this.#idStorageKey, userId);
  }

  // Updates user's data and info displayed in the nav bar
  #update(user) {
    this.#setUserId(user._id);
    this.data = user;

    const el = document.getElementById("userInfo");
    if (!el) return;
    el.innerHTML = `
    <li><span class="name" title="Words Per Minute">WPM</span>: <span class="value">${user.avgwpm}</span></li>
    <li><span class="name" title="Number of games you've played">Games</span>: <span class="value">${user.gamesPlayed}</span></li>
    <li>
        <span class="name">
            <img src="public/images/profile.svg" alt="profile" />
        </span>
        <span class="value">${user.username}</span>
    </li>
  `;
  }

  // Handler for the "user:session" event
  #handleSession(user) {
    this.#update(user);
    loader.hide();
    this.#backToHomeFn();
  }
}

export default User;
