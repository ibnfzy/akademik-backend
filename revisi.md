# Ringkasan Perubahan Backend
- Penambahan tabel `app_settings` untuk menyimpan konfigurasi global, termasuk pengaturan penegakan semester aktif.
- Helper baru untuk mengambil semester aktif sehingga logika pengecekan konsisten di seluruh modul.
- Mode penegakan semester dibagi menjadi `strict` (memblokir tindakan jika semester tidak aktif) dan `relaxed` (memberi peringatan tetapi tetap mengizinkan operasi tertentu).
- Endpoint konfigurasi baru `GET/PUT /admin/settings/semester-enforcement` untuk membaca dan memperbarui mode penegakan semester beserta tanggal aktifnya.
- Admin dashboard kini perlu menyediakan fitur ubah mode penegakan melalui dropdown yang menampilkan opsi `strict` dan `relaxed`, kemudian memanggil endpoint `PUT` di atas saat pengguna menyimpan perubahan.

## Impact ke Frontend
- Hanya kirim `semesterId` saat backend berada dalam mode `strict` **dan** pengguna memilih semester aktif; pada mode `relaxed`, backend dapat menerima request tanpa `semesterId`.
- Tangani error baru:
  - `SEMESTER_NOT_ACTIVE`: tampilkan pesan bahwa semester sudah melewati `tanggalSelesai` dan blokir aksi unggah di mode `strict`.
  - `ACTIVE_SEMESTER_NOT_FOUND`: tampilkan prompt untuk memilih semester aktif atau hubungi admin jika daftar semester kosong.
- Mode `strict`: setelah `tanggalSelesai` semester aktif terlewati, blokir unggahan dan tampilkan alasan ke pengguna.
- Mode `relaxed`: izinkan unggahan meskipun semester aktif sudah lewat, tetapi tampilkan peringatan bahwa data akan ditandai sebagai semester lampau.

Aplikasi kini menyimpan konfigurasi mode enforcement semester pada tabel `app_settings` dengan key `semester_enforcement_mode`. Nilai default-nya adalah `relaxed`, yang mengizinkan guru memilih semester nonaktif ketika diperlukan. Mode `strict` mewajibkan penggunaan semester yang sedang aktif dan akan menolak perubahan jika tidak ada semester aktif yang terdaftar.

Gunakan endpoint berikut (memerlukan autentikasi admin) untuk membaca atau mengubah mode:

- `GET /admin/settings/semester-enforcement` — menampilkan mode saat ini dalam bentuk `{ "mode": "relaxed" }` atau `"strict"`.
- `PUT /admin/settings/semester-enforcement` — perbarui mode dengan payload `{ "mode": "strict" }` atau `{ "mode": "relaxed" }`.

Apabila mode disetel ke `strict`, backend akan otomatis menggunakan semester yang aktif saat payload tidak menentukan semester, dan akan menolak operasi ketika tidak ada semester aktif atau semester yang dipilih sudah tidak aktif.

## Catatan Uji Manual yang Direkomendasikan
1. Kirim request tanpa `semesterId` ketika mode `relaxed` aktif — pastikan backend menerima tanpa error.
2. Kirim request tanpa `semesterId` ketika mode `strict` aktif — pastikan muncul error `ACTIVE_SEMESTER_NOT_FOUND`.
3. Unggah berkas saat `tanggalSelesai` semester aktif sudah lewat dalam mode `strict` — pastikan menerima error `SEMESTER_NOT_ACTIVE` dan unggah gagal.
4. Ulangi skenario poin 3 dalam mode `relaxed` — pastikan unggah tetap berhasil tetapi UI menampilkan peringatan.
5. Ganti mode via `PUT /admin/settings/semester-enforcement`, lalu refresh UI untuk memastikan perubahan mode terpropagasi.
6. Uji dropdown di admin dashboard: pastikan nilai awal sesuai response `GET`, perubahan ke `strict`/`relaxed` memicu `PUT` dengan payload benar, dan UI menampilkan konfirmasi keberhasilan atau pesan error dari backend.
