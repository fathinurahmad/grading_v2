import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs } from "firebase/firestore"

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

async function verify() {
  console.log("Checking Firestore live database in project: campus-7b6fc...")

  const studentsSnap = await getDocs(collection(db, "students"))
  console.log(`\n📚 Total Documents in 'students' collection: ${studentsSnap.size}`)
  studentsSnap.docs.slice(0, 5).forEach((d) => {
    const data = d.data()
    console.log(` - [ID: ${data.id}] ${data.name} (${data.class}, ${data.group}, Score: ${data.score})`)
  })

  const committeeSnap = await getDocs(collection(db, "committee"))
  console.log(`\n👥 Total Documents in 'committee' collection: ${committeeSnap.size}`)
  committeeSnap.docs.slice(0, 5).forEach((d) => {
    const data = d.data()
    console.log(` - [ID: ${data.id}] ${data.name} [${data.division} - ${data.position}]`)
  })

  process.exit(0)
}

verify().catch(err => {
  console.error("Verification error:", err)
  process.exit(1)
})
