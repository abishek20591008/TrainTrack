# TrainTrack – Finnish Train Timetables

A responsive train timetable web application that retrieves live railway timetable data from the Digitraffic REST API operated by Fintraffic. Users can search for a Finnish passenger station and view train departures and arrivals.

## Published application

**Live Application:** https://traintrack-e7e8.netlify.app

**GitHub Repository:** https://github.com/abishek20591008/TrainTrack
- **GitHub repository: https://github.com/abishek20591008/TrainTrack.git
- **Presentation video (minimum 5 minutes): https://drive.google.com/file/d/1xOa9Hn2vuGYLkW19SIkNbVDc_nC9jfzW/view?usp=sharing

## Project plan

1. Retrieve the list of passenger railway stations from the Digitraffic API.
2. Let the user search for a station and select it from a dropdown.
3. Make a new AJAX request with the Fetch API when a station is selected or refreshed.
4. Read the JSON response and select timetable rows for the chosen station.
5. Display departures, arrivals, train numbers, destinations, scheduled times, tracks and delay information when provided by the API.
6. Handle loading, empty and error states and style the application for desktop and mobile screens.

## Wireframe

```text
 ---------------------------------------------------------
| traintrack.                         FINNISH RAIL NETWORK |
 ---------------------------------------------------------
| YOUR JOURNEY STARTS HERE                                 |
| Every train.                                             |
| One timetable.                            [Train graphic]|
| Find upcoming departures and arrivals in Finland.        |
 ---------------------------------------------------------
| STATION LOOKUP                                           |
| Find a station [search........] Choose station [select]  |
|                                            [Refresh]     |
 ---------------------------------------------------------
| STATION BOARD                 Updated time                |
| Selected station: Helsinki (HKI)                         |
| ------------------------------------------------------- |
| DEPARTURES                       | ARRIVALS              |
| Time | Destination | Delay       | Time | Origin | Delay |
| ...                              | ...                   |
 ---------------------------------------------------------
| Data source and attribution                              |
 ---------------------------------------------------------
```

## Technologies

- HTML5
- CSS3 (responsive layout)
- Vanilla JavaScript (no external JavaScript libraries)
- Fetch API for AJAX / HTTP requests
- JSON response parsing
- DOM manipulation and dynamically registered event handlers

## API

Digitraffic railway API, operated by Fintraffic:

- Station metadata: `https://rata.digitraffic.fi/api/v1/metadata/stations`
- Live trains by station: `https://rata.digitraffic.fi/api/v1/live-trains/station/{stationShortCode}`

The application requests passenger stations and then retrieves the selected station's timetable. Data availability and actual-time/delay fields depend on what the railway system has reported. The API is public and does not require an API key.

## How to run locally

1. Download or clone this repository.
2. Open the project folder in Visual Studio Code.
3. Open `index.html` with the Live Server extension, or serve the folder using another local web server.
4. Make sure you have an internet connection because station and timetable data are fetched from the live API.

## Main functionality

- Loads Finnish passenger railway stations from the API.
- Filters stations by name or station code as the user types.
- Fetches timetable data when a station is selected.
- Displays departures and arrivals in separate lists.
- Shows scheduled time, actual time when available, train type/number, destination/origin, track and delay/cancellation status when available.
- Refresh button requests the latest available timetable data.
- Loading, empty and error messages inform the user about the request state.
- Responsive layout for smaller screens.

## Code comments and event handling

The JavaScript file contains comments describing the main functions and API/DOM logic. Event handlers are registered dynamically with `addEventListener()`; there are no inline HTML event attributes.

## Self-assessment

I implemented the application requirements using native JavaScript and the Fetch API. The application makes requests to a live REST API, processes JSON data, updates the DOM, and lets users search for and select a station to initiate a new request. I tested station loading, station selection, timetable rendering, refreshing and the responsive layout.

**What I learned:** I practised asynchronous JavaScript with `async`/`await`, HTTP requests, JSON data handling, DOM manipulation, event listeners and error handling.

**Known limitation:** Timetable results depend on the live data supplied by Digitraffic. Some trains may not have actual departure/arrival times or delay information yet.

## AI assistance statement

AI assistance was used to help plan the project structure, explain the Digitraffic API response, draft and review parts of the HTML, CSS and JavaScript, and prepare documentation. I tested the application and should be able to explain the code and make changes to it. This statement must be edited if it does not accurately describe the assistance used.

## Sources

- Fintraffic / Digitraffic. (n.d.). *Railway traffic API documentation*. https://www.digitraffic.fi/en/railway-traffic/
- Digitraffic. (n.d.). *Railway API Swagger documentation*. https://rata.digitraffic.fi/swagger/
- MDN Web Docs. (n.d.). *Using the Fetch API*. https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
- MDN Web Docs. (n.d.). *Document: DOM interfaces*. https://developer.mozilla.org/en-US/docs/Web/API/Document

Railway data is provided by Fintraffic / Digitraffic under the Creative Commons Attribution 4.0 International (CC BY 4.0) licence. Attribution: Data: Fintraffic / Digitraffic.
