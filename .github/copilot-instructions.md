# Code guidance

Project name: FreeVibes
Description: A web dashboard for RSS/Notes inspired by the old NetVibes.

## Features
- RSS feed reader widget
- Sticky note widget
- Dark mode

## Tech stack
- Frontend: TypeScript and v3 Lit web components, no CSS framework
- No backend, loads data from JSON file hosted on GitHub
- Uses localStorage for persistent settings with a button to send updates to GitHub through a PR (updates the JSON file)
- Deploys to GitHub Pages
- Uses GitHub Actions for CI/CD
- Use Vite as the build tool
- Use latest CSS features like CSS variables and custom properties, container queries, and nesting selectors. The theme is fully customizable through CSS variables. Use the prefix `--fv-` for all custom properties.

## Components
- `app.ts`: Main app component
  * contains a basic navigation bar at the top, and the dashboard content below
- `dashboard.ts`: Dashboard component, containing the main layout and widget management
  * contains a grid layout for widgets. 3 columns by default, but can be adjusted in settings.
- `rss.ts`: RSS feed widget component.
  * show the title of the last 10 items from the feed, can be scrolled to show more.
  * clicking on an item opens it in a new browser tab.
- `notes.ts`: Sticky notes widget component
  * simple text notes thaat can be edited when clicking on them. HTTP links are clickable and open in a new tab.

## Code structure
- `src/`: Source code directory
  * `components/`: Contains all Lit components
  * `services/`: Shared services logic, such as fetching data and managing localStorage
  * `app.ts`: Main application entry point
- `public/`: Public assets directory, also contains the `data.json` file with initial data for the dashboard

## Design choices
- Flat design with a focus on simplicity and usability
- Shadows can be used for depth, but should be subtle

## Coding standards
- Keep the code simple and maintainable
- Use plain typescript functions rather than classes where possible
- Use descriptive variable and function names
- Do not add comments unless absolutely necessary, the code should be self-explanatory
- Never use `null`, always use `undefined` for optional values

## User interactions
- Ask questions if you are unsure about the implementation details, design choices, or need clarification on the requirements
- Always answer in the same language as the question, but use english for the generated content like code, comments or docs
