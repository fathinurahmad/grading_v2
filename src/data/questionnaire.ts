export interface LikertQuestion {
  id: number
  section: "B_PLAN" | "B_EXEC" | "C_IMPACT" | "D_METHOD" | "E_SATISFACTION"
  sectionTitle: string
  text: string
  shortLabel: string
}

export const LIKERT_QUESTIONS: LikertQuestion[] = [
  // B. EVALUASI PELAKSANAAN ENGLISH CAMP - Aspek Perencanaan dan Organisasi
  {
    id: 1,
    section: "B_PLAN",
    sectionTitle: "B. Aspek Perencanaan dan Organisasi",
    text: "Informasi mengenai pelaksanaan English Camp diberikan dengan jelas sebelum kegiatan berlangsung.",
    shortLabel: "B1. Info Jelas",
  },
  {
    id: 2,
    section: "B_PLAN",
    sectionTitle: "B. Aspek Perencanaan dan Organisasi",
    text: "Persiapan kegiatan (jadwal, aturan, pembagian kelompok, dan aktivitas) sudah dilakukan dengan baik.",
    shortLabel: "B2. Persiapan Kegiatan",
  },
  {
    id: 3,
    section: "B_PLAN",
    sectionTitle: "B. Aspek Perencanaan dan Organisasi",
    text: "Tujuan kegiatan English Camp sesuai dengan kebutuhan mahasiswa dalam meningkatkan kemampuan komunikasi bahasa Inggris.",
    shortLabel: "B3. Sesuai Kebutuhan",
  },
  {
    id: 4,
    section: "B_PLAN",
    sectionTitle: "B. Aspek Perencanaan dan Organisasi",
    text: "Rangkaian kegiatan English Camp berjalan sesuai dengan rencana yang telah disampaikan.",
    shortLabel: "B4. Sesuai Rencana",
  },

  // B. EVALUASI PELAKSANAAN ENGLISH CAMP - Aspek Pelaksanaan Kegiatan
  {
    id: 5,
    section: "B_EXEC",
    sectionTitle: "B. Aspek Pelaksanaan Kegiatan",
    text: "Kegiatan English Camp memberikan kesempatan yang cukup bagi mahasiswa untuk menggunakan bahasa Inggris secara aktif.",
    shortLabel: "B5. Kesempatan Aktif",
  },
  {
    id: 6,
    section: "B_EXEC",
    sectionTitle: "B. Aspek Pelaksanaan Kegiatan",
    text: "Aktivitas conversation practice membantu saya berlatih berbicara bahasa Inggris.",
    shortLabel: "B6. Conversation Practice",
  },
  {
    id: 7,
    section: "B_EXEC",
    sectionTitle: "B. Aspek Pelaksanaan Kegiatan",
    text: "Aktivitas diskusi kelompok membantu meningkatkan kemampuan komunikasi saya.",
    shortLabel: "B7. Diskusi Kelompok",
  },
  {
    id: 8,
    section: "B_EXEC",
    sectionTitle: "B. Aspek Pelaksanaan Kegiatan",
    text: "Aktivitas presentasi meningkatkan keberanian saya berbicara di depan orang lain.",
    shortLabel: "B8. Presentasi Keberanian",
  },
  {
    id: 9,
    section: "B_EXEC",
    sectionTitle: "B. Aspek Pelaksanaan Kegiatan",
    text: "Kegiatan social interaction/small talk membantu saya membangun percakapan secara alami.",
    shortLabel: "B9. Social Interaction",
  },
  {
    id: 10,
    section: "B_EXEC",
    sectionTitle: "B. Aspek Pelaksanaan Kegiatan",
    text: "Suasana kegiatan membuat saya lebih nyaman menggunakan bahasa Inggris.",
    shortLabel: "B10. Suasana Nyaman",
  },

  // C. DAMPAK ENGLISH CAMP TERHADAP KEMAMPUAN BAHASA INGGRIS (CPMK English Conversation)
  {
    id: 11,
    section: "C_IMPACT",
    sectionTitle: "C. Dampak Terhadap Kemampuan Bahasa Inggris (CPMK)",
    text: "Saya menjadi lebih percaya diri berbicara menggunakan bahasa Inggris setelah mengikuti English Camp.",
    shortLabel: "C11. Lebih Percaya Diri",
  },
  {
    id: 12,
    section: "C_IMPACT",
    sectionTitle: "C. Dampak Terhadap Kemampuan Bahasa Inggris (CPMK)",
    text: "Kemampuan saya membuka dan mempertahankan percakapan dalam bahasa Inggris meningkat.",
    shortLabel: "C12. Pertahankan Percakapan",
  },
  {
    id: 13,
    section: "C_IMPACT",
    sectionTitle: "C. Dampak Terhadap Kemampuan Bahasa Inggris (CPMK)",
    text: "Vocabulary bahasa Inggris saya bertambah setelah mengikuti kegiatan.",
    shortLabel: "C13. Kosakata Bertambah",
  },
  {
    id: 14,
    section: "C_IMPACT",
    sectionTitle: "C. Dampak Terhadap Kemampuan Bahasa Inggris (CPMK)",
    text: "Saya lebih mampu menggunakan ekspresi bahasa Inggris dalam situasi sehari-hari.",
    shortLabel: "C14. Ekspresi Sehari-hari",
  },
  {
    id: 15,
    section: "C_IMPACT",
    sectionTitle: "C. Dampak Terhadap Kemampuan Bahasa Inggris (CPMK)",
    text: "Saya lebih mampu melakukan komunikasi sederhana dalam konteks akademik maupun profesional.",
    shortLabel: "C15. Komunikasi Profesional",
  },
  {
    id: 16,
    section: "C_IMPACT",
    sectionTitle: "C. Dampak Terhadap Kemampuan Bahasa Inggris (CPMK)",
    text: "English Camp membantu meningkatkan pronunciation saya.",
    shortLabel: "C16. Pronunciation Meningkat",
  },
  {
    id: 17,
    section: "C_IMPACT",
    sectionTitle: "C. Dampak Terhadap Kemampuan Bahasa Inggris (CPMK)",
    text: "Saya menjadi lebih berani berkomunikasi dengan mahasiswa lain menggunakan bahasa Inggris.",
    shortLabel: "C17. Berani Berkomunikasi",
  },

  // D. EVALUASI METODE DAN AKTIVITAS PEMBELAJARAN
  {
    id: 18,
    section: "D_METHOD",
    sectionTitle: "D. Evaluasi Metode dan Aktivitas Pembelajaran",
    text: "Metode experiential learning selama English Camp efektif untuk belajar bahasa Inggris.",
    shortLabel: "D18. Experiential Learning",
  },
  {
    id: 19,
    section: "D_METHOD",
    sectionTitle: "D. Evaluasi Metode dan Aktivitas Pembelajaran",
    text: "Metode kerja kelompok membantu meningkatkan kemampuan komunikasi saya.",
    shortLabel: "D19. Kerja Kelompok",
  },
  {
    id: 20,
    section: "D_METHOD",
    sectionTitle: "D. Evaluasi Metode dan Aktivitas Pembelajaran",
    text: "Role play dan simulation activities membantu saya memahami penggunaan bahasa Inggris dalam kehidupan nyata.",
    shortLabel: "D20. Role Play & Simulasi",
  },
  {
    id: 21,
    section: "D_METHOD",
    sectionTitle: "D. Evaluasi Metode dan Aktivitas Pembelajaran",
    text: "Aktivitas English Camp lebih menarik dibandingkan pembelajaran conversation biasa di kelas.",
    shortLabel: "D21. Lebih Menarik dari Kelas",
  },
  {
    id: 22,
    section: "D_METHOD",
    sectionTitle: "D. Evaluasi Metode dan Aktivitas Pembelajaran",
    text: "Durasi pelaksanaan English Camp sudah sesuai untuk mencapai tujuan pembelajaran.",
    shortLabel: "D22. Durasi Sesuai",
  },

  // E. KEPUASAN MAHASISWA SECARA UMUM
  {
    id: 23,
    section: "E_SATISFACTION",
    sectionTitle: "E. Kepuasan Mahasiswa Secara Umum",
    text: "Saya puas dengan pelaksanaan English Camp secara keseluruhan.",
    shortLabel: "E23. Puas Keseluruhan",
  },
  {
    id: 24,
    section: "E_SATISFACTION",
    sectionTitle: "E. Kepuasan Mahasiswa Secara Umum",
    text: "English Camp memberikan pengalaman belajar bahasa Inggris yang berkesan.",
    shortLabel: "E24. Pengalaman Berkesan",
  },
  {
    id: 25,
    section: "E_SATISFACTION",
    sectionTitle: "E. Kepuasan Mahasiswa Secara Umum",
    text: "Saya merekomendasikan kegiatan English Camp untuk mahasiswa berikutnya.",
    shortLabel: "E25. Rekomendasi Mahasiswa",
  },
  {
    id: 26,
    section: "E_SATISFACTION",
    sectionTitle: "E. Kepuasan Mahasiswa Secara Umum",
    text: "English Camp memberikan manfaat bagi pengembangan kemampuan komunikasi profesional mahasiswa akuntansi.",
    shortLabel: "E26. Manfaat Mhs Akuntansi",
  },
]

export const CLASS_OPTIONS = ["A", "B", "C", "D", "E", "F"] as const

export const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
] as const

export const ABILITY_OPTIONS = [
  { value: "Very Poor", label: "Very Poor" },
  { value: "Poor", label: "Poor" },
  { value: "Fair", label: "Fair" },
  { value: "Good", label: "Good" },
  { value: "Very Good", label: "Very Good" },
] as const

export const HELPFUL_ACTIVITY_OPTIONS = [
  "Treasure Hunt",
  "Games",
  "Conversation practice",
  "Group discussion",
  "Presentation",
  "Team challenge",
  "Social interaction",
  "Other",
] as const
