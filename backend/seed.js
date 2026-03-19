require("dotenv").config();

const mongoose = require("mongoose");
const Student = require("./models/student");

const departments = ["Computer Science", "Information Technology", "Electronics", "AI & DS"];
const counsellors = ["Dr. Meera Nair", "Prof. Arjun Rao", "Dr. Kavya Menon"];
const firstNames = [
  "Aarav", "Vivaan", "Diya", "Ananya", "Ishaan", "Riya", "Krish", "Saanvi",
  "Aditya", "Navya", "Rahul", "Sneha", "Kiran", "Maya", "Rohan", "Nisha"
];
const lastNames = [
  "Sharma", "Reddy", "Patel", "Verma", "Iyer", "Kumar", "Singh", "Nair", "Mehta"
];
const subjectPool = [
  "Mathematics", "Physics", "Chemistry", "Programming in C", "Python Lab",
  "Data Structures", "Database Systems", "Operating Systems", "Computer Networks",
  "Software Engineering", "Web Technologies", "Machine Learning", "Cloud Computing",
  "Artificial Intelligence", "Design Analysis of Algorithms", "Compiler Design"
];

const gradeFromPerformance = (attendance, score, passed) => {
  if (attendance < 75) return "I";
  if (!passed || score < 40) return "R";
  if (score >= 90) return "O";
  if (score >= 80) return "A+";
  if (score >= 70) return "A";
  if (score >= 60) return "B+";
  if (score >= 50) return "B";
  return "C";
};

const createSubjects = (semesterNumber, seed) => {
  const offset = (semesterNumber * 2 + seed) % subjectPool.length;
  const chosen = Array.from({ length: 4 }, (_, index) => subjectPool[(offset + index) % subjectPool.length]);

  return chosen.map((subjectName, index) => {
    const totalClasses = 42 + ((seed + index + semesterNumber) % 18);
    const attendedClasses = Math.max(
      18,
      totalClasses - ((seed * 3 + index * 5 + semesterNumber) % 18)
    );
    const percentage = Math.round((attendedClasses / totalClasses) * 100);
    const internals = 18 + ((seed + semesterNumber + index * 3) % 12);
    const finals = 32 + ((seed * 5 + semesterNumber * 7 + index * 11) % 45);
    const score = internals + finals;
    const passed = score >= 40;

    return {
      subjectName,
      credits: 3 + ((seed + index) % 2),
      grade: gradeFromPerformance(percentage, score, passed),
      status: score >= 50 ? "completed" : "incomplete",
      attendance: {
        subjectName,
        totalClasses,
        attendedClasses,
        percentage
      },
      passed,
      marks: {
        internals,
        finals
      }
    };
  });
};

const createAssignments = (subjects, seed) =>
  subjects.slice(0, 3).map((subject, index) => ({
    title: `${subject.subjectName} Assignment ${index + 1}`,
    subject: subject.subjectName,
    deadline: new Date(Date.now() + (index + 2) * 86400000 + seed * 3600000),
    submitted: (seed + index) % 3 !== 0,
    marks: (seed + index) % 3 !== 0 ? 65 + ((seed + index * 5) % 25) : null,
    uploadedFileName: (seed + index) % 3 !== 0 ? `submission_${seed}_${index + 1}.pdf` : ""
  }));

const createCalendar = (assignments, semester) => [
  ...assignments.map((assignment) => ({
    title: assignment.title,
    type: "assignment",
    date: assignment.deadline,
    description: `${assignment.subject} deadline`
  })),
  {
    title: `Semester ${semester} Internal Exam`,
    type: "exam",
    date: new Date(Date.now() + 12 * 86400000),
    description: "Internal assessment week begins."
  },
  {
    title: "Hackathon & Career Talk",
    type: "event",
    date: new Date(Date.now() + 18 * 86400000),
    description: "Campus event focused on projects and placement readiness."
  }
];

