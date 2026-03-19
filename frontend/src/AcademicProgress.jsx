import React, { useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const SEMESTER_SUBJECT_CATALOGUE = {
  1: [
    { name: "Linear Algebra and Ordinary Differential Equations", code: "22MT103" },
    { name: "Semiconductor Physics and Electromagnetics", code: "22PY105" },
    { name: "Basics of Electrical and Electronics Engineering", code: "22EE101" },
    { name: "Engineering Chemistry", code: "22CT103" },
    { name: "Problem Solving through Programming - I", code: "22TP105" },
    { name: "English Proficiency and Communication Skills", code: "22EN102" },
    { name: "Constitution of India", code: "22TP101" },
    { name: "Physical Fitness, Sports and Games - I", code: "22SA101" },
  ],
  2: [
    { name: "Algebra", code: "22MT106" },
    { name: "Discrete Mathematical Structures", code: "22MT107" },
    { name: "Engineering Graphics", code: "22ME101" },
    { name: "Problem Solving through Programming - II", code: "22TP106" },
    { name: "Technical English Communication", code: "22EN104" },
    { name: "Numerical Methods", code: "22MT108" },
    { name: "Orientation Session", code: "22SA102" },
    { name: "Physical Fitness, Sports and Games - II", code: "22SA103" },
  ],
  3: [
    { name: "Probability and Statistics", code: "22ST202" },
    { name: "Data Structures", code: "22TP201" },
    { name: "Management Science", code: "22MS201" },
    { name: "Database Management Systems", code: "22CS201" },
    { name: "Digital Logic Design", code: "22CS202" },
    { name: "Object-Oriented Programming through JAVA", code: "22CS203" },
    { name: "Environmental Studies", code: "22CT201" },
    { name: "Life Skills - I", code: "22SA201" },
  ],
  4: [
    { name: "Advanced Coding Competency", code: "22TP203" },
    { name: "Professional Communication", code: "22TP204" },
    { name: "Computer Organization and Architecture", code: "22CS205" },
    { name: "Design and Analysis of Algorithms", code: "22CS206" },
    { name: "Operating Systems", code: "22CS207" },
    { name: "Theory of Computation", code: "22CS208" },
    { name: "Life Skills - II", code: "22SA202" },
  ],
  5: [
    { name: "Soft Skills Laboratory", code: "22TP301" },
    { name: "Introduction to Artificial Intelligence", code: "22CS301" },
    { name: "Compiler Design", code: "22CS302" },
    { name: "Web Technologies", code: "22CS303" },
    { name: "Inter-Disciplinary Project - Phase I", code: "22CS304" },
    { name: "Industry Interface Course", code: "22CS305" },
    { name: "Department Elective - 1", code: "DE-1" },
    { name: "NCC/ NSS/ SAC/ E-cell/ Student Mentoring/ Social activities/ Publication", code: "ACT-5" },
  ],
  6: [
    { name: "Quantitative Aptitude and Logical Reasoning", code: "22TP302" },
    { name: "Computer Networks", code: "22CS204" },
    { name: "Data Mining Techniques", code: "22CS306" },
    { name: "Software Engineering", code: "22CS307" },
    { name: "Inter-Disciplinary Project - Phase II", code: "22CS308" },
    { name: "Department Elective - 2", code: "DE-2" },
  ],
};

const COURSE_MILESTONES = {
  1: 30,
  2: 46,
  3: 69,
  4: 85,
  5: 99,
  6: 108,
  7: 117,
  8: 180,
};

const TOTAL_PROGRAM_MILESTONE = 180;
const FIXED_CURRENT_SEMESTER = 6;
const FIXED_COMPLETED_SEMESTERS = 5;

const getGradeFromMarks = (marks) => (
  marks >= 90 ? "O" :
  marks >= 80 ? "A+" :
  marks >= 70 ? "A" :
  marks >= 60 ? "B+" :
  marks >= 50 ? "B" : "C"
);

const escapeForFilename = (value = "") =>
  String(value)
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_\-]/g, "")
    .substring(0, 40);

