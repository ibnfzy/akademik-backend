import { test, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import db from "../src/config/db.js";
import * as StudentModel from "../src/models/students.js";

afterEach(() => {
  mock.restoreAll();
});

test("insertStudent menyertakan nis ketika diberikan di payload utama", async () => {
  const fakeUser = { id: 42, username: "siswa", email: "siswa@example.com" };
  let capturedStudentPayload = null;

  mock.method(db, "transaction", async (handler) => {
    const trx = (table) => {
      if (table === "users") {
        return {
          insert: async (payload) => {
            return [fakeUser.id];
          },
          where: () => ({
            first: async () => fakeUser,
          }),
        };
      }

      if (table === "students") {
        return {
          insert: async (payload) => {
            capturedStudentPayload = payload;
            return [7];
          },
          where: () => ({
            first: async () => ({
              id: 7,
              userId: fakeUser.id,
              ...capturedStudentPayload,
            }),
          }),
        };
      }

      throw new Error(`Unexpected table access: ${table}`);
    };

    return handler(trx);
  });

  const result = await StudentModel.insertStudent({
    users: { username: "siswa", password: "rahasia" },
    students: { nama: "Siswa A", kelasId: 3 },
    nis: "99887766",
  });

  assert.equal(capturedStudentPayload.nis, "99887766");
  assert.equal(result.nis, "99887766");
});

test("updateStudent menyertakan nis ketika diberikan di payload utama", async () => {
  let updatedStudentPayload = null;

  mock.method(db, "transaction", async (handler) => {
    const trx = (table) => {
      if (table === "students") {
        return {
          where: () => ({
            update: async (payload) => {
              updatedStudentPayload = payload;
            },
            first: async () => ({
              id: 9,
              userId: 11,
              ...updatedStudentPayload,
            }),
          }),
        };
      }

      if (table === "users") {
        return {
          where: () => ({
            update: async () => {},
          }),
        };
      }

      throw new Error(`Unexpected table access: ${table}`);
    };

    return handler(trx);
  });

  const result = await StudentModel.updateStudent(11, {
    students: { nama: "Siswa A" },
    nis: "11223344",
  });

  assert.equal(updatedStudentPayload.nis, "11223344");
  assert.equal(result.nis, "11223344");
});
