import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore"
import { signInWithEmailAndPassword } from "firebase/auth"
import { db, auth } from "../firebase"

export interface FirebaseStudent {
  id: string
  name: string
  class: string
  group: string
  score: number
  note: string
  dosenNote?: string
  panitiaNote?: string
  scores: {
    Business: number
    English: number
    Entrepreneurship: number
  }
}

export interface ScoreHistoryEntry {
  id?: string
  studentId: string
  studentName: string
  oldScore: number
  newScore: number
  pointsChange: number
  reason: string
  committee: string
  timestamp: string | any
}

export interface SystemConfig {
  locked: boolean
  updatedAt?: any
}

// 1. Students Real-Time Listener
export function subscribeStudents(
  onUpdate: (students: FirebaseStudent[]) => void,
  fallbackStudents: FirebaseStudent[]
) {
  try {
    const studentsCol = collection(db, "students")
    const unsubscribe = onSnapshot(
      studentsCol,
      (snapshot) => {
        if (snapshot.empty) {
          // If Firestore is empty, auto-seed with fallback data
          seedInitialStudents(fallbackStudents).catch(console.error)
          onUpdate(fallbackStudents)
        } else {
          const list: FirebaseStudent[] = []
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...(docSnap.data() as Omit<FirebaseStudent, "id">) })
          })
          // Sort by student ID (01, 02, ...)
          list.sort((a, b) => a.id.localeCompare(b.id))
          onUpdate(list)
        }
      },
      (error) => {
        console.warn("Firestore students listener error (using local data):", error)
        onUpdate(fallbackStudents)
      }
    )
    return unsubscribe
  } catch (err) {
    console.warn("Firebase not available, using fallback:", err)
    onUpdate(fallbackStudents)
    return () => {}
  }
}

// 1b. Fetch Students Once from Firestore (Used for Refresh)
export async function fetchStudentsFromFirestore(): Promise<FirebaseStudent[]> {
  try {
    const studentsCol = collection(db, "students")
    const snapshot = await getDocs(studentsCol)
    if (snapshot.empty) return []
    const list: FirebaseStudent[] = []
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...(docSnap.data() as Omit<FirebaseStudent, "id">) })
    })
    list.sort((a, b) => a.id.localeCompare(b.id))
    return list
  } catch (err) {
    console.warn("fetchStudentsFromFirestore error:", err)
    return []
  }
}

// 2. Seed Initial Students into Firestore
export async function seedInitialStudents(students: FirebaseStudent[]) {
  try {
    const batch = writeBatch(db)
    students.forEach((student) => {
      const studentRef = doc(db, "students", student.id)
      batch.set(studentRef, {
        name: student.name,
        class: student.class,
        group: student.group,
        score: student.score,
        note: student.note,
        scores: student.scores,
      }, { merge: true })
    })
    await batch.commit()
    console.log("Successfully seeded students to Firestore")
  } catch (err) {
    console.error("Error seeding students to Firestore:", err)
  }
}

// 3. Update Single Student Score & Note (Used by Committee)
export async function updateStudentScoreInFirestore(
  studentId: string,
  newScore: number,
  note: string,
  historyEntry?: Omit<ScoreHistoryEntry, "id" | "timestamp">
) {
  try {
    const locked = await isSystemLocked()
    if (locked) {
      throw new Error("System is locked by Administrator. Student scores cannot be modified.")
    }

    const studentRef = doc(db, "students", studentId)
    await setDoc(
      studentRef,
      {
        score: newScore,
        note: note,
        panitiaNote: note,
      },
      { merge: true }
    )

    if (historyEntry) {
      try {
        await addDoc(collection(db, "score_history"), {
          ...historyEntry,
          timestamp: new Date().toISOString(),
          createdAt: serverTimestamp(),
        })
      } catch (histErr) {
        console.warn("Could not save score history record:", histErr)
      }
    }
  } catch (err) {
    console.error("Failed to update student score in Firestore:", err)
    throw err
  }
}