const normalizeSubjectValue = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const buildCgpaHistory = (student, currentSemester, cgpa) => {
  const semesterWise = Array.isArray(student?.cgpa?.semesterWise)
    ? student.cgpa.semesterWise.map((entry, index) => ({
        semesterNumber: Number(entry?.semesterNumber ?? index + 1),
        cgpa: Number(entry?.cgpa ?? 0),
      }))
    : [];

  if (semesterWise.length) {
    return semesterWise;
  }

  const count = Math.max(1, Math.min(currentSemester, 8));
  const seed = [6.9, 7.1, 7.4, 7.6, 7.9, 8.2, 8.4, 8.6];
  return Array.from({ length: count }, (_, index) => ({
    semesterNumber: index + 1,
    cgpa: Number((seed[index] ?? cgpa).toFixed(2)),
  }));
};

const buildFallbackSubjectRows = (semesterNumber, cgpa, attendanceHistory) => {
  const base = Math.round((cgpa / 10) * 100);
  const catalogue = SEMESTER_SUBJECT_CATALOGUE[semesterNumber] ?? SEMESTER_SUBJECT_CATALOGUE[6];
  const marksOffsets = [3, -2, 4, 1, 5, -1];
  const attendanceOffsets = [4, -3, 2, 1, 5, -2];
  const averageAttendance = attendanceHistory.length
    ? Math.round(attendanceHistory.reduce((sum, value) => sum + value, 0) / attendanceHistory.length)
    : 78;

  return catalogue.map((subject, index) => {
    const marks = Math.min(100, Math.max(45, base + marksOffsets[index]));
    const attendance = Math.min(100, Math.max(55, averageAttendance + attendanceOffsets[index]));

    return {
      ...subject,
      marks,
      attendance,
      grade: getGradeFromMarks(marks),
    };
  });
};

const buildAllSemesterRows = (student, cgpa, attendanceHistory) => {
  const semesterMap = new Map(
    (student?.semesters ?? []).map((semester) => [Number(semester?.semesterNumber), semester])
  );

  return Array.from({ length: FIXED_CURRENT_SEMESTER }, (_, index) => {
    const semesterNumber = index + 1;
    const semesterData = semesterMap.get(semesterNumber);
    const rows = semesterNumber === FIXED_CURRENT_SEMESTER
      ? (SEMESTER_SUBJECT_CATALOGUE[semesterNumber] ?? []).map((subject) => ({
          ...subject,
          marks: null,
          attendance: null,
          grade: "In Progress",
        }))
      : buildSubjectRowsFromSemester(semesterData, semesterNumber, cgpa, attendanceHistory);
    const averageMarks = rows.length
      ? Math.round(rows.reduce((sum, row) => sum + (row.marks ?? 0), 0) / rows.length)
      : 0;

    return {
      semesterNumber,
      rows,
      averageMarks,
      isCurrent: semesterNumber === FIXED_CURRENT_SEMESTER,
      isCompleted: semesterNumber < FIXED_CURRENT_SEMESTER,
    };
  });
};

const buildSubjectRowsFromSemester = (semester, semesterNumber, cgpa, attendanceHistory) => {
  const catalogue = SEMESTER_SUBJECT_CATALOGUE[semesterNumber];

  if (!semester?.subjects?.length && !catalogue?.length) {
    return buildFallbackSubjectRows(semesterNumber, cgpa, attendanceHistory);
  }

  if (catalogue?.length) {
    return catalogue.map((catalogueSubject, index) => {
      const matchedSubject = (semester?.subjects ?? []).find((subject) => {
        const subjectName = normalizeSubjectValue(subject?.subjectName ?? subject?.name);
        const catalogueName = normalizeSubjectValue(catalogueSubject.name);
        const subjectCode = normalizeSubjectValue(subject?.code);
        const catalogueCode = normalizeSubjectValue(catalogueSubject.code);

        return subjectName === catalogueName || (catalogueCode && subjectCode === catalogueCode);
      });

      if (!matchedSubject) {
        const fallbackRows = buildFallbackSubjectRows(semesterNumber, cgpa, attendanceHistory);
        return fallbackRows[index] ?? {
          ...catalogueSubject,
          marks: null,
          attendance: null,
          grade: "N/A",
        };
      }

      const internals = Number(matchedSubject?.marks?.internals ?? 0);
      const finals = Number(matchedSubject?.marks?.finals ?? 0);
      const marks = Math.min(100, Math.max(0, internals + finals));
      const attendance = Math.min(100, Math.max(0, Number(matchedSubject?.attendance?.percentage ?? 0)));

      return {
        name: catalogueSubject.name,
        code: catalogueSubject.code,
        marks,
        attendance,
        grade: matchedSubject?.grade ?? getGradeFromMarks(marks),
      };
    });
  }

  return semester.subjects.map((subject, index) => {
    const internals = Number(subject?.marks?.internals ?? 0);
    const finals = Number(subject?.marks?.finals ?? 0);
    const marks = Math.min(100, Math.max(0, internals + finals));
    const attendance = Math.min(100, Math.max(0, Number(subject?.attendance?.percentage ?? 0)));

    return {
      name: subject?.subjectName ?? subject?.name ?? `Subject ${index + 1}`,
      code: subject?.code ?? `SEM${semesterNumber}-${index + 1}`,
      marks,
      attendance,
      grade: subject?.grade ?? getGradeFromMarks(marks),
    };
  });
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="academic-tooltip">
      <strong>{label}</strong>
      {payload.map((item) => (
        <span key={item.dataKey}>
          {item.name}: {item.value}
        </span>
      ))}
    </div>
  );
};

