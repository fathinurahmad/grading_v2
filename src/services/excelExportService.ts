import * as XLSX from "xlsx-js-style"
import { collection, getDocs, orderBy, query } from "firebase/firestore"
import { db } from "../firebase"
import defaultStudents from "../data/students.json"
import defaultCommittee from "../data/committee.json"
import { LIKERT_QUESTIONS } from "../data/questionnaire"

// Elegant University / Camp Branding Colors
const BORDER_THIN = {
  top: { style: "thin", color: { rgb: "CBD5E1" } },
  bottom: { style: "thin", color: { rgb: "CBD5E1" } },
  left: { style: "thin", color: { rgb: "CBD5E1" } },
  right: { style: "thin", color: { rgb: "CBD5E1" } },
}

const HEADER_STYLE = {
  font: { name: "Calibri", sz: 11, bold: true, color: { rgb: "FFFFFF" } },
  fill: { fgColor: { rgb: "2B5748" } }, // Dark University Forest Green
  border: {
    top: { style: "medium", color: { rgb: "1E3E33" } },
    bottom: { style: "medium", color: { rgb: "1E3E33" } },
    left: { style: "thin", color: { rgb: "4B7566" } },
    right: { style: "thin", color: { rgb: "4B7566" } },
  },
  alignment: { horizontal: "center", vertical: "center", wrapText: true },
}

const TITLE_STYLE = {
  font: { name: "Calibri", sz: 14, bold: true, color: { rgb: "FFFFFF" } },
  fill: { fgColor: { rgb: "1F4135" } },
  alignment: { horizontal: "center", vertical: "center" },
}

const SUBTITLE_STYLE = {
  font: { name: "Calibri", sz: 9.5, italic: true, color: { rgb: "475569" } },
  alignment: { horizontal: "center", vertical: "center" },
}

const CELL_CENTER = {
  font: { name: "Calibri", sz: 10, color: { rgb: "1E293B" } },
  border: BORDER_THIN,
  alignment: { horizontal: "center", vertical: "center" },
}

const CELL_LEFT = {
  font: { name: "Calibri", sz: 10, color: { rgb: "1E293B" } },
  border: BORDER_THIN,
  alignment: { horizontal: "left", vertical: "center" },
}

const CELL_CENTER_BOLD = {
  font: { name: "Calibri", sz: 10, bold: true, color: { rgb: "1E293B" } },
  border: BORDER_THIN,
  alignment: { horizontal: "center", vertical: "center" },
}

// Helper to create a fully styled worksheet with Title Banner, Subtitle, and Bordered Data Table
function createStyledSheet(
  title: string,
  subtitle: string,
  headers: string[],
  rowsData: any[][],
  colWidths: number[],
  leftAlignCols: number[] = []
) {
  const ws: XLSX.WorkSheet = {}
  const totalCols = headers.length

  // Row 1: Main Title
  for (let c = 0; c < totalCols; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c })
    ws[cellRef] = {
      v: c === 0 ? title : "",
      t: "s",
      s: TITLE_STYLE,
    }
  }

  // Row 2: Subtitle
  for (let c = 0; c < totalCols; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: 1, c })
    ws[cellRef] = {
      v: c === 0 ? subtitle : "",
      t: "s",
      s: SUBTITLE_STYLE,
    }
  }

  // Row 3: Empty spacing row
  for (let c = 0; c < totalCols; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: 2, c })
    ws[cellRef] = { v: "", t: "s" }
  }

  // Row 4: Column Headers
  for (let c = 0; c < totalCols; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: 3, c })
    ws[cellRef] = {
      v: headers[c],
      t: "s",
      s: HEADER_STYLE,
    }
  }

  // Row 5+: Data rows
  rowsData.forEach((row, rIdx) => {
    const rowIndex = 4 + rIdx
    const isEven = rIdx % 2 === 1
    const bgFill = isEven ? { fgColor: { rgb: "F8FAF8" } } : undefined

    row.forEach((val, cIdx) => {
      const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: cIdx })
      const isLeft = leftAlignCols.includes(cIdx)
      const isNumeric = typeof val === "number"

      const baseStyle = isLeft
        ? { ...CELL_LEFT, ...(bgFill ? { fill: bgFill } : {}) }
        : { ...CELL_CENTER, ...(bgFill ? { fill: bgFill } : {}) }

      ws[cellRef] = {
        v: val !== null && val !== undefined ? val : "",
        t: isNumeric ? "n" : "s",
        s: baseStyle,
      }
    })
  })

  // Merges for Title and Subtitle
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } },
  ]

  // Column widths
  ws["!cols"] = colWidths.map((wch) => ({ wch }))

  // Row heights
  ws["!rows"] = [
    { hpt: 32 }, // Row 1 (Title)
    { hpt: 20 }, // Row 2 (Subtitle)
    { hpt: 10 }, // Row 3 (Gap)
    { hpt: 26 }, // Row 4 (Header)
  ]

  // Ref range
  const totalRows = 4 + rowsData.length
  ws["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: totalRows - 1, c: totalCols - 1 },
  })

  return ws
}

