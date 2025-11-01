import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  createClass,
  updateClass,
  getTeacherSubjectClasses,
  __setClassDependencies,
  __resetClassDependencies,
  __setScheduleDependencies,
  __resetScheduleDependencies,
} from "../src/controllers/adminController.js";

const createMockResponse = () => {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
};

afterEach(() => {
  __resetClassDependencies();
  __resetScheduleDependencies();
});

test("createClass menyimpan walikelasId berdasarkan teacherId", async () => {
  const req = {
    body: {
      tingkat: "10",
      jurusan: "IPA",
      walikelasId: 5,
    },
  };
  const res = createMockResponse();

  let receivedPayload = null;

  __setClassDependencies({
    teacherModel: {
      getTeacherById: async (id) => {
        assert.equal(id, 5);
        return { id, nama: "Guru" };
      },
    },
    classModel: {
      createClass: async (payload) => {
        receivedPayload = payload;
        return { id: 1, ...payload };
      },
    },
  });

  await createClass(req, res);

  assert.deepEqual(receivedPayload, {
    tingkat: "10",
    jurusan: "IPA",
    walikelasId: 5,
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.message, "Kelas berhasil dibuat");
});

test("createClass mengembalikan 404 ketika teacherId tidak ditemukan", async () => {
  const req = {
    body: {
      tingkat: "10",
      jurusan: "IPA",
      walikelasId: 99,
    },
  };
  const res = createMockResponse();

  let createClassDipanggil = false;

  __setClassDependencies({
    teacherModel: {
      getTeacherById: async () => null,
    },
    classModel: {
      createClass: async () => {
        createClassDipanggil = true;
        return {};
      },
    },
  });

  await createClass(req, res);

  assert.equal(res.statusCode, 404);
  assert.equal(
    res.body.message,
    "Guru dengan teacherId tersebut tidak ditemukan"
  );
  assert.equal(createClassDipanggil, false);
});

test("updateClass memperbarui walikelasId menggunakan teacherId", async () => {
  const req = {
    params: { id: "12" },
    body: {
      tingkat: "10",
      jurusan: "IPA",
      walikelasId: 8,
    },
  };
  const res = createMockResponse();

  let receivedPayload = null;
  let receivedId = null;

  __setClassDependencies({
    teacherModel: {
      getTeacherById: async (id) => {
        assert.equal(id, 8);
        return { id, nama: "Guru" };
      },
    },
    classModel: {
      updateClass: async (id, payload) => {
        receivedId = id;
        receivedPayload = payload;
        return { id: Number(id), ...payload };
      },
    },
  });

  await updateClass(req, res);

  assert.equal(receivedId, "12");
  assert.deepEqual(receivedPayload, {
    tingkat: "10",
    jurusan: "IPA",
    walikelasId: 8,
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.message, "Kelas berhasil diperbarui");
});

test("getTeacherSubjectClasses mengembalikan data relasi dengan filter", async () => {
  const req = {
    query: {
      teacherId: "3",
      subjectId: "4",
      kelasId: "5",
    },
  };
  const res = createMockResponse();

  const stubRelations = [
    {
      id: 10,
      teacherId: 3,
      subjectId: 4,
      kelasId: 5,
      teacherName: "Guru A",
      subjectName: "Matematika",
      className: "X IPA 1",
      walikelasId: 11,
      walikelasName: "Guru B",
    },
  ];

  let receivedFilters = null;

  __setScheduleDependencies({
    teacherSubjectHelper: {
      getTeacherSubjectClassRelations: async (filters) => {
        receivedFilters = filters;
        return stubRelations;
      },
    },
  });

  await getTeacherSubjectClasses(req, res);

  assert.deepEqual(receivedFilters, { teacherId: 3, subjectId: 4, kelasId: 5 });
  assert.equal(res.statusCode, 200);
  assert.equal(
    res.body.message,
    "Relasi guru, mata pelajaran, dan kelas berhasil diambil"
  );
  assert.deepEqual(res.body.data.relations, stubRelations);
  assert.equal(res.body.data.success, true);
});

test("getTeacherSubjectClasses meneruskan error dari model", async () => {
  const req = { query: {} };
  const res = createMockResponse();

  __setScheduleDependencies({
    teacherSubjectHelper: {
      getTeacherSubjectClassRelations: async () => {
        throw new Error("Database error");
      },
    },
  });

  await getTeacherSubjectClasses(req, res);

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, "Database error");
});
