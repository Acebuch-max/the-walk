const playBtn = document.getElementById("playAudio");
const organicBtn = document.getElementById("modeOrganic");
const fluidBtn = document.getElementById("modeFluid");
const statusNode = document.getElementById("status");

function updateStatus(text) {
  if (statusNode) {
    statusNode.innerHTML = text;
  }
}

if (playBtn) {
  playBtn.addEventListener("click", async () => {
    await startExperience();
  });
}

if (organicBtn) {
  organicBtn.addEventListener("click", () => {
    mode = "organic";
    organicBtn.classList.add("is-active");
    if (fluidBtn) fluidBtn.classList.remove("is-active");
    updateStatus("Modo organic.");
  });
}

if (fluidBtn) {
  fluidBtn.addEventListener("click", () => {
    mode = "fluid";
    fluidBtn.classList.add("is-active");
    if (organicBtn) organicBtn.classList.remove("is-active");
    updateStatus("Modo fluid.");
  });
}
const exitButton = document.getElementById("exitButton");
const exitPanel = document.getElementById("exitPanel");
const exitBackdrop = document.getElementById("exitBackdrop");
const closeExit = document.getElementById("closeExit");

function openExit() {
  exitPanel.hidden = false;
}

function closeExitPanel() {
  exitPanel.hidden = true;
}

if (exitButton) {
  exitButton.onclick = openExit;
}

if (exitBackdrop) {
  exitBackdrop.onclick = closeExitPanel;
}

if (closeExit) {
  closeExit.onclick = closeExitPanel;
}

window.addEventListener("keydown", (e) => {

  if (e.key === "Escape") {

    if (!exitPanel.hidden) {
      closeExitPanel();
    } else {
      openExit();
    }

  }

});