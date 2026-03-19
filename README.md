# Parents Verification Portal

A full-stack student and parent portal built with:

- `Node.js + Express + MongoDB` for the backend
- `React + Vite` for the frontend
- OTP login, attendance tracking, assignments, counsellor insights, placement profile, and marks prediction

## Features

- Parent OTP-based login
- Student dashboard with attendance, fees, assignments, remarks, and notifications
- Counsellor dashboard for student monitoring
- AI-powered academic insights
- Marks prediction based on CGPA, attendance, internals, finals, and assignment performance
- Placement-readiness scoring

## Project Structure

```text
.
|-- backend
|   |-- models
|   |-- server.js
|   |-- seed.js
|   `-- package.json
|-- frontend
|   |-- src
|   |-- public
|   `-- package.json
`-- render.yaml
```

## Local Setup

### 1. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
COUNSELLOR_EMAIL=counsellor@university.edu
COUNSELLOR_PASSWORD=counsellor123

# Optional
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openai/gpt-4o-mini
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

Run backend:

```bash
npm run dev
```

Optional seed:

```bash
npm run seed
```

### 2. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

Run frontend:

```bash
npm run dev
```

## Important API Endpoints

- `POST /send-otp`
- `POST /verify-otp`
- `GET /api/student/dashboard?rollNumber=...`
- `GET /api/student/attendance?rollNumber=...`
- `GET /api/student/assignments?rollNumber=...`
- `GET /api/student/predictions?rollNumber=...`
- `POST /api/ai/query`
- `POST /api/ai/insights`
- `GET /api/counsellor/dashboard`

## Render Deployment

This repo now includes a Render Blueprint config in `render.yaml`.

One-click Render deploy link:

- `https://render.com/deploy?repo=https://github.com/jyoshnayadavally09/Parents_verfication_portal`

### What gets deployed

- A backend Render web service from `backend/`
- A frontend Render static site from `frontend/`

### Required environment variables on Render

Backend:

- `MONGO_URI` required
- `COUNSELLOR_EMAIL` optional
- `COUNSELLOR_PASSWORD` optional
- `OPENROUTER_API_KEY` optional
- `OPENROUTER_MODEL` optional
- `TWILIO_ACCOUNT_SID` optional
- `TWILIO_AUTH_TOKEN` optional
- `TWILIO_PHONE_NUMBER` optional

Frontend:

- `VITE_API_BASE_URL` should be set to your backend Render URL if you change the default service name

## Public URL Note

The one-click deploy link above is public and ready to use.

I cannot create the final live Render website URL from inside this workspace because that requires logging into your Render account and completing the deployment there. Once you click the deploy link and add `MONGO_URI`, Render will generate public URLs such as:

- `https://parents-verification-portal-api-jyosh.onrender.com`
- `https://parents-verification-portal-web-jyosh.onrender.com`

If Render changes the service name during deploy, use the generated backend URL as `VITE_API_BASE_URL` for the frontend service.

## Notes

- The backend already supports `PORT`, so it is compatible with Render.
- The frontend already reads `VITE_API_BASE_URL`, so it is deployment-ready.
- Marks prediction is available in the dashboard response and through `/api/student/predictions`.
