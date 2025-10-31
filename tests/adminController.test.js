import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  createClass,
  updateClass,
  __setClassDependencies,
  __resetClassDependencies,
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