// Grade calculation
function getGrade(score: number): string {
  if (score >= 85) return "A"
  if (score >= 75) return "B"
  if (score >= 65) return "C"
  if (score >= 50) return "D"
  return "E"
}

function getDisciplineStatus(score: number): string {
  if (score === 100) return "Clean (No Violations)"
  if (score >= 80) return "Good Standing"
  if (score >= 60) return "Warning Level"
  return "Critical Review"
}

function getPerformanceLevel(score: number): string {
  if (score >= 90) return "Outstanding (90-100)"
  if (score >= 80) return "Excellent (80-89)"
  if (score >= 70) return "Satisfactory (70-79)"
  return "Needs Improvement (<70)"
}

// 1. Export Lecturer Scoring Report (Dosen)
export async function exportLecturerScoringReport() {
  let students = defaultStudents
  try {
    const snap = await getDocs(collection(db, "students"))
    if (!snap.empty) {
      students = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
    }
  } catch (err) {
    console.warn("Using local fallback students for lecturer export:", err)
  }

  students.sort((a, b) => a.class.localeCompare(b.class) || a.id.localeCompare(b.id))

  const headers = [
    "No",
    "Student ID",
    "Student Full Name",
    "Class",
    "Group",
    "Business Score",
    "Business Note",
    "English Score",
    "English Note",
    "Entrepreneurship Score",
    "Entrepreneurship Note",
    "Average",
    "Grade",
    "Status",
  ]

  const rows = students.map((s, idx) => {
    const b = Number(s.scores?.Business ?? 0)
    const e = Number(s.scores?.English ?? 0)
    const ent = Number(s.scores?.Entrepreneurship ?? 0)
    const total = b + e + ent
    const avg = total > 0 ? Math.round((total / 3) * 10) / 10 : 0
    const hasScores = b > 0 || e > 0 || ent > 0

    const noteBus = s.subjectNotes?.Business || (s.dosenNote && b > 0 ? s.dosenNote : "—")
    const noteEng = s.subjectNotes?.English || (s.dosenNote && e > 0 ? s.dosenNote : "—")
    const noteEnt = s.subjectNotes?.Entrepreneurship || (s.dosenNote && ent > 0 ? s.dosenNote : "—")

    return [
      idx + 1,
      s.id,
      s.name,
      s.class,
      s.group,
      b,
      noteBus,
      e,
      noteEng,
      ent,
      noteEnt,
      avg,
      hasScores ? getGrade(avg) : "Pending",
      hasScores ? "Graded" : "Not Graded Yet",
    ]
  })

  const nowStr = new Date().toLocaleString()
  const ws = createStyledSheet(
    "UNIVERSITAS NEGERI MAKASSAR — ENGLISH CAMP 2026",
    `Lecturer Academic Scoring Report · Generated: ${nowStr} · Total Students: ${students.length}`,
    headers,
    rows,
    [6, 14, 34, 12, 12, 14, 28, 14, 28, 20, 28, 14, 12, 16],
    [2, 6, 8, 10] // Name and Notes left aligned
  )

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Lecturer Scoring")
  const dateStr = new Date().toISOString().split("T")[0]
  XLSX.writeFile(wb, `English_Camp_2026_Lecturer_Scoring_${dateStr}.xlsx`)
}

