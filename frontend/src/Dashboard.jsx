import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
} from "chart.js";
import AcademicProgress from "./AcademicProgress";
import "./Dashboard.css";

ChartJS.register(ArcElement, CategoryScale, Legend, LineElement, LinearScale, PointElement, Tooltip);

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const DEFAULT_THEME = localStorage.getItem("theme") || "dark";
const DEFAULT_LANGUAGE = localStorage.getItem("portalLanguage") || "en";

const translations = {
  en: {
    dashboard: "Dashboard",
    attendance: "Attendance",
    fees: "Fees",
    assignments: "Assignments",
    calendar: "Calendar",
    academicProgress: "Academic Progress",
    placementProfile: "Placement Profile",
    placement: "Placement",
    notifications: "Notifications",
    studentPortal: "Student academic portal",
    counsellorWorkspace: "Counsellor workspace",
    currentStatus: "Current status",
    lightMode: "Light mode",
    darkMode: "Dark mode",
    logout: "Logout",
    studentDashboard: "Student dashboard",
    reviewAttendance: "Review attendance",
    openAssignments: "Open assignments",
    currentCgpa: "Current CGPA",
    pendingAssignments: "Pending Assignments",
    backlogs: "Backlogs",
    healthyAttendance: "Healthy attendance",
    allCaughtUp: "All caught up",
    submissionNeeded: "Submission action needed",
    needsAttention: "Needs attention",
    placementAligned: "Placement aligned",
    semWiseAttendance: "Semester wise attendance",
    subjectAttendanceHint: "Subject-wise attendance is highlighted in the attendance section.",
    feeProgress: "Scholarship / fee progress",
    feeProgressHint: "Total fees, paid amount, and scholarship support.",
    total: "Total",
    paid: "Paid",
    remaining: "Remaining",
    scholarship: "Scholarship",
    aiInsight: "AI academic insight",
    aiInsightHint: "Generated from attendance, grades, backlog, and assignment data.",
    voiceAssistant: "AI voice assistant",
    voiceAssistantHint: "Ask: What is my attendance? Do I have pending assignments? What is my CGPA?",
    listening: "Listening...",
    mic: "Mic",
    askAssistant: "Ask your academic assistant",
    send: "Send",
    feesAndScholarship: "Fees and scholarship status",
    feesMonitor: "Monitor payment completion and scholarship support.",
    uploadAssignment: "Upload assignment",
    uploadHint: "Record a fresh submission in the portal.",
    assignmentTitle: "Assignment title",
    subject: "Subject",
    fileName: "File name",
    upload: "Upload",
    academicCalendar: "Academic calendar",
    academicCalendarHint: "Weekly academic planner with exams, assignment deadlines, and campus events.",
    upcomingSchedule: "Upcoming schedule",
    placementProfileTitle: "Placement Profile",
    placementProfileHint: "Track coding profiles, resume status, hackathons, and readiness score.",
    placementReadiness: "Placement readiness",
    placementHint: "Based on CGPA, backlogs, and attendance.",
    readinessScore: "Placement readiness score",
    scoreOutOf: "out of 600",
    placementSuggestions: "Placement suggestions",
    updatePlacementProfile: "Update placement profile",
    saveProfile: "Save profile",
    leetcode: "LeetCode",
    codechef: "CodeChef",
    github: "GitHub",
    resume: "Resume",
    hackathons: "Hackathons",
    username: "Username",
    problemsSolved: "Problems solved",
    rating: "Rating",
    stars: "Stars",
    repositories: "Repositories",
    uploaded: "Uploaded",
    notUploaded: "Not uploaded",
    uploadResume: "Upload resume",
    leetcodeUser: "LeetCode username",
    codechefUser: "CodeChef username",
    githubUser: "GitHub username",
    repos: "Repos",
    resumeUploaded: "Resume uploaded",
    hackathonCount: "Hackathon count",
    courseStatus: "Course status",
    completed: "Completed",
    incomplete: "Incomplete",
    warnings: "Warnings and notifications",
    warningsHint: "Attendance notifications are generated automatically when a subject drops below 75%.",
    counsellorRemarks: "Counsellor remarks",
    addRemark: "Add a new counsellor remark",
    saveRemark: "Save remark",
    counsellorDashboard: "Counsellor dashboard",
    studentsLoaded: "students loaded for review.",
    noEvent: "No event",
    noStudentSelected: "No student selected.",
    addCounsellorRemark: "Add counsellor remark for the selected student",
    addRemarkButton: "Add remark",
    marksSubmitted: "Submitted",
    marksPending: "Pending",
    markSubmitted: "Mark submitted",
    assignmentsHint: "Upload assignments, track submissions, and review pending work.",
    language: "Language"
  },
  te: {
    dashboard: "డాష్‌బోర్డ్",
    attendance: "హాజరు",
    fees: "ఫీజులు",
    assignments: "అసైన్‌మెంట్లు",
    calendar: "క్యాలెండర్",
    placement: "ప్లేస్‌మెంట్",
    notifications: "నోటిఫికేషన్లు",
    studentPortal: "విద్యార్థి అకాడెమిక్ పోర్టల్",
    counsellorWorkspace: "కౌన్సిలర్ వర్క్‌స్పేస్",
    currentStatus: "ప్రస్తుత స్థితి",
    lightMode: "లైట్ మోడ్",
    darkMode: "డార్క్ మోడ్",
    logout: "లాగౌట్",
    studentDashboard: "విద్యార్థి డాష్‌బోర్డ్",
    reviewAttendance: "హాజరు చూడండి",
    openAssignments: "అసైన్‌మెంట్లు తెరువు",
    currentCgpa: "ప్రస్తుత CGPA",
    pendingAssignments: "పెండింగ్ అసైన్‌మెంట్లు",
    backlogs: "బ్యాక్‌లాగ్స్",
    healthyAttendance: "మంచి హాజరు",
    allCaughtUp: "అన్నీ పూర్తి",
    submissionNeeded: "సబ్మిషన్ అవసరం",
    needsAttention: "శ్రద్ధ అవసరం",
    placementAligned: "ప్లేస్‌మెంట్‌కు సరైనది",
    semWiseAttendance: "సెమిస్టర్ వారీ హాజరు",
    subjectAttendanceHint: "సబ్జెక్ట్ వారీ హాజరు హాజరు విభాగంలో చూపబడుతుంది.",
    feeProgress: "స్కాలర్‌షిప్ / ఫీజు పురోగతి",
    feeProgressHint: "మొత్తం ఫీజులు, చెల్లించిన మొత్తం, స్కాలర్‌షిప్ మద్దతు.",
    total: "మొత్తం",
    paid: "చెల్లించినది",
    remaining: "మిగిలింది",
    scholarship: "స్కాలర్‌షిప్",
    aiInsight: "AI అకాడెమిక్ సూచనలు",
    aiInsightHint: "హాజరు, గ్రేడ్లు, బ్యాక్‌లాగ్, అసైన్‌మెంట్ల ఆధారంగా రూపొందించబడింది.",
    voiceAssistant: "AI వాయిస్ అసిస్టెంట్",
    voiceAssistantHint: "అడగండి: నా హాజరు ఎంత? పెండింగ్ అసైన్‌మెంట్లు ఉన్నాయా? నా CGPA ఎంత?",
    listening: "వింటోంది...",
    mic: "మైక్",
    askAssistant: "మీ అకాడెమిక్ అసిస్టెంట్‌ను అడగండి",
    send: "పంపు",
    feesAndScholarship: "ఫీజులు మరియు స్కాలర్‌షిప్ స్థితి",
    feesMonitor: "చెల్లింపుల పూర్తి స్థితి, స్కాలర్‌షిప్ మద్దతు చూడండి.",
    uploadAssignment: "అసైన్‌మెంట్ అప్‌లోడ్",
    uploadHint: "పోర్టల్‌లో కొత్త సబ్మిషన్ నమోదు చేయండి.",
    assignmentTitle: "అసైన్‌మెంట్ శీర్షిక",
    subject: "సబ్జెక్ట్",
    fileName: "ఫైల్ పేరు",
    upload: "అప్‌లోడ్",
    academicCalendar: "అకాడెమిక్ క్యాలెండర్",
    academicCalendarHint: "పరీక్షలు, అసైన్‌మెంట్ గడువులు, ఈవెంట్లతో వారాల వారీ ప్లానర్.",
    upcomingSchedule: "రాబోయే షెడ్యూల్",
    placementReadiness: "ప్లేస్‌మెంట్ సిద్ధత",
    placementHint: "CGPA, బ్యాక్‌లాగ్స్, హాజరు ఆధారంగా.",
    courseStatus: "కోర్స్ స్థితి",
    completed: "పూర్తి",
    incomplete: "అసంపూర్తి",
    warnings: "హెచ్చరికలు మరియు నోటిఫికేషన్లు",
    warningsHint: "హాజరు 75% కంటే తక్కువైతే నోటిఫికేషన్లు ఆటోమేటిక్‌గా రూపొందుతాయి.",
    counsellorRemarks: "కౌన్సిలర్ వ్యాఖ్యలు",
    addRemark: "కొత్త కౌన్సిలర్ వ్యాఖ్యను చేర్చండి",
    saveRemark: "వ్యాఖ్యను సేవ్ చేయండి",
    counsellorDashboard: "కౌన్సిలర్ డాష్‌బోర్డ్",
    studentsLoaded: "విద్యార్థుల రికార్డులు లోడ్ అయ్యాయి.",
    noEvent: "ఈవెంట్ లేదు",
    noStudentSelected: "విద్యార్థి ఎంచుకోలేదు.",
    addCounsellorRemark: "ఎంచుకున్న విద్యార్థికి కౌన్సిలర్ వ్యాఖ్యను జోడించండి",
    addRemarkButton: "వ్యాఖ్య జోడించండి",
    marksSubmitted: "సబ్మిట్ అయింది",
    marksPending: "పెండింగ్",
    markSubmitted: "సబ్మిట్‌గా గుర్తించు",
    assignmentsHint: "అసైన్‌మెంట్లు అప్‌లోడ్ చేయండి, ట్రాక్ చేయండి, పెండింగ్ పనిని చూడండి.",
    language: "భాష"
  },
  hi: {
    dashboard: "डैशबोर्ड",
    attendance: "उपस्थिति",
    fees: "फीस",
    assignments: "असाइनमेंट",
    calendar: "कैलेंडर",
    placement: "प्लेसमेंट",
    notifications: "नोटिफिकेशन",
    studentPortal: "स्टूडेंट अकादमिक पोर्टल",
    counsellorWorkspace: "काउंसलर वर्कस्पेस",
    currentStatus: "वर्तमान स्थिति",
    lightMode: "लाइट मोड",
    darkMode: "डार्क मोड",
    logout: "लॉगआउट",
    studentDashboard: "स्टूडेंट डैशबोर्ड",
    reviewAttendance: "उपस्थिति देखें",
    openAssignments: "असाइनमेंट खोलें",
    currentCgpa: "वर्तमान CGPA",
    pendingAssignments: "पेंडिंग असाइनमेंट",
    backlogs: "बैकलॉग",
    healthyAttendance: "अच्छी उपस्थिति",
    allCaughtUp: "सब पूरा",
    submissionNeeded: "सबमिशन आवश्यक",
    needsAttention: "ध्यान आवश्यक",
    placementAligned: "प्लेसमेंट के लिए ठीक",
    semWiseAttendance: "सेमेस्टर अनुसार उपस्थिति",
    subjectAttendanceHint: "विषय अनुसार उपस्थिति उपस्थिति सेक्शन में दिखाई गई है।",
    feeProgress: "स्कॉलरशिप / फीस प्रगति",
    feeProgressHint: "कुल फीस, जमा राशि और स्कॉलरशिप सहायता।",
    total: "कुल",
    paid: "जमा",
    remaining: "बाकी",
    scholarship: "स्कॉलरशिप",
    aiInsight: "AI अकादमिक इनसाइट",
    aiInsightHint: "उपस्थिति, ग्रेड, बैकलॉग और असाइनमेंट डेटा पर आधारित।",
    voiceAssistant: "AI वॉइस असिस्टेंट",
    voiceAssistantHint: "पूछें: मेरी उपस्थिति क्या है? क्या मेरे असाइनमेंट पेंडिंग हैं? मेरा CGPA क्या है?",
    listening: "सुन रहा है...",
    mic: "माइक",
    askAssistant: "अपने अकादमिक असिस्टेंट से पूछें",
    send: "भेजें",
    feesAndScholarship: "फीस और स्कॉलरशिप स्थिति",
    feesMonitor: "पेमेंट प्रोग्रेस और स्कॉलरशिप सहायता देखें।",
    uploadAssignment: "असाइनमेंट अपलोड",
    uploadHint: "पोर्टल में नया सबमिशन दर्ज करें।",
    assignmentTitle: "असाइनमेंट शीर्षक",
    subject: "विषय",
    fileName: "फाइल नाम",
    upload: "अपलोड",
    academicCalendar: "अकादमिक कैलेंडर",
    academicCalendarHint: "परीक्षा, असाइनमेंट डेडलाइन और इवेंट्स के साथ साप्ताहिक प्लानर।",
    upcomingSchedule: "आगामी शेड्यूल",
    placementReadiness: "प्लेसमेंट तैयारी",
    placementHint: "CGPA, बैकलॉग और उपस्थिति के आधार पर।",
    courseStatus: "कोर्स स्थिति",
    completed: "पूर्ण",
    incomplete: "अपूर्ण",
    warnings: "चेतावनी और नोटिफिकेशन",
    warningsHint: "उपस्थिति 75% से कम होने पर नोटिफिकेशन स्वतः बनते हैं।",
    counsellorRemarks: "काउंसलर टिप्पणियाँ",
    addRemark: "नई काउंसलर टिप्पणी जोड़ें",
    saveRemark: "टिप्पणी सेव करें",
    counsellorDashboard: "काउंसलर डैशबोर्ड",
    studentsLoaded: "छात्र रिकॉर्ड लोड हुए।",
    noEvent: "कोई इवेंट नहीं",
    noStudentSelected: "कोई छात्र चयनित नहीं है।",
    addCounsellorRemark: "चयनित छात्र के लिए काउंसलर टिप्पणी जोड़ें",
    addRemarkButton: "टिप्पणी जोड़ें",
    marksSubmitted: "सबमिटेड",
    marksPending: "पेंडिंग",
    markSubmitted: "सबमिटेड मार्क करें",
    assignmentsHint: "असाइनमेंट अपलोड करें, ट्रैक करें और पेंडिंग कार्य देखें।",
    language: "भाषा"
  }
};