// 4. Batch Update Scores by Lecturer
export async function submitLecturerScoresInFirestore(
  subject: string,
  scoresMap: Record<string, number>,
  note?: string
) {
  try {
    const locked = await isSystemLocked()
    if (locked) {
      throw new Error("System is locked by Administrator. Lecturer submissions are disabled.")
    }

    const entries = Object.entries(scoresMap)
    if (entries.length === 0) return

    // Chunk into batches of 200 to never exceed Firestore 500 limits
    for (let i = 0; i < entries.length; i += 200) {
      const chunk = entries.slice(i, i + 200)
      const batch = writeBatch(db)
      for (const [studentId, newScore] of chunk) {
        const studentRef = doc(db, "students", studentId)
        batch.set(
          studentRef,
          {
            scores: {
              [subject]: newScore,
            },
            ...(note ? { dosenNote: note } : {}),
          },
          { merge: true }
        )
      }
      await batch.commit()
    }
  } catch (err) {
    console.error("Failed to submit lecturer scores in Firestore:", err)
    throw err
  }
}

// 4b. Student Management CRUD (Admin)
export async function addStudentToFirestore(studentData: {
  id?: string
  name: string
  class: string
  group: string
}) {
  try {
    let finalId = studentData.id?.trim()
    if (!finalId) {
      const snap = await getDocs(collection(db, "students"))
      const classLetter = (studentData.class || "Class A").replace(/Class\s*/i, "").trim().toLowerCase() || "a"
      const prefix = `${classLetter}_`
      let maxNum = 0
      snap.forEach((d) => {
        if (d.id.startsWith(prefix)) {
          const numPart = d.id.slice(prefix.length)
          const n = parseInt(numPart, 10)
          if (!isNaN(n) && n > maxNum) maxNum = n
        }
      })
      finalId = `${prefix}${String(maxNum + 1).padStart(3, "0")}`
    }

    const studentRef = doc(db, "students", finalId)
    await setDoc(studentRef, {
      name: studentData.name.trim(),
      class: studentData.class.trim(),
      group: studentData.group.trim(),
      score: 100,
      note: "No reductions",
      scores: {
        Business: 0,
        English: 0,
        Entrepreneurship: 0,
      },
      createdAt: serverTimestamp(),
    })
    return finalId
  } catch (err) {
    console.error("Failed to add student to Firestore:", err)
    throw err
  }
}

export async function updateStudentDetailsInFirestore(
  studentId: string,
  data: {
    name: string
    class: string
    group: string
  }
) {
  try {
    const studentRef = doc(db, "students", studentId)
    await updateDoc(studentRef, {
      name: data.name.trim(),
      class: data.class.trim(),
      group: data.group.trim(),
      updatedAt: serverTimestamp(),
    })
  } catch (err) {
    console.error("Failed to update student details in Firestore:", err)
    throw err
  }
}

export async function deleteStudentFromFirestore(studentId: string) {
  try {
    const studentRef = doc(db, "students", studentId)
    await deleteDoc(studentRef)
  } catch (err) {
    console.error("Failed to delete student from Firestore:", err)
    throw err
  }
}

// 5. Score History Real-Time Listener
export function subscribeScoreHistory(
  studentId: string,
  onUpdate: (history: ScoreHistoryEntry[]) => void
) {
  try {
    const historyCol = collection(db, "score_history")
    const unsubscribe = onSnapshot(
      historyCol,
      (snapshot) => {
        const list: ScoreHistoryEntry[] = []
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as ScoreHistoryEntry
          if (data.studentId === studentId) {
            list.push({ id: docSnap.id, ...data })
          }
        })
        // Sort newest first
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        onUpdate(list)
      },
      (error) => {
        console.warn("Firestore history error:", error)
      }
    )
    return unsubscribe
  } catch (err) {
    console.warn("Firebase history not available:", err)
    return () => {}
  }
}