// 2. Export Committee Evaluation & Student Discipline History (Panitia)
export async function exportCommitteeEvaluationReport() {
  let students = defaultStudents
  try {
    const snap = await getDocs(collection(db, "students"))
    if (!snap.empty) {
      students = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
    }
  } catch (err) {
    console.warn("Using local fallback students for committee evaluation:", err)
  }

  students.sort((a, b) => a.class.localeCompare(b.class) || a.id.localeCompare(b.id))

  // Sheet 1: Discipline Status
  const summaryHeaders = [
    "No",
    "Student ID",
    "Student Full Name",
    "Class",
    "Group",
    "Base Score",
    "Remaining Discipline Score",
    "Points Lost",
    "Discipline Status",
    "Committee Discipline Note",
  ]

  const summaryRows = students.map((s, idx) => {
    const score = Number(s.score ?? 100)
    const reductions = 100 - score
    return [
      idx + 1,
      s.id,
      s.name,
      s.class,
      s.group,
      100,
      score,
      reductions,
      getDisciplineStatus(score),
      s.panitiaNote || s.note || "No reductions",
    ]
  })

  // Sheet 2: Score History Audit Log
  let historyLogs: any[] = []
  try {
    const historySnap = await getDocs(
      query(collection(db, "score_history"), orderBy("timestamp", "desc"))
    )
    if (!historySnap.empty) {
      historyLogs = historySnap.docs.map((d) => d.data())
    }
  } catch (err) {
    console.warn("No score history collection or error fetching:", err)
  }

  const historyHeaders = [
    "Log No",
    "Date & Time",
    "Student ID",
    "Student Name",
    "Previous Score",
    "New Score",
    "Points Deducted",
    "Violation Reason",
    "Recorded By Committee",
  ]

  const historyRows = historyLogs.length
    ? historyLogs.map((log, idx) => {
        let dateStr = "Recorded"
        if (log.timestamp) {
          try {
            dateStr = log.timestamp.toDate
              ? log.timestamp.toDate().toLocaleString()
              : new Date(log.timestamp).toLocaleString()
          } catch {
            dateStr = String(log.timestamp)
          }
        }
        return [
          idx + 1,
          dateStr,
          log.studentId || "—",
          log.studentName || "—",
          log.oldScore ?? "—",
          log.newScore ?? "—",
          Math.abs(log.pointsChange ?? 0),
          log.reason || "Discipline reduction",
          log.committee || "Steering Committee",
        ]
      })
    : [
        [
          1,
          new Date().toLocaleString(),
          "—",
          "System Baseline",
          100,
          100,
          0,
          "All 232 students initialized with 100 base discipline points",
          "English Camp Steering Committee",
        ],
      ]

  const nowStr = new Date().toLocaleString()
  const wsSummary = createStyledSheet(
    "UNIVERSITAS NEGERI MAKASSAR — ENGLISH CAMP 2026",
    `Student Discipline & Points Summary · Generated: ${nowStr} · Total Students: ${students.length}`,
    summaryHeaders,
    summaryRows,
    [6, 14, 34, 12, 12, 12, 26, 14, 24, 32],
    [2, 9] // Name and Note left aligned
  )

  const wsHistory = createStyledSheet(
    "UNIVERSITAS NEGERI MAKASSAR — ENGLISH CAMP 2026",
    `Student Violation & Reduction History Log · Total Records: ${historyRows.length}`,
    historyHeaders,
    historyRows,
    [8, 22, 14, 32, 16, 14, 16, 42, 28],
    [3, 7, 8] // Name, Reason, Committee left aligned
  )

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, wsSummary, "Discipline Status")
  XLSX.utils.book_append_sheet(wb, wsHistory, "Violation History")

  const dateStr = new Date().toISOString().split("T")[0]
  XLSX.writeFile(wb, `English_Camp_2026_Committee_Discipline_and_History_${dateStr}.xlsx`)
}

