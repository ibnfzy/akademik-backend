import db from "../config/db.js";

export const getAllClasses = () => {
  return db("classes").select("*");
};

export const getClassById = (id) => {
  return db("classes").where({ id }).first();
};

export const createClass = (data) => {
  return db.transaction(async (trx) => {
    const [classId] = await trx("classes").insert({
      nama: data.nama,
      tingkat: data.tingkat,
      jurusan: data.jurusan,
      walikelasId: data.walikelasId,
    });

    const getClasses = await trx("classes").where({ id: classId }).first();

    return getClasses;
  });
};

export const updateClass = (id, data) => {
  return db.transaction(async (trx) => {
    await trx("classes").where({ id: id }).update({
      nama: data.nama,
      tingkat: data.tingkat,
      jurusan: data.jurusan,
      walikelasId: data.walikelasId,
    });

    return db("classes").where({ id }).first();
  });
};

export const deleteClass = (id) => {
  return db("classes").where({ id }).del();
};
