import {
  FormEvent,
  ReactNode,
  createElement,
  useEffect,
  useMemo,
  useState,
} from "react"
import campusLogo from "./assets/campus-logo.png"
import splashBg from "./assets/splash-bg.png"
import illustTentCampus from "./assets/illus-tent-campus.png"
import illustHiker from "./assets/illus-hiker.png"
import illustCampfire from "./assets/illus-campfire.png"
import illustGroupCamp from "./assets/illus-group-camp.png"
import unmLogo from "./assets/unm-logo.png"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth } from "./firebase"
import defaultCommittee from "./data/committee.json"
import defaultStudents from "./data/students.json"
import {
  LIKERT_QUESTIONS,
  CLASS_OPTIONS,
  GENDER_OPTIONS,
  ABILITY_OPTIONS,
  HELPFUL_ACTIVITY_OPTIONS,
} from "./data/questionnaire"
import {
  subscribeStudents,
  fetchStudentsFromFirestore,
  updateStudentScoreInFirestore,
  submitLecturerScoresInFirestore,
  subscribeScoreHistory,
  subscribeAllScoreHistory,
  subscribeSystemConfig,
  setSystemLockInFirestore,
  subscribeCommitteeScores,
  saveCommitteeScoresInFirestore,
  saveEventFeedbackInFirestore,
  subscribeCommitteeMembers,
  fetchCommitteeMembersFromFirestore,
  updateCommitteeMemberScoreInFirestore,
  updateCommitteeMemberWithHistoryInFirestore,
  subscribeCommitteeScoreHistory,
  subscribeAllCommitteeScoreHistory,
  resetAllSystemDataInFirestore,
  addStudentToFirestore,
  updateStudentDetailsInFirestore,
  deleteStudentFromFirestore,
  authenticateUserWithFirebase,
  getRoleFromEmail,
  AppUser,
  ScoreHistoryEntry,
  CommitteeScoreHistoryEntry,
  FirebaseStudent,
  FirebaseCommitteeMember,
} from "./services/firebaseService"
import { downloadExcelReport } from "./services/excelExportService"

type Role = "dosen" | "panitia" | "scoring" | "admin"
type IconName = "activity" | "arrow" | "book" | "check" | "chevron" | "clock" | "download" | "edit" | "eye" | "filter" | "home" | "lock" | "logout" | "menu" | "minus" | "people" | "plus" | "profile" | "refresh" | "search" | "shield" | "sparkle" | "star" | "trash" | "warning"

const paths: Record<IconName, ReactNode> = {
  home: (
    <path d="M3 10.8 12 3l9 7.8v9.4a.8.8 0 0 1-.8.8h-5.6v-6.2H9.4V21H3.8a.8.8 0 0 1-.8-.8z" />
  ),
  book: (
    <>
      <path d="M4 4.8A2.8 2.8 0 0 1 6.8 2H20v17H6.8A2.8 2.8 0 0 0 4 21.8z" />
      <path d="M4 4.8v17M8 6h8" />
    </>
  ),
  people: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  activity: (
    <>
      <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  filter: <path d="M4 5h16M7 12h10M10 19h4" />,
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="m16.5 3.5 4 4L9 19l-5 1 1-5z" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12m0 0 5-5m-5 5-5-5M4 21h16" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 6v5h-5" />
      <path d="M19 11a8 8 0 1 0 .2 5" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M9 3h6l1 4H8zM7 7l1 14h8l1-14" />
    </>
  ),
  logout: (
    <>
      <path d="M10 4H4v16h6M14 8l4 4-4 4M18 12H9" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  star: (
    <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z" />
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  arrow: <path d="m15 18-6-6 6-6" />,
  check: <path d="m5 12 4 4L19 6" />,
  warning: (
    <>
      <path d="M12 3 2.8 20h18.4z" />
      <path d="M12 9v4m0 3h.01" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2 4 5v6c0 5.2 3.4 9.3 8 11 4.6-1.7 8-5.8 8-11V5z" />
      <path d="m8.5 12 2.3 2.3 4.7-5" />
    </>
  ),
  sparkle: (
    <path d="m12 2 1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6zM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7z" />
  ),
  eye: (
    <>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
}

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

function Button({
  children,
  className = "",
  icon,
  ...props
}: {
  children?: ReactNode
  className?: string
  icon?: IconName
  [key: string]: unknown
}) {
  return createElement(
    "button",
    { className: `button ${className}`, ...props },
    icon && <Icon name={icon} />,
    children,
  )
}

async function downloadReport(reportName: string) {
  try {
    await downloadExcelReport(reportName)
  } catch (err) {
    console.error("Failed to generate Excel report:", err)
  }
}

function Heading({
  level = 2,
  children,
  className = "",
}: {
  level?: 1 | 2 | 3 | 4
  children: ReactNode
  className?: string
}) {
  return createElement(`h${level}`, { className }, children)
}

function Field({
  label,
  hint,
  error,
  className = "",
  ...props
}: {
  label?: string
  hint?: string
  error?: string
  className?: string
  [key: string]: unknown
}) {
  return (
    <label className={`field ${className}`}>
      {label && <span className="field-label">{label}</span>}
      {createElement("input", {
        className: `input ${error ? "input-error" : ""}`,
        ...props,
      })}
      {(error || hint) && (
        <span className={`field-hint ${error ? "error-text" : ""}`}>
          {error || hint}
        </span>
      )}
    </label>
  )
}

function Avatar({
  name,
  purple = false,
  image,
}: {
  name: string
  purple?: boolean
  image?: string
}) {
  if (image) {
    return (
      <div
        className={`avatar ${purple ? "purple" : ""}`}
        aria-label={`${name} profile`}
        style={{
          overflow: "hidden",
          background: "#ffffff",
          padding: "3px",
        }}
      >
        <img
          src={image}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </div>
    )
  }
  return (
    <div
      className={`avatar ${purple ? "purple" : ""}`}
      aria-label={`${name} profile`}
    >
      {name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")}
    </div>
  )
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <div className="brand-mark">
        <img src={campusLogo} alt="English Camp Accounting" />
      </div>
      <div>
        <strong>English Camp</strong>
        {!compact && <span>Grading &amp; Evaluation</span>}
      </div>
    </div>
  )
}

function Splash() {
  return (
    <main
      className="splash"
      style={{
        backgroundImage: `url(${splashBg})`,
      }}
    >
      <div className="splash-backdrop" />
      <div className="splash-content">
        <div className="splash-logo">
          <img src={campusLogo} alt="English Camp" />
        </div>
        <h1 className="splash-title">
          <span>English</span> <span className="splash-accent">Camp</span>
        </h1>
        <p className="splash-tagline">Explore · Connect · Experience</p>
        <div className="splash-progress-track">
          <div className="splash-progress-fill" />
        </div>
        <p className="splash-loading-text">Preparing evaluation portal...</p>
      </div>
    </main>
  )
}

function Login({
  onLogin,
  onEventRating,
}: {
  onLogin: (role: Role) => void
  onEventRating: () => void
}) {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const cleanId = identifier.trim()
    const cleanPass = password.trim()

    if (!cleanId) {
      setError("Please enter your User ID or username.")
      return
    }
    if (!cleanPass) {
      setError("Please enter your password.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const user = await authenticateUserWithFirebase(cleanId, cleanPass)
      if (user) {
        setLoading(false)
        onLogin(user.role)
      } else {
        setError("Invalid User ID or password. Check credentials.")
        setLoading(false)
      }
    } catch (err) {
      console.error("Login verification failed:", err)
      setError("Authentication error. Please check your connection.")
      setLoading(false)
    }
  }



  return (
    <main
      className="glass-login-page"
      style={{ backgroundImage: `url(${splashBg})` }}
    >
      <div className="glass-login-overlay" />

      <div className="glass-login-container">
        {/* Desktop Hero Section: Logo, title, and descriptive text */}
        <div className="glass-login-hero">
          <div className="glass-hero-badge">
            <div className="glass-hero-logos">
              <div className="glass-hero-logo">
                <img src={campusLogo} alt="Campus Logo" />
              </div>
              <div className="glass-hero-logo">
                <img src={unmLogo} alt="UNM Logo" />
              </div>
            </div>
            <span className="glass-hero-chip">English Camp Accounting</span>
          </div>

          <h1 className="glass-hero-title">
            English Camp <br />
            <span>Grading & Evaluation</span>
          </h1>

          <p className="glass-hero-desc">
            Unified grading and assessment platform for English Camp. Track student achievements, record group evaluations, and monitor performance with full accountability.
          </p>

          <div className="glass-hero-features">
            <span className="glass-feature-tag">
              <Icon name="shield" size={16} /> Transparent Grading
            </span>
            <span className="glass-feature-tag">
              <Icon name="activity" size={16} /> Real-Time Tracking
            </span>
            <span className="glass-feature-tag">
              <Icon name="people" size={16} /> Multi-Role Access
            </span>
          </div>
        </div>

        {/* Login Card */}
        <form className="glass-login-card" onSubmit={submit}>
          {/* Card Header with Logo & Title */}
          <div className="glass-card-header">
            <div className="glass-card-logo">
              <img src={campusLogo} alt="Campus Logo" />
            </div>
            <div className="glass-card-copy">
              <h3>English Camp</h3>
              <p>Accounting Department</p>
            </div>
          </div>

          {/* Email / User ID field */}
          <div className="glass-input-wrap">
            <span className="glass-input-icon">
              <Icon name="profile" size={20} />
            </span>
            <input
              type="text"
              className="glass-input"
              placeholder="Email / User ID"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value)
                if (error) setError("")
              }}
              autoComplete="username"
            />
          </div>

          {/* Password field with lock icon and eye toggle */}
          <div className="glass-input-wrap">
            <span className="glass-input-icon">
              <Icon name="lock" size={20} />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              className="glass-input"
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (error) setError("")
              }}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="glass-eye-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <Icon name="eye" size={20} />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                background: "rgba(254, 242, 242, 0.95)",
                border: "1px solid #fecaca",
                borderRadius: "12px",
                padding: "8px 12px",
                color: "#b91c1c",
                fontSize: "12px",
                textAlign: "center",
                marginBottom: "12px",
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          {/* Submit button with arrow */}
          <button
            type="submit"
            className="glass-submit-btn"
            disabled={loading}
            aria-label="Sign in"
          >
            {loading ? (
              <span className="spinner" />
            ) : (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="13 6 19 12 13 18" />
              </svg>
            )}
          </button>


          {/* Public event feedback link */}
          <button
            type="button"
            className="glass-rating-link"
            onClick={onEventRating}
          >
            <span>Rate your camp experience</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </form>
      </div>
    </main>
  )
}

const roleMeta = {
  dosen: {
    label: "Lecturer",
    title: "Lecturer Dashboard",
    subtitle: "Manage your student scores.",
    accent: "blue",
  },
  panitia: {
    label: "Panitia",
    title: "Student Score Evaluation",
    subtitle: "Review scores with clarity and accountability.",
    accent: "purple",
  },
  scoring: {
    label: "Steering Committee",
    title: "Steering Committee",
    subtitle: "Evaluate committee performance and divisional contributions.",
    accent: "purple",
  },
  admin: {
    label: "Administrator",
    title: "Camp Control Center",
    subtitle: "Manage authorized camp data.",
    accent: "navy",
  },
}

