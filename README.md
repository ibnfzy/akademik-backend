# Akademik Backend

## Pengaturan Enforcement Semester

Aplikasi kini menyimpan konfigurasi mode enforcement semester pada tabel `app_settings` dengan key `semester_enforcement_mode`. Nilai default-nya adalah `relaxed`, yang mengizinkan guru memilih semester nonaktif ketika diperlukan. Mode `strict` mewajibkan penggunaan semester yang sedang aktif dan akan menolak perubahan jika tidak ada semester aktif yang terdaftar.

Gunakan endpoint berikut (memerlukan autentikasi admin) untuk membaca atau mengubah mode:

- `GET /admin/settings/semester-enforcement` — menampilkan mode saat ini dalam bentuk `{ "mode": "relaxed" }` atau `"strict"`.
- `PUT /admin/settings/semester-enforcement` — perbarui mode dengan payload `{ "mode": "strict" }` atau `{ "mode": "relaxed" }`.

Apabila mode disetel ke `strict`, backend akan otomatis menggunakan semester yang aktif saat payload tidak menentukan semester, dan akan menolak operasi ketika tidak ada semester aktif atau semester yang dipilih sudah tidak aktif.
