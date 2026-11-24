// TrainTrack: loads Finnish railway stations and live timetable data from Digitraffic.
"use strict";

// API endpoints and a descriptive client name requested by the data provider.
const API_BASE = "https://rata.digitraffic.fi/api/v1";
const API_HEADERS = {
  "Digitraffic-User": "TrainTrack student project"
};

// Keep the station data in memory so searching does not require another API call.
let stations = [];
let selectedStation = null;

// Cache the page elements used by the application.
const stationSearch = document.querySelector("#station-search");
const stationSelect = document.querySelector("#station-select");
const refreshButton = document.querySelector("#refresh-button");
const stationHint = document.querySelector("#station-hint");
const selectedStationName = document.querySelector("#selected-station");
const stationCode = document.querySelector("#station-code");
const updatedTime = document.querySelector("#updated-time");
const statusMessage = document.querySelector("#status-message");
const departuresList = document.querySelector("#departures-list");
const arrivalsList = document.querySelector("#arrivals-list");
const departureCount = document.querySelector("#departure-count");
const arrivalCount = document.querySelector("#arrival-count");

// Register all event handlers dynamically with addEventListener.
stationSearch.addEventListener("input", handleStationSearch);
stationSelect.addEventListener("change", handleStationChange);
refreshButton.addEventListener("click", loadSelectedStationTimetable);

// Start by requesting the station list from the live API.
loadStations();

/**
 * Fetch passenger railway stations and populate the station dropdown.
 */