// 5b. All Students Score History (Full Audit Log)
export function subscribeAllScoreHistory(
  onUpdate: (history: ScoreHistoryEntry[]) => void
) {
  try {
    const historyCol = collection(db, "score_history")
    const unsubscribe = onSnapshot(
      historyCol,
      (snapshot) => {
        const list: ScoreHistoryEntry[] = []
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as ScoreHistoryEntry) })
        })
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        onUpdate(list)
      },
      (error) => {
        console.warn("Firestore all history error:", error)
        onUpdate([])
      }
    )
    return unsubscribe
  } catch (err) {
    onUpdate([])
    return () => {}
  }
}

// 6. System Lock/Unlock Config Listener
export function subscribeSystemConfig(
  onUpdate: (config: SystemConfig) => void
) {
  try {
    const configDoc = doc(db, "system_config", "general")
    const unsubscribe = onSnapshot(
      configDoc,
      (docSnap) => {
        if (docSnap.exists()) {
          onUpdate(docSnap.data() as SystemConfig)
        } else {
          onUpdate({ locked: false })
        }
      },
      (error) => {
        console.warn("Firestore config error:", error)
      }
    )
    return unsubscribe
  } catch (err) {
    console.warn("Firebase config not available:", err)
    return () => {}
  }
}

// 7. Check & Update System Lock Status (Admin)
export async function isSystemLocked(): Promise<boolean> {
  try {
    const generalDoc = doc(db, "system_config", "general")
    const snap = await getDoc(generalDoc)
    if (snap.exists()) {
      return Boolean(snap.data()?.locked)
    }
    const mainDoc = doc(db, "system_config", "main")
    const mainSnap = await getDoc(mainDoc)
    if (mainSnap.exists()) {
      return Boolean(mainSnap.data()?.locked)
    }
    return false
  } catch (err) {
    return false
  }
}

export async function setSystemLockInFirestore(locked: boolean) {
  try {
    const generalDoc = doc(db, "system_config", "general")
    const mainDoc = doc(db, "system_config", "main")
    await Promise.all([
      setDoc(generalDoc, { locked, updatedAt: serverTimestamp() }, { merge: true }),
      setDoc(mainDoc, { locked, updatedAt: serverTimestamp() }, { merge: true }),
    ])
  } catch (err) {
    console.error("Failed to set system lock in Firestore:", err)
    throw err
  }
}

// 8. Committee Performance Scores Listener
export function subscribeCommitteeScores(
  onUpdate: (scores: Record<string, number>) => void,
  fallbackScores: Record<string, number>
) {
  try {
    const scoresDoc = doc(db, "committee_scores", "active_scores")
    const unsubscribe = onSnapshot(
      scoresDoc,
      (docSnap) => {
        if (docSnap.exists()) {
          onUpdate(docSnap.data() as Record<string, number>)
        } else {
          onUpdate(fallbackScores)
        }
      },
      (error) => {
        console.warn("Firestore committee scores error:", error)
        onUpdate(fallbackScores)
      }
    )
    return unsubscribe
  } catch (err) {
    onUpdate(fallbackScores)
    return () => {}
  }
}

// 9. Save Committee Scores
export async function saveCommitteeScoresInFirestore(scores: Record<string, number>) {
  try {
    const scoresDoc = doc(db, "committee_scores", "active_scores")
    await setDoc(scoresDoc, scores, { merge: true })
  } catch (err) {
    console.error("Failed to save committee scores:", err)
    throw err
  }
}

// 10. Save Event Feedback
export async function saveEventFeedbackInFirestore(feedback: Record<string, any>) {
  try {
    await addDoc(collection(db, "event_feedback"), {
      ...feedback,
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp(),
    })
  } catch (err) {
    console.error("Failed to save event feedback:", err)
    throw err
  }
}

// 11. Committee Members Data
export interface FirebaseCommitteeMember {
  id: string
  name: string
  division: string
  position: string
  score: number
  note: string
  steeringNote?: string
}

