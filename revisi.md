# Revisi Integrasi Semester ke Frontend

Dokumen ini merangkum perubahan API backend terkait manajemen semester dan menjadi acuan penyesuaian di sisi frontend.

## Ringkasan Perubahan Backend
- Tabel baru `semesters` berisi metadata tahun ajaran, nomor semester, rentang tanggal, jumlah hari belajar, dan catatan.
- Tabel `grades` dan `attendance` kini memiliki kolom `semesterId` (foreign key ke `semesters.id`) selain tetap menyimpan `tahunAjaran` & `semester` untuk kompatibilitas.
- Seluruh query nilai, kehadiran, raport, dan agregasi lainnya melakukan join ke `semesters` sehingga data semester (termasuk `jumlahHariBelajar`) tersedia pada response.
- Semua mutasi (insert/update) nilai & kehadiran guru mewajibkan identitas semester.
- Admin memiliki endpoint CRUD baru untuk mengelola daftar semester.

## Dampak pada Frontend

### 1. Admin Module – Manajemen Semester
- Endpoint: `/api/admin/semesters`
  - `GET /api/admin/semesters`
  - `POST /api/admin/semesters`
  - `PUT /api/admin/semesters/:id`
  - `DELETE /api/admin/semesters/:id`
- Payload contoh untuk create/update:
  ```json
  {
    "tahunAjaran": "2024/2025",
    "semester": 1,
    "tanggalMulai": "2024-07-15",
    "tanggalSelesai": "2024-12-20",
    "jumlahHariBelajar": 120,
    "catatan": "Semester ganjil 2024"
  }
  ```
- Frontend perlu menyediakan UI untuk CRUD semester (menampilkan daftar, form tambah/edit, tombol hapus).
- Validasi: kombinasi `tahunAjaran + semester` harus unik (backend akan menolak duplikat).

### 2. Guru – Nilai & Kehadiran
- **Request filter** (`GET /guru/grades` & `GET /guru/attendance`):
  - Gunakan query `semesterId=<id>` atau pasangan `tahunAjaran=<string>&semester=<number>` untuk memfilter data.
- **Response tambahan**:
  - Selain kolom existing, terdapat atribut dari tabel semester:
    - `semesterId`
    - `semesterTahunAjaran`
    - `semesterKe`
    - `semesterTanggalMulai`
    - `semesterTanggalSelesai`
    - `semesterJumlahHariBelajar`
    - `semesterCatatan`
- **Mutasi nilai/kehadiran** (`POST/PUT /guru/:id/nilai` & `POST/PUT /guru/:id/kehadiran`):
  - Wajib mengirim `semesterId` **atau** kombinasi `tahunAjaran` + `semester` di body.
  - Rekomendasi FE: gunakan selector semester (berbasis `GET /api/admin/semesters`) dan kirim `semesterId` untuk menghindari kesalahan mapping.
  - Backend akan menolak request tanpa semester (`400`) atau referensi semester yang tidak valid (`404`).

### 3. Walikelas – Panel Kelas & Raport
- Endpoint `GET /walikelas/:kelasId/kelas/nilai` dan `.../kehadiran` menerima query filter semester sama seperti modul guru dan mengembalikan metadata semester pada setiap baris.
  - Query yang didukung: `?semesterId=<id>` **atau** `?tahun=<string>&semester=<number>` / `?tahunAjaran=<string>&semesterKe=<number>`.
  - Backend akan memvalidasi referensi semester; bila ID atau kombinasi tahun+semester tidak ditemukan, response `404 Semester tidak ditemukan` dikembalikan.
- Endpoint `GET /walikelas/:kelasId/siswa/:studentId/raport` kini menambahkan properti baru pada response:
  ```json
  {
    "semesterId": 12,
    "tahunAjaran": "2024/2025",
    "semester": 1,
    "semesterInfo": {
      "id": 12,
      "tahunAjaran": "2024/2025",
      "semester": 1,
      "tanggalMulai": "2024-07-15",
      "tanggalSelesai": "2024-12-20",
      "jumlahHariBelajar": 120,
      "catatan": "Semester ganjil 2024"
    }
  }
  ```
- UI raport & rekap kehadiran perlu menampilkan `jumlahHariBelajar` dan metadata semester lainnya (tanggal, catatan) jika tersedia.
- Saat memanggil endpoint walikelas, selalu kirim `semesterId` yang valid agar backend mengembalikan dataset yang sudah terfilter ke semester terkait.

### 4. Siswa – Dashboard Nilai, Kehadiran, Raport
- Endpoint `GET /siswa/:id/nilai` dan `GET /siswa/:id/kehadiran` menerima query filter semester serta mengembalikan atribut semester seperti pada modul guru.
- Endpoint `GET /siswa/:id/raport` menyediakan struktur identik dengan endpoint walikelas di atas.
- Pastikan filter semester di UI siswa menggunakan `semesterId` agar konsisten.

### 5. Data Migration & Backward Compatibility
- Data lama pada `grades` dan `attendance` telah dimigrasikan ke semester baru. Namun, FE sebaiknya tidak lagi mengandalkan kombinasi `tahunAjaran + semester` manual dan selalu menggunakan `semesterId`.
- Bila FE masih menyimpan nilai `tahunAjaran` & `semester`, backend tetap memproses, tetapi error handling harus siap untuk pesan `SEMESTER_NOT_FOUND`.

### 6. Langkah Implementasi FE yang Direkomendasikan
1. **Sinkronisasi master semester**
   - Tambahkan store/service untuk memuat daftar semester dari endpoint admin (dapat digunakan lintas modul).
2. **Perbarui form input nilai & kehadiran guru**
   - Tambahkan dropdown semester dan kirim `semesterId` saat submit.
3. **Update filter data**
   - Terapkan filter semester di halaman daftar nilai/kehadiran guru, walikelas, dan siswa menggunakan query parameter baru.
4. **Perbarui tampilan raport**
   - Tampilkan metadata semester (terutama `jumlahHariBelajar`) di header raport.
5. **Sesuaikan handling error**
   - Tampilkan pesan khusus bila backend merespon `SEMESTER_NOT_FOUND` atau `SemesterId wajib diisi`.

---
Dokumen ini dapat dijadikan referensi QA & FE untuk memastikan seluruh alur sudah memanfaatkan struktur semester yang baru.
