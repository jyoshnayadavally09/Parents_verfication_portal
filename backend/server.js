require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const otpGenerator = require("otp-generator");
const twilio = require("twilio");
const axios = require("axios");

const Student = require("./models/student");
const OTP = require("./models/OTP");

const app = express();
const PORT = process.env.PORT || 5000;
const counsellorEmail = process.env.COUNSELLOR_EMAIL || "counsellor@university.edu";
const counsellorPassword = process.env.COUNSELLOR_PASSWORD || "counsellor123";

app.use(cors());
app.use(express.json());

let twilioClient = null;
if (
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_ACCOUNT_SID.startsWith("AC") &&
  process.env.TWILIO_AUTH_TOKEN
) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.error("MongoDB connection error:", error));

const calculatePlacementScore = (student) => {
  const profile = student.placementProfile || {};
  const leetcodeScore = Math.min(profile.leetcode?.problemsSolved || 0, 250);
  const codechefScore = Math.min(Math.round((profile.codechef?.rating || 0) / 10), 120);
  const githubScore = Math.min((profile.github?.repos || 0) * 10, 80);
  const resumeScore = profile.resumeUploaded ? 50 : 0;
  const cgpaScore = Math.min(Math.round((student.cgpa || 0) * 10), 80);
  const backlogPenalty = Math.min((student.backlogs || 0) * 20, 20);

  return Math.max(
    0,
    Math.min(600, leetcodeScore + codechefScore + githubScore + resumeScore + cgpaScore + 20 - backlogPenalty)
  );
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getPerformanceBand = (score) => {
  if (score >= 85) return "Excellent";
  if (score >= 75) return "Very Good";
  if (score >= 65) return "Good";
  if (score >= 50) return "Average";
  return "Needs Support";
};

const getConfidenceLabel = (score) => {
  if (score >= 85) return "high";
  if (score >= 65) return "medium";
  return "low";
};

const buildPerformancePredictions = (student) => {
  const semesters = student.semesters || [];
  const currentSemester =
    semesters.find((semester) => semester.semesterNumber === student.semester) ||
    semesters[semesters.length - 1] ||
    null;
  const currentSubjects = currentSemester?.subjects || [];
  const assignmentMarks = (student.assignments || [])
    .map((assignment) => assignment.marks)
    .filter((mark) => typeof mark === "number");
  const avgAssignmentMark = assignmentMarks.length
    ? assignmentMarks.reduce((sum, mark) => sum + mark, 0) / assignmentMarks.length
    : 0;

  const subjectPredictions = currentSubjects.map((subject) => {
    const internals = subject.marks?.internals || 0;
    const finals = subject.marks?.finals || 0;
    const attendance = subject.attendance?.percentage || 0;
    const subjectCurrentTotal = clamp(internals + finals, 0, 100);
    const cgpaScore = clamp((student.cgpa || 0) * 9.2, 0, 92);
    const attendanceBoost = attendance * 0.18;
    const internalWeight = internals * 1.1;
    const finalsWeight = finals * 0.52;
    const assignmentBoost = avgAssignmentMark ? avgAssignmentMark * 0.08 : 0;

    const predictedTotal = Math.round(
      clamp(cgpaScore * 0.34 + attendanceBoost + internalWeight + finalsWeight + assignmentBoost, 35, 100)
    );
    const predictedFinals = clamp(Math.round(predictedTotal - internals), 0, 70);
    const improvement = predictedTotal - subjectCurrentTotal;
    const confidenceScore = clamp(
      45 +
        (attendance >= 75 ? 20 : 0) +
        (internals > 0 ? 10 : 0) +
        (finals > 0 ? 15 : 0) +
        (avgAssignmentMark > 0 ? 10 : 0),
      40,
      100
    );

    return {
      subjectName: subject.subjectName,
      currentMarks: {
        internals,
        finals,
        total: subjectCurrentTotal
      },
      predictedMarks: {
        internals,
        finals: predictedFinals,
        total: predictedTotal
      },
      improvementTrend: improvement > 5 ? "Likely to improve" : improvement < -5 ? "May decline" : "Stable",
      performanceBand: getPerformanceBand(predictedTotal),
      confidence: getConfidenceLabel(confidenceScore),
      confidenceScore
    };
  });

  const predictedAverage = subjectPredictions.length
    ? Math.round(
        subjectPredictions.reduce((sum, subject) => sum + subject.predictedMarks.total, 0) /
          subjectPredictions.length
      )
    : 0;
  const predictedCgpa = clamp(
    Number((((student.cgpa || 0) * 0.7 + predictedAverage / 25).toFixed(2))),
    0,
    10
  );

  return {
    basedOn: ["cgpa", "attendance", "internals", "finals", "assignment performance"],
    predictedSemesterAverage: predictedAverage,
    predictedCgpa,
    overallPerformanceBand: getPerformanceBand(predictedAverage),
    subjectPredictions,
    generatedAt: new Date()
  };
};

const buildDerivedMetrics = (student) => {
  const semesters = student.semesters || [];
  const allSubjects = semesters.flatMap((semester) => semester.subjects || []);
  const allAttendance = semesters.flatMap((semester) => semester.attendance || []);
  const lowAttendanceSubjects = allSubjects.filter(
    (subject) => (subject.attendance?.percentage || 0) < 75
  );
  const completedSubjects = allSubjects.filter((subject) => subject.status === "completed");
  const incompleteSubjects = allSubjects.filter((subject) => subject.status !== "completed");
  const pendingAssignments = (student.assignments || []).filter((assignment) => !assignment.submitted);
  const avgAttendance = allAttendance.length
    ? Math.round(
        allAttendance.reduce((sum, entry) => sum + (entry.percentage || 0), 0) / allAttendance.length
      )
    : 0;
  const gradeClassification = allSubjects.map((subject) => ({
    subjectName: subject.subjectName,
    grade: subject.grade,
    classification:
      (subject.attendance?.percentage || 0) < 75
        ? "I Grade"
        : subject.grade === "R"
          ? "R Grade"
          : "Regular"
  }));

  const placementStatus =
    student.cgpa >= 7 && (student.backlogs || 0) === 0 && avgAttendance >= 75
      ? "Placement Ready"
      : "Not Ready";
  const placementScore = calculatePlacementScore(student);

  const derivedNotifications = [
    ...lowAttendanceSubjects.map((subject) => ({
      message: `${subject.subjectName} attendance is ${subject.attendance.percentage}%. Minimum required is 75%.`,
      type: "warning",
      date: new Date(),
      readStatus: false
    })),
    ...pendingAssignments.map((assignment) => ({
      message: `${assignment.title} is pending and due on ${new Date(assignment.deadline).toLocaleDateString("en-IN")}.`,
      type: "assignment",
      date: new Date(),
      readStatus: false
    }))
  ];

  return {
    avgAttendance,
    lowAttendanceSubjects,
    completedSubjects,
    incompleteSubjects,
    pendingAssignments,
    gradeClassification,
    placementStatus,
    placementScore,
    derivedNotifications
  };
};

const buildDashboardResponse = (studentDocument) => {
  const student = studentDocument.toJSON ? studentDocument.toJSON() : studentDocument;
  const metrics = buildDerivedMetrics(student);
  const predictions = buildPerformancePredictions(student);
  const semesterAttendance = (student.semesters || []).map((semester) => ({
    semesterNumber: semester.semesterNumber,
    averageAttendance: semester.attendance?.length
      ? Math.round(
          semester.attendance.reduce((sum, entry) => sum + (entry.percentage || 0), 0) /
            semester.attendance.length
        )
      : 0,
    subjects: semester.subjects || []
  }));

  return {
    ...student,
    placementProfile: {
      ...(student.placementProfile || {}),
      placementScore: metrics.placementScore
    },
    semesterAttendance,
    notifications: [...metrics.derivedNotifications, ...(student.notifications || [])].sort(
      (left, right) => new Date(right.date) - new Date(left.date)
    ),
    lowAttendanceSubjects: metrics.lowAttendanceSubjects,
    pendingAssignments: metrics.pendingAssignments,
    completedSubjects: metrics.completedSubjects,
    incompleteSubjects: metrics.incompleteSubjects,
    predictions,
    placementStatus: metrics.placementStatus,
    gradeClassification: metrics.gradeClassification,
    attendancePercentage: metrics.avgAttendance,
    placementScore: metrics.placementScore
  };
};

const findStudent = async (rollNumber) => Student.findOne({ rollNumber });

const createFallbackAiResponse = (student, message) => {
  const dashboard = buildDashboardResponse(student);
  const normalized = message.toLowerCase();

  if (normalized.includes("attendance")) {
    if (dashboard.lowAttendanceSubjects.length) {
      return `Your overall attendance is ${dashboard.attendancePercentage}%. Low attendance subjects: ${dashboard.lowAttendanceSubjects
        .map((subject) => `${subject.subjectName} (${subject.attendance.percentage}%)`)
        .join(", ")}.`;
    }
    return `Your overall attendance is ${dashboard.attendancePercentage}% and all current subjects are above 75%.`;
  }

  if (normalized.includes("assignment")) {
    return dashboard.pendingAssignments.length
      ? `You have ${dashboard.pendingAssignments.length} pending assignment(s): ${dashboard.pendingAssignments
          .map((assignment) => assignment.title)
          .join(", ")}.`
      : "You do not have any pending assignments right now.";
  }

  if (normalized.includes("cgpa")) {
    return `Your current CGPA is ${dashboard.cgpa}. Placement status is ${dashboard.placementStatus}.`;
  }

  if (normalized.includes("predict") || normalized.includes("prediction") || normalized.includes("marks")) {
    return dashboard.predictions.subjectPredictions.length
      ? `Predicted semester average is ${dashboard.predictions.predictedSemesterAverage}. Strongest outlook: ${dashboard.predictions.subjectPredictions
          .slice()
          .sort((left, right) => right.predictedMarks.total - left.predictedMarks.total)[0]
          .subjectName}.`
      : "Prediction data is not available because no current semester subjects were found.";
  }

  if (normalized.includes("placement") || normalized.includes("resume") || normalized.includes("leetcode")) {
    return `Your placement score is ${dashboard.placementScore} out of 600. Resume uploaded: ${dashboard.placementProfile?.resumeUploaded ? "yes" : "no"}. LeetCode solved: ${dashboard.placementProfile?.leetcode?.problemsSolved || 0}, GitHub repos: ${dashboard.placementProfile?.github?.repos || 0}.`;
  }

  if (normalized.includes("fees") || normalized.includes("scholarship")) {
    return `Total fees are Rs. ${dashboard.fees.totalFees}. Paid amount is Rs. ${dashboard.fees.paidFees}, remaining amount is Rs. ${dashboard.fees.remainingFees}, scholarship is Rs. ${dashboard.fees.scholarship}.`;
  }

  return `Here is a quick academic summary: CGPA ${dashboard.cgpa}, attendance ${dashboard.attendancePercentage}%, ${dashboard.pendingAssignments.length} pending assignment(s), and placement status ${dashboard.placementStatus}.`;
};

const requestOpenRouter = async (student, prompt, mode = "assistant") => {
  if (!process.env.OPENROUTER_API_KEY) {
    return null;
  }

  const dashboard = buildDashboardResponse(student);
  const studentContext = {
    name: dashboard.name,
    rollNumber: dashboard.rollNumber,
    department: dashboard.department,
    semester: dashboard.semester,
    cgpa: dashboard.cgpa,
    attendancePercentage: dashboard.attendancePercentage,
    placementStatus: dashboard.placementStatus,
    placementScore: dashboard.placementScore,
    backlogs: dashboard.backlogs,
    pendingAssignments: dashboard.pendingAssignments.map((assignment) => ({
      title: assignment.title,
      deadline: assignment.deadline,
      subject: assignment.subject
    })),
    lowAttendanceSubjects: dashboard.lowAttendanceSubjects.map((subject) => ({
      subjectName: subject.subjectName,
      percentage: subject.attendance.percentage
    })),
    fees: dashboard.fees,
    placementProfile: dashboard.placementProfile
  };

  const systemPrompt =
    mode === "insights"
      ? "You are an academic counsellor assistant. Analyze the student record and return concise, actionable academic insights in 3 short bullet points."
      : "You are a university student portal voice assistant. Answer clearly, accurately, and concisely based only on the provided student data.";

  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Student data: ${JSON.stringify(studentContext)}\n\nUser request: ${prompt}`
        }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      timeout: 20000
    }
  );

  return response.data?.choices?.[0]?.message?.content?.trim() || null;
};

app.post("/send-otp", async (req, res) => {
  try {
    const { rollNumber, phone } = req.body;
    const student = await Student.findOne({ rollNumber, parentPhone: phone });

    if (!student) {
      return res.json({ success: false, message: "Student not found" });
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false
    });

    await OTP.create({ phone, otp });

    if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
      await twilioClient.messages.create({
        body: `Your StudyTracker OTP is ${otp}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
      });
      return res.json({ success: true, message: "OTP sent to your phone" });
    }

    console.log(`OTP for ${phone}: ${otp}`);
    return res.json({
      success: true,
      message: `OTP generated: ${otp} (check backend console)`
    });
  } catch (error) {
    console.error("OTP send failed:", error);
    return res.status(500).json({ success: false, message: "OTP failed" });
  }
});

