const haveEvents = "ongamepadconnected" in window;
const controllers = {};

function connecthandler(e) {
  addgamepad(e.gamepad);
}

function addgamepad(gamepad) {
  controllers[gamepad.index] = gamepad;

  const d = document.createElement("div");
  d.setAttribute("id", `controller${gamepad.index}`);

  const t = document.createElement("h1");
  t.textContent = `gamepad: ${gamepad.id}`;
  d.appendChild(t);

  const b = document.createElement("ul");
  b.className = "buttons";
  gamepad.buttons.forEach((button, i) => {
    const e = document.createElement("li");
    e.className = "button";
    e.textContent = `Button ${i}`;
    b.appendChild(e);
  });

  d.appendChild(b);

  const a = document.createElement("div");
  a.className = "axes";

  gamepad.axes.forEach((axis, i) => {
    const axisContainer = document.createElement("div");
    axisContainer.className = "axis-container";
  
    const axisValueDisplay = document.createElement("span");
    axisValueDisplay.className = "axis-value";
    axisValueDisplay.textContent = `Axis ${i}: ${axis.toFixed(2)}`;
  
    const p = document.createElement("progress");
    p.className = "axis";
    p.setAttribute("max", "2");
    p.setAttribute("value", "1");
  
    axisContainer.appendChild(axisValueDisplay);
    axisContainer.appendChild(p);
    a.appendChild(axisContainer);
  });

  d.appendChild(a);

  // See https://github.com/luser/gamepadtest/blob/master/index.html
  const start = document.getElementById("start");
  if (start) {
    start.style.display = "none";
  }

  document.body.appendChild(d);
  requestAnimationFrame(updateStatus);
}

function disconnecthandler(e) {
  removegamepad(e.gamepad);
}

function removegamepad(gamepad) {
  const d = document.getElementById(`controller${gamepad.index}`);
  document.body.removeChild(d);
  delete controllers[gamepad.index];
}

function updateStatus() {
  if (!haveEvents) {
    scangamepads();
  }

  Object.entries(controllers).forEach(([index, controller]) => {
    const d = document.getElementById(`controller${index}`);
    if (!d) return; // Skip if the controller element is not found
    const buttons = d.getElementsByClassName("button");

    controller.buttons.forEach((button, i) => {
      const b = buttons[i];
      let pressed = button === 1.0;
      let val = button;

      if (typeof button === "object") {
        pressed = val.pressed;
        val = val.value;
      }

      const buttonName = buttonNames[i] || `Button ${i}`;
      const pct = `${Math.round(val * 100)}%`;
      b.style.backgroundSize = `${pct} ${pct}`;
      b.textContent = pressed ? `${buttonName} [PRESSED]` : buttonName;
      b.style.color = pressed ? "#42f593" : "#2e2d33";
      b.className = pressed ? "button pressed" : "button";
    });




    const axesContainers = d.getElementsByClassName("axis-container");
    controller.axes.forEach((axis, i) => {
      if (axesContainers[i]) {
        const axisValueDisplay = axesContainers[i].getElementsByClassName("axis-value")[0];
        const axisProgressBar = axesContainers[i].getElementsByClassName("axis")[0];

        const axisValue = axis.toFixed(2); // Convert to a fixed decimal point for readability

        if (axisValueDisplay) {
          axisValueDisplay.textContent = `Axis ${i}: ${axisValue}`;
        }

        if (axisProgressBar) {
          axisProgressBar.value = axis + 1;
        }
      }
    });
    


    
  });

  requestAnimationFrame(updateStatus);
}

function scangamepads() {
  const gamepads = navigator.getGamepads();
  document.querySelector("#noDevices").style.display = gamepads.filter(Boolean)
    .length
    ? "none"
    : "block";
  for (const gamepad of gamepads) {
    if (gamepad) {
      // Can be null if disconnected during the session
      if (gamepad.index in controllers) {
        controllers[gamepad.index] = gamepad;
      } else {
        addgamepad(gamepad);
      }
    }
  }
}

window.addEventListener("gamepadconnected", connecthandler);
window.addEventListener("gamepaddisconnected", disconnecthandler);

if (!haveEvents) {
  setInterval(scangamepads, 500);
}



// Mapping of button indices to names
const buttonNames = {
  0: 'a',
  1: 'b',
  2: 'x',
  3: 'y',
  4: 'l1',
  5: 'r1',
  6: 'l2',
  7: 'r2',
  8: 'back',
  9: 'start',
  10: 'lstick',
  11: 'rstick',
  12: 'up',
  13: 'down',
  14: 'left',
  15: 'right'
};

