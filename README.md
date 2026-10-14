# Student Management

An Angular application for managing students, courses, and course enrollments.

## Technologies

- Angular 20
- TypeScript
- Reactive Forms
- RxJS
- JSON Server
- SCSS

## Requirements

Node.js and npm must be installed.

The project was developed using Node.js 24.14.0.

## Setup

Clone the repository and open a terminal inside the project folder.

Install dependencies:

```bash
npm ci
```

## Run the application

Start JSON Server in one terminal:

```bash
npm run api
```

The API runs at http://localhost:3000.

Open a second terminal and start Angular:

```bash
npm start
```

Open http://localhost:4200 in your browser.

Keep both terminals running. Use Ctrl+C to stop a server.

## Features

- Create, view, update, and delete students and courses
- Enroll a student in multiple courses
- Navigate between lists and forms
- Details and Enrollment tabs with modal confirmation
- Confirmation before deletion
- Form validation
- Loading, empty, and error states
- Retry failed list requests

## Project structure

- `src/app/features/students`: student model, service, list, and form
- `src/app/features/courses`: course model, service, list, and form
- `src/app/shared/ui/confirm-dialog`: reusable confirmation dialog
- `src/app/app.routes.ts`: application routes
- `src/app/app.config.ts`: router and HTTP configuration
- `mock-api/db.json`: mock API data
- `src/styles.scss`: shared styles

## AI assistance

I used AI as a coding assistant to help generate code more quickly and add comments. I integrated the code and manually checked the application's functionality.