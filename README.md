# Cloud Inventory

Gambit frontend take-home.
Browse cloud resources, group them into applications, and view each application as a graph.

## Running it

Requires Node 20.19+ (or 22.12+).

```bash
npm install && npm run dev
```

Then open http://localhost:5173. Other scripts: `npm test`, `npm run build`, `npm run lint`.

## What I built

Stack: React 19, TypeScript (strict), Vite, Tailwind, shadcn/ui (on top of Radix) and React Flow. There's no backend, so everything is saved in localStorage.

**Resources**
- A table with search by name and filters for provider, environment and criticality. Each filter option shows how many results it would return. Sorting and pagination too.
- Add, edit and delete resources. To delete you have to type the resource's name. If the resource belongs to applications, it's removed from them as well, and the dialog lists which ones. Undo is available.
- Select rows to create a new application, or add them to an existing one. If some of the selected rows are on another page or hidden by a filter, the selection bar says so.

**Applications**
- Create, rename and delete applications. Removing a single resource from an application asks for confirmation first.
- A graph view built with React Flow: the application in the middle and its resources around it, ordered by criticality. You can drag nodes, the layout is saved per application, and Reset layout restores the default. Clicking a node highlights its row in the table below.

**General**
- Everything that defines the screen (page, filters, sort, which application is open) is in the URL, so refresh, back/forward and shared links all work.
- Toasts are colored by what happened: green when something is created or saved, red when something is removed, and neutral when nothing changed.
- Works on mobile.

## Decisions

- Applications only store resource ids, and a resource can belong to more than one application (for example `shared-ci-runner`).
- Domain state is a single reducer (`src/state/store.ts`) with unit tests. View state lives in the URL, and everything else is derived.
- The graph layout is a small function of my own (`src/lib/graphLayout.ts`). React Flow only renders it.
- I added `openIssues` to the `Resource` type, since the sample data uses it.
- There's no "create issue" button. In a product like this, issues come from scanning, not from users.
- Deleting a resource that's used by applications cascades with a warning instead of being blocked. Blocking would mean removing it from every application by hand first.

## Data

There are 12 seed resources, chosen so that three natural applications come out of them: payments on AWS, identity on GCP, and data on Azure. Criticality and open issues deliberately don't line up, and some filter combinations return nothing, so the empty state gets used.

## Structure

```
src/
  types.ts, data/     model and seed data
  lib/                pure logic: filtering, pagination, URL state, graph layout (with tests)
  state/              reducer, persistence, URL and selection hooks
  components/         resources/, applications/, layout/, common/
  components/ui/      shadcn/ui components (generated, a couple of small changes)
```

## What I'd do next

- **Backend and API.** Move resources, applications and layouts to a real service with a proper API, and do filtering and pagination on the server. Right now everything lives in one browser.
- **Real data and monitoring.** Pull resources from the cloud accounts (AWS / GCP / Azure) instead of entering them by hand, and monitor each resource: issue history, plus alerts when a new critical issue shows up or something changes.
- **End-to-end tests.** Playwright tests for the main flows: creating and editing applications, deleting with cascade, refresh and back/forward. Today the logic has unit tests and I checked the flows in the browser, but those checks aren't automated in the repo.
- **Auth and permissions**, so not everyone can edit or delete.
- **Accessibility for the graph:** keyboard navigation between nodes, and a list alternative for screen readers.
- **Dark mode.** The colors are already defined as tokens.

## Where I used AI

I used Claude throughout. I started in plan mode, going over the brief and planning the work together, and I made the architecture and product decisions: the stack, React Flow for the graph, the state model, the scope, and what to add beyond the brief. Claude wrote most of the code. I reviewed it, tested every flow in the browser, and sent back what needed fixing.

Some examples of what I caught along the way:
- Dragging a node made every node disappear until I let go. The nodes were rebuilt on every frame and lost the size React Flow had measured.
- A refresh sent you back to page 1 of Resources, even from inside an application. That's why the view state now lives in the URL.
- In the sidebar, the scroll container clipped the top border of the active application.
- The mobile navigation used a native select that was unreadable, so it was replaced.
- For deletes I asked for a typed confirmation. We went with typing the resource's name rather than a fixed phrase, so it can't turn into a reflex.