function ProfilePage({
  role,
  onLogout,
}: {
  role: Role
  onLogout: () => void
}) {
  const guideData = {
    dosen: {
      eyebrow: "USER GUIDE · LECTURER",
      title: "Lecturer Workspace Guide",
      subtitle: "Step-by-step workflow for academic scoring, class filtering, and Excel report export.",
      steps: [
        {
          num: "01",
          icon: "book" as IconName,
          title: "Pilih Mata Kuliah & Kelas",
          desc: "Tentukan mata kuliah yang dinilai (Business, English, atau Entrepreneurship), lalu pilih kelas (Class A - F) dan kelompok sasaran.",
        },
        {
          num: "02",
          icon: "star" as IconName,
          title: "Input & Sesuaikan Nilai",
          desc: "Gunakan tombol penyesuaian nilai (+/-) atau ketik langsung skor setiap mahasiswa dalam rentang 0 hingga 100.",
        },
        {
          num: "03",
          icon: "check" as IconName,
          title: "Simpan Nilai ke Cloud Firebase",
          desc: "Klik tombol 'Submit Scores' untuk menyimpan nilai secara permanen. Nilai langsung tersinkronisasi aman di cloud Firestore.",
        },
        {
          num: "04",
          icon: "download" as IconName,
          title: "Unduh Laporan Rekapitulasi Excel",
          desc: "Klik tombol ekspor di bilah atas untuk mengunduh rekapitulasi penilaian lengkap bertanda tangan dalam format Excel (.xlsx).",
        },
      ],
      highlights: [
        { label: "Submission Deadline", desc: "Ensure all score submissions are completed before the system is locked by Administrator." },
        { label: "Automated Calculation", desc: "Average across 3 subjects and letter grades (A/B/C/D/E) are automatically calculated by the system." },
        { label: "Real-Time Validation", desc: "The platform prevents duplicate submissions and instantly synchronizes student scoring status." },
      ],
    },
    panitia: {
      eyebrow: "USER GUIDE · COMMITTEE",
      title: "Committee Workspace Guide",
      subtitle: "Step-by-step workflow for student discipline evaluation, violation tracking, and point deductions.",
      steps: [
        {
          num: "01",
          icon: "people" as IconName,
          title: "Cari Data Mahasiswa",
          desc: "Gunakan kolom pencarian nama/ID atau filter kelas untuk menemukan mahasiswa yang akan dievaluasi kedisiplinannya.",
        },
        {
          num: "02",
          icon: "shield" as IconName,
          title: "Evaluasi Pelanggaran & Poin",
          desc: "Pilih kategori pelanggaran (keterlambatan, ketertiban, dll.) dan kurangi poin dari modal awal 100 poin mahasiswa.",
        },
        {
          num: "03",
          icon: "check" as IconName,
          title: "Sertakan Alasan & PIC Panitia",
          desc: "Wajib mengisi alasan pengurangan poin dan nama panitia penanggung jawab untuk transparansi catatan.",
        },
        {
          num: "04",
          icon: "activity" as IconName,
          title: "Pantau Riwayat Real-Time",
          desc: "Setiap pengurangan poin langsung tersimpan ke cloud Firestore dan tercatat dalam buku histori kedisiplinan.",
        },
      ],
      highlights: [
        { label: "Initial Student Points", desc: "Every student begins the camp with a perfect baseline score of 100 discipline points." },
        { label: "Digital Audit Log", desc: "Point deduction records are transparently logged and cannot be removed arbitrarily." },
        { label: "Live Synchronization", desc: "Discipline point updates are instantly visible to the Steering Committee and Administrator." },
      ],
    },
    scoring: {
      eyebrow: "USER GUIDE · STEERING COMMITTEE",
      title: "Steering Committee Guide",
      subtitle: "Performance review guidelines and committee division contribution evaluation for English Camp 2026.",
      steps: [
        {
          num: "01",
          icon: "people" as IconName,
          title: "Telusuri Divisi Panitia",
          desc: "Pilih panitia pelaksana berdasarkan divisi kerja masing-masing (Ketua, Acara, Kedisiplinan, Logistik, Konsumsi, dll.).",
        },
        {
          num: "02",
          icon: "star" as IconName,
          title: "Beri Skor Kinerja (0-100)",
          desc: "Evaluasi kinerja setiap panitia dengan menetapkan skor performa berdasarkan kontribusi, koordinasi, dan tanggung jawab.",
        },
        {
          num: "03",
          icon: "check" as IconName,
          title: "Tulis Catatan Evaluasi",
          desc: "Tuliskan catatan kualitatif, apresiasi, atau rekomendasi perbaikan kinerja untuk evaluasi resmi kepanitiaan.",
        },
        {
          num: "04",
          icon: "download" as IconName,
          title: "Ekspor Laporan Kinerja Excel",
          desc: "Klik tombol ekspor untuk mengunduh rekapitulasi penilaian kinerja seluruh panitia pelaksana ke file Excel.",
        },
      ],
      highlights: [
        { label: "Objective Evaluation", desc: "Steering Committee evaluations serve as the official benchmark for committee certification." },
        { label: "Performance Tiers", desc: "Scores are grouped into categories: Outstanding, Excellent, Satisfactory, and Needs Improvement." },
        { label: "Live Cloud Backup", desc: "All evaluation records are securely backed up in Firebase Firestore without risk of data loss." },
      ],
    },
    admin: {
      eyebrow: "USER GUIDE · ADMINISTRATOR",
      title: "Administrator Workspace Guide",
      subtitle: "Management instructions for student master data, Excel report downloads, system lock control, and maintenance.",
      steps: [
        {
          num: "01",
          icon: "people" as IconName,
          title: "Kelola Master Data Mahasiswa",
          desc: "Tambah mahasiswa baru, edit kelas atau kelompok, dan hapus data jika terjadi kekeliruan pendaftaran.",
        },
        {
          num: "02",
          icon: "lock" as IconName,
          title: "Kunci / Buka Sistem Penilaian",
          desc: "Gunakan toggle 'Lock Scoring System' untuk menutup penginputan nilai dosen dan panitia saat batas waktu selesai.",
        },
        {
          num: "03",
          icon: "download" as IconName,
          title: "Unduh Semua Laporan Excel",
          desc: "Akses tombol ekspor untuk mengunduh Laporan Nilai Dosen, Kedisiplinan Mahasiswa, Kinerja Panitia, dan Kuesioner Kepuasan.",
        },
        {
          num: "04",
          icon: "refresh" as IconName,
          title: "Reset & Pemeliharaan Sistem",
          desc: "Gunakan 'Reset All System Data' saat mempersiapkan periode kegiatan baru untuk mengembalikan data ke kondisi awal.",
        },
      ],
      highlights: [
        { label: "Full System Control", desc: "Administrator holds top-level authority to manage scoring system locks and participant data." },
        { label: "Data Integrity", desc: "All system reset and data modifications are secured by database permission rules." },
        { label: "Centralized Reports", desc: "All academic scores, discipline audits, and participant satisfaction feedback aggregate here." },
      ],
    },
  }[role]

  return (
    <main className="content profile-page-content">
      <section className="welcome-row">
        <div>
          <p className="eyebrow">{guideData.eyebrow}</p>
          <Heading level={1}>{guideData.title}</Heading>
          <p>{guideData.subtitle}</p>
        </div>
      </section>

      {/* 1. Step by step usage guide */}
      <section className="guide-section">
        <h3 className="guide-section-title">
          <Icon name="book" size={17} /> Step-by-Step Workflow
        </h3>
        <div className="guide-steps-grid">
          {guideData.steps.map((st) => (
            <div key={st.num} className="guide-step-card">
              <div className="guide-step-header">
                <span className="guide-step-num">LANGKAH {st.num}</span>
                <span className="guide-step-icon">
                  <Icon name={st.icon} size={18} />
                </span>
              </div>
              <strong>{st.title}</strong>
              <p>{st.desc}</p>
            </div>
          ))}
        </div>

        <div className="guide-highlights-grid">
          {guideData.highlights.map((h, i) => (
            <div key={i} className="guide-highlight-card">
              <strong>{h.label}</strong>
              <p>{h.desc}</p>
            </div>
          ))}
        </div>
      </section>


      {/* Security & Logout Section */}
      <section className="profile-logout-section">
        <div className="profile-logout-copy">
          <h3>Session Management</h3>
          <p>
            Finished using the system? Sign out securely to protect data privacy and student evaluation records.
          </p>
        </div>
        <Button
          className="danger profile-logout-button"
          icon="logout"
          onClick={onLogout}
        >
          Sign Out of System (Log Out)
        </Button>
      </section>
    </main>
  )
}

function AppShell({
  role,
  children,
  onLogout,
  active = "Home",
}: {
  role: Role
  children: ReactNode
  onLogout: () => void
  active?: string
}) {
  const [currentTab, setCurrentTab] = useState<string>(active)
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstall)
    window.addEventListener("appinstalled", () => {
      setInstalled(true)
      setInstallPrompt(null)
    })
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === "accepted") {
      setInstalled(true)
      setInstallPrompt(null)
    }
  }

  const meta = roleMeta[role]
  const nav = [
    ["Home", "home"],
    ["Panduan", "book"],
  ]
  return (
    <div className={`app-shell role-${meta.accent}`}>
      <aside className="side-nav">
        <Brand compact />
        <nav>
          {nav.map(([label, icon]) => (
            <Button
              key={label}
              className={`nav-link ${label === currentTab ? "active" : ""}`}
              onClick={() => setCurrentTab(label)}
            >
              <Icon name={icon as IconName} /> <span>{label}</span>
            </Button>
          ))}
        </nav>
        <div
          className="side-profile"
          style={{ cursor: "pointer" }}
          onClick={() => setCurrentTab("Panduan")}
        >
          <Avatar
            name="User"
            purple={role === "panitia" || role === "scoring"}
          />
          <div>
            <strong>User</strong>
            <span>{meta.label}</span>
          </div>
          <Button
            className="icon-button ghost"
            icon="logout"
            aria-label="Log out"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              onLogout()
            }}
          />
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="mobile-brand">
            <Brand compact />
          </div>
          <div className="desktop-title">
            <span>{currentTab === "Panduan" ? `Guide · ${meta.label}` : meta.label}</span>
          </div>
          <div className="top-actions">
            {installPrompt && !installed && (
              <button
                type="button"
                onClick={handleInstallClick}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 12px",
                  borderRadius: "10px",
                  background: "var(--primary)",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(35, 73, 59, 0.25)",
                }}
                aria-label="Install App"
              >
                <Icon name="download" size={14} />
                <span>Install App</span>
              </button>
            )}
            <div className="connection">
              <span /> Live data
            </div>
            <Avatar
              name="Universitas Negeri Makassar"
              image={unmLogo}
            />
          </div>
        </header>
        {currentTab === "Panduan" ? (
          <ProfilePage
            role={role}
            onLogout={onLogout}
          />
        ) : (
          children
        )}
      </div>
      <nav className="bottom-nav">
        {nav.map(([label, icon]) => (
          <Button
            key={label}
            className={`bottom-link ${label === currentTab ? "active" : ""}`}
            onClick={() => setCurrentTab(label)}
          >
            <Icon name={icon as IconName} />
            <span>{label}</span>
          </Button>
        ))}
      </nav>
    </div>
  )
}

function SelectCard({
  label,
  value,
  disabled,
  onClick,
}: {
  label: string
  value: string
  disabled?: boolean
  onClick: () => void
}) {
  const iconName: IconName =
    label === "Subject" ? "book" : label === "Class" ? "shield" : "people"
  return (
    <Button
      type="button"
      className="select-card"
      disabled={disabled}
      onClick={onClick}
    >
      <span className="select-card-icon">
        <Icon name={iconName} size={20} />
      </span>
      <span className="select-card-copy">
        <small>{label}</small>
        <strong>{value}</strong>
        {disabled && <em>Choose a class first</em>}
      </span>
      <span className="select-arrow">
        <Icon name="chevron" size={16} />
      </span>
    </Button>
  )
}