const menuItems = [
  { key: "dashboard", labelKey: "dashboard" },
  { key: "attendance", labelKey: "attendance" },
  { key: "fees", labelKey: "fees" },
  { key: "assignments", labelKey: "assignments" },
  { key: "calendar", labelKey: "calendar" },
  { key: "academicProgress", labelKey: "academicProgress" },
  { key: "placement", labelKey: "placement" },
  { key: "notifications", labelKey: "notifications" }
];

const ATTENDANCE_SUBJECT_CATALOGUE = {
  5: [
    { subjectName: "Soft Skills Laboratory", code: "22TP301" },
    { subjectName: "Introduction to Artificial Intelligence", code: "22CS301" },
    { subjectName: "Compiler Design", code: "22CS302" },
    { subjectName: "Web Technologies", code: "22CS303" },
    { subjectName: "Inter-Disciplinary Project - Phase I", code: "22CS304" },
    { subjectName: "Industry Interface Course", code: "22CS305" },
    { subjectName: "Department Elective - 1", code: "DE-1" },
    { subjectName: "NCC/ NSS/ SAC/ E-cell/ Student Mentoring/ Social activities/ Publication", code: "ACT-5" }
  ],
  6: [
    { subjectName: "Quantitative Aptitude and Logical Reasoning", code: "22TP302" },
    { subjectName: "Computer Networks", code: "22CS204" },
    { subjectName: "Data Mining Techniques", code: "22CS306" },
    { subjectName: "Software Engineering", code: "22CS307" },
    { subjectName: "Inter-Disciplinary Project - Phase II", code: "22CS308" },
    { subjectName: "Department Elective - 2", code: "DE-2" }
  ]
};