export default function AcademicProgress({ student }) {
  const currentSemester = FIXED_CURRENT_SEMESTER;
  const cgpa = Number(student?.cgpa?.current ?? student?.cgpa ?? 8.2);
  const backlogs = Number(student?.backlogs?.count ?? student?.backlogs ?? 0);
  const studentName = student?.name ?? "Student";
  const regNo = student?.regNo ?? student?.rollNumber ?? "--";
  const currentSemesterData = student?.semesters?.find(
    (semester) => Number(semester?.semesterNumber) === currentSemester
  );

  const attendanceHistory = useMemo(
    () => student?.semesters?.flatMap((semester) =>
      semester?.subjects?.map((subject) => Number(subject?.attendance?.percentage ?? 0)) ?? []
    ) ?? [],
    [student]
  );

  const cgpaHistory = useMemo(
    () => buildCgpaHistory(student, currentSemester, cgpa),
    [student, currentSemester, cgpa]
  );

  const rows = useMemo(
    () => (SEMESTER_SUBJECT_CATALOGUE[currentSemester] ?? []).map((subject) => ({
      ...subject,
      marks: null,
      attendance: null,
      grade: "In Progress",
    })),
    [currentSemester]
  );
  const allSemesterRows = useMemo(
    () => buildAllSemesterRows(student, cgpa, attendanceHistory),
    [student, cgpa, attendanceHistory]
  );
  const completedSemesterRows = allSemesterRows
    .filter((semester) => semester.isCompleted)
    .flatMap((semester) => semester.rows);
  const totalCompletedSubjects = completedSemesterRows.length;
  const averageMarks = totalCompletedSubjects
    ? Math.round(
        completedSemesterRows.reduce((sum, row) => sum + Number(row.marks ?? 0), 0) / totalCompletedSubjects
      )
    : 0;
  const averageAttendance = totalCompletedSubjects
    ? Math.round(
        completedSemesterRows.reduce((sum, row) => sum + Number(row.attendance ?? 0), 0) / totalCompletedSubjects
      )
    : 0;
  const currentSemesterStatus = "In Progress";
  const completedSemesters = FIXED_COMPLETED_SEMESTERS;
  const completedMilestone = COURSE_MILESTONES[completedSemesters] ?? 0;
  const activeMilestone = COURSE_MILESTONES[currentSemester] ?? completedMilestone;
  const completionPercent = Math.round((completedSemesters / 8) * 100);
  const progressRingStyle = {
    background: `radial-gradient(circle at center, var(--surface) 52%, transparent 53%), conic-gradient(#2563eb 0 ${completionPercent}%, rgba(148, 163, 184, 0.15) ${completionPercent}% 100%)`,
  };

  const cgpaChartData = cgpaHistory
    .filter((item) => item.semesterNumber < FIXED_CURRENT_SEMESTER)
    .map((item) => ({
    semester: `Sem ${item.semesterNumber}`,
    cgpa: Number(item.cgpa.toFixed(2)),
    fill: "#2563eb",
    }));

  const downloadPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;

    doc.setFontSize(18);
    doc.text("Academic Progress Report", margin, 52);
    doc.setFontSize(10);
    doc.text(`Student: ${studentName} | Reg No: ${regNo}`, margin, 70);
    doc.text(`Current Semester: ${currentSemester} | Current CGPA: ${cgpa}`, margin, 86);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 102);

    autoTable(doc, {
      startY: 124,
      head: [["Metric", "Value"]],
      body: [
        ["Current semester", String(currentSemester)],
        ["Semesters completed", `${completedSemesters} / 8`],
        ["Current CGPA", String(cgpa)],
        ["Average marks (completed sems)", `${averageMarks}%`],
        ["Average attendance (completed sems)", `${averageAttendance}%`],
        ["Completed milestone", `${completedMilestone} / ${TOTAL_PROGRAM_MILESTONE}`],
      ],
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [37, 99, 235] },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 24,
      head: [["Semester", "CGPA"]],
      body: cgpaHistory.map((item) => [`Semester ${item.semesterNumber}`, item.cgpa]),
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [15, 118, 110] },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 24,
      head: [["Code", "Subject", "Marks", "Attendance", "Grade"]],
      body: rows.map((row) => [row.code, row.name, "Not yet available", "In progress", row.grade]),
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [22, 163, 74] },
    });

    doc.save(`${escapeForFilename(studentName || regNo)}_academic_progress.pdf`);
  };

  return (
    <div className="page-stack academic-progress-page">
      <section className="panel academic-hero-panel">
        <div className="academic-hero-copy">
          <p className="panel-tag">Academic Progress</p>
          <h1>{studentName}</h1>
          <p className="hero-copy">
            3rd year 6th semester overview with semester-wise CGPA, completed coursework up to 5th
            semester, and 6th semester subject performance.
          </p>
          <div className="academic-meta-strip">
            <span>Reg No: {regNo}</span>
            <span>Current Semester: 6</span>
            <span>Completed: 5 / 8 semesters</span>
          </div>
        </div>

        <div className="academic-hero-actions">
          <div className="academic-progress-ring" style={progressRingStyle}>
            <div className="academic-progress-value">{completionPercent}%</div>
            <div className="academic-progress-label">Completed through sem 5</div>
          </div>
          <button onClick={downloadPdf} className="primary-button" type="button">
            Download Report
          </button>
        </div>
      </section>

      <section className="academic-summary-grid">
        <article className="academic-summary-card">
          <span>Current CGPA</span>
          <strong>{cgpa.toFixed(2)}</strong>
          <small>Across all recorded semesters</small>
        </article>
        <article className="academic-summary-card">
          <span>Average Marks</span>
          <strong>{averageMarks}%</strong>
          <small>Based on completed semesters only</small>
        </article>
        <article className="academic-summary-card">
          <span>Average Attendance</span>
          <strong>{averageAttendance}%</strong>
          <small>Overall attendance across semesters 1 to 5</small>
        </article>
        <article className="academic-summary-card">
          <span>Completed Milestone</span>
          <strong>{completedMilestone} / {TOTAL_PROGRAM_MILESTONE}</strong>
          <small>Semester 6 is current and still in progress</small>
        </article>
        <article className="academic-summary-card">
          <span>Semester 6 Status</span>
          <strong>{currentSemesterStatus}</strong>
          <small>Current semester, marks not released yet</small>
        </article>
      </section>

      <section className="academic-layout-grid">
        <article className="panel academic-chart-panel">
          <div className="panel-head">
            <div>
              <h2>All Semester CGPA</h2>
              <p>Track CGPA across completed semesters only, from semester 1 to semester 5.</p>
            </div>
          </div>
          <div className="academic-chart-wrap large">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cgpaChartData} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.22)" vertical={false} />
                <XAxis dataKey="semester" tickLine={false} axisLine={false} />
                <YAxis domain={[0, 10]} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(37, 99, 235, 0.08)" }} />
                <Bar dataKey="cgpa" name="CGPA" radius={[10, 10, 0, 0]}>
                  {cgpaChartData.map((entry) => (
                    <Cell key={entry.semester} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel academic-roadmap-panel">
          <div className="panel-head">
            <div>
              <h2>Completion Snapshot</h2>
              <p>Semester 1 to 5 are completed. Semester 6 is the current running semester.</p>
            </div>
          </div>

          <div className="academic-progress-block">
            <div>
              <span className="academic-label">Completed up to</span>
              <strong>Semester 5</strong>
            </div>
            <div>
              <span className="academic-label">Current ongoing semester</span>
              <strong>Semester 6 | {activeMilestone} / {TOTAL_PROGRAM_MILESTONE}</strong>
            </div>
          </div>

          <div className="academic-semester-strip">
            {Array.from({ length: 8 }, (_, index) => {
              const semesterNumber = index + 1;
              const state =
                semesterNumber < currentSemester ? "done" :
                semesterNumber === currentSemester ? "live" :
                "upcoming";

              return (
                <div key={semesterNumber} className={`academic-sem-pill ${state}`}>
                  <strong>Sem {semesterNumber}</strong>
                  <span>{COURSE_MILESTONES[semesterNumber]}</span>
                </div>
              );
            })}
          </div>

          <div className="academic-note-card">
            <strong>3rd Year View</strong>
            <p>
              A 3rd year student has completed semester 1 to 5. Semester 6 is not completed yet,
              it is the current semester in progress. Based on your course structure, completed
              progress is shown up to milestone {completedMilestone}, and semester 6 is the active
              semester moving toward {activeMilestone}.
            </p>
            <span>Backlogs: {backlogs}</span>
          </div>
        </article>
      </section>

      <section className="academic-layout-grid">
        <article className="panel academic-chart-panel">
          <div className="panel-head">
            <div>
              <h2>Semester 6 Subjects</h2>
              <p>Bars are removed because semester 6 marks are not available yet.</p>
            </div>
          </div>
          <div className="academic-empty-state">
            <strong>No marks chart for semester 6</strong>
            <p>Semester 6 is still in progress, so subject bars are hidden until marks are available.</p>
          </div>
        </article>

        <article className="panel academic-subject-panel">
          <div className="panel-head">
            <div>
              <h2>Subject Performance</h2>
              <p>Marks, grade, and attendance for the active semester subjects.</p>
            </div>
          </div>
          <div className="academic-subject-list">
            {rows.map((row) => (
              <div key={row.code} className="academic-subject-card">
                <div className="academic-subject-head">
                  <div>
                    <strong>{row.name}</strong>
                    <span>{row.code}</span>
                  </div>
                  <span className={`academic-grade-pill grade-${row.grade.toLowerCase().replace("+", "plus")}`}>
                    {row.grade}
                  </span>
                </div>
                <div className="academic-subject-stats">
                  <div>
                    <span>Marks</span>
                    <strong>Not yet available</strong>
                  </div>
                  <div>
                    <span>Attendance</span>
                    <strong>In progress</strong>
                  </div>
                  <div>
                    <span>Status</span>
                    <strong>Current semester</strong>
                  </div>
                </div>
                <div className="academic-bar-track">
                  <div className="academic-bar-fill marks" style={{ width: "0%" }} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel academic-semester-history-panel">
        <div className="panel-head">
          <div>
            <h2>All Semester Subject Marks</h2>
            <p>Open each semester to see all subjects and the marks scored in that semester.</p>
          </div>
        </div>

        <div className="academic-accordion-list">
          {allSemesterRows.map((semester) => (
            <details
              key={semester.semesterNumber}
              className="academic-accordion"
              open={semester.semesterNumber === FIXED_CURRENT_SEMESTER}
            >
              <summary className="academic-accordion-summary">
                <div>
                  <strong>Semester {semester.semesterNumber}</strong>
                  <span>
                    {semester.isCurrent ? "Current semester" : semester.isCompleted ? "Completed semester" : "Upcoming"}
                  </span>
                </div>
                <div className="academic-accordion-meta">
                  <span>{semester.rows.length} subjects</span>
                  <span>Avg Marks: {semester.averageMarks}%</span>
                </div>
              </summary>

              <div className="academic-accordion-content">
                <div className="academic-semester-table">
                  <div className="academic-semester-table-head">
                    <span>Code</span>
                    <span>Subject</span>
                    <span>Marks</span>
                    <span>Grade</span>
                    <span>Attendance</span>
                  </div>

                  {semester.rows.map((row) => (
                    <div key={`${semester.semesterNumber}-${row.code}`} className="academic-semester-table-row">
                      <span>{row.code}</span>
                      <strong>{row.name}</strong>
                      <span>{semester.semesterNumber === FIXED_CURRENT_SEMESTER ? "Not available" : row.marks}</span>
                      <span>{row.grade}</span>
                      <span>{semester.semesterNumber === FIXED_CURRENT_SEMESTER ? "In progress" : `${row.attendance}%`}</span>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