async function loadStations() {
  setStatus("Loading railway stations from Digitraffic…");
  stationSelect.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/metadata/stations`, {
      headers: API_HEADERS
    });

    if (!response.ok) {
      throw new Error(`Station request failed (${response.status}).`);
    }

    const data = await response.json();

    // Keep passenger stations that have a usable three-letter station code.
    stations = data
      .filter((station) => station.passengerTraffic && station.stationShortCode)
      .sort((a, b) => getStationName(a).localeCompare(getStationName(b), "fi"));

    if (stations.length === 0) {
      throw new Error("The API did not return any passenger stations.");
    }

    renderStationOptions(stations);
    stationSelect.disabled = false;
    stationHint.textContent = `${stations.length} passenger stations available. Search or choose a station.`;
    setStatus("Choose a station to view its upcoming departures and arrivals.");

    // Preselect Helsinki as a useful first example when it exists.
    const defaultStation = stations.find((station) => station.stationShortCode === "HKI");
    if (defaultStation) {
      stationSelect.value = defaultStation.stationShortCode;
      selectedStation = defaultStation;
      await loadSelectedStationTimetable();
    }
  } catch (error) {
    console.error("Could not load station list:", error);
    setStatus("Could not load stations. Please check your internet connection and try refreshing the page.", true);
    stationHint.textContent = "Station list could not be loaded.";
  }
}

/**
 * Return an English station name when available, otherwise use Finnish.
 */
function getStationName(station) {
  return station.stationName?.["en"] || station.stationName?.["fi"] ||
    station.stationName?.["sv"] || station.stationShortCode;
}

/**
 * Build dropdown options safely using DOM methods and textContent.
 */
function renderStationOptions(list) {
  stationSelect.replaceChildren();

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select a railway station";
  stationSelect.append(placeholder);

  list.forEach((station) => {
    const option = document.createElement("option");
    option.value = station.stationShortCode;
    option.textContent = `${getStationName(station)} (${station.stationShortCode})`;
    stationSelect.append(option);
  });
}

/**
 * Filter the dropdown while the user types a station name or station code.
 */
function handleStationSearch() {
  const query = stationSearch.value.trim().toLocaleLowerCase();
  const filteredStations = stations.filter((station) => {
    const name = getStationName(station).toLocaleLowerCase();
    const code = station.stationShortCode.toLocaleLowerCase();
    return name.includes(query) || code.includes(query);
  });

  renderStationOptions(filteredStations);
  stationSelect.disabled = filteredStations.length === 0;
  stationHint.textContent = filteredStations.length
    ? `${filteredStations.length} matching station${filteredStations.length === 1 ? "" : "s"}. Choose one from the list.`
    : "No matching station. Try another search.";

  // Keep the previous station selected only if it is still in the filtered list.
  if (selectedStation && filteredStations.some((station) =>
    station.stationShortCode === selectedStation.stationShortCode)) {
    stationSelect.value = selectedStation.stationShortCode;
  }
}

/**
 * Update the selected station when the dropdown changes.
 */
function handleStationChange() {
  const code = stationSelect.value;
  selectedStation = stations.find((station) => station.stationShortCode === code) || null;

  if (selectedStation) {
    loadSelectedStationTimetable();
  }
}

/**
 * Fetch the next arrivals and departures for the selected station.
 */
async function loadSelectedStationTimetable() {
  if (!selectedStation) {
    setStatus("Please choose a station first.", true);
    return;
  }

  const code = selectedStation.stationShortCode;
  const name = getStationName(selectedStation);

  selectedStationName.textContent = name;
  stationCode.textContent = `Station code: ${code}`;
  refreshButton.disabled = true;
  refreshButton.textContent = "Loading…";
  setStatus(`Loading timetable for ${name}…`);
  departuresList.innerHTML = '<p class="empty-state">Loading departures…</p>';
  arrivalsList.innerHTML = '<p class="empty-state">Loading arrivals…</p>';

  // Ask the API for a small number of upcoming trains in both directions.
  const query = new URLSearchParams({
    arrived_trains: "0",
    arriving_trains: "15",
    departed_trains: "0",
    departing_trains: "15",
    include_nonstopping: "false"
  });

  try {
    const response = await fetch(
      `${API_BASE}/live-trains/station/${encodeURIComponent(code)}?${query}`,
      { headers: API_HEADERS }
    );

    if (!response.ok) {
      throw new Error(`Timetable request failed (${response.status}).`);
    }

    const trains = await response.json();

    // Convert the train-level response into station-specific arrival/departure rows.
    const departures = [];
    const arrivals = [];

    trains.forEach((train) => {
      const rows = train.timeTableRows || [];
      const stationRows = rows
        .map((row, index) => ({ row, index }))
        .filter(({ row }) => row.stationShortCode === code);

      stationRows.forEach(({ row, index }) => {
        if (row.type === "DEPARTURE") {
          departures.push(createTrainDisplayItem(train, row, findNeighbourStation(rows, index, 1)));
        } else if (row.type === "ARRIVAL") {
          arrivals.push(createTrainDisplayItem(train, row, findNeighbourStation(rows, index, -1)));
        }
      });
    });

    // Sort by the scheduled time, then display the most relevant results.
    departures.sort((a, b) => new Date(a.time) - new Date(b.time));
    arrivals.sort((a, b) => new Date(a.time) - new Date(b.time));

    renderTrainList(departuresList, departures, "departure");
    renderTrainList(arrivalsList, arrivals, "arrival");
    departureCount.textContent = departures.length;
    arrivalCount.textContent = arrivals.length;

    updatedTime.textContent = `Updated ${new Date().toLocaleTimeString("en-FI", {
      hour: "2-digit", minute: "2-digit"
    })}`;

    if (departures.length === 0 && arrivals.length === 0) {
      setStatus("No timetable rows were returned for this station right now. Try another station or refresh later.");
    } else {
      setStatus(`Showing timetable information for ${name}. Times are local Finnish time.`, false, true);
    }
  } catch (error) {
    console.error("Could not load timetable:", error);
    departuresList.innerHTML = '<p class="empty-state">Departures are temporarily unavailable.</p>';
    arrivalsList.innerHTML = '<p class="empty-state">Arrivals are temporarily unavailable.</p>';
    departureCount.textContent = "0";
    arrivalCount.textContent = "0";
    setStatus("Could not load timetable data. Please try again in a moment.", true);
  } finally {
    refreshButton.disabled = false;
    refreshButton.innerHTML = '<span aria-hidden="true">↻</span> Refresh';
  }
}

/**
 * Find the next commercial station in the timetable rows.
 * Direction 1 means the next row; -1 means the previous row.
 */
function findNeighbourStation(rows, startIndex, direction) {
  for (let index = startIndex + direction; index >= 0 && index < rows.length; index += direction) {
    const row = rows[index];
    if (row.commercialStop && row.stationShortCode) {
      return row.stationShortCode;
    }
  }
  return direction === 1 ? "Final destination" : "Origin station";
}

/**
 * Prepare a small, consistent object for rendering one timetable item.
 */
function createTrainDisplayItem(train, row, neighbour) {
  const delay = Number(row.differenceInMinutes || 0);
  const cancelled = Boolean(train.cancelled);
  const actualTime = row.actualTime || row.liveEstimateTime || null;

  return {
    trainNumber: train.trainNumber,
    trainType: train.trainType || "Train",
    line: train.commuterLineID || "",
    time: row.scheduledTime,
    actualTime,
    track: row.commercialTrack || "",
    neighbour,
    delay,
    cancelled
  };
}

/**
 * Render timetable items using createElement and textContent to avoid unsafe HTML.
 */
function renderTrainList(container, items, direction) {
  container.replaceChildren();

  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No trains to display at the moment.";
    container.append(empty);
    return;
  }

  items.slice(0, 15).forEach((item) => {
    const row = document.createElement("article");
    row.className = "train-row";

    const time = document.createElement("div");
    time.className = "train-time";
    time.textContent = formatTime(item.actualTime || item.time);

    const scheduled = document.createElement("small");
    scheduled.textContent = item.actualTime ? `Scheduled ${formatTime(item.time)}` : "Scheduled time";
    time.append(scheduled);

    const destination = document.createElement("div");
    destination.className = "train-destination";

    const destinationName = document.createElement("strong");
    destinationName.textContent = direction === "departure"
      ? `Towards ${item.neighbour}`
      : `From ${item.neighbour}`;

    const meta = document.createElement("div");
    meta.className = "train-meta";
    const lineText = item.line ? ` · Line ${item.line}` : "";
    const trackText = item.track ? ` · Track ${item.track}` : "";
    meta.textContent = `${item.trainType} ${item.trainNumber}${lineText}${trackText}`;

    destination.append(destinationName, meta);

    const status = document.createElement("div");
    status.className = "train-status";

    if (item.cancelled) {
      status.classList.add("cancelled");
      status.textContent = "Cancelled";
    } else if (item.delay > 0) {
      status.classList.add("delayed");
      status.textContent = `+${item.delay} min`;
    } else if (item.delay < 0) {
      status.classList.add("on-time");
      status.textContent = `${item.delay} min`;
    } else {
      status.classList.add("on-time");
      status.textContent = "On time";
    }

    row.append(time, destination, status);
    container.append(row);
  });
}

/**
 * Format API timestamps as Finnish local clock time.
 */
function formatTime(timestamp) {
  if (!timestamp) return "--:--";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("en-FI", {
    timeZone: "Europe/Helsinki",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/**
 * Show a clear status message for loading, success, and error states.
 */
function setStatus(message, isError = false, isSuccess = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
  statusMessage.classList.toggle("success", isSuccess);
}
