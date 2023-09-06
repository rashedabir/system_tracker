document.addEventListener("DOMContentLoaded", () => {
  const trackingTable = document
    .getElementById("trackingTable")
    .getElementsByTagName("tbody")[0];

  const socket = new WebSocket("ws://localhost:3000"); // Connect to your WebSocket server

  socket.onmessage = (event) => {
    const trackingData = JSON.parse(event.data);

    // Clear the existing table rows
    while (trackingTable.firstChild) {
      trackingTable.removeChild(trackingTable.firstChild);
    }

    // Convert trackingData to an array of objects
    const appArray = Object.keys(trackingData).map((app) => {
      const rowData = trackingData[app];
      return {
        appName: app,
        startTime: rowData.startTime,
        endTime: rowData.endTime,
        count: rowData.count,
      };
    });

    // Sort the appArray in descending order by startTime
    appArray.sort((a, b) => {
      return b.startTime.localeCompare(a.startTime);
    });

    // Iterate through appArray and add rows to the table
    appArray.forEach((appData) => {
      const row = trackingTable.insertRow();

      // Application name
      const appNameCell = row.insertCell(0);
      appNameCell.textContent = appData.appName;

      // Start Time (in AM/PM format)
      const startTimeCell = row.insertCell(1);
      startTimeCell.textContent = appData.startTime
        ? new Date(appData.startTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : "-";

      // End Time (in AM/PM format)
      const endTimeCell = row.insertCell(2);
      endTimeCell.textContent = appData.endTime
        ? new Date(appData.endTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : "-";

      // Duration (in minutes)
      const durationCell = row.insertCell(3);
      durationCell.textContent =
        appData.endTime && appData.startTime
          ? calculateDuration(appData.startTime, appData.endTime)
          : "-";

      // Count
      const countCell = row.insertCell(4);
      countCell.textContent = appData.count;
    });
  };

  // Helper function to calculate duration in minutes
  function calculateDuration(startTime, endTime) {
    const startTimestamp = new Date(startTime).getTime();
    const endTimestamp = new Date(endTime).getTime();
    const durationInMinutes = (endTimestamp - startTimestamp) / (1000 * 60); // Convert milliseconds to minutes
    return durationInMinutes.toFixed(2);
  }
});