const normalizeSubjectKey = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "-";

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const buildMonthGrid = (events) => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const days = [];
  const eventMap = events.reduce((acc, event) => {
    const date = new Date(event.date);
    const key = date.toDateString();
    acc[key] = acc[key] || [];
    acc[key].push(event);
    return acc;
  }, {});

  for (let index = 0; index < firstDay.getDay(); index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), day);
    days.push({
      day,
      isToday: date.toDateString() === today.toDateString(),
      events: eventMap[date.toDateString()] || []
    });
  }

  return days;
};

const buildAcademicWeeks = (events) => {
  if (!events.length) {
    return [];
  }

  const sorted = [...events].sort((left, right) => new Date(left.date) - new Date(right.date));
  const start = new Date(sorted[0].date);
  const end = new Date(sorted[sorted.length - 1].date);
  const startDay = start.getDay();
  const sundayStart = new Date(start);
  sundayStart.setDate(start.getDate() - startDay);
  const saturdayEnd = new Date(end);
  saturdayEnd.setDate(end.getDate() + (6 - end.getDay()));

  const eventMap = sorted.reduce((acc, event) => {
    const key = new Date(event.date).toDateString();
    acc[key] = acc[key] || [];
    acc[key].push(event);
    return acc;
  }, {});

  const weeks = [];
  let cursor = new Date(sundayStart);
  let weekNumber = 1;

  while (cursor <= saturdayEnd) {
    const days = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const current = new Date(cursor);
      const key = current.toDateString();
      days.push({
        key,
        label: current.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        events: eventMap[key] || []
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push({ weekLabel: `Week-${weekNumber}`, days });
    weekNumber += 1;
  }

  return weeks;
};

const buildAttendanceDates = () => {
  const dates = [];
  const start = new Date();
  start.setDate(start.getDate() - 11);

  for (let index = 0; index < 12; index += 1) {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    dates.push({
      key: current.toISOString(),
      short: current.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "-")
    });
  }

  return dates;
};

const buildAttendanceMatrix = (semester, semesterNumber) => {
  const dates = buildAttendanceDates();
  const catalogue = ATTENDANCE_SUBJECT_CATALOGUE[semesterNumber] || [];
  const sourceSubjects = catalogue.length
    ? catalogue.map((catalogueSubject) => {
        const matched = (semester?.subjects || []).find((subject) => {
          const sourceName = normalizeSubjectKey(subject.subjectName || subject.name);
          const catalogueName = normalizeSubjectKey(catalogueSubject.subjectName);
          const sourceCode = normalizeSubjectKey(subject.code);
          const catalogueCode = normalizeSubjectKey(catalogueSubject.code);
          return sourceName === catalogueName || (catalogueCode && sourceCode === catalogueCode);
        });

        return matched || {
          subjectName: catalogueSubject.subjectName,
          code: catalogueSubject.code,
          attendance: {
            totalClasses: 0,
            attendedClasses: 0,
            percentage: 0
          }
        };
      })
    : (semester?.subjects || []);

  const subjects = sourceSubjects.map((subject, subjectIndex) => {
    const totalClasses = subject.attendance?.totalClasses || 0;
    const attendedClasses = subject.attendance?.attendedClasses || 0;
    const takenClasses = Math.min(totalClasses, dates.length);
    const pattern = dates.map((date, dateIndex) => {
      if (dateIndex >= takenClasses) {
        return { date: date.short, status: "Not Taken" };
      }

      const pivot = (subjectIndex + (semester?.semesterNumber || 0) + dateIndex) % Math.max(takenClasses, 1);
      const attendedThreshold = Math.max(attendedClasses - Math.max(totalClasses - dates.length, 0), 0);
      return {
        date: date.short,
        status: pivot < attendedThreshold ? "Present" : "Absent"
      };
    });

    return {
      semesterNumber,
      subjectName: subject.subjectName,
      percentage: subject.attendance?.percentage || 0,
      pattern
    };
  });

  return { dates, subjects };
};

const CircularFeeProgress = ({ fees }) => {
  const paidPercent = fees?.totalFees ? Math.round((fees.paidFees / fees.totalFees) * 100) : 0;

  return (
    <div className="fee-progress">
      <svg viewBox="0 0 120 120" className="fee-progress-ring">
        <circle cx="60" cy="60" r="48" className="fee-progress-track" />
        <circle
          cx="60"
          cy="60"
          r="48"
          className="fee-progress-fill"
          style={{
            strokeDasharray: `${2 * Math.PI * 48}`,
            strokeDashoffset: `${2 * Math.PI * 48 * (1 - paidPercent / 100)}`
          }}
        />
      </svg>
      <div className="fee-progress-copy">
        <strong>{paidPercent}% paid</strong>
        <span>{formatCurrency(fees?.remainingFees)} remaining</span>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, note, tone = "default" }) => (
  <article className={`metric-card tone-${tone}`}>
    <span>{label}</span>
    <strong>{value}</strong>
    <small>{note}</small>
  </article>
);

const NotificationList = ({ notifications }) => (
  <div className="stack-list">
    {notifications.map((notification, index) => (
      <div key={`${notification.message}-${index}`} className={`stack-item type-${notification.type}`}>
        <div className="stack-meta">
          <strong>{notification.type}</strong>
          <span>{formatDate(notification.date)}</span>
        </div>
        <p>{notification.message}</p>
      </div>
    ))}
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);
  const role = localStorage.getItem("userRole");
  const rollNumber = localStorage.getItem("studentRollNumber");

  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [activeView, setActiveView] = useState("dashboard");
  const [student, setStudent] = useState(null);
  const [placementProfile, setPlacementProfile] = useState(null);
  const [placementScore, setPlacementScore] = useState(0);
  const [counsellorRows, setCounsellorRows] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [insights, setInsights] = useState([]);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Ask me about attendance, pending assignments, CGPA, fee dues, or placement readiness."
    }
  ]);
  const [question, setQuestion] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [remark, setRemark] = useState("");
  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    subject: "",
    deadline: "",
    fileName: ""
  });
  const [placementForm, setPlacementForm] = useState({
    leetcodeUsername: "",
    leetcodeProblemsSolved: 0,
    leetcodeRating: 0,
    codechefUsername: "",
    codechefRating: 0,
    codechefStars: 0,
    githubUsername: "",
    githubRepos: 0,
    resumeUploaded: false,
    hackathons: 0
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("portalLanguage", language);
  }, [language]);

  const t = (key) => translations[language]?.[key] || translations.en[key] || key;

  useEffect(() => {
    if (!placementProfile) {
      return;
    }

    setPlacementForm({
      leetcodeUsername: placementProfile.leetcode?.username || "",
      leetcodeProblemsSolved: placementProfile.leetcode?.problemsSolved || 0,
      leetcodeRating: placementProfile.leetcode?.rating || 0,
      codechefUsername: placementProfile.codechef?.username || "",
      codechefRating: placementProfile.codechef?.rating || 0,
      codechefStars: placementProfile.codechef?.stars || 0,
      githubUsername: placementProfile.github?.username || "",
      githubRepos: placementProfile.github?.repos || 0,
      resumeUploaded: placementProfile.resumeUploaded || false,
      hackathons: placementProfile.hackathons || 0
    });
  }, [placementProfile]);

  useEffect(() => {
    if (!role) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        if (role === "counsellor") {
          const response = await axios.get(`${API_BASE}/api/counsellor/dashboard`);
          setCounsellorRows(response.data.students || []);
          setSelectedStudent(response.data.students?.[0] || null);
        } else {
          const [dashboardResponse, insightResponse] = await Promise.all([
            axios.get(`${API_BASE}/api/student/dashboard`, { params: { rollNumber } }),
            axios.post(`${API_BASE}/api/ai/insights`, { rollNumber })
          ]);
          const dashboardData = dashboardResponse.data.data;
          setStudent(dashboardData);
          setInsights(insightResponse.data.insights || []);
          setPlacementProfile(dashboardData.placementProfile || null);
          setPlacementScore(dashboardData.placementScore || dashboardData.placementProfile?.placementScore || 0);
        }
      } catch (fetchError) {
        console.error(fetchError);
        setError("Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, role, rollNumber]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return undefined;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuestion(transcript);
      askAssistant(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;

    return () => recognition.stop();
  }, [rollNumber]);

  const attendanceTrendData = useMemo(() => {
    const source = student?.semesterAttendance || [];
    return {
      labels: source.map((item) => `Sem ${item.semesterNumber}`),
      datasets: [
        {
          label: "Attendance %",
          data: source.map((item) => item.averageAttendance),
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.18)",
          tension: 0.35,
          fill: true
        }
      ]
    };
  }, [student]);

  const cgpaGaugeData = useMemo(() => {
    const cgpa = Number(student?.cgpa || 0);
    return {
      labels: ["CGPA", "Gap"],
      datasets: [
        {
          data: [cgpa, Math.max(10 - cgpa, 0)],
          backgroundColor: ["#0f766e", "rgba(148, 163, 184, 0.18)"],
          borderWidth: 0
        }
      ]
    };
  }, [student]);

  const placementGaugeData = useMemo(
    () => ({
      labels: ["Score", "Remaining"],
      datasets: [
        {
          data: [placementScore, Math.max(600 - placementScore, 0)],
          backgroundColor: ["#f59e0b", "rgba(148, 163, 184, 0.18)"],
          borderWidth: 0
        }
      ]
    }),
    [placementScore]
  );

  const currentData = role === "counsellor" ? selectedStudent : student;
  const currentSemesterNumber = Number(student?.semester || 6);
  const currentSemesterAttendance = useMemo(
    () => {
      const semesterFromAttendance = student?.semesterAttendance?.find(
        (semester) => Number(semester.semesterNumber) === currentSemesterNumber
      );
      const semesterFromSemesters = student?.semesters?.find(
        (semester) => Number(semester.semesterNumber) === currentSemesterNumber
      );

      return semesterFromAttendance || semesterFromSemesters || {
        semesterNumber: currentSemesterNumber,
        subjects: []
      };
    },
    [student, currentSemesterNumber]
  );
  const events = useMemo(
    () => (student?.academicCalendar || []).slice().sort((left, right) => new Date(left.date) - new Date(right.date)),
    [student]
  );
  const calendarDays = useMemo(() => buildMonthGrid(events), [events]);
  const academicWeeks = useMemo(() => buildAcademicWeeks(events), [events]);
  const attendanceAtRisk = student?.lowAttendanceSubjects || [];
  const pendingAssignments = student?.pendingAssignments || [];
  const attendanceMatrix = useMemo(
    () => buildAttendanceMatrix(currentSemesterAttendance, currentSemesterNumber),
    [currentSemesterAttendance, currentSemesterNumber]
  );
  const currentSemesterAttendanceSummary = useMemo(() => {
    const subjects = attendanceMatrix.subjects || [];
    const averageAttendance = subjects.length
      ? Math.round(subjects.reduce((sum, subject) => sum + Number(subject.percentage || 0), 0) / subjects.length)
      : 0;

    return {
      semesterNumber: currentSemesterNumber,
      subjects,
      averageAttendance
    };
  }, [attendanceMatrix, currentSemesterNumber]);
  const placementSuggestions = useMemo(
    () =>
      insights.filter((insight) =>
        /leetcode|resume|github|placement|dsa/i.test(insight)
      ),
    [insights]
  );

  const toggleTheme = () => setTheme((current) => (current === "dark" ? "light" : "dark"));

  const logout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("studentRollNumber");
    localStorage.removeItem("parentPhone");
    localStorage.removeItem("counsellorEmail");
    navigate("/");
  };

  const askAssistant = async (text) => {
    if (!text?.trim() || role !== "student") {
      return;
    }

    setMessages((current) => [...current, { role: "user", text }]);
    setQuestion("");

    try {
      const response = await axios.post(`${API_BASE}/api/ai/query`, {
        rollNumber,
        message: text
      });
      setMessages((current) => [...current, { role: "assistant", text: response.data.reply }]);
    } catch (requestError) {
      console.error(requestError);
      setMessages((current) => [
        ...current,
        { role: "assistant", text: "I could not complete that request right now." }
      ]);
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not available in this browser.");
      return;
    }
    setIsListening(true);
    recognitionRef.current.start();
  };

  const refreshStudent = async () => {
    const response = await axios.get(`${API_BASE}/api/student/dashboard`, { params: { rollNumber } });
    const dashboardData = response.data.data;
    setStudent(dashboardData);
    setPlacementProfile(dashboardData.placementProfile || null);
    setPlacementScore(dashboardData.placementScore || dashboardData.placementProfile?.placementScore || 0);
  };

  const submitAssignment = async (assignmentId) => {
    try {
      await axios.post(`${API_BASE}/api/student/assignments/${assignmentId}/submit`, {
        rollNumber,
        fileName: "submitted-from-portal.pdf"
      });
      await refreshStudent();
    } catch (requestError) {
      console.error(requestError);
      alert("Unable to update assignment.");
    }
  };

  const uploadAssignment = async (event) => {
    event.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/student/assignments/upload`, {
        rollNumber,
        ...assignmentForm
      });
      await refreshStudent();
      setAssignmentForm({ title: "", subject: "", deadline: "", fileName: "" });
    } catch (requestError) {
      console.error(requestError);
      alert("Unable to upload assignment.");
    }
  };

  const savePlacementProfile = async (event) => {
    event.preventDefault();
    try {
      await axios.post(`${API_BASE}/placement-profile/update`, {
        rollNumber,
        leetcode: {
          username: placementForm.leetcodeUsername,
          problemsSolved: Number(placementForm.leetcodeProblemsSolved),
          rating: Number(placementForm.leetcodeRating)
        },
        codechef: {
          username: placementForm.codechefUsername,
          rating: Number(placementForm.codechefRating),
          stars: Number(placementForm.codechefStars)
        },
        github: {
          username: placementForm.githubUsername,
          repos: Number(placementForm.githubRepos)
        },
        resumeUploaded: placementForm.resumeUploaded,
        hackathons: Number(placementForm.hackathons)
      });
      await refreshStudent();
    } catch (requestError) {
      console.error(requestError);
      alert("Unable to update placement profile.");
    }
  };

  const addRemark = async (event) => {
    event.preventDefault();
    const targetRollNumber = role === "counsellor" ? selectedStudent?.rollNumber : rollNumber;
    if (!targetRollNumber || !remark.trim()) {
      return;
    }

    try {
      await axios.post(`${API_BASE}/api/student/remarks`, {
        rollNumber: targetRollNumber,
        counsellorName: role === "counsellor" ? "Academic Counsellor" : "Self note",
        remark
      });

      if (role === "student") {
        await refreshStudent();
      } else {
        const response = await axios.get(`${API_BASE}/api/counsellor/dashboard`);
        setCounsellorRows(response.data.students || []);
        setSelectedStudent(
          response.data.students.find((item) => item.rollNumber === targetRollNumber) || response.data.students[0]
        );
      }

      setRemark("");
    } catch (requestError) {
      console.error(requestError);
      alert("Unable to save remark.");
    }
  };

  const renderDashboardHome = () => (
    <div className="portal-grid">
      <section className="panel hero-panel">
        <div>
          <p className="panel-tag">{t("studentDashboard")}</p>
          <h1>{student?.name}</h1>
          <p className="hero-copy">
            {student?.department} | Semester {student?.semester} | {student?.placementStatus}
          </p>
        </div>
        <div className="hero-actions">
          <button className="primary-button" onClick={() => setActiveView("attendance")}>
            {t("reviewAttendance")}
          </button>
          <button className="ghost-button" onClick={() => setActiveView("assignments")}>
            {t("openAssignments")}
          </button>
        </div>
      </section>

      <section className="metric-grid">
        <MetricCard label={t("currentCgpa")} value={student?.cgpa} note={student?.placementStatus} tone="primary" />
        <MetricCard
          label={t("attendance")}
          value={`${student?.attendancePercentage || 0}%`}
          note={attendanceAtRisk.length ? `${attendanceAtRisk.length} subject warning(s)` : t("healthyAttendance")}
          tone={attendanceAtRisk.length ? "danger" : "success"}
        />
        <MetricCard
          label={t("pendingAssignments")}
          value={pendingAssignments.length}
          note={pendingAssignments.length ? t("submissionNeeded") : t("allCaughtUp")}
          tone={pendingAssignments.length ? "warning" : "success"}
        />
        <MetricCard
          label={t("backlogs")}
          value={student?.backlogs || 0}
          note={student?.placementReady ? t("placementAligned") : t("needsAttention")}
          tone={student?.backlogs ? "danger" : "success"}
        />
      </section>

      <section className="panel chart-panel">
        <div className="panel-head">
          <div>
            <h2>{t("semWiseAttendance")}</h2>
            <p>{t("subjectAttendanceHint")}</p>
          </div>
        </div>
        <div className="line-chart-wrap">
          <Line
            data={attendanceTrendData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { min: 0, max: 100, grid: { color: "rgba(148, 163, 184, 0.18)" } },
                x: { grid: { display: false } }
              }
            }}
          />
        </div>
      </section>

      <section className="panel fee-panel">
        <div className="panel-head">
          <div>
            <h2>{t("feeProgress")}</h2>
            <p>{t("feeProgressHint")}</p>
          </div>
        </div>
        <CircularFeeProgress fees={student?.fees} />
        <div className="summary-block">
          <div><span>{t("total")}</span><strong>{formatCurrency(student?.fees?.totalFees)}</strong></div>
          <div><span>{t("paid")}</span><strong>{formatCurrency(student?.fees?.paidFees)}</strong></div>
          <div><span>{t("remaining")}</span><strong>{formatCurrency(student?.fees?.remainingFees)}</strong></div>
          <div><span>{t("scholarship")}</span><strong>{formatCurrency(student?.fees?.scholarship)}</strong></div>
        </div>
      </section>

      <section className="panel insight-panel">
        <div className="panel-head">
          <div>
            <h2>{t("aiInsight")}</h2>
            <p>{t("aiInsightHint")}</p>
          </div>
        </div>
        <div className="bullet-list">
          {insights.map((insight, index) => (
            <div key={`${insight}-${index}`} className="bullet-item">
              {insight.replace(/^[-*]\s*/, "")}
            </div>
          ))}
        </div>
      </section>

      <section className="panel assistant-panel">
        <div className="panel-head">
          <div>
            <h2>{t("voiceAssistant")}</h2>
            <p>{t("voiceAssistantHint")}</p>
          </div>
          <button className={`mic-button ${isListening ? "listening" : ""}`} onClick={startListening}>
            {isListening ? t("listening") : t("mic")}
          </button>
        </div>
        <div className="chat-window">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`chat-bubble ${message.role}`}>
              {message.text}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="chat-compose">
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={t("askAssistant")}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                askAssistant(question);
              }
            }}
          />
          <button className="primary-button" onClick={() => askAssistant(question)}>
            {t("send")}
          </button>
        </div>
      </section>
    </div>
  );

  const renderAttendance = () => (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>{t("semWiseAttendance")}</h2>
            <p>
              Showing subjects from Semester {currentSemesterNumber} with date-wise attendance status.
            </p>
          </div>
        </div>
        <div className="attendance-report-wrap">
          <div className="attendance-report-table">
            <div className="attendance-report-header">
              <div className="attendance-subject-cell heading">Subject</div>
              {attendanceMatrix.dates.map((date) => (
                <div key={date.key} className="attendance-date-cell heading">
                  {date.short}
                </div>
              ))}
              <div className="attendance-summary-cell heading">Summary</div>
            </div>

            {attendanceMatrix.subjects.map((subject) => {
              const low = subject.percentage < 75;
              return (
                <div key={`${subject.semesterNumber}-${subject.subjectName}`} className={`attendance-report-row ${low ? "risk" : ""}`}>
                  <div className="attendance-subject-cell">
                    <strong>{subject.subjectName}</strong>
                    <span>Sem {subject.semesterNumber}</span>
                  </div>

                  {subject.pattern.map((entry, index) => (
                    <div key={`${subject.subjectName}-${entry.date}-${index}`} className="attendance-date-cell">
                      <span className={`attendance-pill ${entry.status.toLowerCase().replace(/\s+/g, "-")}`}>
                        {entry.status}
                      </span>
                    </div>
                  ))}

                  <div className="attendance-summary-cell">
                    <strong>{subject.percentage}%</strong>
                    <span>{low ? "Below 75%" : "On track"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="attendance-summary-grid">
          {currentSemesterAttendanceSummary ? (
            <article key={currentSemesterAttendanceSummary.semesterNumber} className="semester-card">
              <div className="semester-header">
                <strong>Semester {currentSemesterAttendanceSummary.semesterNumber}</strong>
                <span>{currentSemesterAttendanceSummary.averageAttendance}% average</span>
              </div>
              <div className="summary-block compact">
                <div><span>Subjects</span><strong>{currentSemesterAttendanceSummary.subjects.length}</strong></div>
                <div><span>Low attendance</span><strong>{currentSemesterAttendanceSummary.subjects.filter((subject) => Number(subject.percentage || 0) < 75).length}</strong></div>
              </div>
            </article>
          ) : (
            <article className="semester-card">
              <div className="semester-header">
                <strong>Semester {currentSemesterNumber}</strong>
                <span>No attendance data</span>
              </div>
            </article>
          )}
        </div>
      </section>
    </div>
  );

  const renderFees = () => (
    <div className="page-stack">
      <section className="panel fees-layout">
        <div>
          <h2>{t("feesAndScholarship")}</h2>
          <p>{t("feesMonitor")}</p>
          <div className="summary-block">
            <div><span>{t("total")}</span><strong>{formatCurrency(student?.fees?.totalFees)}</strong></div>
            <div><span>{t("paid")}</span><strong>{formatCurrency(student?.fees?.paidFees)}</strong></div>
            <div><span>{t("remaining")}</span><strong>{formatCurrency(student?.fees?.remainingFees)}</strong></div>
            <div><span>{t("scholarship")}</span><strong>{formatCurrency(student?.fees?.scholarship)}</strong></div>
          </div>
        </div>
        <CircularFeeProgress fees={student?.fees} />
      </section>
    </div>
  );

  const renderAssignments = () => (
    <div className="page-stack assignments-layout">
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>{t("assignments")}</h2>
            <p>{t("assignmentsHint")}</p>
          </div>
        </div>
        <div className="stack-list">
          {(student?.assignments || []).map((assignment) => (
            <article key={assignment._id} className="stack-item">
              <div className="stack-meta">
                <strong>{assignment.title}</strong>
                <span>{formatDate(assignment.deadline)}</span>
              </div>
              <p>{assignment.subject}</p>
              <div className="assignment-actions">
                <span className={`status-pill ${assignment.submitted ? "ok" : "warn"}`}>
                  {assignment.submitted ? t("marksSubmitted") : t("marksPending")}
                </span>
                {!assignment.submitted && (
                  <button className="ghost-button" onClick={() => submitAssignment(assignment._id)}>
                    {t("markSubmitted")}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>{t("uploadAssignment")}</h2>
            <p>{t("uploadHint")}</p>
          </div>
        </div>
        <form className="form-grid" onSubmit={uploadAssignment}>
          <input placeholder={t("assignmentTitle")} value={assignmentForm.title} onChange={(event) => setAssignmentForm((current) => ({ ...current, title: event.target.value }))} />
          <input placeholder={t("subject")} value={assignmentForm.subject} onChange={(event) => setAssignmentForm((current) => ({ ...current, subject: event.target.value }))} />
          <input type="date" value={assignmentForm.deadline} onChange={(event) => setAssignmentForm((current) => ({ ...current, deadline: event.target.value }))} />
          <input placeholder={t("fileName")} value={assignmentForm.fileName} onChange={(event) => setAssignmentForm((current) => ({ ...current, fileName: event.target.value }))} />
          <button className="primary-button" type="submit">{t("upload")}</button>
        </form>
      </section>
    </div>
  );

  const renderCalendar = () => (
    <div className="page-stack calendar-layout">
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>{t("academicCalendar")}</h2>
            <p>{t("academicCalendarHint")}</p>
          </div>
        </div>
        {academicWeeks.length ? (
          <div className="academic-calendar-table">
            <div className="academic-calendar-header academic-calendar-row">
              <div className="academic-week-cell">Week</div>
              {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                <div key={day} className="academic-day-cell header">{day}</div>
              ))}
            </div>

            {academicWeeks.map((week) => (
              <div key={week.weekLabel} className="academic-calendar-row">
                <div className="academic-week-cell">{week.weekLabel}</div>
                {week.days.map((day) => (
                  <div key={day.key} className={`academic-day-cell ${day.events.length ? "filled" : ""}`}>
                    <div className="academic-date">{day.label}</div>
                    <div className="academic-day-events">
                      {day.events.length ? (
                        day.events.map((event, eventIndex) => (
                          <div key={`${event.title}-${eventIndex}`} className={`academic-chip ${event.type}`}>
                            {event.title}
                          </div>
                        ))
                      ) : (
                        <span className="academic-empty">{t("noEvent")}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="calendar-grid">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="calendar-day-label">{day}</div>
            ))}
            {calendarDays.map((entry, index) => (
              <div key={`${entry?.day || "blank"}-${index}`} className={`calendar-cell ${entry?.isToday ? "today" : ""}`}>
                {entry ? (
                  <>
                    <strong>{entry.day}</strong>
                    <div className="calendar-dots">
                      {entry.events.slice(0, 3).map((event, eventIndex) => (
                        <span key={`${event.title}-${eventIndex}`} className={`calendar-dot ${event.type}`} />
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>{t("upcomingSchedule")}</h2>
        <div className="stack-list">
          {events.map((event, index) => (
            <div key={`${event.title}-${index}`} className="stack-item">
              <div className="stack-meta">
                <strong>{event.title}</strong>
                <span>{formatDate(event.date)}</span>
              </div>
              <p>{event.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const renderPlacementProfile = () => (
    <div className="page-stack placement-profile-layout">
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>{t("placementProfileTitle")}</h2>
            <p>{t("placementProfileHint")}</p>
          </div>
        </div>

        <div className="placement-card-grid">
          <article className="profile-stat-card">
            <h3>{t("leetcode")}</h3>
            <div className="summary-block compact">
              <div><span>{t("username")}</span><strong>{student?.placementProfile?.leetcode?.username || "-"}</strong></div>
              <div><span>{t("problemsSolved")}</span><strong>{student?.placementProfile?.leetcode?.problemsSolved || 0}</strong></div>
              <div><span>{t("rating")}</span><strong>{student?.placementProfile?.leetcode?.rating || 0}</strong></div>
            </div>
          </article>

          <article className="profile-stat-card">
            <h3>{t("codechef")}</h3>
            <div className="summary-block compact">
              <div><span>{t("username")}</span><strong>{student?.placementProfile?.codechef?.username || "-"}</strong></div>
              <div><span>{t("rating")}</span><strong>{student?.placementProfile?.codechef?.rating || 0}</strong></div>
              <div><span>{t("stars")}</span><strong>{student?.placementProfile?.codechef?.stars || 0}</strong></div>
            </div>
          </article>

          <article className="profile-stat-card">
            <h3>{t("github")}</h3>
            <div className="summary-block compact">
              <div><span>{t("username")}</span><strong>{student?.placementProfile?.github?.username || "-"}</strong></div>
              <div><span>{t("repositories")}</span><strong>{student?.placementProfile?.github?.repos || 0}</strong></div>
              <div><span>{t("hackathons")}</span><strong>{student?.placementProfile?.hackathons || 0}</strong></div>
            </div>
          </article>

          <article className="profile-stat-card">
            <h3>{t("resume")}</h3>
            <div className="summary-block compact">
              <div><span>{t("resumeUploaded")}</span><strong>{student?.placementProfile?.resumeUploaded ? t("uploaded") : t("notUploaded")}</strong></div>
              <div><span>{t("placement")}</span><strong>{student?.placementStatus}</strong></div>
              <div><span>{t("backlogs")}</span><strong>{student?.backlogs || 0}</strong></div>
            </div>
          </article>
        </div>
      </section>

      <section className="panel placement-score-panel">
        <div className="panel-head">
          <div>
            <h2>{t("readinessScore")}</h2>
            <p>{t("scoreOutOf")}</p>
          </div>
        </div>
        <div className="semi-gauge-wrap">
          <Doughnut
            data={placementGaugeData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              cutout: "72%",
              rotation: -90,
              circumference: 180,
              plugins: { legend: { display: false } }
            }}
          />
          <div className="semi-gauge-center">
            <strong>{placementScore}</strong>
            <span>{t("scoreOutOf")}</span>
          </div>
        </div>

        <div className="bullet-list">
          {(placementSuggestions.length ? placementSuggestions : insights.slice(0, 3)).map((insight, index) => (
            <div key={`${insight}-${index}`} className="bullet-item">
              {insight.replace(/^[-*]\s*/, "")}
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>{t("updatePlacementProfile")}</h2>
            <p>{t("placementProfileHint")}</p>
          </div>
        </div>

        <form className="placement-form-grid" onSubmit={savePlacementProfile}>
          <input placeholder={t("leetcodeUser")} value={placementForm.leetcodeUsername} onChange={(event) => setPlacementForm((current) => ({ ...current, leetcodeUsername: event.target.value }))} />
          <input type="number" placeholder={t("problemsSolved")} value={placementForm.leetcodeProblemsSolved} onChange={(event) => setPlacementForm((current) => ({ ...current, leetcodeProblemsSolved: event.target.value }))} />
          <input type="number" placeholder={t("rating")} value={placementForm.leetcodeRating} onChange={(event) => setPlacementForm((current) => ({ ...current, leetcodeRating: event.target.value }))} />
          <input placeholder={t("codechefUser")} value={placementForm.codechefUsername} onChange={(event) => setPlacementForm((current) => ({ ...current, codechefUsername: event.target.value }))} />
          <input type="number" placeholder={t("rating")} value={placementForm.codechefRating} onChange={(event) => setPlacementForm((current) => ({ ...current, codechefRating: event.target.value }))} />
          <input type="number" placeholder={t("stars")} value={placementForm.codechefStars} onChange={(event) => setPlacementForm((current) => ({ ...current, codechefStars: event.target.value }))} />
          <input placeholder={t("githubUser")} value={placementForm.githubUsername} onChange={(event) => setPlacementForm((current) => ({ ...current, githubUsername: event.target.value }))} />
          <input type="number" placeholder={t("repos")} value={placementForm.githubRepos} onChange={(event) => setPlacementForm((current) => ({ ...current, githubRepos: event.target.value }))} />
          <input type="number" placeholder={t("hackathonCount")} value={placementForm.hackathons} onChange={(event) => setPlacementForm((current) => ({ ...current, hackathons: event.target.value }))} />

          <label className="checkbox-card">
            <input
              type="checkbox"
              checked={placementForm.resumeUploaded}
              onChange={(event) => setPlacementForm((current) => ({ ...current, resumeUploaded: event.target.checked }))}
            />
            <span>{placementForm.resumeUploaded ? t("uploaded") : t("uploadResume")}</span>
          </label>

          <button className="primary-button" type="submit">
            {t("saveProfile")}
          </button>
        </form>
      </section>
    </div>
  );

  const renderPlacement = () => (
    <div className="page-stack placement-layout">
      <section className="panel placement-hero">
        <div>
          <h2>{t("placementReadiness")}</h2>
          <p>{t("placementHint")}</p>
        </div>
        <div className={`placement-badge ${student?.placementStatus === "Placement Ready" ? "ready" : "not-ready"}`}>
          {student?.placementStatus}
        </div>
      </section>

      <section className="panel placement-grid">
        <div className="gauge-card">
          <h3>CGPA progress</h3>
          <div className="gauge-wrap">
            <Doughnut
              data={cgpaGaugeData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: "75%",
                plugins: { legend: { display: false } }
              }}
            />
            <div className="gauge-center">
              <strong>{student?.cgpa}</strong>
              <span>/ 10</span>
            </div>
          </div>
        </div>

        <div className="course-card">
          <h3>{t("courseStatus")}</h3>
          <div className="summary-block">
            <div><span>{t("completed")}</span><strong>{student?.completedSubjects?.length || 0}</strong></div>
            <div><span>{t("incomplete")}</span><strong>{student?.incompleteSubjects?.length || 0}</strong></div>
            <div><span>{t("backlogs")}</span><strong>{student?.backlogs || 0}</strong></div>
            <div><span>{t("attendance")}</span><strong>{student?.attendancePercentage || 0}%</strong></div>
          </div>
        </div>
      </section>
    </div>
  );

  const renderAcademicProgress = () => <AcademicProgress student={student} />;

  const renderNotifications = () => (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>{t("warnings")}</h2>
            <p>{t("warningsHint")}</p>
          </div>
        </div>
        <NotificationList notifications={student?.notifications || []} />
      </section>

      <section className="panel">
        <h2>{t("counsellorRemarks")}</h2>
        <div className="stack-list">
          {(student?.remarks || []).map((item, index) => (
            <div key={`${item.remark}-${index}`} className="stack-item">
              <div className="stack-meta">
                <strong>{item.counsellorName}</strong>
                <span>{formatDate(item.date)}</span>
              </div>
              <p>{item.remark}</p>
            </div>
          ))}
        </div>
        <form className="remark-form" onSubmit={addRemark}>
          <textarea value={remark} onChange={(event) => setRemark(event.target.value)} placeholder={t("addRemark")} />
          <button className="primary-button" type="submit">{t("saveRemark")}</button>
        </form>
      </section>
    </div>
  );

  const renderCounsellorDashboard = () => (
    <div className="page-stack counsellor-layout">
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>{t("counsellorDashboard")}</h2>
            <p>{counsellorRows.length} {t("studentsLoaded")}</p>
          </div>
        </div>
        <div className="counsellor-table">
          <div className="counsellor-row head">
            <span>Student</span>
            <span>Attendance</span>
            <span>CGPA</span>
            <span>Assignments</span>
            <span>Placement</span>
          </div>
          {counsellorRows.map((row) => (
            <button
              key={row.rollNumber}
              type="button"
              className={`counsellor-row ${selectedStudent?.rollNumber === row.rollNumber ? "active" : ""}`}
              onClick={() => setSelectedStudent(row)}
            >
              <span>{row.name}</span>
              <span>{row.attendancePercentage}%</span>
              <span>{row.cgpa}</span>
              <span>{row.pendingAssignments}</span>
              <span>{row.placementStatus}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        {selectedStudent ? (
          <>
            <div className="panel-head">
              <div>
                <h2>{selectedStudent.name}</h2>
                <p>{selectedStudent.rollNumber} | {selectedStudent.department} | Semester {selectedStudent.semester}</p>
              </div>
            </div>
            <div className="summary-block">
              <div><span>Attendance</span><strong>{selectedStudent.attendancePercentage}%</strong></div>
              <div><span>CGPA</span><strong>{selectedStudent.cgpa}</strong></div>
              <div><span>Pending assignments</span><strong>{selectedStudent.pendingAssignments}</strong></div>
              <div><span>Backlogs</span><strong>{selectedStudent.backlogs}</strong></div>
            </div>
            <div className="stack-list">
              {(selectedStudent.remarks || []).map((item, index) => (
                <div key={`${item.remark}-${index}`} className="stack-item">
                  <div className="stack-meta">
                    <strong>{item.counsellorName}</strong>
                    <span>{formatDate(item.date)}</span>
                  </div>
                  <p>{item.remark}</p>
                </div>
              ))}
            </div>
            <form className="remark-form" onSubmit={addRemark}>
              <textarea value={remark} onChange={(event) => setRemark(event.target.value)} placeholder="Add counsellor remark for the selected student" />
              <button className="primary-button" type="submit">Add remark</button>
            </form>
          </>
        ) : (
          <p>{t("noStudentSelected")}</p>
        )}
      </section>
    </div>
  );

  const renderContent = () => {
    if (role === "counsellor") {
      return renderCounsellorDashboard();
    }

    switch (activeView) {
      case "attendance":
        return renderAttendance();
      case "fees":
        return renderFees();
      case "assignments":
        return renderAssignments();
      case "calendar":
        return renderCalendar();
      case "academicProgress":
        return renderAcademicProgress();
      case "placement":
        return renderPlacement();
      case "notifications":
        return renderNotifications();
      default:
        return renderDashboardHome();
    }
  };

  if (loading) {
    return <div className="state-screen">Loading portal data...</div>;
  }

  if (error) {
    return <div className="state-screen error">{error}</div>;
  }

  return (
    <div className="portal-shell">
      <aside className="portal-sidebar">
        <div className="brand-block">
          <span className="brand-mark">ST</span>
          <div>
            <strong>StudyTracker</strong>
            <small>{role === "counsellor" ? t("counsellorWorkspace") : t("studentPortal")}</small>
          </div>
        </div>

        <div className="language-picker">
          <label htmlFor="portal-language">{t("language")}</label>
          <select id="portal-language" value={language} onChange={(event) => setLanguage(event.target.value)}>
            <option value="en">English</option>
            <option value="te">Telugu</option>
            <option value="hi">Hindi</option>
          </select>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.key}
              className={activeView === item.key ? "nav-link active" : "nav-link"}
              onClick={() => setActiveView(item.key)}
              type="button"
              disabled={role === "counsellor"}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </nav>

        <div className="sidebar-card">
          <p className="sidebar-kicker">{t("currentStatus")}</p>
          <strong>{currentData?.name || "Counsellor"}</strong>
          <span>{currentData?.rollNumber || localStorage.getItem("counsellorEmail")}</span>
          {role === "student" && <span>{currentData?.placementStatus}</span>}
        </div>

        <div className="sidebar-actions">
          <button className="ghost-button" onClick={toggleTheme} type="button">
            {theme === "dark" ? t("lightMode") : t("darkMode")}
          </button>
          <button className="ghost-button" onClick={logout} type="button">
            {t("logout")}
          </button>
        </div>
      </aside>

      <main className="portal-main">{renderContent()}</main>
    </div>
  );
}