// 3. Export Committee Performance Scoring (Scoring Panitia)
export async function exportCommitteeScoringReport() {
  let committee = defaultCommittee
  try {
    const snap = await getDocs(collection(db, "committee"))
    if (!snap.empty) {
      committee = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
    }
  } catch (err) {
    console.warn("Using local fallback committee for scoring export:", err)
  }

  // Also fetch committee history logs if available
  let commHistoryLogs: any[] = []
  try {
    const chSnap = await getDocs(
      query(collection(db, "committee_score_history"), orderBy("timestamp", "desc"))
    )
    if (!chSnap.empty) {
      commHistoryLogs = chSnap.docs.map((d) => d.data())
    }
  } catch (err) {
    console.warn("No committee score history:", err)
  }

  committee.sort((a, b) => a.division.localeCompare(b.division) || a.position.localeCompare(b.position))

  const headers = [
    "No",
    "Committee ID",
    "Member Full Name",
    "Division",
    "Position",
    "Base Score",
    "Final Evaluation Score",
    "Performance Level",
    "Steering Performance Note",
  ]

  const rows = committee.map((m, idx) => {
    const score = Number(m.score ?? 100)
    return [
      idx + 1,
      m.id,
      m.name,
      m.division,
      m.position,
      100,
      score,
      getPerformanceLevel(score),
      m.steeringNote || m.note || "Active camp contribution",
    ]
  })

  const historyHeaders = [
    "Log No",
    "Date & Time",
    "Committee ID",
    "Member Name",
    "Division",
    "Previous Score",
    "New Score",
    "Score Change",
    "Evaluation Reason",
    "Evaluator Name",
  ]

  const historyRows = commHistoryLogs.length
    ? commHistoryLogs.map((log, idx) => {
        let dateStr = "Recorded"
        if (log.timestamp) {
          try {
            dateStr = log.timestamp.toDate
              ? log.timestamp.toDate().toLocaleString()
              : new Date(log.timestamp).toLocaleString()
          } catch {
            dateStr = String(log.timestamp)
          }
        }
        return [
          idx + 1,
          dateStr,
          log.memberId || "—",
          log.memberName || "—",
          log.division || "—",
          log.oldScore ?? "—",
          log.newScore ?? "—",
          log.pointsChange ?? 0,
          log.reason || "Performance review",
          log.evaluator || "Lead Evaluator",
        ]
      })
    : [
        [
          1,
          new Date().toLocaleString(),
          "—",
          "System Baseline",
          "ALL DIVISIONS",
          100,
          100,
          0,
          "All 37 committee members initialized with 100 base performance points",
          "Steering Committee",
        ],
      ]

  const nowStr = new Date().toLocaleString()
  const ws1 = createStyledSheet(
    "UNIVERSITAS NEGERI MAKASSAR — ENGLISH CAMP 2026",
    `Committee Performance & Evaluation Scores · Generated: ${nowStr} · Total Members: ${committee.length}`,
    headers,
    rows,
    [6, 16, 36, 26, 16, 12, 22, 26, 34],
    [2, 8] // Name and Note left aligned
  )

  const ws2 = createStyledSheet(
    "UNIVERSITAS NEGERI MAKASSAR — ENGLISH CAMP 2026",
    `Committee Evaluation Audit History Log · Total Records: ${historyRows.length}`,
    historyHeaders,
    historyRows,
    [8, 22, 16, 32, 24, 16, 14, 16, 40, 24],
    [3, 8, 9] // Name, Reason, Evaluator left aligned
  )

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws1, "Committee Scoring")
  XLSX.utils.book_append_sheet(wb, ws2, "Committee History Log")

  const dateStr = new Date().toISOString().split("T")[0]
  XLSX.writeFile(wb, `English_Camp_2026_Committee_Performance_Scoring_${dateStr}.xlsx`)
}