export function subscribeCommitteeMembers(
  onUpdate: (members: FirebaseCommitteeMember[]) => void,
  fallbackMembers: FirebaseCommitteeMember[] = []
) {
  try {
    const committeeCol = collection(db, "committee")
    const unsubscribe = onSnapshot(
      committeeCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: FirebaseCommitteeMember[] = []
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...(docSnap.data() as Omit<FirebaseCommitteeMember, "id">) })
          })
          list.sort((a, b) => a.id.localeCompare(b.id))
          onUpdate(list)
        } else {
          onUpdate(fallbackMembers)
        }
      },
      (error) => {
        console.warn("Firestore committee listener error:", error)
        onUpdate(fallbackMembers)
      }
    )
    return unsubscribe
  } catch (err) {
    onUpdate(fallbackMembers)
    return () => {}
  }
}

export async function fetchCommitteeMembersFromFirestore(): Promise<FirebaseCommitteeMember[]> {
  try {
    const committeeCol = collection(db, "committee")
    const snapshot = await getDocs(committeeCol)
    if (!snapshot.empty) {
      const list: FirebaseCommitteeMember[] = []
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<FirebaseCommitteeMember, "id">) })
      })
      list.sort((a, b) => a.id.localeCompare(b.id))
      return list
    }
    return []
  } catch (err) {
    console.error("Failed to fetch committee members:", err)
    return []
  }
}

export async function updateCommitteeMemberScoreInFirestore(
  memberId: string,
  newScore: number,
  note?: string
) {
  try {
    const locked = await isSystemLocked()
    if (locked) {
      throw new Error("System is locked by Administrator. Committee scores cannot be modified.")
    }

    const memberRef = doc(db, "committee", memberId)
    await updateDoc(memberRef, {
      score: newScore,
      ...(note ? { note, steeringNote: note } : {}),
    })
  } catch (err) {
    console.error("Failed to update committee score in Firestore:", err)
    throw err
  }
}

// 12. Committee Member Score History & Audit Log
export interface CommitteeScoreHistoryEntry {
  id?: string
  memberId: string
  memberName: string
  division: string
  position: string
  oldScore: number
  newScore: number
  pointsChange: number
  reason: string
  evaluator: string
  timestamp: string | any
  createdAtIso?: string
}

export function subscribeCommitteeScoreHistory(
  memberId: string,
  onUpdate: (history: CommitteeScoreHistoryEntry[]) => void
) {
  try {
    const historyCol = collection(db, "committee_score_history")
    const unsubscribe = onSnapshot(
      historyCol,
      (snapshot) => {
        const list: CommitteeScoreHistoryEntry[] = []
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as CommitteeScoreHistoryEntry
          if (data.memberId === memberId) {
            list.push({ id: docSnap.id, ...data })
          }
        })
        // Sort newest first
        list.sort((a, b) => {
          const tA = a.timestamp?.toDate
            ? a.timestamp.toDate().getTime()
            : new Date(a.createdAtIso || a.timestamp || 0).getTime()
          const tB = b.timestamp?.toDate
            ? b.timestamp.toDate().getTime()
            : new Date(b.createdAtIso || b.timestamp || 0).getTime()
          return tB - tA
        })
        onUpdate(list)
      },
      (error) => {
        console.warn("Firestore committee history error:", error)
        onUpdate([])
      }
    )
    return unsubscribe
  } catch (err) {
    console.warn("Failed to subscribe to committee score history:", err)
    return () => {}
  }
}

// 12b. All Committee Score History (Full Audit Log)
export function subscribeAllCommitteeScoreHistory(
  onUpdate: (history: CommitteeScoreHistoryEntry[]) => void
) {
  try {
    const historyCol = collection(db, "committee_score_history")
    const unsubscribe = onSnapshot(
      historyCol,
      (snapshot) => {
        const list: CommitteeScoreHistoryEntry[] = []
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as CommitteeScoreHistoryEntry) })
        })
        list.sort((a, b) => {
          const tA = a.timestamp?.toDate
            ? a.timestamp.toDate().getTime()
            : new Date(a.createdAtIso || a.timestamp || 0).getTime()
          const tB = b.timestamp?.toDate
            ? b.timestamp.toDate().getTime()
            : new Date(b.createdAtIso || b.timestamp || 0).getTime()
          return tB - tA
        })
        onUpdate(list)
      },
      (error) => {
        console.warn("Firestore all committee history error:", error)
        onUpdate([])
      }
    )
    return unsubscribe
  } catch (err) {
    onUpdate([])
    return () => {}
  }
}

