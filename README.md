# RoomOfRequirement

Backend for LemonPay

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB instance (local or cloud)
- Redis instance (local or cloud)
- Docker (optional, for containerization)

### Environment Variables
Create a `.env` file in the RoomOfRequirement directory with the following:
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://localhost:6379
```

### Local Development
```
npm install
npm start
```

### Docker
Build and run the backend container:
```
docker build -t roomofrequirement-backend .
docker run -p 5000:5000 --env-file .env roomofrequirement-backend
```

## API Endpoints

### Authentication
- POST `/api/auth/register` — Register a new user
- POST `/api/auth/login` — Login and receive JWT in HTTP-only cookie

### Tasks (JWT required)
- GET `/api/tasks` — Get all tasks for the logged-in user (Redis cached)
- GET `/api/tasks/:id` — Get a specific task (Redis cached)
- POST `/api/tasks` — Add a new task
- PUT `/api/tasks/:id` — Update a task
- DELETE `/api/tasks/:id` — Delete a task

### Redis Cache
- Task lists and individual tasks are cached in Redis for 5 minutes (TTL).
- Cache is invalidated on add, update, or delete.
- Redis should be configured with an LRU eviction policy (e.g., `maxmemory-policy allkeys-lru`).

### Clear Cache
- POST `/api/tasks/clear-cache` — Clears all Redis cache (for demo/admin use)

#### Example curl command:
```
curl -X POST http://localhost:5000/api/tasks/clear-cache
```

## Notes
- Ensure your Redis instance is running with LRU policy for optimal cache management.
- For production, secure the /clear-cache endpoint appropriately.