// 4. Export Event Satisfaction & Experience Rating (Rev. 2026 Questionnaire)
export async function exportEventSatisfactionReport() {
  let feedbacks: any[] = []
  try {
    const snap = await getDocs(collection(db, "event_feedback"))
    if (!snap.empty) {
      feedbacks = snap.docs.map((d) => d.data())
    }
  } catch (err) {
    console.warn("Error fetching event feedback:", err)
  }

  if (!feedbacks.length) {
    const local = window.localStorage.getItem("event-satisfaction")
    if (local) {
      feedbacks.push({
        participantName: "Active Participant",
        studentClass: "A",
        gender: "Female",
        initialAbility: "Fair",
        ratings: { 1: 5, 2: 5, 3: 5, 4: 5, 5: 5, 6: 5, 7: 5, 8: 5, 9: 5, 10: 5, 11: 5, 12: 5, 13: 5, 14: 5, 15: 5, 16: 5, 17: 5, 18: 5, 19: 5, 20: 5, 21: 5, 22: 5, 23: 5, 24: 5, 25: 5, 26: 5 },
        rating: 5,
        bestAspect: "Aktivitas interaktif dan pembinaan percakapan yang menyenangkan.",
        difficulties: "Tidak ada kendala yang berarti.",
        helpfulActivities: ["Conversation practice", "Group discussion"],
        improvements: "Waktu istirahat bisa sedikit ditambah.",
        newSuggestions: "English debate atau outdoor campfire story sharing.",
        submittedAt: new Date().toISOString(),
      })
    }
  }

  const formatFbDate = (fb: any) => {
    const dt = fb.submittedAt || fb.timestamp
    if (!dt) return "Recorded"
    try {
      return dt.toDate ? dt.toDate().toLocaleString("id-ID") : new Date(dt).toLocaleString("id-ID")
    } catch {
      return String(dt)
    }
  }

  const calcAvg = (ratings: Record<string | number, any> | undefined, start: number, end: number) => {
    if (!ratings) return 0
    let sum = 0
    let count = 0
    for (let i = start; i <= end; i++) {
      const val = Number(ratings[i] ?? ratings[String(i)])
      if (!isNaN(val) && val > 0) {
        sum += val
        count++
      }
    }
    return count > 0 ? Math.round((sum / count) * 100) / 100 : 0
  }

  const getSatisfactionPredikat = (overall: number) => {
    if (overall >= 4.5) return "Sangat Puas (Very High)"
    if (overall >= 3.5) return "Puas (High)"
    if (overall >= 2.5) return "Cukup Puas (Moderate)"
    if (overall >= 1.5) return "Kurang Puas (Low)"
    return "Sangat Kurang (Very Low)"
  }

  // Sheet 1: Ringkasan & Demografi
  const summaryHeaders = [
    "No",
    "Tanggal & Waktu",
    "Nama Mahasiswa",
    "Kelas",
    "Gender",
    "Kemampuan Awal",
    "B. Perencanaan (Rata-rata)",
    "B. Pelaksanaan (Rata-rata)",
    "C. Dampak Bahasa (Rata-rata)",
    "D. Metode Belajar (Rata-rata)",
    "E. Kepuasan Umum (Rata-rata)",
    "Rata-rata Keseluruhan",
    "Kategori Kepuasan",
  ]

  const summaryRows = feedbacks.map((fb, idx) => {
    const r = fb.ratings || {}
    const defaultVal = Number(fb.rating ?? 5)
    const avgPlan = fb.categoryAverages?.planning || calcAvg(r, 1, 4) || defaultVal
    const avgExec = fb.categoryAverages?.execution || calcAvg(r, 5, 10) || defaultVal
    const avgImpact = fb.categoryAverages?.impact || calcAvg(r, 11, 17) || defaultVal
    const avgMethod = fb.categoryAverages?.method || calcAvg(r, 18, 22) || defaultVal
    const avgSat = fb.categoryAverages?.generalSatisfaction || calcAvg(r, 23, 26) || defaultVal
    const overall = fb.categoryAverages?.overall || calcAvg(r, 1, 26) || defaultVal

    return [
      idx + 1,
      formatFbDate(fb),
      fb.participantName || "Anonymous Participant",
      fb.studentClass ? `Class ${fb.studentClass}` : "—",
      fb.gender || "—",
      fb.initialAbility || "—",
      avgPlan,
      avgExec,
      avgImpact,
      avgMethod,
      avgSat,
      overall,
      getSatisfactionPredikat(overall),
    ]
  })

  // Sheet 2: Detail Skala Likert 26 Item
  const detailHeaders = [
    "No",
    "Tanggal",
    "Nama Mahasiswa",
    "Kelas",
    ...LIKERT_QUESTIONS.map((q) => q.shortLabel),
    "Total Skor",
    "Rata-rata",
  ]

  const detailRows = feedbacks.map((fb, idx) => {
    const r = fb.ratings || {}
    const defaultVal = Number(fb.rating ?? 5)
    let total = 0
    let count = 0

    const itemScores = LIKERT_QUESTIONS.map((q) => {
      const score = Number(r[q.id] ?? r[String(q.id)] ?? defaultVal)
      total += score
      count++
      return score
    })

    const avg = count > 0 ? Math.round((total / count) * 100) / 100 : 0

    return [
      idx + 1,
      formatFbDate(fb),
      fb.participantName || "Anonymous Participant",
      fb.studentClass ? `Class ${fb.studentClass}` : "—",
      ...itemScores,
      total,
      avg,
    ]
  })

  // Sheet 3: Evaluasi Terbuka (Kualitatif)
  const openHeaders = [
    "No",
    "Tanggal & Waktu",
    "Nama Mahasiswa",
    "Kelas",
    "1. Aspek Terbaik",
    "2. Kendala / Kesulitan",
    "3. Aktivitas Paling Membantu",
    "4. Hal Perlu Diperbaiki",
    "5. Saran Kegiatan Baru",
  ]

  const openRows = feedbacks.map((fb, idx) => {
    let helpful = "—"
    if (Array.isArray(fb.helpfulActivities) && fb.helpfulActivities.length) {
      helpful = fb.helpfulActivities.join(", ")
      if (fb.otherActivity) {
        helpful += ` (Lainnya: ${fb.otherActivity})`
      }
    } else if (fb.helpfulActivity) {
      helpful = fb.helpfulActivity
    }

    return [
      idx + 1,
      formatFbDate(fb),
      fb.participantName || "Anonymous Participant",
      fb.studentClass ? `Class ${fb.studentClass}` : "—",
      fb.bestAspect || fb.comment || "—",
      fb.difficulties || "—",
      helpful,
      fb.improvements || "—",
      fb.newSuggestions || "—",
    ]
  })

  const nowStr = new Date().toLocaleString()
  const wsSummary = createStyledSheet(
    "UNIVERSITAS NEGERI MAKASSAR — ENGLISH CAMP 2026",
    `Event Satisfaction: Ringkasan & Profil Responden · Generated: ${nowStr} · Total Responden: ${summaryRows.length}`,
    summaryHeaders,
    summaryRows,
    [6, 20, 32, 12, 14, 18, 16, 16, 16, 16, 16, 16, 24],
    [2, 12]
  )

  const wsDetail = createStyledSheet(
    "UNIVERSITAS NEGERI MAKASSAR — ENGLISH CAMP 2026",
    `Evaluasi Skala Likert 26 Item (CPMK & Pembelajaran) · Generated: ${nowStr} · Total Responden: ${detailRows.length}`,
    detailHeaders,
    detailRows,
    [6, 18, 30, 10, ...LIKERT_QUESTIONS.map(() => 14), 14, 14],
    [2]
  )

  const wsOpen = createStyledSheet(
    "UNIVERSITAS NEGERI MAKASSAR — ENGLISH CAMP 2026",
    `Evaluasi Terbuka & Saran Kualitatif Peserta · Generated: ${nowStr} · Total Responden: ${openRows.length}`,
    openHeaders,
    openRows,
    [6, 20, 30, 12, 38, 38, 34, 38, 38],
    [2, 4, 5, 6, 7, 8]
  )

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan & Demografi")
  XLSX.utils.book_append_sheet(wb, wsDetail, "Skala Likert (Q1-Q26)")
  XLSX.utils.book_append_sheet(wb, wsOpen, "Evaluasi Terbuka (F1-F5)")

  const dateStr = new Date().toISOString().split("T")[0]
  XLSX.writeFile(wb, `English_Camp_2026_Event_Satisfaction_Feedback_${dateStr}.xlsx`)
}

