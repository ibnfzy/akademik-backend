import db from "../config/db.js";

// 🔹 Ambil profil sekolah (biasanya cuma 1 record)
export const getProfile = async () => {
  return db("school_profile")
    .select(
      "id",
      "namaSekolah",
      "npsn",
      "alamat",
      "kodePos",
      "telepon",
      "email",
      "website",
      "kepalaSekolah",
      "nipKepalaSekolah",
      "akreditasi",
      "tahunAkreditasi",
      "visi",
      "misi",
      "updatedAt"
    )
    .first();
};

// 🔹 Update profil sekolah
export const updateProfile = async (data) => {
  return db("school_profile")
    .update({
      namaSekolah: data.namaSekolah,
      npsn: data.npsn,
      alamat: data.alamat,
      kodePos: data.kodePos,
      telepon: data.telepon,
      email: data.email,
      website: data.website,
      kepalaSekolah: data.kepalaSekolah,
      nipKepalaSekolah: data.nipKepalaSekolah,
      akreditasi: data.akreditasi,
      tahunAkreditasi: data.tahunAkreditasi,
      visi: data.visi,
      misi: data.misi,
      updatedAt: db.fn.now(),
    })
    .where("id", 1) // karena cuma 1 record
    .returning([
      "id",
      "namaSekolah",
      "npsn",
      "alamat",
      "kodePos",
      "telepon",
      "email",
      "website",
      "kepalaSekolah",
      "nipKepalaSekolah",
      "akreditasi",
      "tahunAkreditasi",
      "visi",
      "misi",
      "updatedAt",
    ]);
};
