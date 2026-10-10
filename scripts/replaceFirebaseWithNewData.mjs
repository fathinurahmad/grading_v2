import { initializeApp } from "firebase/app"
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  writeBatch,
  setDoc,
} from "firebase/firestore"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

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

async function replaceData() {
  console.log("==================================================")
  console.log("🔄 Starting Data Replacement in Firebase Firestore")
  console.log("   Project: campus-7b6fc")
  console.log("==================================================")

  // 1. DELETE OLD STUDENTS
  console.log("\n🗑️  Step 1: Deleting existing 'students' collection...")
  const oldStudentsSnap = await getDocs(collection(db, "students"))
  console.log(`Found ${oldStudentsSnap.size} old student documents to delete.`)
  if (oldStudentsSnap.size > 0) {
    const deleteBatch = writeBatch(db)
    oldStudentsSnap.forEach((d) => {
      deleteBatch.delete(d.ref)
    })
    await deleteBatch.commit()
    console.log("✅ All old student documents deleted.")
  }

  // 2. DELETE OLD COMMITTEE
  console.log("\n🗑️  Step 2: Deleting existing 'committee' collection...")
  const oldCommSnap = await getDocs(collection(db, "committee"))
  console.log(`Found ${oldCommSnap.size} old committee documents to delete.`)
  if (oldCommSnap.size > 0) {
    const deleteBatch = writeBatch(db)
    oldCommSnap.forEach((d) => {
      deleteBatch.delete(d.ref)
    })
    await deleteBatch.commit()
    console.log("✅ All old committee documents deleted.")
  }

  // 3. PARSE & NORMALIZE NEW STUDENTS
  console.log("\n📦 Step 3: Parsing new students from datamhs/database_mahasiswa_firebase.json...")
  const rawStudents = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../datamhs/database_mahasiswa_firebase.json"), "utf-8")
  )
  const newStudents = rawStudents.students.map((s) => ({
    id: s.id,
    name: s.nama,
    class: `Class ${s.kelas}`,
    group: `Group ${s.kelompok}`,
    score: 100,
    note: "No reductions",
    scores: {
      Business: 0,
      English: 0,
      Entrepreneurship: 0,
    },
  }))
  console.log(`Parsed ${newStudents.length} students across 6 classes (Class A - Class F).`)

  // Save to src/data/students.json as well for local offline fallback
  fs.writeFileSync(
    path.join(__dirname, "../src/data/students.json"),
    JSON.stringify(newStudents, null, 2),
    "utf-8"
  )
  console.log("Saved new students to src/data/students.json")

  // Upload new students in batches (batch max is 500)
  console.log("Uploading new students to Firestore 'students' collection...")
  const batch1 = writeBatch(db)
  newStudents.forEach((student) => {
    const ref = doc(db, "students", student.id)
    batch1.set(ref, student)
  })
  await batch1.commit()
  console.log(`✅ Successfully uploaded ${newStudents.length} new students to Firestore!`)

  // 4. PARSE & NORMALIZE NEW COMMITTEE
  console.log("\n📦 Step 4: Parsing new committee from datamhs/panitia_ec_26_firebase.json...")
  const rawPanitia = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../datamhs/panitia_ec_26_firebase.json"), "utf-8")
  )
  let currentDivision = "EVENT"
  const newCommittee = rawPanitia.panitia.map((p, idx) => {
    if (p.division) currentDivision = p.division
    return {
      id: `PAN-${String(idx + 1).padStart(2, "0")}`,
      name: p.name,
      division: currentDivision,
      position: p.position || "MEMBER",
      score: p.position === "COORDINATOR" ? 85 : 80,
      note: "Active camp contribution",
    }
  })
  console.log(`Parsed ${newCommittee.length} committee members across 5 divisions.`)

  // Save to src/data/committee.json
  fs.writeFileSync(
    path.join(__dirname, "../src/data/committee.json"),
    JSON.stringify(newCommittee, null, 2),
    "utf-8"
  )
  console.log("Saved new committee to src/data/committee.json")

  console.log("Uploading new committee to Firestore 'committee' collection...")
  const commBatch = writeBatch(db)
  newCommittee.forEach((member) => {
    const ref = doc(db, "committee", member.id)
    commBatch.set(ref, member)
  })
  await commBatch.commit()
  console.log(`✅ Successfully uploaded ${newCommittee.length} new committee members to Firestore!`)

  // 5. WRITE METADATA SUMMARY DOCUMENT
  console.log("\n📊 Step 5: Writing metadata summary document to Firestore...")
  const classesList = ["Class A", "Class B", "Class C", "Class D", "Class E", "Class F"]
  const metadata = {
    totalStudents: newStudents.length,
    totalClasses: classesList.length,
    classes: classesList,
    totalGroupsPerClass: 6,
    totalCommittee: newCommittee.length,
    divisions: ["EVENT", "PUBLIC & DOCUMENTATION", "CONSUMPTION", "FIELD", "EQUIPMENT"],
    updatedAt: new Date().toISOString(),
  }
  await setDoc(doc(db, "metadata", "camp_overview"), metadata)
  console.log("✅ Successfully written camp metadata overview to Firestore!")

  console.log("\n🎉 ALL NEW DATA HAS BEEN REPLACED AND UPLOADED SUCCESSFULLY!")
  process.exit(0)
}

replaceData().catch((err) => {
  console.error("❌ Replacement failed:", err)
  process.exit(1)
})
