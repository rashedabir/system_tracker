const { app, BrowserWindow } = require("electron");
const fs = require("fs");
const WebSocket = require("ws");
const path = require("path");
const puppeteer = require("puppeteer");
const { performance } = require("perf_hooks"); // Import the performance module

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

let trackingData = {};

const wss = new WebSocket.Server({ port: 3000 });

wss.on("connection", (socket) => {
  console.log("WebSocket connection established");
  sendTrackingData(socket);

  socket.on("close", () => {
    console.log("WebSocket connection closed");
  });
});

async function sendTrackingData(socket) {
  try {
    const psList = (await import("ps-list")).default;
    const processes = await psList();
    const userProcesses = processes.filter((process) => {
      const name = process.name.toLowerCase();
      return (
        !name.includes("system") &&
        !name.includes("library") &&
        !name.includes("trustd")
      );
    });
    const activeApps = userProcesses.map((process) => process.name);
    const apps = userProcesses.map((process) => process);

    // Calculate start time for newly opened applications
    activeApps.forEach((app) => {
      if (!trackingData[app]) {
        trackingData[app] = {
          count: 0,
          startTime: new Date(), // Record start time
          endTime: null, // Initialize end time
        };
      }
      trackingData[app].count += 1;
    });

    // Calculate end time for closed applications
    Object.keys(trackingData).forEach((app) => {
      if (!activeApps.includes(app) && trackingData[app].endTime === null) {
        trackingData[app].endTime = new Date(); // Record end time
      }
    });

    // Send tracking data to connected clients via WebSocket
    socket.send(JSON.stringify(trackingData));

    // Save tracking data to a JSON file.
    fs.writeFileSync(
      "trackingData.json",
      JSON.stringify(trackingData, null, 2)
    );
  } catch (error) {
    console.error("Error tracking applications:", error);
  }
}

setInterval(() => {
  wss.clients.forEach((client) => {
    sendTrackingData(client);
  });
}, 1000);