app.post("/verify-otp", async (req, res) => {
  try {
    const { rollNumber, phone, otp } = req.body;
    const record = await OTP.findOne({ phone, otp });

    if (!record) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    const student = await Student.findOne({ rollNumber, parentPhone: phone });
    if (!student) {
      return res.json({ success: false, message: "Student not found" });
    }

    return res.json({
      success: true,
      message: "Login successful",
      student: buildDashboardResponse(student)
    });
  } catch (error) {
    console.error("OTP verification failed:", error);
    return res.status(500).json({ success: false, message: "Verification failed" });
  }
});

app.post("/counsellor/login", async (req, res) => {
  const { email, password } = req.body;

  if (email !== counsellorEmail || password !== counsellorPassword) {
    return res.status(401).json({ success: false, message: "Invalid counsellor credentials" });
  }

  return res.json({
    success: true,
    message: "Counsellor login successful",
    counsellor: {
      name: "Academic Counsellor",
      email: counsellorEmail
    }
  });
});

app.get("/student", async (req, res) => {
  try {
    const student = await findStudent(req.query.rollNumber || req.query.regNo);
    if (!student) {
      return res.json({ success: false, message: "Student not found" });
    }

    return res.json({ success: true, student: buildDashboardResponse(student) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/student/dashboard", async (req, res) => {
  try {
    const student = await findStudent(req.query.rollNumber);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    return res.json({ success: true, data: buildDashboardResponse(student) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/student/attendance", async (req, res) => {
  try {
    const student = await findStudent(req.query.rollNumber);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    const data = buildDashboardResponse(student);
    return res.json({
      success: true,
      attendancePercentage: data.attendancePercentage,
      semesterAttendance: data.semesterAttendance,
      lowAttendanceSubjects: data.lowAttendanceSubjects,
      gradeClassification: data.gradeClassification
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/student/fees", async (req, res) => {
  try {
    const student = await findStudent(req.query.rollNumber);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    return res.json({ success: true, fees: student.fees });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/student/predictions", async (req, res) => {
  try {
    const student = await findStudent(req.query.rollNumber);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const dashboard = buildDashboardResponse(student);
    return res.json({
      success: true,
      rollNumber: dashboard.rollNumber,
      predictions: dashboard.predictions
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/placement-profile/:rollNumber", async (req, res) => {
  try {
    const student = await findStudent(req.params.rollNumber);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const dashboard = buildDashboardResponse(student);
    return res.json({
      success: true,
      placementProfile: dashboard.placementProfile,
      placementReady: dashboard.placementStatus
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/placement-profile/update", async (req, res) => {
  try {
    const {
      rollNumber,
      leetcode = {},
      codechef = {},
      github = {},
      resumeUploaded,
      hackathons
    } = req.body;
    const student = await findStudent(rollNumber);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const currentProfile = student.placementProfile || {};
    student.placementProfile = {
      leetcode: {
        ...(currentProfile.leetcode || {}),
        ...leetcode
      },
      codechef: {
        ...(currentProfile.codechef || {}),
        ...codechef
      },
      github: {
        ...(currentProfile.github || {}),
        ...github
      },
      resumeUploaded:
        typeof resumeUploaded === "boolean" ? resumeUploaded : currentProfile.resumeUploaded || false,
      hackathons: typeof hackathons === "number" ? hackathons : currentProfile.hackathons || 0,
      placementScore: 0
    };
    student.placementProfile.placementScore = calculatePlacementScore(student);
    await student.save();

    return res.json({
      success: true,
      placementProfile: buildDashboardResponse(student).placementProfile
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/placement-score/:rollNumber", async (req, res) => {
  try {
    const student = await findStudent(req.params.rollNumber);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const dashboard = buildDashboardResponse(student);
    return res.json({
      success: true,
      rollNumber: dashboard.rollNumber,
      placementScore: dashboard.placementScore,
      placementStatus: dashboard.placementStatus
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/student/assignments", async (req, res) => {
  try {
    const student = await findStudent(req.query.rollNumber);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    return res.json({
      success: true,
      assignments: student.assignments,
      pendingAssignments: student.assignments.filter((assignment) => !assignment.submitted)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/student/assignments/upload", async (req, res) => {
  try {
    const { rollNumber, title, subject, deadline, fileName } = req.body;
    const student = await findStudent(rollNumber);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    student.assignments.push({
      title,
      subject,
      deadline,
      submitted: true,
      marks: null,
      uploadedFileName: fileName || "uploaded-assignment.pdf"
    });
    await student.save();

    return res.json({ success: true, assignments: student.assignments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/student/assignments/:assignmentId/submit", async (req, res) => {
  try {
    const { rollNumber, fileName } = req.body;
    const student = await findStudent(rollNumber);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const assignment = student.assignments.id(req.params.assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    assignment.submitted = true;
    assignment.uploadedFileName = fileName || assignment.uploadedFileName || "submitted-file.pdf";
    await student.save();

    return res.json({ success: true, assignment });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/student/remarks", async (req, res) => {
  try {
    const student = await findStudent(req.query.rollNumber);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    return res.json({ success: true, remarks: student.remarks });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/student/remarks", async (req, res) => {
  try {
    const { rollNumber, counsellorName, remark } = req.body;
    const student = await findStudent(rollNumber);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    student.remarks.unshift({
      counsellorName,
      remark,
      date: new Date()
    });
    await student.save();

    return res.json({ success: true, remarks: student.remarks });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/student/notifications", async (req, res) => {
  try {
    const student = await findStudent(req.query.rollNumber);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    return res.json({
      success: true,
      notifications: buildDashboardResponse(student).notifications
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/student/notifications/read", async (req, res) => {
  try {
    const student = await findStudent(req.body.rollNumber);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    student.notifications = student.notifications.map((notification) => ({
      ...notification.toObject(),
      readStatus: true
    }));
    await student.save();

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/ai/query", async (req, res) => {
  try {
    const { rollNumber, message } = req.body;
    const student = await findStudent(rollNumber);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const aiReply =
      (await requestOpenRouter(student, message, "assistant").catch(() => null)) ||
      createFallbackAiResponse(student, message);

    return res.json({ success: true, reply: aiReply });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/ai/insights", async (req, res) => {
  try {
    const { rollNumber } = req.body;
    const student = await findStudent(rollNumber);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const dashboard = buildDashboardResponse(student);
    const baseInsights = [
      dashboard.attendancePercentage >= 85 && dashboard.cgpa < 7
        ? "High attendance but CGPA is still below the strong-performance range. Focus on exam strategy and revision quality."
        : "Attendance and CGPA trend are reasonably aligned.",
      dashboard.lowAttendanceSubjects.length
        ? `${dashboard.lowAttendanceSubjects.length} subject(s) are below 75% attendance and need immediate recovery planning.`
        : "No low-attendance subjects detected right now.",
      !dashboard.placementProfile?.resumeUploaded
        ? "Upload resume to improve placement readiness."
        : dashboard.placementProfile?.leetcode?.problemsSolved < 150
          ? "Improve DSA by solving more LeetCode problems."
          : dashboard.placementProfile?.github?.repos < 4
            ? "Increase GitHub activity and showcase more projects."
            : "Placement profile looks healthy. Keep improving coding consistency.",
      dashboard.placementStatus === "Placement Ready"
        ? "Student is placement ready based on CGPA, backlogs, and attendance."
        : "Student is not placement ready yet. Improve CGPA, clear backlogs, and keep attendance above 75%."
    ];

    const aiInsights =
      (await requestOpenRouter(
        student,
        "Give academic insights and suggestions for this student.",
        "insights"
      ).catch(() => null)) || baseInsights.join("\n");

    return res.json({
      success: true,
      insights: typeof aiInsights === "string" ? aiInsights.split("\n").filter(Boolean) : baseInsights
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/counsellor/dashboard", async (_req, res) => {
  try {
    const students = await Student.find({}).sort({ rollNumber: 1 }).limit(72);
    const data = students.map((student) => {
      const dashboard = buildDashboardResponse(student);
      return {
        _id: dashboard._id,
        name: dashboard.name,
        rollNumber: dashboard.rollNumber,
        department: dashboard.department,
        semester: dashboard.semester,
        cgpa: dashboard.cgpa,
        attendancePercentage: dashboard.attendancePercentage,
        pendingAssignments: dashboard.pendingAssignments.length,
        remarks: dashboard.remarks,
        placementStatus: dashboard.placementStatus,
        placementScore: dashboard.placementScore,
        lowAttendanceCount: dashboard.lowAttendanceSubjects.length,
        backlogs: dashboard.backlogs
      };
    });

    return res.json({ success: true, students: data, count: data.length });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/students", async (_req, res) => {
  try {
    const students = await Student.find({}).sort({ rollNumber: 1 });
    return res.json(students);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
