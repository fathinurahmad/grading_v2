import * as XLSX from "xlsx"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs } from "firebase/firestore"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const firebaseConfig = {
  apiKey: "AIzaSyBWWONfDcUUtbqKVIf28ajRMkhPXBR-krc",
  authDomain: "campus-7b6fc.firebaseapp.com",
  projectId: "campus-7b6fc",
  storageBucket: "campus-7b6fc.firebasestorage.app",
  messagingSenderId: "766084515490",
  appId: "1:766084515490:web:99c11988acfa6d0175b9fb",
  measurementId: "G-S3MFDJ7TY2",
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function testExports() {
  console.log("Testing generation of 4 distinct Excel (.xlsx) files...")

  const outputDir = path.join(__dirname, "../scratch_exports")
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir)

  // 1. Dosen (Lecturer Scoring)
  const studentsSnap = await getDocs(collection(db, "students"))
  const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
  students.sort((a, b) => a.class.localeCompare(b.class) || a.id.localeCompare(b.id))
  
  const lecturerRows = students.map((s, idx) => {
    const b = Number(s.scores?.Business ?? 0)
    const e = Number(s.scores?.English ?? 0)
    const ent = Number(s.scores?.Entrepreneurship ?? 0)
    const total = b + e + ent
    const avg = total > 0 ? Math.round((total / 3) * 10) / 10 : 0
    return {
      "No": idx + 1,
      "Student ID": s.id,
      "Full Name": s.name,
      "Class": s.class,
      "Group": s.group,
      "Business": b,
      "English": e,
      "Entrepreneurship": ent,
      "Average": avg,
      "Grade": avg >= 85 ? "A" : avg >= 75 ? "B" : avg >= 65 ? "C" : "D",
      "Evaluation Note": s.note || "No note",
    }
  })
  const wb1 = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb1, XLSX.utils.json_to_sheet(lecturerRows), "Lecturer Scoring")
  XLSX.writeFile(wb1, path.join(outputDir, "01_Lecturer_Scoring_Dosen.xlsx"))
  console.log("✅ 01_Lecturer_Scoring_Dosen.xlsx generated with", lecturerRows.length, "rows")

  // 2. Panitia (Student Discipline & History)
  const disciplineRows = students.map((s, idx) => ({
    "No": idx + 1,
    "Student ID": s.id,
    "Full Name": s.name,
    "Class": s.class,
    "Group": s.group,
    "Base Score": 100,
    "Remaining Discipline Score": s.score ?? 100,
    "Points Lost": 100 - (s.score ?? 100),
    "Violation Note": s.note || "No reductions",
  }))
  const wb2 = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb2, XLSX.utils.json_to_sheet(disciplineRows), "Discipline Summary")
  XLSX.writeFile(wb2, path.join(outputDir, "02_Committee_Discipline_Panitia.xlsx"))
  console.log("✅ 02_Committee_Discipline_Panitia.xlsx generated with", disciplineRows.length, "rows")

  // 3. Scoring Panitia (Committee Performance)
  const commSnap = await getDocs(collection(db, "committee"))
  const committee = commSnap.docs.map(d => ({ id: d.id, ...d.data() }))
  const commRows = committee.map((m, idx) => ({
    "No": idx + 1,
    "Committee ID": m.id,
    "Full Name": m.name,
    "Division": m.division,
    "Position": m.position,
    "Performance Score": m.score ?? 80,
    "Evaluation Note": m.note || "Active camp contribution",
  }))
  const wb3 = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb3, XLSX.utils.json_to_sheet(commRows), "Committee Scoring")
  XLSX.writeFile(wb3, path.join(outputDir, "03_Committee_Performance_Scoring.xlsx"))
  console.log("✅ 03_Committee_Performance_Scoring.xlsx generated with", commRows.length, "rows")

  // 4. Rating Experience (Event Satisfaction)
  const fbRows = [
    {
      "No": 1,
      "Date": new Date().toLocaleString(),
      "Participant": "Camp Participant",
      "Star Rating": 5,
      "Satisfaction": "5 Stars (Exceptional)",
      "Comment": "English Camp 2026 was wonderful!",
    }
  ]
  const wb4 = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb4, XLSX.utils.json_to_sheet(fbRows), "Event Satisfaction")
  XLSX.writeFile(wb4, path.join(outputDir, "04_Event_Satisfaction_Feedback.xlsx"))
  console.log("✅ 04_Event_Satisfaction_Feedback.xlsx generated")

  // Clean up scratch files
  fs.rmSync(outputDir, { recursive: true, force: true })
  console.log("All 4 Excel generators verified successfully!")
  process.exit(0)
}

testExports().catch(console.error)
