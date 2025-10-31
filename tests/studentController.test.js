import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  getRaport,
  __setStudentControllerDependencies,
  __resetStudentControllerDependencies,
} from "../src/controllers/studentController.js";

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
  __resetStudentControllerDependencies();
});

test("getRaport menyertakan nis pada response siswa", async () => {
  const raportPayload = {
    student: {
      id: 1,
      nis: "22334455",
      nisn: "88990011",
      nama: "Siswa Contoh",
      kelasId: 3,
      kelasName: "X IPA 1",
      jenisKelamin: "L",
      tanggalLahir: "2007-01-01",
      alamat: "Jalan Mawar",
      nomorHP: "08123456789",
      namaOrangTua: "Orang Tua",
      pekerjaanOrangTua: "Karyawan",
      tahunMasuk: "2022",
    },
    grades: [],
    attendance: [],
    semesterId: null,
    tahunAjaran: null,
    semester: null,
    semesterInfo: null,
    walikelas: null,
    profileSchool: {},
  };

  __setStudentControllerDependencies({
    getRaportById: async (studentId) => {
      assert.equal(studentId, "1");
      return raportPayload;
    },
  });

  const req = { params: { id: "1" }, query: {} };
  const res = createMockResponse();

  await getRaport(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.student.nis, "22334455");
});
