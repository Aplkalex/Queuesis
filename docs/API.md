# CUHK Scheduler API

These API routes are served by the Next.js app and can be reached via `/api/*` while the dev server is running.

## Health

- **Endpoint:** `GET /api/health`
- **Description:** Simple liveness probe.
- **Response:**
  ```json
  {
    "status": "healthy",
    "timestamp": "2025-11-07T12:34:56.789Z",
    "service": "cuhk-scheduler-api",
    "version": "0.1.0"
  }
  ```

## Terms

- **Endpoint:** `GET /api/terms`
- **Description:** Returns the list of academic terms currently supported.
- **Response:**
  ```json
  {
    "success": true,
    "count": 3,
    "data": [
      { "id": "2025-26-T1", "name": "2025-26 Term 1" }
      // ...
    ]
  }
  ```

## Courses

### List courses

- **Endpoint:** `GET /api/courses`
- **Query Parameters:**
  - `term` (optional) – filter by exact `course.term` value
  - `department` (optional) – filter by department code
  - `search` (optional) – case-insensitive match on course code, name, or instructor
  - `testMode` (optional) – set to `true` to use `testCourses`
- **Response:**
  ```json
  {
    "success": true,
    "count": 12,
    "data": [
      {
        "courseCode": "ENGG1100",
        "courseName": "Introduction to Engineering",
        "sections": [
          {
            "sectionId": "LEC1",
            "sectionType": "Lecture"
          }
        ]
      }
      // ...
    ]
  }
  ```

### Single course

- **Endpoint:** `GET /api/courses/{courseCode}`
- **Query Parameters:**
  - `testMode` (optional) – set to `true` to use `testCourses`
- **Responses:**
  - `200 OK` with course payload when found
  - `404 Not Found` with `{ "success": false, "error": "Course not found" }` when the course is missing

---

To try these endpoints locally:

```bash
npm run dev
# then open http://localhost:3000/api/health in your browser
```