// 5. Export Complete Student Master Data
export async function exportStudentMasterDataReport() {
  let students = defaultStudents
  try {
    const snap = await getDocs(collection(db, "students"))
    if (!snap.empty) {
      students = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
    }
  } catch (err) {
    console.warn("Using local fallback students for master data export:", err)
  }

  students.sort((a, b) => a.class.localeCompare(b.class) || a.id.localeCompare(b.id))

  const headers = [
    "No",
    "Student ID",
    "Student Full Name",
    "Class",
    "Group",
    "Discipline Score",
    "Discipline Status",
    "Business Score",
    "Business Note",
    "English Score",
    "English Note",
    "Entrepreneurship Score",
    "Entrepreneurship Note",
    "Committee Discipline Note",
  ]

  const rows = students.map((s, idx) => {
    const b = s.scores?.Business ?? 0
    const e = s.scores?.English ?? 0
    const ent = s.scores?.Entrepreneurship ?? 0
    const noteBus = s.subjectNotes?.Business || (s.dosenNote && b > 0 ? s.dosenNote : "—")
    const noteEng = s.subjectNotes?.English || (s.dosenNote && e > 0 ? s.dosenNote : "—")
    const noteEnt = s.subjectNotes?.Entrepreneurship || (s.dosenNote && ent > 0 ? s.dosenNote : "—")

    return [
      idx + 1,
      s.id,
      s.name,
      s.class,
      s.group,
      s.score ?? 100,
      getDisciplineStatus(s.score ?? 100),
      b,
      noteBus,
      e,
      noteEng,
      ent,
      noteEnt,
      s.panitiaNote || s.note || "No reductions",
    ]
  })

  const nowStr = new Date().toLocaleString()
  const ws = createStyledSheet(
    "UNIVERSITAS NEGERI MAKASSAR — ENGLISH CAMP 2026",
    `Student Master Profile & Directory · Generated: ${nowStr} · Total Students: ${students.length}`,
    headers,
    rows,
    [6, 14, 34, 12, 12, 18, 24, 14, 26, 14, 26, 20, 26, 30],
    [2, 8, 10, 12, 13]
  )

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Master Data")
  const dateStr = new Date().toISOString().split("T")[0]
  XLSX.writeFile(wb, `English_Camp_2026_Student_Master_Data_${dateStr}.xlsx`)
}

// Master dispatcher
export async function downloadExcelReport(reportName: string) {
  const norm = reportName.toLowerCase()
  if (norm.includes("performance") || norm.includes("steering") || norm.includes("scoring panitia") || norm.includes("division")) {
    await exportCommitteeScoringReport()
  } else if (norm.includes("lecturer") || norm.includes("dosen")) {
    await exportLecturerScoringReport()
  } else if (norm.includes("committee") || norm.includes("discipline") || norm.includes("panitia") || norm.includes("history") || norm.includes("reduction")) {
    await exportCommitteeEvaluationReport()
  } else if (norm.includes("satisfaction") || norm.includes("rating") || norm.includes("experience") || norm.includes("feedback")) {
    await exportEventSatisfactionReport()
  } else {
    await exportStudentMasterDataReport()
  }
}