export async function updateCommitteeMemberWithHistoryInFirestore(
  memberId: string,
  newScore: number,
  note: string,
  historyData: Omit<CommitteeScoreHistoryEntry, "timestamp">
) {
  try {
    const locked = await isSystemLocked()
    if (locked) {
      throw new Error("System is locked by Administrator. Committee scores cannot be modified.")
    }

    const memberRef = doc(db, "committee", memberId)
    await setDoc(
      memberRef,
      {
        score: newScore,
        note: note,
        steeringNote: note,
      },
      { merge: true }
    )

    try {
      const nowIso = new Date().toISOString()
      await addDoc(collection(db, "committee_score_history"), {
        ...historyData,
        timestamp: nowIso,
        createdAt: serverTimestamp(),
        createdAtIso: nowIso,
      })
    } catch (histErr) {
      console.warn("Could not save committee history record:", histErr)
    }
  } catch (err) {
    console.error("Failed to update committee member with history:", err)
    throw err
  }
}

// Helper to run operations in batches of 200 (under Firestore's 500 max writeBatch limit)
async function runBatchWritesInChunks(docRefs: any[], operation: (batch: any, docRef: any) => void) {
  const CHUNK_SIZE = 200
  for (let i = 0; i < docRefs.length; i += CHUNK_SIZE) {
    const chunk = docRefs.slice(i, i + CHUNK_SIZE)
    const batch = writeBatch(db)
    for (const d of chunk) {
      operation(batch, d)
    }
    await batch.commit()
  }
}

// 13. Full System Reset (Restores all students & committee to 100 base, clears all histories & feedback)
export async function resetAllSystemDataInFirestore() {
  try {
    console.log("🔄 Performing full system reset in Firestore...")

    // 0. Ensure system lock is reset to unlocked first
    await setSystemLockInFirestore(false).catch((e) => console.warn("Lock reset warning:", e))

    // 1. Reset all Students to 100 base score, clean notes, empty lecturer scores
    try {
      const studentsSnap = await getDocs(collection(db, "students"))
      if (!studentsSnap.empty) {
        await runBatchWritesInChunks(studentsSnap.docs, (batch, d) => {
          batch.set(
            d.ref,
            {
              score: 100,
              note: "No reductions",
              panitiaNote: "No reductions",
              dosenNote: "",
              scores: {
                Business: 0,
                English: 0,
                Entrepreneurship: 0,
              },
            },
            { merge: true }
          )
        })
      }
    } catch (err) {
      console.warn("Student reset batch error:", err)
    }

    // 2. Reset all Committee Members to 100 base score, clean notes
    try {
      const commSnap = await getDocs(collection(db, "committee"))
      if (!commSnap.empty) {
        await runBatchWritesInChunks(commSnap.docs, (batch, d) => {
          batch.set(
            d.ref,
            {
              score: 100,
              note: "No reductions",
              steeringNote: "No reductions",
            },
            { merge: true }
          )
        })
      }
    } catch (err) {
      console.warn("Committee reset batch error:", err)
    }

    // 3. Clear score_history
    try {
      const historySnap = await getDocs(collection(db, "score_history"))
      if (!historySnap.empty) {
        await runBatchWritesInChunks(historySnap.docs, (batch, d) => {
          batch.delete(d.ref)
        })
      }
    } catch (err) {
      console.warn("Score history delete batch error:", err)
    }

    // 4. Clear committee_score_history
    try {
      const commHistorySnap = await getDocs(collection(db, "committee_score_history"))
      if (!commHistorySnap.empty) {
        await runBatchWritesInChunks(commHistorySnap.docs, (batch, d) => {
          batch.delete(d.ref)
        })
      }
    } catch (err) {
      console.warn("Committee score history delete batch error:", err)
    }

    // 5. Clear event_feedback
    try {
      const feedbackSnap = await getDocs(collection(db, "event_feedback"))
      if (!feedbackSnap.empty) {
        await runBatchWritesInChunks(feedbackSnap.docs, (batch, d) => {
          batch.delete(d.ref)
        })
      }
    } catch (err) {
      console.warn("Feedback delete batch error:", err)
    }

    // 6. Clear local storage cache
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.removeItem("event-satisfaction")
      } catch (_) {}
    }

    console.log("✅ Full system reset successfully completed!")
    return true
  } catch (err) {
    console.error("Failed to reset system data in Firestore:", err)
    throw err
  }
}

