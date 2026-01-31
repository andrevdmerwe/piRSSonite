# piRSSonite: Project Details for Reconstruction

This document outlines the architecture, requirements, and technology stack for the piRSSonite RSS reader. It is intended to be a comprehensive guide for another AI development platform to reconstruct the application.

## 1. Project Overview

piRSSonite is a self-hosted, web-based RSS aggregator. It allows users to add, organize, and read articles from various RSS feeds. The application is designed as a monolithic Next.js application, featuring a React-based frontend and a backend powered by Next.js API Routes. It uses a SQLite database via the Prisma ORM for data persistence and is containerized with Docker for easy deployment.

## 2. Core Features (Requirements)

- **Feed Management**:
    - Add new RSS/Atom feeds by URL.
    - Delete existing feeds.
    - Organize feeds into user-defined folders.
- **Article Viewing**:
    - View a unified list of all articles from all feeds, sorted chronologically.
    - Filter articles by a specific folder or feed.
    - View article content within the application.
- **State Management**:
    - Mark individual entries as "read" or "unread".
    - Star important entries for later reference.
    - "Clear" (mark as read) all entries for a specific feed.
- **Automatic Feed Refreshing**:
    - Periodically poll feeds for new content in the background.
    - Employ an "intelligent refresh" strategy with exponential backoff for feeds that are slow or return errors.
    - Support for the WebSub (formerly PubSubHubbub) protocol for real-time, push-based updates, reducing the reliance on polling.
- **Data Portability**:
    - Export the user's list of feeds to an OPML file.
    - Import feeds from an existing OPML file.
- **User Interface**:
    - A three-pane layout: Sidebar for folders/feeds, a middle column for the article list, and a main pane for article content (inferred from component names).
    - **Theme System**:
        - Built-in Light and Dark themes.
        - Custom theme creation and persistence.
        - Advanced color customization with granular overrides and individual resets.
    - **Typography**:
        - Granular font control for headers, folders, feeds, and article content.

## 3. Technology Stack

- **Framework**: Next.js (with App Router)
- **Language**: TypeScript
- **Database**: SQLite
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Frontend**: React
- **Deployment**: Docker

## 4. Architecture

The application is a monolith built with Next.js, colocating the UI and the API.

### 4.1. Database Schema

The database is managed by Prisma and defined in `prisma/schema.prisma`. It consists of four main models:

- **`Folder`**: Represents a user-created folder to organize feeds.
    - `id`: Int (Primary Key)
    - `name`: String (Unique)
    - `order`: Int (for ordering folders)
    - `feeds`: Relation to `Feed` model

- **`Feed`**: Represents a single RSS/Atom feed.
    - `id`: Int (Primary Key)
    - `url`: String (Unique)
    - `title`: String
    - `folderId`: Int (Foreign Key to `Folder`)
    - `lastFetched`: DateTime
    - `nextCheckAt`: DateTime (for intelligent refresh scheduling)
    - `failureCount`: Int (tracks consecutive fetch failures)
    - `order`: Int (for ordering feeds within a folder)
    - `entries`: Relation to `Entry` model

- **`Entry`**: Represents a single article or item from a feed.
    - `id`: Int (Primary Key)
    - `url`: String (Unique per feed)
    - `title`: String
    - `content`: String (HTML content of the article)
    - `published`: DateTime
    - `feedId`: Int (Foreign Key to `Feed`)
    - `isRead`: Boolean
    - `isStarred`: Boolean

- **`Config`**: A key-value store for application settings.
    - `key`: String (Primary Key)
    - `value`: String

### 4.2. Backend (API Routes)

The backend is implemented as a series of API Routes within the `app/api/` directory.

- **`POST /api/refresh`**: The core endpoint for the polling mechanism. It identifies feeds due for a check (`nextCheckAt` is in the past), fetches their content, parses it, and adds new entries to the database.
- **`GET, POST /api/websub/callback`**: Handles the WebSub protocol.
    - `GET`: Responds to challenge requests from WebSub hubs to verify subscriptions.
    - `POST`: Receives content notifications from the hub for real-time updates.
- **`GET, POST /api/feeds`**: Manages feeds. `GET` lists all feeds, `POST` adds a new feed.
- **`DELETE /api/feeds/[id]`**: Deletes a specific feed.
- **`GET, POST /api/folders`**: Manages folders. `GET` lists all folders, `POST` creates a new folder.
- **`DELETE /api/folders/[id]`**: Deletes a specific folder.
- **`PUT /api/entries/[id]`**: Updates an entry's status (e.g., `isRead`, `isStarred`).
- **`POST /api/entries/clear`**: Marks all entries for a given feed as read.
- **`GET /api/opml/export`**: Generates and returns an OPML file of the user's feeds.
- **`POST /api/opml/upload`**: Parses an uploaded OPML file and imports the feeds.