const createStudent = (index) => {
  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[index % lastNames.length];
  const name = `${firstName} ${lastName}`;
  const department = departments[index % departments.length];
  const semester = (index % 8) + 1;
  const rollNumber = `ST${String(2026001 + index).padStart(7, "0")}`;
  const semesters = Array.from({ length: Math.max(semester, 2) }, (_, semIndex) => {
    const semesterNumber = semIndex + 1;
    const subjects = createSubjects(semesterNumber, index + 3);
    return {
      semesterNumber,
      subjects,
      attendance: subjects.map((subject) => subject.attendance)
    };
  });

  const currentSemesterSubjects = semesters[semesters.length - 1].subjects;
  const allSubjects = semesters.flatMap((item) => item.subjects);
  const lowAttendanceCount = allSubjects.filter((subject) => subject.attendance.percentage < 75).length;
  const failedSubjects = allSubjects.filter((subject) => subject.grade === "R").length;
  const avgAttendance = Math.round(
    allSubjects.reduce((sum, subject) => sum + subject.attendance.percentage, 0) / allSubjects.length
  );
  const cgpa = Number((6.2 + ((index * 13) % 33) / 10).toFixed(2));
  const assignments = createAssignments(currentSemesterSubjects, index);
  const totalFees = 120000;
  const scholarship = index % 4 === 0 ? 25000 : index % 5 === 0 ? 15000 : 0;
  const paidFees = Math.min(totalFees - scholarship, 30000 + ((index * 9000) % 95000));
  const remainingFees = Math.max(totalFees - scholarship - paidFees, 0);
  const placementReady = cgpa >= 7 && failedSubjects === 0 && avgAttendance >= 75;
  const placementProfile = {
    leetcode: {
      username: `${firstName.toLowerCase()}_${lastName.toLowerCase()}_lc`,
      problemsSolved: 80 + ((index * 17) % 260),
      rating: 1200 + ((index * 29) % 900)
    },
    codechef: {
      username: `${firstName.toLowerCase()}_${lastName.toLowerCase()}_cc`,
      rating: 1000 + ((index * 31) % 1200),
      stars: 1 + (index % 5)
    },
    github: {
      username: `${firstName.toLowerCase()}${lastName.toLowerCase()}dev`,
      repos: 2 + (index % 8)
    },
    resumeUploaded: index % 3 !== 0,
    hackathons: index % 6,
    placementScore: 0
  };
  placementProfile.placementScore = Math.max(
    0,
    Math.min(
      600,
      Math.min(placementProfile.leetcode.problemsSolved, 250) +
        Math.min(Math.round(placementProfile.codechef.rating / 10), 120) +
        Math.min(placementProfile.github.repos * 10, 80) +
        (placementProfile.resumeUploaded ? 50 : 0) +
        Math.min(Math.round(cgpa * 10), 80) +
        20 -
        Math.min(failedSubjects * 20, 20)
    )
  );

  const notifications = [
    {
      message: remainingFees > 0 ? `Fee payment pending: Rs. ${remainingFees} remaining.` : "All fee dues are cleared.",
      type: remainingFees > 0 ? "finance" : "success",
      date: new Date(Date.now() - 86400000),
      readStatus: false
    },
    {
      message: assignments.some((assignment) => !assignment.submitted)
        ? "You have pending assignments due this week."
        : "Assignments are on track.",
      type: assignments.some((assignment) => !assignment.submitted) ? "assignment" : "success",
      date: new Date(),
      readStatus: false
    }
  ];

  if (lowAttendanceCount > 0) {
    notifications.push({
      message: `${lowAttendanceCount} subject(s) are below the 75% attendance threshold.`,
      type: "warning",
      date: new Date(),
      readStatus: false
    });
  }

  return {
    name,
    rollNumber,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index + 1}@university.edu`,
    department,
    semester,
    cgpa,
    placementReady,
    parentPhone: `9${String(876543210 + index).padStart(9, "0")}`.slice(0, 10),
    studentPhone: `9${String(765432100 + index).padStart(9, "0")}`.slice(0, 10),
    profilePhoto: `https://i.pravatar.cc/160?img=${(index % 60) + 1}`,
    semesters,
    fees: {
      totalFees,
      paidFees,
      remainingFees,
      scholarship
    },
    assignments,
    remarks: [
      {
        counsellorName: counsellors[index % counsellors.length],
        remark: placementReady
          ? "Consistent progress. Encourage mock interviews and aptitude practice."
          : lowAttendanceCount > 0
            ? "Attendance intervention required. Weekly follow-up recommended."
            : "Needs academic support in core subjects."
      }
    ],
    notifications,
    academicCalendar: createCalendar(assignments, semester),
    placementProfile,
    backlogs: failedSubjects,
    counsellorName: counsellors[index % counsellors.length]
  };
};

const sampleStudents = Array.from({ length: 72 }, (_, index) => createStudent(index));

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    await Student.deleteMany({});
    await Student.insertMany(sampleStudents);

    console.log(`Inserted ${sampleStudents.length} student records.`);
    console.log("Demo student login");
    console.log(`Roll Number: ${sampleStudents[0].rollNumber}`);
    console.log(`Parent Phone: ${sampleStudents[0].parentPhone}`);
    console.log("Counsellor demo credentials");
    console.log(`Email: ${process.env.COUNSELLOR_EMAIL || "counsellor@university.edu"}`);
    console.log(`Password: ${process.env.COUNSELLOR_PASSWORD || "counsellor123"}`);
  } catch (error) {
    console.error("Seed failed:", error);
  } finally {
    await mongoose.connection.close();
  }
}

seedDatabase();