function ScoreStepper({
  value,
  onChange,
  label = "Score",
  disabled = false,
}: {
  value: number
  onChange: (value: number) => void
  label?: string
  disabled?: boolean
}) {
  const [textValue, setTextValue] = useState<string>(
    isNaN(value) ? "" : String(value ?? 0)
  )

  useEffect(() => {
    setTextValue(isNaN(value) ? "" : String(value ?? 0))
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    const raw = e.target.value
    if (raw === "") {
      setTextValue("")
      return
    }
    const cleaned = raw.replace(/\D/g, "")
    if (cleaned === "") {
      setTextValue("")
      return
    }
    const num = Math.min(100, Math.max(0, parseInt(cleaned, 10)))
    setTextValue(String(num))
    onChange(num)
  }

  const handleBlur = () => {
    if (disabled) return
    if (textValue === "" || isNaN(Number(textValue))) {
      setTextValue(String(value))
    } else {
      const num = Math.min(100, Math.max(0, parseInt(textValue, 10)))
      setTextValue(String(num))
      onChange(num)
    }
  }

  return (
    <div className={`score-stepper ${disabled ? "opacity-50 pointer-events-none" : ""}`} aria-label={label}>
      <Button
        type="button"
        icon="minus"
        aria-label={`Reduce ${label}`}
        disabled={disabled || value <= 0}
        onClick={() => !disabled && onChange(Math.max(0, value - 1))}
      />
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        className="score-stepper-input"
        value={textValue}
        disabled={disabled}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={(e) => e.target.select()}
        aria-label={label}
      />
      <Button
        type="button"
        icon="plus"
        aria-label={`Increase ${label}`}
        disabled={disabled || value >= 100}
        onClick={() => !disabled && onChange(Math.min(100, value + 1))}
      />
    </div>
  )
}

function Sheet({
  title,
  children,
  onClose,
  className = "",
}: {
  title: string
  children: ReactNode
  onClose: () => void
  className?: string
}) {
  return (
    <div className="overlay" onMouseDown={onClose}>
      <section
        className={`sheet ${className}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" />
        <header>
          <div>
            <p className="eyebrow">English Camp Accounting</p>
            <Heading level={3}>{title}</Heading>
          </div>
          <Button
            className="icon-button soft"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </Button>
        </header>
        {children}
      </section>
    </div>
  )
}

interface MasterStudent {
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

const masterStudents: MasterStudent[] = defaultStudents as MasterStudent[]

function DosenDashboard({ onLogout }: { onLogout: () => void }) {
  const [allStudents, setAllStudents] = useState<MasterStudent[]>(masterStudents)
  const [locked, setLocked] = useState(false)
  const [subject, setSubject] = useState("")
  const [className, setClassName] = useState("")
  const [group, setGroup] = useState("")
  const [sheet, setSheet] =
    useState<"subject" | "class" | "group" | "submit" | "success" | null>(null)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [note, setNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const unsub = subscribeStudents(setAllStudents, masterStudents)
    return () => unsub()
  }, [])

  useEffect(() => {
    const unsub = subscribeSystemConfig((cfg) => setLocked(cfg.locked))
    return () => unsub()
  }, [])

  const choose = (value: string) => {
    if (sheet === "subject") setSubject(value)
    if (sheet === "class") {
      setClassName(value)
      setGroup("")
    }
    if (sheet === "group") setGroup(value)
    setSheet(null)
  }

  const availableClasses = useMemo(() => {
    const list = Array.from(new Set(allStudents.map((s) => s.class))).filter(Boolean)
    return list.length ? list.sort() : ["Class A"]
  }, [allStudents])

  const availableGroups = useMemo(() => {
    const filtered = className
      ? allStudents.filter((s) => s.class === className)
      : allStudents
    const list = Array.from(new Set(filtered.map((s) => s.group))).filter(Boolean)
    return list.length ? list.sort() : ["Group 1", "Group 2", "Group 3", "Group 4", "Group 5", "Group 6"]
  }, [allStudents, className])

  const currentStudents = useMemo(
    () =>
      allStudents.filter(
        (s) => s.class === className && s.group === group,
      ),
    [allStudents, className, group],
  )
  const updated = Object.keys(scores).length

  const submitScores = async () => {
    if (locked) {
      alert("System is currently locked by Administrator. Scores cannot be modified.")
      return
    }
    setIsSubmitting(true)
    try {
      await submitLecturerScoresInFirestore(subject, scores, note)
      setSheet("success")
    } catch (err: any) {
      console.error("Firestore submit error:", err)
      alert(err?.message || "Failed to submit scores. Please check permissions or connection.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppShell role="dosen" onLogout={onLogout}>
      <main className="content">
        <section className="welcome-row">
          <div>
            <p className="eyebrow">Welcome, User</p>
            <Heading level={1}>Lecturer Dashboard</Heading>
            <p>Manage your student scores.</p>
          </div>
          <div className="date-chip">
            <Icon name="clock" /> Monday, 06 October
          </div>
        </section>

        <section className="camp-app-hero lecturer-app-hero">
          <img src={illustTentCampus} alt="Camping tent between campus trees" />
          <div className="camp-hero-top">
            <span>Monday · Scoring Day</span>
            <span className={`live-badge ${locked ? "locked" : ""}`}>
              <i /> {locked ? "Locked" : "Active"}
            </span>
          </div>
          <div className="camp-hero-panel">
            <div>
              <p className="eyebrow">Lecturer workspace</p>
              <Heading>
                Score the journey,
                <br />
                one group at a time.
              </Heading>
              <span>
                Choose the learning context, then update scores with simple plus
                and minus controls.
              </span>
            </div>
            <span className="camp-round-icon">
              <Icon name="book" />
            </span>
          </div>
        </section>

        {locked && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "14px",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "#b91c1c",
            marginBottom: "16px",
            fontSize: "13px",
            fontWeight: 600,
          }}>
            <Icon name="lock" />
            <span>Scoring is currently locked by Administrator. Submissions and adjustments are temporarily disabled.</span>
          </div>
        )}

        <section className="selection-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Step 1</p>
              <Heading>Learning context</Heading>
            </div>
            <span className="progress-pill">
              {[subject, className, group].filter(Boolean).length} of 3 selected
            </span>
          </div>
          <div className="selector-grid">
            <SelectCard
              label="Subject"
              value={subject || "Select subject"}
              onClick={() => setSheet("subject")}
            />
            <SelectCard
              label="Class"
              value={className || "Select class"}
              onClick={() => setSheet("class")}
            />
            <SelectCard
              label="Group"
              value={group || "Select group"}
              disabled={!className}
              onClick={() => setSheet("group")}
            />
          </div>
        </section>

        {subject && className && group ? (
          <section className="student-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Step 2</p>
                <Heading>Student scores</Heading>
                <p>
                  {subject} · {className} · {group}
                </p>
              </div>
              <span className="student-count">
                <Icon name="people" size={17} /> {currentStudents.length} students
              </span>
            </div>
            <div className="score-table">
              <div className="table-head">
                <span>No</span>
                <span>Student</span>
                <span>Class & group</span>
                <span>Previous</span>
                <span>New score</span>
              </div>
              {currentStudents.map((student) => {
                const prevScore =
                  subject && student.scores && subject in student.scores
                    ? student.scores[subject as keyof typeof student.scores]
                    : 0
                return (
                  <div className="score-row" key={student.id}>
                    <span className="student-number">{student.id}</span>
                    <div className="student-identity">
                      <Avatar name={student.name} />
                      <div>
                        <strong>{student.name}</strong>
                        <small>No. {student.id}</small>
                      </div>
                    </div>
                    <span className="class-group">
                      {className}
                      <small>{group}</small>
                    </span>
                    <span className="previous-score">
                      {prevScore > 0 ? prevScore : "—"}
                      <small>
                        {prevScore > 0 ? "Recorded" : "No previous score"}
                      </small>
                    </span>
                    <ScoreStepper
                      label={`${student.name} score`}
                      value={scores[student.id] ?? (prevScore > 0 ? prevScore : 0)}
                      disabled={locked}
                      onChange={(value) =>
                        !locked && setScores({ ...scores, [student.id]: value })
                      }
                    />
                  </div>
                )
              })}
            </div>
            <section className="notes-card">
              <div className="notes-icon">
                <Icon name="edit" />
              </div>
              <div className="notes-copy">
                <Heading level={3}>Group Evaluation</Heading>
                <p>This note applies to the whole group.</p>
              </div>
              {createElement("textarea", {
                className: "textarea",
                placeholder: locked ? "Scoring is currently locked by Administrator..." : "Write evaluation notes about this group...",
                value: note,
                disabled: locked,
                onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  !locked && setNote(e.target.value),
                maxLength: 500,
              })}
              <span className="character-count">{note.length}/500</span>
            </section>
          </section>
        ) : (
          <section className="guided-empty">
            <div className="empty-icon">
              <Icon name="people" />
            </div>
            <Heading level={3}>Your students will appear here</Heading>
            <p>Select a subject, class, and group to open the scorebook.</p>
            <div className="empty-steps">
              <span className={subject ? "done" : ""}>1</span>
              <i />
              <span className={className ? "done" : ""}>2</span>
              <i />
              <span className={group ? "done" : ""}>3</span>
            </div>
          </section>
        )}
      </main>

      {subject && className && group && (
        <div className="sticky-submit">
          <div>
            <strong>{updated} students updated</strong>
            <span>{locked ? "Scoring is locked by Administrator" : "Review scores before submitting"}</span>
          </div>
          <Button
            className="primary"
            disabled={locked || !updated}
            onClick={() => !locked && setSheet("submit")}
          >
            {locked ? "Locked by Admin" : "Submit Scores"} <Icon name={locked ? "lock" : "chevron"} />
          </Button>
        </div>
      )}

      {sheet && !["submit", "success"].includes(sheet) && (
        <Sheet
          title={`Select ${sheet[0].toUpperCase()}${sheet.slice(1)}`}
          onClose={() => setSheet(null)}
        >
          <div className="option-list">
            {(sheet === "subject"
              ? ["Business", "English", "Entrepreneurship"]
              : sheet === "class"
                ? availableClasses
                : availableGroups
            ).map((item) => (
              <Button
                key={item}
                className="option-row"
                onClick={() => choose(item)}
              >
                <span>
                  <strong>{item}</strong>
                  {sheet === "subject" && <small>Active subject</small>}
                </span>
                <span className="radio">
                  <i />
                </span>
              </Button>
            ))}
          </div>
        </Sheet>
      )}
      {sheet === "submit" && (
        <Sheet
          title="Ready to Submit"
          onClose={() => setSheet(null)}
          className="confirm-sheet"
        >
          <div className="summary-banner">
            <div className="summary-icon">
              <Icon name="book" />
            </div>
            <div>
              <strong>{subject}</strong>
              <span>
                {className} · {group}
              </span>
            </div>
            <b>
              {updated}
              <small>updated</small>
            </b>
          </div>
          <p className="confirm-copy">
            New scores will be recorded for {updated} students. You can update
            them again later if needed.
          </p>
          <div className="sheet-actions">
            <Button className="secondary" onClick={() => setSheet(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button className="primary" onClick={submitScores} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Scores"}
            </Button>
          </div>
        </Sheet>
      )}
      {sheet === "success" && (
        <Sheet
          title="Scores Submitted"
          onClose={() => setSheet(null)}
          className="success-sheet"
        >
          <div className="success-mark">
            <Icon name="check" size={34} />
          </div>
          <Heading>All set!</Heading>
          <p>Scores have been successfully recorded for {updated} students.</p>
          <Button className="primary full" onClick={() => setSheet(null)}>
            Done
          </Button>
        </Sheet>
      )}
    </AppShell>
  )
}

const committeeStudents = masterStudents

function StatusScore({ score }: { score: number }) {
  const status =
    score === 100
      ? "score-full"
      : score >= 50
        ? "score-reduced"
        : "score-critical"
  return (
    <div className={`status-score ${status}`}>
      <strong>{score}</strong>
      <span>
        <i />
        {score === 100
          ? "Full score"
          : score >= 50
            ? "Reduced"
            : "Critical"}
      </span>
    </div>
  )
}

function MetricCard({
  icon,
  label,
  value,
  tone,
  note,
}: {
  icon: IconName
  label: string
  value: string
  tone: string
  note: string
}) {
  return (
    <article className={`metric-card ${tone}`}>
      <div className="metric-top">
        <span>
          <Icon name={icon} />
        </span>
        <small>{note}</small>
      </div>
      <strong>{value}</strong>
      <p>{label}</p>
    </article>
  )
}

function PanitiaDashboard({ onLogout }: { onLogout: () => void }) {
  const [students, setStudents] = useState<MasterStudent[]>(masterStudents)
  const [locked, setLocked] = useState(false)
  const [search, setSearch] = useState("")
  const [classFilter, setClassFilter] = useState("All classes")
  const [groupFilter, setGroupFilter] = useState("All groups")
  const [sheet, setSheet] =
    useState<"filter" | "edit" | "history" | "success" | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selected, setSelected] = useState<MasterStudent>(masterStudents[0])
  const [newScore, setNewScore] = useState(String(masterStudents[0]?.score ?? 100))
  const [reason, setReason] = useState("")
  const [committee, setCommittee] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [historyList, setHistoryList] = useState<ScoreHistoryEntry[]>([])
  const [allHistoryList, setAllHistoryList] = useState<ScoreHistoryEntry[]>([])
  const [historyTab, setHistoryTab] = useState<"single" | "all">("single")

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const fresh = await fetchStudentsFromFirestore()
      if (fresh && fresh.length > 0) {
        setStudents(fresh)
      }
    } catch (err) {
      console.warn("Manual refresh failed:", err)
    } finally {
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }

  useEffect(() => {
    const unsub = subscribeStudents(setStudents, masterStudents)
    return () => unsub()
  }, [])

  useEffect(() => {
    const unsub = subscribeSystemConfig((cfg) => setLocked(cfg.locked))
    return () => unsub()
  }, [])

  useEffect(() => {
    if (selected?.id) {
      const unsub = subscribeScoreHistory(selected.id, setHistoryList)
      return () => unsub()
    }
  }, [selected?.id])

  useEffect(() => {
    const unsub = subscribeAllScoreHistory(setAllHistoryList)
    return () => unsub()
  }, [])

  const availableClasses = useMemo(() => {
    const list = Array.from(new Set(students.map((s) => s.class))).filter(Boolean)
    return ["All classes", ...list.sort()]
  }, [students])

  const availableGroups = useMemo(() => {
    const filtered =
      classFilter !== "All classes"
        ? students.filter((s) => s.class === classFilter)
        : students
    const list = Array.from(new Set(filtered.map((s) => s.group))).filter(Boolean)
    return ["All groups", ...list.sort()]
  }, [students, classFilter])

  const filtered = useMemo(
    () =>
      students.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) &&
          (classFilter === "All classes" || s.class === classFilter) &&
          (groupFilter === "All groups" || s.group === groupFilter),
      ),
    [students, search, classFilter, groupFilter],
  )

  const openEdit = (student: typeof selected) => {
    if (locked) return
    setSelected(student)
    setNewScore(String(student.score))
    setReason("")
    setCommittee("")
    setErrors({})
    setSheet("edit")
  }
  const save = async () => {
    if (locked) return
    const value = Number(newScore)
    const next: Record<string, string> = {}
    if (isNaN(value) || value < 0 || value > 100)
      next.score = "Score must be between 0 and 100."
    if (value < selected.score && !reason.trim())
      next.reason = "Reason is required when reducing score."
    if (value < selected.score && !committee.trim())
      next.committee = "Committee name is required."
    setErrors(next)
    if (!Object.keys(next).length) {
      try {
        const panitiaReason =
          reason.trim() ||
          selected.panitiaNote ||
          (selected.note && selected.note !== selected.dosenNote ? selected.note : null) ||
          "No reductions"
        await updateStudentScoreInFirestore(selected.id, value, panitiaReason, {
          studentId: selected.id,
          studentName: selected.name,
          oldScore: selected.score,
          newScore: value,
          pointsChange: value - selected.score,
          reason: reason.trim() || "Score adjustment",
          committee: committee.trim() || "Panitia Kedisiplinan",
        })

        setSelected((prev) => ({
          ...prev,
          score: value,
          note: panitiaReason,
          panitiaNote: panitiaReason,
        }))
        setSheet("success")
      } catch (err: any) {
        console.error("Panitia save error:", err)
        setErrors({ reason: err?.message || "Failed to save score." })
      }
    }
  }

  return (
    <AppShell role="panitia" onLogout={onLogout}>
      <main className="content">
        <section className="welcome-row committee-welcome">
          <div>
            <p className="eyebrow">Welcome, User</p>
            <Heading level={1}>Student Score Evaluation</Heading>
            <p>Review scores with clarity and accountability.</p>
          </div>
          <div className="header-actions">
            <Button
              className="secondary refresh-button"
              icon="refresh"
              disabled={isRefreshing}
              onClick={handleRefresh}
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </section>
        <section className="camp-app-hero committee-app-hero">
          <img src={illustCampfire} alt="Students around camp tent and campfire" />
          <div className="camp-hero-top">
            <span>Committee / SC</span>
            <span className={`live-badge ${locked ? "locked" : ""}`}>
              <i /> {locked ? "Locked" : "Evaluation open"}
            </span>
          </div>
          <div className="camp-hero-panel">
            <div>
              <p className="eyebrow">Student evaluation</p>
              <Heading>
                Fair evaluation,
                <br />
                clear history.
              </Heading>
              <span>Every score change stays traceable and accountable.</span>
            </div>
            <div className="hero-score-pill">
              <strong>
                {Math.round(
                  students.reduce((acc, s) => acc + s.score, 0) /
                    (students.length || 1),
                )}
              </strong>
              <span>average</span>
            </div>
          </div>
        </section>

        {locked && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "14px",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "#b91c1c",
            marginBottom: "16px",
            fontSize: "13px",
            fontWeight: 600,
          }}>
            <Icon name="lock" />
            <span>Score evaluation is currently locked by Administrator. Student score reductions and adjustments are disabled.</span>
          </div>
        )}

        <section className="metric-grid">
          <MetricCard
            icon="people"
            label="Total Students"
            value={String(students.length)}
            tone="blue"
            note="Active"
          />
          <MetricCard
            icon="activity"
            label="Total Used Score"
            value={String(
              students.reduce((acc, s) => acc + (100 - s.score), 0),
            )}
            tone="red"
            note="Points"
          />
          <MetricCard
            icon="shield"
            label="Average Remaining"
            value={(
              students.reduce((acc, s) => acc + s.score, 0) /
              (students.length || 1)
            ).toFixed(1)}
            tone="green"
            note="Out of 100"
          />
          <MetricCard
            icon="warning"
            label="With Reductions"
            value={String(students.filter((s) => s.score < 100).length)}
            tone="orange"
            note={`${Math.round(
              (students.filter((s) => s.score < 100).length /
                (students.length || 1)) *
                100,
            )}%`}
          />
        </section>
        <section className="directory-card">
          <div className="directory-header">
            <div>
              <p className="eyebrow">Student directory</p>
              <Heading>Evaluation list</Heading>
              <p>{filtered.length} students shown</p>
            </div>
            <div className="search-filter-row">
              <label className="search-box">
                <Icon name="search" />
                {createElement("input", {
                  placeholder: "Search student...",
                  value: search,
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearch(e.target.value),
                })}
              </label>
              <Button
                className="filter-button secondary"
                onClick={() => {
                  setHistoryTab("all")
                  setSheet("history")
                }}
              >
                <Icon name="clock" />
                <span>Full History</span>
              </Button>
              <Button
                className="filter-button secondary"
                onClick={() => setSheet("filter")}
              >
                <Icon name="filter" />
                <span>Filters</span>
                {(classFilter !== "All classes" ||
                  groupFilter !== "All groups") && <b />}
              </Button>
            </div>
          </div>
          <div className="filter-chips">
            <Button
              className={classFilter !== "All classes" ? "active" : ""}
              onClick={() => setSheet("filter")}
            >
              {classFilter} <Icon name="chevron" size={15} />
            </Button>
            <Button
              className={groupFilter !== "All groups" ? "active" : ""}
              onClick={() => setSheet("filter")}
            >
              {groupFilter} <Icon name="chevron" size={15} />
            </Button>
          </div>
          {filtered.length ? (
            <div className="committee-table">
              <div className="table-head">
                <span>No</span>
                <span>Student</span>
                <span>Class & group</span>
                <span>Remaining</span>
                <span>Discipline note</span>
                <span>Actions</span>
              </div>
              {filtered.map((student) => (
                <article className="committee-row" key={student.id}>
                  <span className="student-number">{student.id}</span>
                  <div className="student-identity">
                    <Avatar name={student.name} purple />
                    <div>
                      <strong>{student.name}</strong>
                      <small>No. {student.id}</small>
                    </div>
                  </div>
                  <span className="class-group">
                    {student.class}
                    <small>{student.group}</small>
                  </span>
                  <StatusScore score={student.score} />
                  <span className="current-note">
                    {student.panitiaNote || (student.note && student.note !== student.dosenNote ? student.note : null) || "No reductions"}
                  </span>
                  <div className="row-actions">
                    <Button
                      className="secondary compact"
                      icon="clock"
                      onClick={() => {
                        setSelected(student)
                        setHistoryTab("single")
                        setSheet("history")
                      }}
                    >
                      History
                    </Button>
                    <Button
                      className="primary compact"
                      icon={locked ? "lock" : "edit"}
                      disabled={locked}
                      onClick={() => !locked && openEdit(student)}
                    >
                      {locked ? "Locked" : "Edit"}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="guided-empty">
              <div className="empty-icon purple">
                <Icon name="search" />
              </div>
              <Heading level={3}>No students match your filters</Heading>
              <p>Try a different name, class, or group.</p>
              <Button
                className="secondary"
                onClick={() => {
                  setSearch("")
                  setClassFilter("All classes")
                  setGroupFilter("All groups")
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </section>
      </main>

      {sheet === "filter" && (
        <Sheet title="Filter Students" onClose={() => setSheet(null)}>
          <div className="filter-group">
            <span>Class</span>
            <div className="choice-grid">
              {availableClasses.map((item) => (
                <Button
                  className={classFilter === item ? "selected" : ""}
                  key={item}
                  onClick={() => {
                    setClassFilter(item)
                    if (item === "All classes") setGroupFilter("All groups")
                  }}
                >
                  {item}
                  {classFilter === item && <Icon name="check" />}
                </Button>
              ))}
            </div>
          </div>
          <div
            className={`filter-group ${
              classFilter === "All classes" ? "disabled-group" : ""
            }`}
          >
            <span>Group</span>
            <div className="choice-grid">
              {availableGroups.map((item) => (
                <Button
                  disabled={classFilter === "All classes"}
                  className={groupFilter === item ? "selected" : ""}
                  key={item}
                  onClick={() => setGroupFilter(item)}
                >
                  {item}
                  {groupFilter === item && <Icon name="check" />}
                </Button>
              ))}
            </div>
            {classFilter === "All classes" && (
              <small>Choose a class to filter by group.</small>
            )}
          </div>
          <Button className="primary full" onClick={() => setSheet(null)}>
            Show Students
          </Button>
        </Sheet>
      )}
      {sheet === "edit" && (
        <Sheet
          title="Edit Student Score"
          onClose={() => setSheet(null)}
          className="edit-sheet"
        >
          <div className="student-summary">
            <Avatar name={selected.name} purple />
            <div className="student-summary-info">
              <strong>{selected.name}</strong>
              <span className="student-meta">
                {selected.class} · {selected.group}
              </span>
            </div>
            <StatusScore score={selected.score} />
          </div>
          <div className="score-edit-block">
            <span>Remaining Score</span>
            <ScoreStepper
              label="remaining score"
              value={Number(newScore)}
              onChange={(value) => setNewScore(String(value))}
            />
            {errors.score && <em>{errors.score}</em>}
          </div>
          <Field
            label="Reason for reduction"
            placeholder="Enter a clear reason"
            value={reason}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setReason(e.target.value)
            }
            error={errors.reason}
            hint={
              Number(newScore) < selected.score
                ? "Required for a score reduction"
                : "Optional when score is unchanged or increased"
            }
          />
          <Field
            label="Committee Name"
            placeholder="Your full name"
            value={committee}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setCommittee(e.target.value)
            }
            error={errors.committee}
          />
          <div className="sheet-actions">
            <Button className="secondary" onClick={() => setSheet(null)}>
              Cancel
            </Button>
            <Button className="primary" onClick={save}>
              Save Changes
            </Button>
          </div>
        </Sheet>
      )}
      {sheet === "history" && (
        <Sheet
          title="Score History"
          onClose={() => setSheet(null)}
          className="history-sheet"
        >
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px", padding: "4px", background: "#f1f5f9", borderRadius: "12px" }}>
            <button
              type="button"
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "none",
                borderRadius: "8px",
                background: historyTab === "single" ? "#23493b" : "transparent",
                color: historyTab === "single" ? "#ffffff" : "#475569",
                fontWeight: 600,
                fontSize: "12px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onClick={() => setHistoryTab("single")}
            >
              {selected?.name ? selected.name.split(" ")[0] : "Student"} History ({historyList.length})
            </button>
            <button
              type="button"
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "none",
                borderRadius: "8px",
                background: historyTab === "all" ? "#23493b" : "transparent",
                color: historyTab === "all" ? "#ffffff" : "#475569",
                fontWeight: 600,
                fontSize: "12px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onClick={() => setHistoryTab("all")}
            >
              Full History Log ({allHistoryList.length})
            </button>
          </div>

          {historyTab === "single" ? (
            <>
              <div className="student-summary">
                <Avatar name={selected.name} purple />
                <div className="student-summary-info">
                  <strong>{selected.name}</strong>
                  <span className="student-meta">
                    {selected.class} · {selected.group}
                  </span>
                </div>
                <StatusScore score={selected.score} />
              </div>
              <div className="timeline">
                {historyList.length > 0 ? (
                  historyList.map((item) => (
                    <article key={item.id || item.timestamp}>
                      <div className="timeline-dot">
                        <Icon name="activity" size={15} />
                      </div>
                      <div className="timeline-content">
                        <span>
                          {new Date(item.timestamp).toLocaleString("en-GB", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                        <Heading level={4}>
                          {item.pointsChange < 0
                            ? `Score reduced by ${Math.abs(item.pointsChange)} points`
                            : item.pointsChange > 0
                              ? `Score increased by ${item.pointsChange} points`
                              : "Score updated"}
                        </Heading>
                        <div className="score-change">
                          <b>{item.oldScore}</b>
                          <Icon name="chevron" />
                          <b>{item.newScore}</b>
                          <em>
                            {item.pointsChange > 0
                              ? `+${item.pointsChange}`
                              : item.pointsChange}
                          </em>
                        </div>
                        <dl>
                          <div>
                            <dt>Committee</dt>
                            <dd>{item.committee || "Panitia Kedisiplinan"}</dd>
                          </div>
                          <div>
                            <dt>Reason</dt>
                            <dd>{item.reason || "Score evaluation"}</dd>
                          </div>
                        </dl>
                      </div>
                    </article>
                  ))
                ) : (
                  <article>
                    <div className="timeline-dot">
                      <Icon name="activity" size={15} />
                    </div>
                    <div className="timeline-content">
                      <span>Current Record</span>
                      <Heading level={4}>Score: {selected.score} points</Heading>
                      <p>
                        {selected.panitiaNote ||
                          (selected.note && selected.note !== selected.dosenNote
                            ? selected.note
                            : null) ||
                          "No score reductions recorded yet."}
                      </p>
                    </div>
                  </article>
                )}
                <article>
                  <div className="timeline-dot light">
                    <Icon name="check" size={15} />
                  </div>
                  <div className="timeline-content">
                    <span>Camp Start</span>
                    <Heading level={4}>Initial score created</Heading>
                    <p>Student evaluation record started at 100.</p>
                  </div>
                </article>
              </div>
            </>
          ) : (
            <div className="timeline">
              {allHistoryList.length > 0 ? (
                allHistoryList.map((item) => (
                  <article key={item.id || item.timestamp}>
                    <div className="timeline-dot">
                      <Icon name="activity" size={15} />
                    </div>
                    <div className="timeline-content">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <strong style={{ fontSize: "13px", color: "#1e293b" }}>{item.studentName}</strong>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                          {new Date(item.timestamp).toLocaleString("en-GB", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                      <Heading level={4}>
                        {item.pointsChange < 0
                          ? `Reduced by ${Math.abs(item.pointsChange)} pts`
                          : item.pointsChange > 0
                            ? `Increased by ${item.pointsChange} pts`
                            : "Updated"}
                      </Heading>
                      <div className="score-change">
                        <b>{item.oldScore}</b>
                        <Icon name="chevron" />
                        <b>{item.newScore}</b>
                        <em>
                          {item.pointsChange > 0
                            ? `+${item.pointsChange}`
                            : item.pointsChange}
                        </em>
                      </div>
                      <dl>
                        <div>
                          <dt>Committee</dt>
                          <dd>{item.committee || "Panitia Kedisiplinan"}</dd>
                        </div>
                        <div>
                          <dt>Reason</dt>
                          <dd>{item.reason || "Score adjustment"}</dd>
                        </div>
                      </dl>
                    </div>
                  </article>
                ))
              ) : (
                <article>
                  <div className="timeline-dot light">
                    <Icon name="check" size={15} />
                  </div>
                  <div className="timeline-content">
                    <span>No Deductions Recorded</span>
                    <Heading level={4}>All students at 100 points</Heading>
                    <p>No reduction history entries exist in the system.</p>
                  </div>
                </article>
              )}
            </div>
          )}
        </Sheet>
      )}

      {sheet === "success" && (
        <Sheet
          title="Action Complete"
          onClose={() => setSheet(null)}
          className="success-sheet"
        >
          <div className="success-mark">
            <Icon name="check" size={34} />
          </div>
          <Heading>Successfully completed</Heading>
          <p>Your latest committee action has been securely recorded.</p>
          <Button className="primary full" onClick={() => setSheet(null)}>
            Done
          </Button>
        </Sheet>
      )}
    </AppShell>
  )
}

function ScoringPanitiaDashboard({ onLogout }: { onLogout: () => void }) {
  const [committeeList, setCommitteeList] =
    useState<FirebaseCommitteeMember[]>(defaultCommittee)
  const [locked, setLocked] = useState(false)
  const [search, setSearch] = useState("")
  const [divisionFilter, setDivisionFilter] = useState("All Divisions")
  const [sheet, setSheet] =
    useState<"filter" | "edit" | "history" | "success" | null>(null)
  const [selected, setSelected] = useState<FirebaseCommitteeMember>(
    defaultCommittee[0] || ({} as FirebaseCommitteeMember),
  )
  const [newScore, setNewScore] = useState(
    String(defaultCommittee[0]?.score ?? 100),
  )
  const [reason, setReason] = useState("")
  const [evaluator, setEvaluator] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [historyList, setHistoryList] = useState<CommitteeScoreHistoryEntry[]>([])
  const [allHistoryList, setAllHistoryList] = useState<CommitteeScoreHistoryEntry[]>([])
  const [historyTab, setHistoryTab] = useState<"single" | "all">("single")

  useEffect(() => {
    const unsub = subscribeCommitteeMembers((members) => {
      setCommitteeList(members)
      if (members.length && !selected?.id) {
        setSelected(members[0])
        setNewScore(String(members[0].score ?? 100))
      }
    }, defaultCommittee)
    return () => unsub()
  }, [])

  useEffect(() => {
    const unsub = subscribeSystemConfig((cfg) => setLocked(cfg.locked))
    return () => unsub()
  }, [])

  useEffect(() => {
    if (selected?.id) {
      const unsub = subscribeCommitteeScoreHistory(selected.id, setHistoryList)
      return () => unsub()
    }
  }, [selected?.id])

  useEffect(() => {
    const unsub = subscribeAllCommitteeScoreHistory(setAllHistoryList)
    return () => unsub()
  }, [])

  const divisions = [
    "All Divisions",
    "EVENT",
    "PUBLIC & DOCUMENTATION",
    "CONSUMPTION",
    "FIELD",
    "EQUIPMENT",
  ]

  const filteredCommittee = useMemo(
    () =>
      committeeList.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) &&
          (divisionFilter === "All Divisions" || m.division === divisionFilter),
      ),
    [committeeList, search, divisionFilter],
  )

  const openEdit = (member: FirebaseCommitteeMember) => {
    if (locked) return
    setSelected(member)
    setNewScore(String(member.score ?? 100))
    setReason("")
    setEvaluator("")
    setErrors({})
    setSheet("edit")
  }

  const openHistory = (member: FirebaseCommitteeMember) => {
    setSelected(member)
    setHistoryTab("single")
    setSheet("history")
  }

  const saveEvaluation = async () => {
    if (locked) return
    const value = Number(newScore)
    const next: Record<string, string> = {}
    if (isNaN(value) || value < 0 || value > 100) {
      next.score = "Score must be between 0 and 100."
    }
    const currentScore = selected.score ?? 100
    if (value < currentScore && !reason.trim()) {
      next.reason = "Reason is required when reducing score."
    }
    if (value < currentScore && !evaluator.trim()) {
      next.evaluator = "Evaluator name is required."
    }
    setErrors(next)

    if (!Object.keys(next).length) {
      const pointsDiff = value - currentScore
      const reasonText = reason.trim() || selected.steeringNote || selected.note || "Performance review"
      const evaluatorText = evaluator.trim() || "Steering Committee"

      try {
        await updateCommitteeMemberWithHistoryInFirestore(
          selected.id,
          value,
          reasonText,
          {
            memberId: selected.id,
            memberName: selected.name,
            division: selected.division,
            position: selected.position,
            oldScore: currentScore,
            newScore: value,
            pointsChange: pointsDiff,
            reason: reasonText,
            evaluator: evaluatorText,
          },
        )

        setSelected((prev) => ({
          ...prev,
          score: value,
          note: reasonText,
          steeringNote: reasonText,
        }))
        setSheet("success")
      } catch (err) {
        console.error("Save error:", err)
      }
    }
  }

  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const fresh = await fetchCommitteeMembersFromFirestore()
      if (fresh && fresh.length > 0) {
        setCommitteeList(fresh)
      }
    } catch (err) {
      console.warn("Manual refresh failed:", err)
    } finally {
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }

  return (
    <AppShell role="scoring" onLogout={onLogout}>
      <main className="content">
        <section className="welcome-row committee-welcome">
          <div>
            <p className="eyebrow">Welcome, User</p>
            <Heading level={1}>Steering Committee</Heading>
            <p>Evaluate committee performance and divisional contributions.</p>
          </div>
          <div className="header-actions">
            <Button
              className="secondary refresh-button"
              icon="refresh"
              disabled={isRefreshing}
              onClick={handleRefresh}
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </section>
        <section className="camp-app-hero scoring-app-hero">
          <img src={illustGroupCamp} alt="Camp group members packing and coordinating" />
          <div className="camp-hero-top">
            <span>Steering Committee</span>
            <span className={`live-badge ${locked ? "locked" : ""}`}>
              <i /> {locked ? "Locked" : "Evaluation open"}
            </span>
          </div>
          <div className="camp-hero-panel">
            <div>
              <p className="eyebrow">Performance scoring</p>
              <Heading>Recognize every contribution.</Heading>
              <span>
                Select a division and review evaluation scores for each committee member.
              </span>
            </div>
            <div className="hero-score-pill">
              <strong>
                {Math.round(
                  committeeList.reduce((acc, m) => acc + (m.score ?? 100), 0) /
                    (committeeList.length || 1),
                )}
              </strong>
              <small>Average score</small>
            </div>
          </div>
        </section>

        {locked && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "14px",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "#b91c1c",
            marginBottom: "16px",
            fontSize: "13px",
            fontWeight: 600,
          }}>
            <Icon name="lock" />
            <span>Committee scoring is currently locked by Administrator. Performance adjustments are disabled.</span>
          </div>
        )}

        {/* Metric Strip */}
        <section className="metric-strip committee-metrics">
          <MetricCard
            icon="activity"
            label="Total Reductions"
            value={String(
              committeeList.reduce((acc, s) => acc + (100 - (s.score ?? 100)), 0),
            )}
            tone="red"
            note="Points"
          />
          <MetricCard
            icon="shield"
            label="Average Score"
            value={(
              committeeList.reduce((acc, s) => acc + (s.score ?? 100), 0) /
              (committeeList.length || 1)
            ).toFixed(1)}
            tone="green"
            note="Out of 100"
          />
          <MetricCard
            icon="warning"
            label="With Reductions"
            value={String(committeeList.filter((s) => (s.score ?? 100) < 100).length)}
            tone="orange"
            note={`${Math.round(
              (committeeList.filter((s) => (s.score ?? 100) < 100).length /
                (committeeList.length || 1)) *
                100,
            )}%`}
          />
        </section>

        {/* Directory Card with Search & Filter matching Panitia Page */}
        <section className="directory-card">
          <div className="directory-header">
            <div>
              <p className="eyebrow">Committee directory</p>
              <Heading>Steering Committee</Heading>
              <p>{filteredCommittee.length} members shown</p>
            </div>
            <div className="search-filter-row">
              <label className="search-box">
                <Icon name="search" />
                {createElement("input", {
                  placeholder: "Search committee member...",
                  value: search,
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearch(e.target.value),
                })}
              </label>
              <Button
                className="filter-button secondary"
                onClick={() => {
                  setHistoryTab("all")
                  setSheet("history")
                }}
              >
                <Icon name="clock" />
                <span>Full History</span>
              </Button>
              <Button
                className="filter-button secondary"
                onClick={() => setSheet("filter")}
              >
                <Icon name="filter" />
                <span>Filters</span>
                {divisionFilter !== "All Divisions" && <b />}
              </Button>
            </div>
          </div>
          <div className="filter-chips">
            <Button
              className={divisionFilter !== "All Divisions" ? "active" : ""}
              onClick={() => setSheet("filter")}
            >
              {divisionFilter} <Icon name="chevron" size={15} />
            </Button>
          </div>

          {filteredCommittee.length ? (
            <div className="committee-table">
              <div className="table-head">
                <span>No</span>
                <span>Member</span>
                <span>Division & Position</span>
                <span>Score</span>
                <span>Steering note</span>
                <span>Actions</span>
              </div>
              {filteredCommittee.map((member, index) => (
                <article className="committee-row" key={member.id}>
                  <span className="student-number">{String(index + 1).padStart(2, "0")}</span>
                  <div className="student-identity">
                    <Avatar name={member.name} purple />
                    <div>
                      <strong>{member.name}</strong>
                      <small>ID: {member.id}</small>
                    </div>
                  </div>
                  <span className="class-group">
                    {member.division}
                    <small>{member.position}</small>
                  </span>
                  <StatusScore score={member.score ?? 100} />
                  <span className="current-note">{member.steeringNote || member.note || "No reductions"}</span>
                  <div className="row-actions">
                    <Button
                      className="secondary compact"
                      icon="clock"
                      onClick={() => openHistory(member)}
                    >
                      History
                    </Button>
                    <Button
                      className="primary compact"
                      icon={locked ? "lock" : "edit"}
                      disabled={locked}
                      onClick={() => !locked && openEdit(member)}
                    >
                      {locked ? "Locked" : "Edit"}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="guided-empty">
              <div className="empty-icon purple">
                <Icon name="search" />
              </div>
              <Heading level={3}>No committee members match your search</Heading>
              <p>Try searching with another name or reset division filter.</p>
              <Button
                className="secondary"
                onClick={() => {
                  setSearch("")
                  setDivisionFilter("All Divisions")
                }}
              >
                Clear search & filters
              </Button>
            </div>
          )}
        </section>
      </main>

      {/* Filter Sheet Modal */}
      {sheet === "filter" && (
        <Sheet title="Filter Committee" onClose={() => setSheet(null)}>
          <div className="filter-group">
            <span>Division</span>
            <div className="choice-grid">
              {divisions.map((item) => (
                <Button
                  className={divisionFilter === item ? "selected" : ""}
                  key={item}
                  onClick={() => {
                    setDivisionFilter(item)
                    setSheet(null)
                  }}
                >
                  {item}
                  {divisionFilter === item && <Icon name="check" />}
                </Button>
              ))}
            </div>
          </div>
          {divisionFilter !== "All Divisions" && (
            <div style={{ marginTop: "16px" }}>
              <Button
                className="secondary full"
                onClick={() => {
                  setDivisionFilter("All Divisions")
                  setSheet(null)
                }}
              >
                Clear filter
              </Button>
            </div>
          )}
        </Sheet>
      )}

      {/* Edit Committee Score Sheet */}
      {sheet === "edit" && (
        <Sheet
          title="Edit Committee Score"
          onClose={() => setSheet(null)}
          className="edit-sheet"
        >
          <div className="student-summary">
            <Avatar name={selected.name} purple />
            <div className="student-summary-info">
              <strong>{selected.name}</strong>
              <span className="student-meta">
                {selected.position} · {selected.division}
              </span>
            </div>
            <StatusScore score={selected.score ?? 100} />
          </div>
          <div className="score-edit-block">
            <span>Evaluation Score</span>
            <ScoreStepper
              label="evaluation score"
              value={Number(newScore)}
              onChange={(value) => setNewScore(String(value))}
            />
            {errors.score && <em>{errors.score}</em>}
          </div>
          <Field
            label="Reason for adjustment"
            placeholder="Enter reason or performance feedback"
            value={reason}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setReason(e.target.value)
            }
            error={errors.reason}
            hint={
              Number(newScore) < (selected.score ?? 100)
                ? "Required when reducing score"
                : "Optional when score is unchanged or increased"
            }
          />
          <Field
            label="Evaluator Name"
            placeholder="Your full name"
            value={evaluator}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEvaluator(e.target.value)
            }
            error={errors.evaluator}
            hint={
              Number(newScore) < (selected.score ?? 100)
                ? "Required for score reductions"
                : "Optional"
            }
          />
          <div className="sheet-actions">
            <Button className="secondary" onClick={() => setSheet(null)}>
              Cancel
            </Button>
            <Button className="primary" onClick={saveEvaluation}>
              Save Evaluation
            </Button>
          </div>
        </Sheet>
      )}

      {/* Committee History Sheet */}
      {sheet === "history" && (
        <Sheet
          title="Score History"
          onClose={() => setSheet(null)}
          className="history-sheet"
        >
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px", padding: "4px", background: "#f1f5f9", borderRadius: "12px" }}>
            <button
              type="button"
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "none",
                borderRadius: "8px",
                background: historyTab === "single" ? "#23493b" : "transparent",
                color: historyTab === "single" ? "#ffffff" : "#475569",
                fontWeight: 600,
                fontSize: "12px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onClick={() => setHistoryTab("single")}
            >
              {selected?.name ? selected.name.split(" ")[0] : "Member"} History ({historyList.length})
            </button>
            <button
              type="button"
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "none",
                borderRadius: "8px",
                background: historyTab === "all" ? "#23493b" : "transparent",
                color: historyTab === "all" ? "#ffffff" : "#475569",
                fontWeight: 600,
                fontSize: "12px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onClick={() => setHistoryTab("all")}
            >
              Full History Log ({allHistoryList.length})
            </button>
          </div>

          {historyTab === "single" ? (
            <>
              <div className="student-summary">
                <Avatar name={selected.name} purple />
                <div className="student-summary-info">
                  <strong>{selected.name}</strong>
                  <span className="student-meta">
                    {selected.position} · {selected.division}
                  </span>
                </div>
                <StatusScore score={selected.score ?? 100} />
              </div>
              <div className="timeline">
                {historyList.length > 0 ? (
                  historyList.map((item) => {
                    const itemDate = item.createdAtIso
                      ? new Date(item.createdAtIso)
                      : item.timestamp?.toDate
                        ? item.timestamp.toDate()
                        : item.timestamp
                          ? new Date(item.timestamp)
                          : new Date()
                    return (
                      <article key={item.id || item.timestamp}>
                        <div className="timeline-dot">
                          <Icon name="activity" size={15} />
                        </div>
                        <div className="timeline-content">
                          <span>
                            {itemDate.toLocaleString("en-GB", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </span>
                          <Heading level={4}>
                            {item.pointsChange < 0
                              ? `Score reduced by ${Math.abs(item.pointsChange)} points`
                              : item.pointsChange > 0
                                ? `Score increased by ${item.pointsChange} points`
                                : "Score updated"}
                          </Heading>
                          <div className="score-change">
                            <b>{item.oldScore}</b>
                            <Icon name="chevron" />
                            <b>{item.newScore}</b>
                            <em>
                              {item.pointsChange > 0
                                ? `+${item.pointsChange}`
                                : item.pointsChange}
                            </em>
                          </div>
                          <dl>
                            <div>
                              <dt>Evaluator</dt>
                              <dd>{item.evaluator || "Steering Committee"}</dd>
                            </div>
                            <div>
                              <dt>Reason</dt>
                              <dd>{item.reason || "Performance review"}</dd>
                            </div>
                          </dl>
                        </div>
                      </article>
                    )
                  })
                ) : (
                  <article>
                    <div className="timeline-dot">
                      <Icon name="activity" size={15} />
                    </div>
                    <div className="timeline-content">
                      <span>Current Record</span>
                      <Heading level={4}>Score: {selected.score ?? 100} points</Heading>
                      <p>{selected.steeringNote || selected.note || "No score reductions recorded yet."}</p>
                    </div>
                  </article>
                )}
                <article>
                  <div className="timeline-dot light">
                    <Icon name="check" size={15} />
                  </div>
                  <div className="timeline-content">
                    <span>Camp Start</span>
                    <Heading level={4}>Initial score created</Heading>
                    <p>Committee member evaluation record started at 100.</p>
                  </div>
                </article>
              </div>
            </>
          ) : (
            <div className="timeline">
              {allHistoryList.length > 0 ? (
                allHistoryList.map((item) => {
                  const itemDate = item.createdAtIso
                    ? new Date(item.createdAtIso)
                    : item.timestamp?.toDate
                      ? item.timestamp.toDate()
                      : item.timestamp
                        ? new Date(item.timestamp)
                        : new Date()
                  return (
                    <article key={item.id || item.timestamp}>
                      <div className="timeline-dot">
                        <Icon name="activity" size={15} />
                      </div>
                      <div className="timeline-content">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <strong style={{ fontSize: "13px", color: "#1e293b" }}>{item.memberName}</strong>
                          <span style={{ fontSize: "11px", color: "#64748b" }}>
                            {itemDate.toLocaleString("en-GB", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </span>
                        </div>
                        <span style={{ fontSize: "11px", color: "#475569", display: "block", marginBottom: "6px" }}>
                          {item.position} · {item.division}
                        </span>
                        <Heading level={4}>
                          {item.pointsChange < 0
                            ? `Reduced by ${Math.abs(item.pointsChange)} pts`
                            : item.pointsChange > 0
                              ? `Increased by ${item.pointsChange} pts`
                              : "Updated"}
                        </Heading>
                        <div className="score-change">
                          <b>{item.oldScore}</b>
                          <Icon name="chevron" />
                          <b>{item.newScore}</b>
                          <em>
                            {item.pointsChange > 0
                              ? `+${item.pointsChange}`
                              : item.pointsChange}
                          </em>
                        </div>
                        <dl>
                          <div>
                            <dt>Evaluator</dt>
                            <dd>{item.evaluator || "Steering Committee"}</dd>
                          </div>
                          <div>
                            <dt>Reason</dt>
                            <dd>{item.reason || "Performance review"}</dd>
                          </div>
                        </dl>
                      </div>
                    </article>
                  )
                })
              ) : (
                <article>
                  <div className="timeline-dot light">
                    <Icon name="check" size={15} />
                  </div>
                  <div className="timeline-content">
                    <span>No Deductions Recorded</span>
                    <Heading level={4}>All committee members at 100 points</Heading>
                    <p>No reduction history entries exist in the system.</p>
                  </div>
                </article>
              )}
            </div>
          )}
        </Sheet>
      )}

      {/* Success Sheet Modal */}
      {sheet === "success" && (
        <Sheet
          title="Evaluation Saved"
          onClose={() => setSheet(null)}
          className="success-sheet"
        >
          <div className="success-mark">
            <Icon name="check" size={34} />
          </div>
          <Heading>Evaluation Recorded</Heading>
          <p>The score and audit history for {selected.name} have been updated in Firebase.</p>
          <Button className="primary full" onClick={() => setSheet(null)}>
            Done
          </Button>
        </Sheet>
      )}
    </AppShell>
  )
}

function EventRating({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [participantName, setParticipantName] = useState("")
  const [studentClass, setStudentClass] = useState<string>("A")
  const [gender, setGender] = useState<string>("Female")
  const [initialAbility, setInitialAbility] = useState<string>("Fair")
  const [ratings, setRatings] = useState<Record<number, number>>({})

  // Section F open feedback
  const [bestAspect, setBestAspect] = useState("")
  const [difficulties, setDifficulties] = useState("")
  const [helpfulActivities, setHelpfulActivities] = useState<string[]>([
    "Conversation practice",
    "Group discussion",
  ])
  const [otherActivity, setOtherActivity] = useState("")
  const [improvements, setImprovements] = useState("")
  const [newSuggestions, setNewSuggestions] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleRate = (id: number, stars: number) => {
    setRatings((prev) => ({ ...prev, [id]: stars }))
  }

  const toggleActivity = (act: string) => {
    setHelpfulActivities((prev) =>
      prev.includes(act) ? prev.filter((a) => a !== act) : [...prev, act],
    )
  }

  // Count answered items
  const totalLikertAnswered = Object.keys(ratings).length
  const step2Answered = LIKERT_QUESTIONS.filter((q) => (q.id >= 1 && q.id <= 10) && ratings[q.id]).length
  const step3Answered = LIKERT_QUESTIONS.filter((q) => (q.id >= 11 && q.id <= 17) && ratings[q.id]).length
  const step4Answered = LIKERT_QUESTIONS.filter((q) => (q.id >= 18 && q.id <= 26) && ratings[q.id]).length

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Calculate category averages
      const calcAvg = (start: number, end: number) => {
        let sum = 0
        let count = 0
        for (let i = start; i <= end; i++) {
          if (ratings[i]) {
            sum += ratings[i]
            count++
          }
        }
        return count > 0 ? Math.round((sum / count) * 100) / 100 : 5
      }

      const planningAvg = calcAvg(1, 4)
      const executionAvg = calcAvg(5, 10)
      const impactAvg = calcAvg(11, 17)
      const methodAvg = calcAvg(18, 22)
      const generalSatisfactionAvg = calcAvg(23, 26)
      const overallAvg = calcAvg(1, 26)

      const payload = {
        participantName: participantName.trim() || "Anonymous Participant",
        studentClass,
        gender,
        initialAbility,
        ratings,
        categoryAverages: {
          planning: planningAvg,
          execution: executionAvg,
          impact: impactAvg,
          method: methodAvg,
          generalSatisfaction: generalSatisfactionAvg,
          overall: overallAvg,
        },
        bestAspect: bestAspect.trim(),
        difficulties: difficulties.trim(),
        helpfulActivities,
        otherActivity: otherActivity.trim(),
        improvements: improvements.trim(),
        newSuggestions: newSuggestions.trim(),
        rating: Math.round(overallAvg),
        comment: bestAspect.trim() || "English Camp 2026 Evaluation completed.",
        submittedAt: new Date().toISOString(),
      }

      window.localStorage.setItem(
        "event-satisfaction",
        `${Math.round(overallAvg)} of 5 stars (${studentClass})`,
      )

      await saveEventFeedbackInFirestore(payload)
      setSubmitted(true)
    } catch (err) {
      console.error("Failed to submit feedback:", err)
      alert("Failed to submit questionnaire. Please check your internet connection.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStarQuestion = (q: (typeof LIKERT_QUESTIONS)[0]) => {
    const currentRating = ratings[q.id] || 0
    return (
      <article
        className={`question-card ${currentRating ? "answered" : ""}`}
        key={q.id}
      >
        <div className="question-header">
          <span className="question-num">{String(q.id).padStart(2, "0")}</span>
          <p className="question-text">{q.text}</p>
        </div>
        <div className="star-rating-row">
          <div className="star-rating-buttons">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                className={`star-icon-btn ${currentRating >= star ? "selected" : ""}`}
                onClick={() => handleRate(q.id, star)}
                aria-label={`${star} bintang untuk pertanyaan nomor ${q.id}`}
              >
                <Icon name="star" size={20} />
              </button>
            ))}
          </div>
          <span className="star-status-pill">
            {currentRating === 1 && "1★ Strongly Disagree"}
            {currentRating === 2 && "2★ Disagree"}
            {currentRating === 3 && "3★ Neutral"}
            {currentRating === 4 && "4★ Agree"}
            {currentRating === 5 && "5★ Strongly Agree"}
            {!currentRating && "Rate with stars (1–5)"}
          </span>
        </div>
      </article>
    )
  }

  return (
    <main className="rating-page">
      <section className="rating-visual">
        <img src={illustHiker} alt="Hiker overlooking peaceful camp" />
        <div className="rating-visual-copy">
          <span>English Camp 2026</span>
          <Heading level={1}>How was your camp journey?</Heading>
        </div>
      </section>

      <section className="rating-scroll-wrapper">
        <div className="rating-sheet">
          <div className="rating-brand">
            <Brand compact />
            <Button
              className="icon-button soft"
              onClick={onBack}
              aria-label="Close"
            >
              ×
            </Button>
          </div>

          {submitted ? (
            <div className="rating-success" style={{ padding: "40px 10px" }}>
              <div className="success-mark">
                <Icon name="check" size={34} />
              </div>
              <Heading>Thank You for Your Feedback!</Heading>
              <p style={{ maxWidth: "440px", margin: "10px auto 26px", fontSize: "13px", color: "#64748b" }}>
                Your English Camp 2026 questionnaire evaluation has been successfully submitted and recorded in the database. Your input is very valuable for improving the next camp experience.
              </p>
              <Button className="primary full" onClick={onBack}>
                Back to Home / Login
              </Button>
            </div>
          ) : (
            <>
              <div>
                <p className="eyebrow">Event Satisfaction & CPMK Evaluation</p>
                <Heading>Rate your experience</Heading>
                <p className="subtext">
                  Your feedback helps the next camp feel even better. This questionnaire is administered to evaluate the implementation and learning outcomes of English Camp.
                </p>
              </div>

              {/* Progress Bar */}
              <div className="rating-progress-wrap">
                <div className="rating-progress-bar">
                  <div
                    className="rating-progress-fill"
                    style={{ width: `${(step / 5) * 100}%` }}
                  />
                </div>
                <div className="rating-progress-info">
                  <span>
                    Step {step} of 5:{" "}
                    {step === 1 && "A. Participant Identity"}
                    {step === 2 && "B. Implementation Evaluation"}
                    {step === 3 && "C. Language Proficiency Impact"}
                    {step === 4 && "D & E. Methods & General Satisfaction"}
                    {step === 5 && "F. Open Evaluation"}
                  </span>
                  <span>{Math.round((step / 5) * 100)}% Completed</span>
                </div>
              </div>

              {/* Step Navigation Chips */}
              <div className="rating-step-chips">
                <button
                  type="button"
                  className={`rating-step-chip ${step === 1 ? "active" : "completed"}`}
                  onClick={() => setStep(1)}
                >
                  1. Identity
                </button>
                <button
                  type="button"
                  className={`rating-step-chip ${step === 2 ? "active" : step2Answered > 0 ? "completed" : ""}`}
                  onClick={() => setStep(2)}
                >
                  2. Implementation ({step2Answered}/10)
                </button>
                <button
                  type="button"
                  className={`rating-step-chip ${step === 3 ? "active" : step3Answered > 0 ? "completed" : ""}`}
                  onClick={() => setStep(3)}
                >
                  3. Impact ({step3Answered}/7)
                </button>
                <button
                  type="button"
                  className={`rating-step-chip ${step === 4 ? "active" : step4Answered > 0 ? "completed" : ""}`}
                  onClick={() => setStep(4)}
                >
                  4. Satisfaction ({step4Answered}/9)
                </button>
                <button
                  type="button"
                  className={`rating-step-chip ${step === 5 ? "active" : ""}`}
                  onClick={() => setStep(5)}
                >
                  5. Feedback
                </button>
              </div>

              {/* Step 1: Participant Identity */}
              {step === 1 && (
                <div>
                  <h3 className="question-section-title">A. Participant Identity</h3>
                  <p className="question-section-desc">
                    Please provide your identity details below before proceeding to the evaluation items.
                  </p>

                  <div className="question-card">
                    <label className="field" style={{ margin: 0 }}>
                      <span className="field-label">Full Name (Optional)</span>
                      <input
                        className="input"
                        placeholder="e.g. Nurul Fadilah"
                        value={participantName}
                        onChange={(e) => setParticipantName(e.target.value)}
                      />
                    </label>
                  </div>

                  <div className="question-card">
                    <strong style={{ fontSize: "13px", color: "#1e293b", display: "block", marginBottom: "8px" }}>
                      1. Class:
                    </strong>
                    <div className="choice-pill-group">
                      {CLASS_OPTIONS.map((c) => (
                        <button
                          type="button"
                          key={c}
                          className={`choice-pill-btn ${studentClass === c ? "active" : ""}`}
                          onClick={() => setStudentClass(c)}
                        >
                          {studentClass === c && <Icon name="check" size={15} />}
                          Class {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="question-card">
                    <strong style={{ fontSize: "13px", color: "#1e293b", display: "block", marginBottom: "8px" }}>
                      2. Gender:
                    </strong>
                    <div className="choice-pill-group">
                      {GENDER_OPTIONS.map((g) => (
                        <button
                          type="button"
                          key={g.value}
                          className={`choice-pill-btn ${gender === g.value ? "active" : ""}`}
                          onClick={() => setGender(g.value)}
                        >
                          {gender === g.value && <Icon name="check" size={15} />}
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="question-card">
                    <strong style={{ fontSize: "13px", color: "#1e293b", display: "block", marginBottom: "8px" }}>
                      3. Before participating in the English camp, my English-speaking ability was:
                    </strong>
                    <div className="choice-pill-group">
                      {ABILITY_OPTIONS.map((a) => (
                        <button
                          type="button"
                          key={a.value}
                          className={`choice-pill-btn ${initialAbility === a.value ? "active" : ""}`}
                          onClick={() => setInitialAbility(a.value)}
                        >
                          {initialAbility === a.value && <Icon name="check" size={15} />}
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: B. Evaluasi Pelaksanaan English Camp (Q1-Q10) */}
              {step === 2 && (
                <div>
                  <h3 className="question-section-title">B. ENGLISH CAMP IMPLEMENTATION EVALUATION</h3>
                  <p className="question-section-desc">
                    Rate each statement by selecting the stars (1 = Strongly Disagree to 5 = Strongly Agree).
                  </p>

                  <h4 className="question-subheading">Planning and Organization Aspects</h4>
                  {LIKERT_QUESTIONS.filter((q) => q.section === "B_PLAN").map(renderStarQuestion)}

                  <h4 className="question-subheading">Activity Implementation Aspects</h4>
                  {LIKERT_QUESTIONS.filter((q) => q.section === "B_EXEC").map(renderStarQuestion)}
                </div>
              )}

              {/* Step 3: C. Dampak Terhadap Kemampuan Bahasa Inggris (Q11-Q17) */}
              {step === 3 && (
                <div>
                  <h3 className="question-section-title">
                    C. IMPACT OF ENGLISH CAMP ON ENGLISH PROFICIENCY
                  </h3>
                  <p className="question-section-desc">
                    Compiled based on English Conversation CPMK outcomes: basic communication, everyday interaction, and simple professional communication.
                  </p>
                  {LIKERT_QUESTIONS.filter((q) => q.section === "C_IMPACT").map(renderStarQuestion)}
                </div>
              )}

              {/* Step 4: D & E. Metode dan Kepuasan (Q18-Q26) */}
              {step === 4 && (
                <div>
                  <h3 className="question-section-title">
                    D & E. LEARNING METHODS & GENERAL SATISFACTION
                  </h3>
                  <p className="question-section-desc">
                    Evaluation of experiential learning methods and overall student satisfaction.
                  </p>

                  <h4 className="question-subheading">D. Evaluation of Learning Methods and Activities</h4>
                  {LIKERT_QUESTIONS.filter((q) => q.section === "D_METHOD").map(renderStarQuestion)}

                  <h4 className="question-subheading">E. General Student Satisfaction</h4>
                  {LIKERT_QUESTIONS.filter((q) => q.section === "E_SATISFACTION").map(renderStarQuestion)}
                </div>
              )}

              {/* Step 5: F. Evaluasi Terbuka */}
              {step === 5 && (
                <div>
                  <h3 className="question-section-title">F. OPEN EVALUATION</h3>
                  <p className="question-section-desc">
                    Please share your experience, obstacles, and constructive suggestions for the next English Camp.
                  </p>

                  <div className="question-card">
                    <strong style={{ fontSize: "13px", color: "#1e293b", display: "block", marginBottom: "8px" }}>
                      1. Apa aspek terbaik dari pelaksanaan English Camp yang Anda rasakan?
                    </strong>
                    {createElement("textarea", {
                      className: "textarea rating-textarea",
                      placeholder: "Describe the best aspects or highlights you experienced...",
                      rows: 3,
                      value: bestAspect,
                      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setBestAspect(e.target.value),
                    })}
                  </div>

                  <div className="question-card">
                    <strong style={{ fontSize: "13px", color: "#1e293b", display: "block", marginBottom: "8px" }}>
                      2. Kendala atau kesulitan apa yang Anda alami selama mengikuti English Camp?
                    </strong>
                    {createElement("textarea", {
                      className: "textarea rating-textarea",
                      placeholder: "Describe any obstacles or difficulties you faced...",
                      rows: 3,
                      value: difficulties,
                      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setDifficulties(e.target.value),
                    })}
                  </div>

                  <div className="question-card">
                    <strong style={{ fontSize: "13px", color: "#1e293b", display: "block", marginBottom: "8px" }}>
                      3. Aktivitas apa yang paling membantu meningkatkan kemampuan bahasa Inggris Anda?
                    </strong>
                    <div className="choice-pill-group">
                      {HELPFUL_ACTIVITY_OPTIONS.map((act) => {
                        const isChecked = helpfulActivities.includes(act)
                        return (
                          <button
                            type="button"
                            key={act}
                            className={`choice-pill-btn ${isChecked ? "active" : ""}`}
                            onClick={() => toggleActivity(act)}
                          >
                            {isChecked && <Icon name="check" size={15} />}
                            {act}
                          </button>
                        )
                      })}
                    </div>
                    {helpfulActivities.includes("Other") && (
                      <div style={{ marginTop: "10px" }}>
                        <input
                          className="input"
                          placeholder="Specify other activity..."
                          value={otherActivity}
                          onChange={(e) => setOtherActivity(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="question-card">
                    <strong style={{ fontSize: "13px", color: "#1e293b", display: "block", marginBottom: "8px" }}>
                      4. Menurut Anda, apa yang perlu diperbaiki untuk pelaksanaan English Camp berikutnya?
                    </strong>
                    {createElement("textarea", {
                      className: "textarea rating-textarea",
                      placeholder: "What aspects need improvement for future camps...",
                      rows: 3,
                      value: improvements,
                      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setImprovements(e.target.value),
                    })}
                  </div>

                  <div className="question-card">
                    <strong style={{ fontSize: "13px", color: "#1e293b", display: "block", marginBottom: "8px" }}>
                      5. Saran kegiatan baru yang ingin ditambahkan pada English Camp berikutnya:
                    </strong>
                    {createElement("textarea", {
                      className: "textarea rating-textarea",
                      placeholder: "Ideas for new activities or topics you would like to have...",
                      rows: 3,
                      value: newSuggestions,
                      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setNewSuggestions(e.target.value),
                    })}
                  </div>
                </div>
              )}

              {/* Navigation Action Buttons */}
              <div className="questionnaire-actions">
                <Button
                  type="button"
                  className="secondary"
                  disabled={step === 1}
                  onClick={() => setStep((prev) => (Math.max(1, prev - 1) as 1 | 2 | 3 | 4 | 5))}
                >
                  <Icon name="arrow" /> Previous
                </Button>

                {step < 5 ? (
                  <Button
                    type="button"
                    className="primary"
                    onClick={() => {
                      setStep((prev) => (Math.min(5, prev + 1) as 1 | 2 | 3 | 4 | 5))
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }}
                  >
                    Next <Icon name="chevron" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="primary"
                    disabled={isSubmitting}
                    onClick={handleSubmit}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Feedback"}{" "}
                    <Icon name="check" />
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  )
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [locked, setLocked] = useState(false)
  const [sheet, setSheet] = useState<
    | "students"
    | "add-student"
    | "edit-student"
    | "delete-student-confirm"
    | "export"
    | "reset-confirm"
    | "reset-success"
    | null
  >(null)
  const [isResetting, setIsResetting] = useState(false)
  const [exportName, setExportName] = useState("")
  const [adminStudents, setAdminStudents] = useState<MasterStudent[]>(masterStudents)
  const [committeeMembers, setCommitteeMembers] = useState<FirebaseCommitteeMember[]>(
    defaultCommittee as FirebaseCommitteeMember[],
  )

  // Manage students state
  const [studentSearch, setStudentSearch] = useState("")
  const [studentClassFilter, setStudentClassFilter] = useState("All Classes")
  const [selectedStudent, setSelectedStudent] = useState<MasterStudent | null>(null)
  const [editName, setEditName] = useState("")
  const [editClass, setEditClass] = useState("Class A")
  const [editGroup, setEditGroup] = useState("Group 1")
  const [editError, setEditError] = useState("")
  const [isSavingStudent, setIsSavingStudent] = useState(false)

  // Add student state
  const [newStudentId, setNewStudentId] = useState("")
  const [newName, setNewName] = useState("")
  const [newClass, setNewClass] = useState("Class A")
  const [newGroup, setNewGroup] = useState("Group 1")
  const [addError, setAddError] = useState("")

  // Delete student state
  const [studentToDelete, setStudentToDelete] = useState<MasterStudent | null>(null)
  const [isDeletingStudent, setIsDeletingStudent] = useState(false)

  useEffect(() => {
    const unsub = subscribeSystemConfig((cfg) => setLocked(cfg.locked))
    return () => unsub()
  }, [])

  useEffect(() => {
    const unsub = subscribeStudents(setAdminStudents, masterStudents)
    return () => unsub()
  }, [])

  useEffect(() => {
    const unsub = subscribeCommitteeMembers(setCommitteeMembers, defaultCommittee as FirebaseCommitteeMember[])
    return () => unsub()
  }, [])

  const availableAdminClasses = useMemo(() => {
    const list = Array.from(new Set(adminStudents.map((s) => s.class).filter(Boolean)))
    if (!list.length) return ["Class A", "Class B", "Class C", "Class D"]
    return list.sort()
  }, [adminStudents])

  const availableAdminGroups = useMemo(() => {
    const list = Array.from(new Set(adminStudents.map((s) => s.group).filter(Boolean)))
    if (!list.length) return ["Group 1", "Group 2", "Group 3", "Group 4", "Group 5", "Group 6"]
    return list.sort()
  }, [adminStudents])

  const filteredAdminStudents = useMemo(() => {
    return adminStudents.filter((s) => {
      const q = studentSearch.trim().toLowerCase()
      const matchSearch =
        !q || s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
      const matchClass =
        studentClassFilter === "All Classes" || s.class === studentClassFilter
      return matchSearch && matchClass
    })
  }, [adminStudents, studentSearch, studentClassFilter])

  const getNextStudentIdForClass = (targetClass: string) => {
    const classLetter = targetClass.replace(/Class\s*/i, "").trim().toLowerCase() || "a"
    const prefix = `${classLetter}_`
    let maxNum = 0
    adminStudents.forEach((s) => {
      if (s.id.startsWith(prefix)) {
        const numPart = s.id.slice(prefix.length)
        const n = parseInt(numPart, 10)
        if (!isNaN(n) && n > maxNum) maxNum = n
      }
    })
    return `${prefix}${String(maxNum + 1).padStart(3, "0")}`
  }

  const openAddStudent = () => {
    const initialClass = availableAdminClasses[0] || "Class A"
    setNewStudentId(getNextStudentIdForClass(initialClass))
    setNewName("")
    setNewClass(initialClass)
    setNewGroup(availableAdminGroups[0] || "Group 1")
    setAddError("")
    setSheet("add-student")
  }

  const handleSaveNewStudent = async () => {
    if (!newName.trim()) {
      setAddError("Student name is required.")
      return
    }
    setIsSavingStudent(true)
    setAddError("")
    try {
      await addStudentToFirestore({
        id: newStudentId.trim() || undefined,
        name: newName.trim(),
        class: newClass.trim() || "Class A",
        group: newGroup.trim() || "Group 1",
      })
      setIsSavingStudent(false)
      setSheet("students")
    } catch (err) {
      console.error("Failed to add student:", err)
      setAddError("Failed to save student to Firebase. Check connection.")
      setIsSavingStudent(false)
    }
  }

  const openEditStudent = (student: MasterStudent) => {
    setSelectedStudent(student)
    setEditName(student.name)
    setEditClass(student.class)
    setEditGroup(student.group)
    setEditError("")
    setSheet("edit-student")
  }

  const handleUpdateStudent = async () => {
    if (!selectedStudent) return
    if (!editName.trim()) {
      setEditError("Student name is required.")
      return
    }
    setIsSavingStudent(true)
    setEditError("")
    try {
      await updateStudentDetailsInFirestore(selectedStudent.id, {
        name: editName.trim(),
        class: editClass.trim(),
        group: editGroup.trim(),
      })
      setIsSavingStudent(false)
      setSheet("students")
    } catch (err) {
      console.error("Failed to update student:", err)
      setEditError("Failed to update student in Firebase.")
      setIsSavingStudent(false)
    }
  }

  const openDeleteStudent = (student: MasterStudent) => {
    setStudentToDelete(student)
    setSheet("delete-student-confirm")
  }

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return
    setIsDeletingStudent(true)
    try {
      await deleteStudentFromFirestore(studentToDelete.id)
      setIsDeletingStudent(false)
      setStudentToDelete(null)
      setSheet("students")
    } catch (err) {
      console.error("Failed to delete student:", err)
      alert("Failed to delete student from Firebase.")
      setIsDeletingStudent(false)
    }
  }

  const classCount = useMemo(
    () => new Set(adminStudents.map((s) => s.class)).size,
    [adminStudents],
  )
  const groupCount = useMemo(
    () => new Set(adminStudents.map((s) => s.group)).size,
    [adminStudents],
  )

  const toggleLock = async () => {
    const nextLocked = !locked
    setLocked(nextLocked)
    await setSystemLockInFirestore(nextLocked).catch(console.error)
  }

  const exports = [
    {
      name: "Lecturer Scoring (Dosen)",
      note: "Business, English, Entrepreneurship & academic grades",
      tone: "blue",
    },
    {
      name: "Committee Evaluation & History (Panitia)",
      note: "Student reductions, penalties & full audit history log",
      tone: "orange",
    },
    {
      name: "Committee Performance (Scoring Panitia)",
      note: "All 37 committee members evaluated across 5 divisions",
      tone: "green",
    },
    {
      name: "Event Satisfaction (Rating Experience)",
      note: "Participant star ratings, satisfaction & camp feedback",
      tone: "gold",
    },
  ]
  const openExport = (name: string) => {
    setExportName(name)
    setSheet("export")
  }
  return (
    <AppShell role="admin" onLogout={onLogout}>
      <main className="content admin-mobile-content">
        <section className="welcome-row">
          <div>
            <p className="eyebrow">Welcome, User</p>
            <Heading level={1}>Camp Control Center</Heading>
            <p>Manage students, system access, and all scoring exports.</p>
          </div>
        </section>
        <section className="camp-app-hero admin-app-hero">
          <img src={illustTentCampus} alt="Campus camp control illustration" />
          <div className="camp-hero-top">
            <span>English Camp · Admin</span>
            <span className={`live-badge ${locked ? "locked" : ""}`}>
              <i /> {locked ? "Locked" : "System open"}
            </span>
          </div>
          <div className="camp-hero-panel admin-control-panel">
            <div>
              <p className="eyebrow">System access</p>
              <Heading>
                {locked ? "Scoring is locked" : "Scoring is open"}
              </Heading>
              <span>
                {locked
                  ? "Lecturer and committee submissions are temporarily disabled."
                  : "All authorized roles can submit their latest scores."}
              </span>
            </div>
            <Button
              className={locked ? "primary" : "lock-button"}
              icon="lock"
              onClick={toggleLock}
            >
              {locked ? "Unlock" : "Lock"}
            </Button>
          </div>
        </section>

        {/* Live Firebase Synced Metrics */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "10px",
            marginBottom: "16px",
          }}
        >
          <div style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)", padding: "12px 8px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.5)", textAlign: "center" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Students</span>
            <strong style={{ display: "block", fontSize: "18px", color: "#0f172a", marginTop: "2px" }}>{adminStudents.length}</strong>
          </div>
          <div style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)", padding: "12px 8px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.5)", textAlign: "center" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Classes</span>
            <strong style={{ display: "block", fontSize: "18px", color: "#0f172a", marginTop: "2px" }}>{classCount}</strong>
          </div>
          <div style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)", padding: "12px 8px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.5)", textAlign: "center" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Groups</span>
            <strong style={{ display: "block", fontSize: "18px", color: "#0f172a", marginTop: "2px" }}>{groupCount}</strong>
          </div>
          <div style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)", padding: "12px 8px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.5)", textAlign: "center" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Committee</span>
            <strong style={{ display: "block", fontSize: "18px", color: "#0f172a", marginTop: "2px" }}>{committeeMembers.length}</strong>
          </div>
        </section>

        <section className="admin-quick-grid">
          <Button
            className="admin-quick-card"
            onClick={() => setSheet("students")}
          >
            <span className="admin-icon green">
              <Icon name="people" />
            </span>
            <span>
              <strong>Manage Students</strong>
              <small>Add, review, and update master data</small>
            </span>
            <Icon name="chevron" />
          </Button>
          <div className="admin-system-card">
            <span className={`system-state ${locked ? "locked" : ""}`}>
              <Icon name="lock" />
            </span>
            <div>
              <strong>Submission Access</strong>
              <small>
                {locked ? "All scoring forms locked" : "All scoring forms open"}
              </small>
            </div>
            <Button
              className="secondary compact"
              onClick={toggleLock}
            >
              {locked ? "Open" : "Lock"}
            </Button>
          </div>
        </section>
        <section className="admin-directory">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Download center</p>
              <Heading>Export Excel reports</Heading>
              <p>Four focused files, ready for campus administration.</p>
            </div>
          </div>
          <div className="export-card-grid">
            {exports.map((item, index) => (
              <Button
                className="export-data-card"
                key={item.name}
                onClick={() => openExport(item.name)}
              >
                <span className={`export-number ${item.tone}`}>
                  0{index + 1}
                </span>
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.note}</small>
                </span>
                <span className="download-circle">
                  <Icon name="download" />
                </span>
              </Button>
            ))}
          </div>
        </section>

        {/* Danger Zone: Full System Reset */}
        <section style={{ marginTop: "20px", marginBottom: "30px" }}>
          <div className="danger-zone" style={{ borderRadius: "16px", padding: "16px 20px" }}>
            <div>
              <Icon name="warning" />
              <span>
                <strong style={{ fontSize: "13px" }}>Reset All System Data</strong>
                <small style={{ fontSize: "11px" }}>Restore student & committee scores to 100, clear all reduction logs</small>
              </span>
            </div>
            <Button
              className="danger-outline"
              icon="trash"
              onClick={() => setSheet("reset-confirm")}
            >
              Reset All Data
            </Button>
          </div>
        </section>
      </main>
      {sheet === "students" && (
        <Sheet title="Manage Student Data" onClose={() => setSheet(null)}>
          <div style={{ marginBottom: "12px" }}>
            <label className="search-box student-search" style={{ marginBottom: "8px" }}>
              <Icon name="search" />
              <input
                placeholder="Search student by name or ID..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
              {studentSearch && (
                <button
                  type="button"
                  onClick={() => setStudentSearch("")}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "14px" }}
                >
                  ×
                </button>
              )}
            </label>

            <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px" }}>
              {["All Classes", ...availableAdminClasses].map((cls) => (
                <Button
                  key={cls}
                  className={`filter-chip ${studentClassFilter === cls ? "active" : ""}`}
                  style={{
                    padding: "4px 10px",
                    fontSize: "11px",
                    borderRadius: "20px",
                    background: studentClassFilter === cls ? "var(--primary)" : "rgba(255,255,255,0.7)",
                    color: studentClassFilter === cls ? "#fff" : "var(--text)",
                    border: "1px solid rgba(0,0,0,0.08)",
                    whiteSpace: "nowrap",
                  }}
                  onClick={() => setStudentClassFilter(cls)}
                >
                  {cls}
                </Button>
              ))}
            </div>
            <div style={{ marginTop: "6px", fontSize: "11px", color: "#64748b", display: "flex", justifyContent: "space-between" }}>
              <span>Showing <strong>{filteredAdminStudents.length}</strong> of {adminStudents.length} students</span>
              {studentClassFilter !== "All Classes" && (
                <span style={{ color: "var(--primary)", fontWeight: 600 }}>Filter: {studentClassFilter}</span>
              )}
            </div>
          </div>

          <div className="student-manage-list" style={{ maxHeight: "380px", overflowY: "auto", paddingRight: "4px" }}>
            {filteredAdminStudents.length ? (
              filteredAdminStudents.map((student) => (
                <article className="student-manage-card" key={student.id}>
                  <div className="student-manage-card-top">
                    <Avatar name={student.name} />
                    <div className="student-manage-card-info">
                      <strong>{student.name}</strong>
                      <small>
                        No. {student.id} · {student.class} · {student.group}
                      </small>
                    </div>
                    <span className={`student-manage-card-score ${student.score < 80 ? "low" : ""}`}>
                      {student.score} pts
                    </span>
                  </div>

                  <div className="student-manage-card-actions">
                    <Button
                      className="edit-btn"
                      icon="edit"
                      onClick={() => openEditStudent(student)}
                    >
                      Edit Student
                    </Button>
                    <Button
                      className="delete-btn"
                      icon="trash"
                      aria-label={`Delete ${student.name}`}
                      onClick={() => openDeleteStudent(student)}
                    >
                      Delete
                    </Button>
                  </div>
                </article>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "30px 10px", color: "#94a3b8" }}>
                <p style={{ margin: 0, fontSize: "13px" }}>No students match your search.</p>
              </div>
            )}
          </div>

          <Button
            className="primary full"
            icon="plus"
            style={{ marginTop: "12px" }}
            onClick={openAddStudent}
          >
            Add New Student
          </Button>
        </Sheet>
      )}

      {sheet === "add-student" && (
        <Sheet title="Add New Student" onClose={() => setSheet("students")}>
          <div style={{ display: "grid", gap: "12px" }}>
            <label className="field">
              <span className="field-label">Student ID (Number)</span>
              <input
                className="input"
                placeholder="e.g. 233"
                value={newStudentId}
                onChange={(e) => setNewStudentId(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-label">Full Name *</span>
              <input
                className="input"
                placeholder="Enter student full name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-label">Class</span>
              <select
                className="input"
                value={newClass}
                onChange={(e) => {
                  const val = e.target.value
                  setNewClass(val)
                  setNewStudentId(getNextStudentIdForClass(val))
                }}
              >
                {availableAdminClasses.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">Group</span>
              <select
                className="input"
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
              >
                {availableAdminGroups.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </label>

            <div style={{ background: "#edf4eb", padding: "10px 14px", borderRadius: "12px", fontSize: "12px", color: "#2B5748" }}>
              Initial Base Score: <strong>100 points</strong> (No penalties)
            </div>

            {addError && (
              <span className="error-text" style={{ fontSize: "12px", color: "var(--danger)" }}>
                {addError}
              </span>
            )}

            <div className="sheet-actions" style={{ marginTop: "8px" }}>
              <Button className="secondary" onClick={() => setSheet("students")} disabled={isSavingStudent}>
                Cancel
              </Button>
              <Button
                className="primary"
                icon="check"
                disabled={isSavingStudent}
                onClick={handleSaveNewStudent}
              >
                {isSavingStudent ? "Saving..." : "Save to Firebase"}
              </Button>
            </div>
          </div>
        </Sheet>
      )}

      {sheet === "edit-student" && selectedStudent && (
        <Sheet title={`Edit Student #${selectedStudent.id}`} onClose={() => setSheet("students")}>
          <div style={{ display: "grid", gap: "12px" }}>
            <div style={{ background: "#edf4eb", padding: "10px 14px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--primary)" }}>ID: #{selectedStudent.id}</span>
              <span style={{ fontSize: "12px", color: "#475569" }}>Discipline Score: <strong>{selectedStudent.score}</strong></span>
            </div>

            <label className="field">
              <span className="field-label">Full Name *</span>
              <input
                className="input"
                placeholder="Student name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-label">Class</span>
              <select
                className="input"
                value={editClass}
                onChange={(e) => setEditClass(e.target.value)}
              >
                {availableAdminClasses.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">Group</span>
              <select
                className="input"
                value={editGroup}
                onChange={(e) => setEditGroup(e.target.value)}
              >
                {availableAdminGroups.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </label>

            {editError && (
              <span className="error-text" style={{ fontSize: "12px", color: "var(--danger)" }}>
                {editError}
              </span>
            )}

            <div className="sheet-actions" style={{ marginTop: "8px" }}>
              <Button className="secondary" onClick={() => setSheet("students")} disabled={isSavingStudent}>
                Cancel
              </Button>
              <Button
                className="primary"
                icon="check"
                disabled={isSavingStudent}
                onClick={handleUpdateStudent}
              >
                {isSavingStudent ? "Updating..." : "Update Student"}
              </Button>
            </div>
          </div>
        </Sheet>
      )}

      {sheet === "delete-student-confirm" && studentToDelete && (
        <Sheet
          title="Delete Student"
          className="danger-sheet"
          onClose={() => !isDeletingStudent && setSheet("students")}
        >
          <div className="danger-mark">
            <Icon name="trash" />
          </div>
          <p className="confirm-copy" style={{ textAlign: "center", marginBottom: "18px" }}>
            Are you sure you want to delete <strong>{studentToDelete.name}</strong> (No. {studentToDelete.id}, {studentToDelete.class})?
            <br />
            This will permanently remove the student from Firebase.
          </p>
          <div className="sheet-actions">
            <Button
              className="secondary"
              onClick={() => setSheet("students")}
              disabled={isDeletingStudent}
            >
              Cancel
            </Button>
            <Button
              className="danger"
              icon="trash"
              disabled={isDeletingStudent}
              onClick={handleDeleteStudent}
            >
              {isDeletingStudent ? "Deleting..." : "Yes, Delete Student"}
            </Button>
          </div>
        </Sheet>
      )}
      {sheet === "export" && (
        <Sheet title="Export Excel Report" onClose={() => setSheet(null)}>
          <div className="export-preview">
            <span>
              <Icon name="download" />
            </span>
            <div>
              <strong>{exportName}</strong>
              <small>Live synchronized Firebase data (.xlsx)</small>
            </div>
          </div>
          <p className="confirm-copy">
            The Excel (.xlsx) file will be generated with all latest data from Firebase,
            including complete student calculations, division scores, and timestamps.
          </p>
          <div className="sheet-actions">
            <Button className="secondary" onClick={() => setSheet(null)}>
              Cancel
            </Button>
            <Button
              className="primary"
              icon="download"
              onClick={async () => {
                await downloadReport(exportName)
                setSheet(null)
              }}
            >
              Download Excel (.xlsx)
            </Button>
          </div>
        </Sheet>
      )}
      {sheet === "reset-confirm" && (
        <Sheet
          title="Reset All System Data"
          className="danger-sheet"
          onClose={() => !isResetting && setSheet(null)}
        >
          <div className="danger-mark">
            <Icon name="warning" />
          </div>
          <p className="confirm-copy" style={{ textAlign: "center", marginBottom: "18px" }}>
            <strong>Are you sure you want to reset all data?</strong>
            <br />
            This will permanently restore all student and committee scores to <strong>100</strong>, clear all violation notes, erase reduction audit logs, and clear event ratings across Firebase.
          </p>
          <div className="sheet-actions">
            <Button
              className="secondary"
              onClick={() => setSheet(null)}
              disabled={isResetting}
            >
              Cancel
            </Button>
            <Button
              className="danger"
              icon="trash"
              disabled={isResetting}
              onClick={async () => {
                setIsResetting(true)
                try {
                  await resetAllSystemDataInFirestore()
                  setIsResetting(false)
                  setSheet("reset-success")
                } catch (err) {
                  console.error("Reset failed:", err)
                  setIsResetting(false)
                  alert("Failed to reset system data. Please check connection.")
                }
              }}
            >
              {isResetting ? "Resetting..." : "Yes, Reset Everything"}
            </Button>
          </div>
        </Sheet>
      )}
      {sheet === "reset-success" && (
        <Sheet
          title="System Reset Completed"
          onClose={() => setSheet(null)}
        >
          <div style={{ textAlign: "center", padding: "20px 10px" }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "#ecfdf5", color: "#059669", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
              <Icon name="check" />
            </div>
            <strong style={{ fontSize: "16px", display: "block", marginBottom: "6px" }}>All Data Has Been Reset</strong>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
              All 232 students and 37 committee members have been restored to a base score of 100 with zero penalties. All reduction logs have been cleared.
            </p>
          </div>
          <Button
            className="primary full"
            onClick={() => setSheet(null)}
          >
            Done
          </Button>
        </Sheet>
      )}
    </AppShell>
  )
}

export default function App() {
  const [splash, setSplash] = useState(true)
  const [role, setRole] = useState<Role | null>(() => {
    try {
      const saved = localStorage.getItem("campus_user_role")
      if (saved && ["dosen", "panitia", "scoring", "admin"].includes(saved)) {
        return saved as Role
      }
    } catch (_) {}
    return null
  })
  const [eventRating, setEventRating] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setSplash(false), 2200)
    return () => window.clearTimeout(timer)
  }, [])

  // Listen and strictly sync with Firebase Authentication state (Anti-Tamper & Role Enforcement)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        const verifiedRole = getRoleFromEmail(user.email)
        if (verifiedRole) {
          try {
            localStorage.setItem("campus_user_role", verifiedRole)
          } catch (_) {}
          setRole(verifiedRole)
        } else {
          handleLogout()
        }
      } else {
        // If not authenticated in Firebase Auth
        try {
          localStorage.removeItem("campus_user_role")
        } catch (_) {}
        setRole(null)
      }
    })
    return () => unsub()
  }, [])

  const handleLogin = (newRole: Role) => {
    try {
      localStorage.setItem("campus_user_role", newRole)
    } catch (_) {}
    setRole(newRole)
  }

  const handleLogout = () => {
    try {
      localStorage.removeItem("campus_user_role")
      sessionStorage.clear()
    } catch (_) {}
    setRole(null)
    signOut(auth).catch(() => {})
  }

  // Active user email role guard: If user logged out (role === null), immediately render Login!
  const currentAuthEmail = auth.currentUser?.email
  const verifiedRole = currentAuthEmail ? getRoleFromEmail(currentAuthEmail) : null
  const activeRole = role ? (verifiedRole || role) : null

  if (splash) return <Splash />
  if (eventRating) return <EventRating onBack={() => setEventRating(false)} />
  if (!activeRole)
    return (
      <Login onLogin={handleLogin} onEventRating={() => setEventRating(true)} />
    )
  if (activeRole === "dosen") return <DosenDashboard onLogout={handleLogout} />
  if (activeRole === "panitia") return <PanitiaDashboard onLogout={handleLogout} />
  if (activeRole === "scoring") return <ScoringPanitiaDashboard onLogout={handleLogout} />
  return <AdminDashboard onLogout={handleLogout} />
}
