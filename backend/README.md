# Student Parent Dashboard Backend

A Node.js backend system for student parent dashboard with OTP authentication and AI chatbot functionality.

## Features

- **OTP Authentication**: Send and verify OTP for parent login
- **Student Data Management**: Semester-wise academic data storage
- **AI Chatbot**: Natural language queries for attendance and marks
- **MongoDB Integration**: Mongoose ODM for data modeling

## Data Structure

### Student Schema
```javascript
{
  regNo: String,           // Registration number
  name: String,            // Student name
  department: String,      // Department
  year: Number,            // 1, 2, 3, or 4
  parentPhone: String,     // Parent phone number
  semesters: [{            // Array of semesters
    semesterNumber: Number,
    subjects: [{
      name: String,
      attendance: {
        totalClasses: Number,
        attendedClasses: Number,
        percentage: Number
      },
      marks: {
        mid1: Number,
        mid2: Number,
        semesterExam: Number
      }
    }]
  }]
}
```

### Semester Logic
- **1st Year**: Semesters 1-2
- **2nd Year**: Semesters 1-4
- **3rd Year**: Semesters 1-6
- **4th Year**: Semesters 1-8

## API Endpoints

### 1. Send OTP
**POST** `/send-otp`

Request:
```json
{
  "regNo": "2021001",
  "phone": "9876543210"
}
```

Response:
```json
{
  "success": true,
  "message": "OTP generated (check backend console)"
}
```

### 2. Verify OTP
**POST** `/verify-otp`

Request:
```json
{
  "phone": "9876543210",
  "otp": "123456"
}
```

Response:
```json
{
  "success": true,
  "message": "Login Successful"
}
```

### 3. Chatbot
**POST** `/chatbot`

Request:
```json
{
  "regNo": "2021001",
  "message": "Show attendance"
}
```

Response:
```json
{
  "reply": "Attendance:\n\nSemester 1:\nData Structures: 84%\nAlgorithms: 89%\n\nSemester 2:\nDatabase Systems: 90%\nOperating Systems: 73%"
}
```

## Chatbot Commands

The chatbot understands various natural language queries:

### Attendance Queries
- "Show attendance"
- "Attendance for Data Structures"
- "Show my attendance"

### Marks Queries
- "Show marks"
- "Mid1 marks"
- "Mid2 marks"
- "Semester marks"
- "Show semester 3 marks"
- "Final exam marks"

### Fees Queries (Legacy)
- "Show fees"
- "Fee status"

### Marks Prediction
**GET** `/api/student/predictions?rollNumber=ST2026001`

Response:
```json
{
  "success": true,
  "rollNumber": "ST2026001",
  "predictions": {
    "basedOn": ["cgpa", "attendance", "internals", "finals", "assignment performance"],
    "predictedSemesterAverage": 78,
    "predictedCgpa": 8.14,
    "overallPerformanceBand": "Very Good",
    "subjectPredictions": [
      {
        "subjectName": "Machine Learning",
        "currentMarks": { "internals": 24, "finals": 41, "total": 65 },
        "predictedMarks": { "internals": 24, "finals": 50, "total": 74 },
        "improvementTrend": "Likely to improve",
        "performanceBand": "Good",
        "confidence": "high",
        "confidenceScore": 90
      }
    ]
  }
}
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file:
   ```
   MONGO_URI=mongodb://localhost:27017/student-dashboard
   PORT=5000
   ```

3. **Start MongoDB**
   Make sure MongoDB is running on your system.

4. **Seed Sample Data**
   ```bash
   node seed.js
   ```

5. **Start Server**
   ```bash
   npm start
   ```

## Sample Data

The system includes sample students:

- **John Doe** (2021001) - 2nd Year, Computer Science
- **Jane Smith** (2022002) - 1st Year, Information Technology

## Testing the API

Use tools like Postman or curl to test the endpoints:

```bash
# Send OTP
curl -X POST http://localhost:5000/send-otp \
  -H "Content-Type: application/json" \
  -d '{"regNo": "2021001", "phone": "9876543210"}'

# Verify OTP (check console for OTP)
curl -X POST http://localhost:5000/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210", "otp": "123456"}'

# Chatbot query
curl -X POST http://localhost:5000/chatbot \
  -H "Content-Type: application/json" \
  -d '{"regNo": "2021001", "message": "Show attendance"}'
```

## Dependencies

- **express**: Web framework
- **mongoose**: MongoDB ODM
- **cors**: Cross-origin resource sharing
- **otp-generator**: OTP generation
- **dotenv**: Environment variables

## Project Structure

```
backend/
├── models/
│   ├── Student.js    # Student data model
│   └── OTP.js        # OTP model
├── server.js         # Main server file
├── seed.js           # Sample data seeder
├── package.json
└── .env              # Environment variables
```
