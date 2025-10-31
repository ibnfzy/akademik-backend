import db from "../config/db.js";

let activeDb = db;

const extractTrailingNumber = (name) => {
  if (typeof name !== "string") {
    return 0;
  }

  const match = name.trim().match(/(\d+)$/);
  return match ? Number(match[1]) : 0;
};

const buildClassName = (tingkat, jurusan, sequence) => {
  return `${tingkat} ${jurusan} ${sequence}`;
};

const generateNextClassName = async (trx, tingkat, jurusan) => {
  const existing = await trx("classes")
    .where({ tingkat, jurusan })
    .select("nama");

  const nextSequence = existing.reduce((highest, row) => {
    const current = extractTrailingNumber(row.nama);
    return current > highest ? current : highest;
  }, 0);

  return buildClassName(tingkat, jurusan, nextSequence + 1);
};

const sanitizeWalikelasId = (value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  return value;
};

export const __setDb = (overrideDb) => {
  activeDb = overrideDb;
};

export const __resetDb = () => {
  activeDb = db;
};

export const getAllClasses = () => {
  return activeDb("classes").select("*");
};

export const getClassById = (id) => {
  return activeDb("classes").where({ id }).first();
};

export const createClass = (data) => {
  if (!data?.tingkat || !data?.jurusan) {
    throw new Error("tingkat dan jurusan wajib diisi");
  }

  return activeDb.transaction(async (trx) => {
    const nama = await generateNextClassName(trx, data.tingkat, data.jurusan);

    const payload = {
      nama,
      tingkat: data.tingkat,
      jurusan: data.jurusan,
      walikelasId: sanitizeWalikelasId(data.walikelasId) ?? null,
    };

    const [classId] = await trx("classes").insert(payload);
    const getClasses = await trx("classes").where({ id: classId }).first();

    return getClasses;
  });
};

export const updateClass = (id, data) => {
  return activeDb.transaction(async (trx) => {
    const existing = await trx("classes").where({ id }).first();

    if (!existing) {
      throw new Error("Kelas tidak ditemukan");
    }

    const nextTingkat = data.tingkat ?? existing.tingkat;
    const nextJurusan = data.jurusan ?? existing.jurusan;
    let nextNama = existing.nama;

    if (existing.tingkat !== nextTingkat || existing.jurusan !== nextJurusan) {
      nextNama = await generateNextClassName(trx, nextTingkat, nextJurusan);
    }

    const updatePayload = {
      nama: nextNama,
      tingkat: nextTingkat,
      jurusan: nextJurusan,
    };

    if (Object.prototype.hasOwnProperty.call(data, "walikelasId")) {
      updatePayload.walikelasId = sanitizeWalikelasId(data.walikelasId);
    }

    await trx("classes").where({ id }).update(updatePayload);

    return trx("classes").where({ id }).first();
  });
};

export const deleteClass = (id) => {
  return activeDb("classes").where({ id }).del();
};

export const __testHelpers = {
  extractTrailingNumber,
  buildClassName,
};
