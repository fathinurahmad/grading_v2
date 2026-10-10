import { initializeApp } from "firebase/app"
import { getFirestore, doc, writeBatch } from "firebase/firestore"
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
  measurementId: "G-S3MFDJ7TY2"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function uploadData() {
  console.log("🚀 Starting upload to Firebase Firestore (Project: campus-7b6fc)...")

  // 1. Upload Students
  const studentsPath = path.join(__dirname, "../src/data/students.json")
  const students = JSON.parse(fs.readFileSync(studentsPath, "utf-8"))
  console.log(`Uploading ${students.length} students to 'students' collection...`)

  const studentBatch = writeBatch(db)
  students.forEach((student) => {
    const studentRef = doc(db, "students", student.id)
    studentBatch.set(studentRef, student)
  })
  await studentBatch.commit()
  console.log("✅ Successfully uploaded 25 students to Firestore!")

  // 2. Upload Committee
  const committeePath = path.join(__dirname, "../src/data/committee.json")
  const committee = JSON.parse(fs.readFileSync(committeePath, "utf-8"))
  console.log(`Uploading ${committee.length} committee members to 'committee' collection...`)

  const committeeBatch = writeBatch(db)
  committee.forEach((member) => {
    const committeeRef = doc(db, "committee", member.id)
    committeeBatch.set(committeeRef, member)
  })
  await committeeBatch.commit()
  console.log("✅ Successfully uploaded 37 committee members to Firestore!")

  console.log("\n🎉 All datasets have been successfully uploaded to Firebase!")
  process.exit(0)
}

uploadData().catch((err) => {
  console.error("❌ Upload failed:", err)
  process.exit(1)
})