### 4.3. Frontend (React Components)

The UI is built with React and located primarily in the `components/` directory.

- **`Sidebar.tsx`**: Renders the list of folders and feeds, allowing for navigation.
- **`EntryFeed.tsx`**: Displays the list of articles for the selected feed/folder.
- **`ArticleCard.tsx`**: Renders a single article in the `EntryFeed`.
- **`AutoRefresher.tsx`**: A client-side component that triggers the backend refresh process every 15 minutes.
- **`ManageFeedsModal.tsx`**: A modal dialog for adding, deleting, and managing feeds and folders.
- **`SettingsModal.tsx`**: A modal for user settings like theme and font selection.
- **`CommandBar.tsx`**: Provides a command palette for quick actions (e.g., add feed, refresh).

### 4.4. Deployment (Docker)

The application is configured for deployment using Docker.

- **`Dockerfile`**: A multi-stage build process that:
    1. Installs dependencies.
    2. Runs `prisma generate`.
    3. Builds the Next.js application (`npm run build`).
    4. Creates a minimal production image with only the necessary files.
- **`docker-compose.yml`**: Defines the service, maps the container port, and sets up a volume (`pirssonite-data`) to persist the SQLite database file outside the container.
- **`start.sh`**: The container's entrypoint script. It is crucial as it runs `prisma migrate deploy` to apply any pending database migrations before starting the Next.js server, ensuring the database is always up-to-date.

## 5. Key Systems Deep Dive

### Feed Refreshing Mechanism

The feed refreshing system is a hybrid pull/push model, designed for efficiency.

1.  **Client-Side Trigger**: The `AutoRefresher.tsx` component, present in the main UI, uses a `setInterval` to send a `POST` request to `/api/refresh` every 15 minutes. This offloads the cron/scheduling responsibility from the server, running only when a user has the app open.

2.  **Intelligent Polling**: The `/api/refresh` endpoint does not fetch every feed on every call. It queries the database for feeds where `nextCheckAt` is in the past. This timestamp is updated after every fetch attempt.

3.  **Exponential Backoff**: The logic for calculating the next check time is in `lib/utils/websubUtils.ts`. If a feed fetch fails, the `failureCount` is incremented, and the delay until the next check increases exponentially. This prevents the server from wasting resources on broken or temporarily unavailable feeds. If a fetch succeeds, the `failureCount` is reset.

4.  **WebSub Integration**: For feeds that support it, the application subscribes to a WebSub hub. The hub then sends a `POST` request to `/api/websub/callback` with new content as soon as it's published. This provides near-instant updates and is the preferred method, with the polling mechanism serving as a fallback.

## 6. Step-by-Step Build Plan

1.  **Project Initialization**:
    - Set up a new Next.js project with TypeScript and Tailwind CSS.
    - Initialize a `package.json` file and install the core dependencies: `next`, `react`, `react-dom`, `typescript`, `@prisma/client`, `better-sqlite3`.
    - Install dev dependencies: `prisma`, `tailwindcss`, `postcss`, `autoprefixer`, etc.

2.  **Database Setup**:
    - Initialize Prisma (`npx prisma init --datasource-provider sqlite`).
    - Copy the data models (`Folder`, `Feed`, `Entry`, `Config`) into `prisma/schema.prisma`.
    - Run the initial migration to create the database and tables: `npx prisma migrate dev --name init`.

3.  **Backend API Development**:
    - Create the folder structure under `app/api/`.
    - Implement each API route as defined in the "Backend" section above, starting with core feed and folder management.
    - Implement the logic for the `/api/refresh` endpoint.
    - Implement the `calculateNextCheckTime` utility function.
    - Implement the WebSub callback endpoint.

4.  **Frontend UI Development**:
    - Create the main page layout in `app/page.tsx` and `app/layout.tsx`.
    - Build the individual React components (`Sidebar`, `EntryFeed`, `ArticleCard`, etc.) in the `components/` directory.
    - Implement the React Contexts (`ThemeContext`, `FontContext`, etc.) for managing global UI state.
    - Integrate the frontend components with the backend API endpoints to fetch and display data.

5.  **Functionality Implementation**:
    - Add state management for marking entries as read/starred.
    - Build the OPML import/export functionality.
    - Implement the client-side `AutoRefresher` component.

6.  **Containerization**:
    - Write the `Dockerfile` for the multi-stage build.
    - Create the `start.sh` script to handle production database migrations.
    - Write the `docker-compose.yml` file to define the service and data volume.

7.  **Finalization**:
    - Add utility scripts for debugging or maintenance as needed.
    - Write a `README.md` with setup and deployment instructions.
