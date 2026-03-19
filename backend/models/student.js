const mongoose = require("mongoose");

/* ---------------- DAILY PERIOD RECORD ---------------- */

const dailyAttendanceSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },

    month: {
      type: String,
      enum: ["Jan", "Feb", "Mar", "Apr", "May"],
      required: true
    },

    presentPeriods: {
      type: Number,
      default: 0,
      min: 0,
      max: 8
    },

    absentPeriods: {
      type: Number,
      default: 0,
      min: 0,
      max: 8
    }
  },
  { _id: false }
);

/* ---------------- SUBJECT ATTENDANCE ---------------- */

const attendanceSchema = new mongoose.Schema(
  {
    subjectName: { type: String, trim: true },

    totalClasses: { type: Number, default: 0 },

    attendedClasses: { type: Number, default: 0 },

    percentage: { type: Number, default: 0 },

    // NEW: DAILY RECORDS
    dailyRecords: { type: [dailyAttendanceSchema], default: [] }
  },
  { _id: false }
);

/* ---------------- SUBJECT ---------------- */

const subjectSchema = new mongoose.Schema(
  {
    subjectName: { type: String, required: true, trim: true },

    credits: { type: Number, default: 3 },

    grade: { type: String, default: "B" },

    status: {
      type: String,
      enum: ["completed", "incomplete"],
      default: "completed"
    },

    attendance: attendanceSchema,

    passed: { type: Boolean, default: true },

    marks: {
      internals: { type: Number, default: 0 },
      finals: { type: Number, default: 0 }
    }
  },
  { _id: false }
);

/* ---------------- FEES ---------------- */

const feesSchema = new mongoose.Schema(
  {
    totalFees: { type: Number, default: 0 },
    paidFees: { type: Number, default: 0 },
    remainingFees: { type: Number, default: 0 },
    scholarship: { type: Number, default: 0 }
  },
  { _id: false }
);

/* ---------------- ASSIGNMENTS ---------------- */

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true },
  deadline: { type: Date, required: true },
  submitted: { type: Boolean, default: false },
  marks: { type: Number, default: null },
  uploadedFileName: { type: String, default: "" }
});

/* ---------------- REMARKS ---------------- */

const remarksSchema = new mongoose.Schema(
  {
    counsellorName: { type: String, required: true, trim: true },
    remark: { type: String, required: true, trim: true },
    date: { type: Date, default: Date.now }
  },
  { _id: false }
);

/* ---------------- NOTIFICATIONS ---------------- */

const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true, trim: true },
  type: { type: String, default: "info" },
  date: { type: Date, default: Date.now },
  readStatus: { type: Boolean, default: false }
});

/* ---------------- SEMESTER ---------------- */

const semesterSchema = new mongoose.Schema(
  {
    semesterNumber: { type: Number, required: true },

    subjects: { type: [subjectSchema], default: [] },

    attendance: { type: [attendanceSchema], default: [] }
  },
  { _id: false }
);

/* ---------------- CALENDAR ---------------- */

const calendarEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, default: "event" },
    date: { type: Date, required: true },
    description: { type: String, default: "" }
  },
  { _id: false }
);

/* ---------------- PLACEMENT PROFILE ---------------- */

const placementProfileSchema = new mongoose.Schema(
  {
    leetcode: {
      username: { type: String, default: "", trim: true },
      problemsSolved: { type: Number, default: 0 },
      rating: { type: Number, default: 0 }
    },

    codechef: {
      username: { type: String, default: "", trim: true },
      rating: { type: Number, default: 0 },
      stars: { type: Number, default: 0 }
    },

    github: {
      username: { type: String, default: "", trim: true },
      repos: { type: Number, default: 0 }
    },

    resumeUploaded: { type: Boolean, default: false },

    hackathons: { type: Number, default: 0 },

    placementScore: { type: Number, default: 0 }
  },
  { _id: false }
);

/* ---------------- STUDENT ---------------- */

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    rollNumber: { type: String, required: true, unique: true, trim: true },

    email: { type: String, required: true, trim: true, lowercase: true },

    department: { type: String, required: true, trim: true },

    semester: { type: Number, required: true },

    cgpa: { type: Number, default: 0 },

    placementReady: { type: Boolean, default: false },

    parentPhone: { type: String, required: true, trim: true },

    studentPhone: { type: String, trim: true },

    profilePhoto: { type: String, default: "" },

    semesters: { type: [semesterSchema], default: [] },

    fees: feesSchema,

    assignments: { type: [assignmentSchema], default: [] },

    remarks: { type: [remarksSchema], default: [] },

    notifications: { type: [notificationSchema], default: [] },

    academicCalendar: { type: [calendarEventSchema], default: [] },

    placementProfile: { type: placementProfileSchema, default: () => ({}) },

    backlogs: { type: Number, default: 0 },

    counsellorName: { type: String, default: "Dr. Meera Nair" }
  },
  { timestamps: true }
);

/* ---------------- VIRTUAL ---------------- */

studentSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.regNo = ret.rollNumber;
    return ret;
  }
});

studentSchema.set("toObject", { virtuals: true });

module.exports =
  mongoose.models.Student || mongoose.model("Student", studentSchema);