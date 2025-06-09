# Workshop Backend API

A simple Node.js microservice to expose REST APIs over a SQLite database

TEST

## Features

- RESTful API endpoints with Swagger documentation
- SQLite database for data persistence
- Express.js web server
- Testing with Jest and Supertest

## Prerequisites

- Node.js (v20 or higher)
- npm (v9 or higher)

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd <repository-directory>
```

2. Install dependencies:

```bash
npm install
```

## Running the Application

Start the development server:

```bash
npm run dev
```

The server will start on port 8000. 

You can access Swagger documentation at <http://localhost:8000/api-docs>

## Testing

The application uses Jest and Supertest for testing. Tests are located in the `src/tests` directory.

Run the test suite:

```bash
npm test
```

## API Endpoints

| Method | Endpoint      | Description           |
|--------|---------------|-----------------------|
| GET    | /api/v1/health   | Check service health   |

## Database

The application uses SQLite as database. The database file is created in the `data` directory when the application starts for the first time.
