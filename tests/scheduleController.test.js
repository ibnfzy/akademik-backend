import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  createSchedule,
  updateSchedule,
  __setScheduleDependencies,
  __resetScheduleDependencies,
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
  __resetScheduleDependencies();
  __resetClassDependencies();
});

test("createSchedule menolak jadwal dengan rentang waktu tidak valid", async () => {
  const req = {
    body: {
      kelasId: 1,
      subjectId: 2,
      teacherId: 3,
      semesterId: 4,
      hari: "Senin",
      jamMulai: "10:00",
      jamSelesai: "09:00",
    },
  };

  const res = createMockResponse();

  await createSchedule(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, "jamMulai harus lebih kecil daripada jamSelesai");
});

test("createSchedule mengembalikan 404 ketika kelas tidak ditemukan", async () => {
  const req = {
    body: {
      kelasId: 10,
      subjectId: 20,
      teacherId: 30,
      semesterId: 40,
      hari: "Selasa",
      jamMulai: "09:00",
      jamSelesai: "10:00",
    },
  };

  const res = createMockResponse();

  __setClassDependencies({
    classModel: {
      getClassById: async () => null,
    },
    teacherModel: {
      getTeacherById: async () => ({ id: 30 }),
    },
  });

  __setScheduleDependencies({
    subjectModel: {
      getSubjectById: async () => ({ id: 20 }),
    },
    semesterModel: {
      getSemesterById: async () => ({ id: 40 }),
    },
    scheduleModel: {
      findConflictingSchedules: async () => [],
      createSchedule: async () => ({}),
    },
  });

  await createSchedule(req, res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.message, "Kelas tidak ditemukan");
});

test("createSchedule menyimpan jadwal baru setelah validasi sukses", async () => {
  const req = {
    body: {
      kelasId: "11",
      subjectId: "22",
      teacherId: "33",
      semesterId: "44",
      hari: "Rabu",
      jamMulai: "07:30",
      jamSelesai: "08:15",
      ruang: "Lab Komputer",
      keterangan: "Ujian",
    },
  };

  const res = createMockResponse();
  let receivedPayload = null;

  __setClassDependencies({
    classModel: {
      getClassById: async (id) => ({ id }),
    },
    teacherModel: {
      getTeacherById: async (id) => ({ id }),
    },
  });

  __setScheduleDependencies({
    subjectModel: {
      getSubjectById: async (id) => ({ id }),
    },
    semesterModel: {
      getSemesterById: async (id) => ({ id }),
    },
    scheduleModel: {
      findConflictingSchedules: async () => [],
      createSchedule: async (payload) => {
        receivedPayload = payload;
        return { id: 99, ...payload };
      },
    },
  });

  await createSchedule(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.message, "Jadwal berhasil dibuat");
  assert.deepEqual(receivedPayload, {
    kelasId: 11,
    subjectId: 22,
    teacherId: 33,
    semesterId: 44,
    hari: "Rabu",
    jamMulai: "07:30",
    jamSelesai: "08:15",
    ruang: "Lab Komputer",
    keterangan: "Ujian",
  });
});

test("createSchedule mengembalikan 409 ketika jadwal bentrok", async () => {
  const req = {
    body: {
      kelasId: 1,
      subjectId: 2,
      teacherId: 3,
      semesterId: 4,
      hari: "Kamis",
      jamMulai: "08:00",
      jamSelesai: "09:00",
    },
  };

  const res = createMockResponse();

  __setClassDependencies({
    classModel: {
      getClassById: async () => ({ id: 1 }),
    },
    teacherModel: {
      getTeacherById: async () => ({ id: 3 }),
    },
  });

  __setScheduleDependencies({
    subjectModel: {
      getSubjectById: async () => ({ id: 2 }),
    },
    semesterModel: {
      getSemesterById: async () => ({ id: 4 }),
    },
    scheduleModel: {
      findConflictingSchedules: async () => [{ id: 50 }],
      createSchedule: async () => ({})
    },
  });

  await createSchedule(req, res);

  assert.equal(res.statusCode, 409);
  assert.equal(res.body.message, "Jadwal bertabrakan dengan jadwal lain");
});

test("updateSchedule meneruskan excludeId saat pengecekan konflik", async () => {
  const req = {
    params: { id: "7" },
    body: {
      jamMulai: "10:00",
      jamSelesai: "11:00",
    },
  };

  const res = createMockResponse();
  let conflictOptions = null;
  let conflictPayload = null;
  let updatePayload = null;

  __setClassDependencies({
    classModel: {
      getClassById: async (id) => ({ id }),
    },
    teacherModel: {
      getTeacherById: async (id) => ({ id }),
    },
  });

  __setScheduleDependencies({
    subjectModel: {
      getSubjectById: async (id) => ({ id }),
    },
    semesterModel: {
      getSemesterById: async (id) => ({ id }),
    },
    scheduleModel: {
      getScheduleById: async (id) => ({
        id,
        kelasId: 1,
        subjectId: 2,
        teacherId: 3,
        semesterId: 4,
        hari: "Jumat",
        jamMulai: "09:00",
        jamSelesai: "10:00",
        ruang: null,
        keterangan: null,
      }),
      findConflictingSchedules: async (payload, options) => {
        conflictPayload = payload;
        conflictOptions = options;
        return [];
      },
      updateSchedule: async (id, payload) => {
        updatePayload = payload;
        return { id, ...payload };
      },
    },
  });

  await updateSchedule(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(conflictOptions, { excludeId: 7 });
  assert.deepEqual(conflictPayload, {
    kelasId: 1,
    teacherId: 3,
    hari: "Jumat",
    jamMulai: "10:00",
    jamSelesai: "11:00",
  });
  assert.equal(updatePayload.jamMulai, "10:00");
  assert.equal(updatePayload.jamSelesai, "11:00");
});

test("updateSchedule mengembalikan 404 ketika jadwal tidak ditemukan", async () => {
  const req = {
    params: { id: "55" },
    body: {},
  };

  const res = createMockResponse();

  __setScheduleDependencies({
    scheduleModel: {
      getScheduleById: async () => null,
    },
  });

  await updateSchedule(req, res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.message, "Jadwal tidak ditemukan");
});