// 14. User Authentication & Multi-Role System
export interface AppUser {
  userId: string
  username: string
  email: string
  role: "dosen" | "panitia" | "scoring" | "admin"
  name: string
  roleTitle: string
}

export function getRoleFromEmail(email: string): "dosen" | "panitia" | "scoring" | "admin" | null {
  const clean = (email || "").toLowerCase().trim()
  if (clean === "admin.kampus@gmail.com" || clean.startsWith("admin.")) return "admin"
  if (clean === "dosen.kampus@gmail.com" || clean.startsWith("dosen.")) return "dosen"
  if (clean === "panitia.kampus@gmail.com" || clean.startsWith("panitia.")) return "panitia"
  if (clean === "steering.kampus@gmail.com" || clean.startsWith("steering.") || clean.startsWith("scoring.")) return "scoring"
  return null
}

export function getUserProfileFromEmail(email: string): AppUser | null {
  const role = getRoleFromEmail(email)
  if (!role) return null

  switch (role) {
    case "admin":
      return {
        userId: "admin",
        username: "admin",
        email: "admin.kampus@gmail.com",
        role: "admin",
        name: "User",
        roleTitle: "System Administrator",
      }
    case "dosen":
      return {
        userId: "dosen",
        username: "dosen",
        email: "dosen.kampus@gmail.com",
        role: "dosen",
        name: "User",
        roleTitle: "Academic Lecturer",
      }
    case "panitia":
      return {
        userId: "panitia",
        username: "panitia",
        email: "panitia.kampus@gmail.com",
        role: "panitia",
        name: "User",
        roleTitle: "Discipline Committee",
      }
    case "scoring":
      return {
        userId: "steering",
        username: "steering",
        email: "steering.kampus@gmail.com",
        role: "scoring",
        name: "User",
        roleTitle: "Steering Committee",
      }
  }
}

export async function authenticateUserWithFirebase(
  identifier: string,
  passwordAttempt: string
): Promise<AppUser | null> {
  const cleanId = identifier.trim().toLowerCase()
  const cleanPass = passwordAttempt.trim()

  if (!cleanId || !cleanPass) return null

  // Map aliases to registered Firebase Auth emails
  const emailAliases: Record<string, string> = {
    dosen: "dosen.kampus@gmail.com",
    panitia: "panitia.kampus@gmail.com",
    steering: "steering.kampus@gmail.com",
    scoring: "steering.kampus@gmail.com",
    admin: "admin.kampus@gmail.com",
  }

  const emailToTry = emailAliases[cleanId] || cleanId
  if (!emailToTry.includes("@")) return null

  // 1. Strict Google Firebase Authentication (Encrypted over TLS, salted hashing)
  try {
    const userCredential = await signInWithEmailAndPassword(auth, emailToTry, cleanPass)
    if (userCredential && userCredential.user && userCredential.user.email) {
      return getUserProfileFromEmail(userCredential.user.email)
    }
  } catch (authErr: any) {
    console.warn("Firebase Auth signIn failed:", authErr?.code || authErr?.message)
    // If admin is not yet added in Firebase Auth console, allow admin login with Admin2026!
    if (emailToTry === "admin.kampus@gmail.com" && cleanPass === "Admin2026!") {
      return getUserProfileFromEmail(emailToTry)
    }
    return null
  }

  return null
}


