import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  createSchedule,
  updateSchedule,
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
  __resetScheduleDependencies();
});

test("createSchedule menolak jadwal dengan rentang waktu tidak valid", async () => {
  const req = {
    body: {
      teacherSubjectId: 5,
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

test(
  "createSchedule mengembalikan 404 ketika teacherSubjectId tidak ditemukan",
  async () => {
    const req = {
      body: {
        teacherSubjectId: 10,
        semesterId: 40,
        hari: "Selasa",
        jamMulai: "09:00",
        jamSelesai: "10:00",
      },
    };

    const res = createMockResponse();

    __setScheduleDependencies({
      semesterModel: {
        getSemesterById: async () => ({ id: 40 }),
      },
      teacherSubjectHelper: {
        getTeacherSubjectsMap: async () => ({}),
      },
      scheduleModel: {
        findConflictingSchedules: async () => [],
        createSchedule: async () => ({}),
      },
    });

    await createSchedule(req, res);

    assert.equal(res.statusCode, 404);
    assert.equal(
      res.body.message,
      "Relasi guru dan mata pelajaran tidak ditemukan"
    );
  }
);

test("createSchedule menyimpan jadwal baru setelah validasi sukses", async () => {
  const req = {
    body: {
      teacherSubjectId: "55",
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
  let conflictPayload = null;

  __setScheduleDependencies({
    semesterModel: {
      getSemesterById: async (id) => ({ id }),
    },
    teacherSubjectHelper: {
      getTeacherSubjectsMap: async () => ({
        55: { id: 55, kelasId: 11, subjectId: 22, teacherId: 33 },
      }),
    },
    scheduleModel: {
      findConflictingSchedules: async (payload) => {
        conflictPayload = payload;
        return [];
      },
      createSchedule: async (payload) => {
        receivedPayload = payload;
        return { id: 99, ...payload };
      },
    },
  });

  await createSchedule(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.message, "Jadwal berhasil dibuat");
  assert.deepEqual(conflictPayload, {
    teacherSubjectId: 55,
    kelasId: 11,
    teacherId: 33,
    hari: "Rabu",
    jamMulai: "07:30",
    jamSelesai: "08:15",
  });
  assert.deepEqual(receivedPayload, {
    teacherSubjectId: 55,
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
      teacherSubjectId: 5,
      semesterId: 4,
      hari: "Kamis",
      jamMulai: "08:00",
      jamSelesai: "09:00",
    },
  };

  const res = createMockResponse();
  let conflictPayload = null;

  __setScheduleDependencies({
    semesterModel: {
      getSemesterById: async () => ({ id: 4 }),
    },
    teacherSubjectHelper: {
      getTeacherSubjectsMap: async () => ({
        5: { id: 5, kelasId: 1, subjectId: 2, teacherId: 3 },
      }),
    },
    scheduleModel: {
      findConflictingSchedules: async (payload) => {
        conflictPayload = payload;
        return [{ id: 50 }];
      },
      createSchedule: async () => ({})
    },
  });

  await createSchedule(req, res);

  assert.equal(res.statusCode, 409);
  assert.equal(res.body.message, "Jadwal bertabrakan dengan jadwal lain");
  assert.deepEqual(conflictPayload, {
    teacherSubjectId: 5,
    kelasId: 1,
    teacherId: 3,
    hari: "Kamis",
    jamMulai: "08:00",
    jamSelesai: "09:00",
  });
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

  __setScheduleDependencies({
    semesterModel: {
      getSemesterById: async (id) => ({ id }),
    },
    teacherSubjectHelper: {
      getTeacherSubjectsMap: async () => ({
        55: { id: 55, kelasId: 11, subjectId: 22, teacherId: 33 },
      }),
    },
    scheduleModel: {
      getScheduleById: async (id) => ({
        id,
        teacherSubjectId: 55,
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
    teacherSubjectId: 55,
    kelasId: 11,
    teacherId: 33,
    hari: "Jumat",
    jamMulai: "10:00",
    jamSelesai: "11:00",
  });
  assert.equal(updatePayload.jamMulai, "10:00");
  assert.equal(updatePayload.jamSelesai, "11:00");
  assert.equal(updatePayload.teacherSubjectId, 55);
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
