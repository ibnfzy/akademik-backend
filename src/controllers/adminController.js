// controllers/adminController.js

import * as User from "../models/user.js";
import * as Class from "../models/kelas.js";
import * as Subject from "../models/subject.js";
import * as Student from "../models/students.js";
import * as Teacher from "../models/teacher.js";
import * as SchoolProfile from "../models/schoolProfile.js";
import * as Achievement from "../models/achievement.js";
import * as Program from "../models/program.js";
import * as RegistrationLink from "../models/registrationLink.js";
import * as Semester from "../models/semesters.js";
import * as Settings from "../models/settings.js";
import * as Schedule from "../models/jadwalPelajaran.js";

import { successResponse, errorResponse } from "../utils/response.js";

let activeTeacherModel = Teacher;
let activeClassModel = Class;
let activeSubjectModel = Subject;
let activeSemesterModel = Semester;
let activeScheduleModel = Schedule;

// Helper functions untuk pengujian untuk mengganti dependensi model.
export const __setClassDependencies = (overrides = {}) => {
  activeTeacherModel = overrides.teacherModel ?? Teacher;
  activeClassModel = overrides.classModel ?? Class;
};

export const __resetClassDependencies = () => {
  activeTeacherModel = Teacher;
  activeClassModel = Class;
};

export const __setScheduleDependencies = (overrides = {}) => {
  if (overrides.subjectModel) {
    activeSubjectModel = overrides.subjectModel;
  }

  if (overrides.semesterModel) {
    activeSemesterModel = overrides.semesterModel;
  }

  if (overrides.scheduleModel) {
    activeScheduleModel = overrides.scheduleModel;
  }
};

export const __resetScheduleDependencies = () => {
  activeSubjectModel = Subject;
  activeSemesterModel = Semester;
  activeScheduleModel = Schedule;
};

const parseNumericId = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const toMinutes = (timeString) => {
  if (typeof timeString !== "string") {
    return null;
  }

  const parts = timeString.split(":");
  if (parts.length < 2) {
    return null;
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
};

const buildScheduleFilters = (query = {}) => {
  const filters = {};

  const kelasId = parseNumericId(query.kelasId);
  if (kelasId !== null) filters.kelasId = kelasId;

  const teacherId = parseNumericId(query.teacherId);
  if (teacherId !== null) filters.teacherId = teacherId;

  const semesterId = parseNumericId(query.semesterId);
  if (semesterId !== null) filters.semesterId = semesterId;

  if (query.hari) {
    filters.hari = query.hari;
  }

  if (query.walikelasId !== undefined) {
    const walikelasId = parseNumericId(query.walikelasId);
    if (walikelasId !== null) {
      filters.walikelasId = walikelasId;
    }
  }

  return filters;
};

//
// USERS
//
export const getUsers = async (req, res) => {
  try {
    const users = await User.getAllUsers();
    return successResponse(res, users, "Daftar user berhasil diambil");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

export const getUsersOnly = async (req, res) => {
  try {
    const users = await User.getAllUsersStats();
    return successResponse(res, users, "Daftar user berhasil diambil");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

export const createUser = async (req, res) => {
  try {
    const userData = await User.createUser(req.body);
    return successResponse(res, userData, "User berhasil dibuat");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

export const updateUser = async (req, res) => {
  try {
    const userData = await User.updateUser(req.params.id, req.body);
    return successResponse(res, userData, "User berhasil diperbarui");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

export const deleteUser = async (req, res) => {
  try {
    await User.deleteUser(req.params.id);
    return successResponse(res, {}, "User berhasil dihapus");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

//
// STUDENTS
//
export const getStudents = async (req, res) => {
  try {
    const students = await Student.getAllStudents();
    return successResponse(res, students, "Daftar siswa berhasil diambil");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

export const createStudent = async (req, res) => {
  try {
    const newStudent = await Student.insertStudent(req.body);
    return successResponse(res, newStudent, "Siswa berhasil dibuat");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

export const updateStudent = async (req, res) => {
  try {
    const updated = await Student.updateStudent(req.params.id, req.body);
    return successResponse(res, updated, "Siswa berhasil diperbarui");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

export const deleteStudent = async (req, res) => {
  try {
    await Student.deleteStudent(req.params.id);
    return successResponse(res, {}, "Siswa berhasil dihapus");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

//
// TEACHERS
//
export const getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.getAllTeachers();
    return successResponse(res, teachers, "Daftar guru berhasil diambil");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

export const createTeacher = async (req, res) => {
  try {
    const newTeacher = await Teacher.insertTeacher(req.body);
    return successResponse(res, newTeacher, "Guru berhasil dibuat");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

export const updateTeacher = async (req, res) => {
  try {
    const updated = await Teacher.updateTeacher(req.params.id, req.body);
    return successResponse(res, updated, "Guru berhasil diperbarui");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

export const deleteTeacher = async (req, res) => {
  try {
    await Teacher.deleteTeacher(req.params.id);
    return successResponse(res, {}, "Guru berhasil dihapus");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

//
// CLASSES
//
export const getClasses = async (req, res) => {
  try {
    const classes = await Class.getAllClasses();
    return successResponse(res, classes, "Daftar kelas berhasil diambil");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

export const createClass = async (req, res) => {
  try {
    const kelasPayload = { ...req.body };

    if (Object.prototype.hasOwnProperty.call(req.body, "walikelasId")) {
      const teacherId = req.body.walikelasId;

      if (teacherId !== undefined && teacherId !== null && teacherId !== "") {
        const walikelas = await activeTeacherModel.getTeacherById(teacherId);

        if (!walikelas) {
          return errorResponse(
            res,
            404,
            "Guru dengan teacherId tersebut tidak ditemukan"
          );
        }

        kelasPayload.walikelasId = walikelas.id;
      } else {
        kelasPayload.walikelasId = null;
      }
    } else {
      kelasPayload.walikelasId = null;
    }

    const kelasData = await activeClassModel.createClass(kelasPayload);
    return successResponse(res, kelasData, "Kelas berhasil dibuat");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

export const updateClass = async (req, res) => {
  try {
    const kelasPayload = { ...req.body };

    if (Object.prototype.hasOwnProperty.call(req.body, "walikelasId")) {
      const teacherId = req.body.walikelasId;

      if (teacherId !== undefined && teacherId !== null && teacherId !== "") {
        const walikelas = await activeTeacherModel.getTeacherById(teacherId);

        if (!walikelas) {
          return errorResponse(
            res,
            404,
            "Guru dengan teacherId tersebut tidak ditemukan"
          );
        }

        kelasPayload.walikelasId = walikelas.id;
      } else {
        kelasPayload.walikelasId = null;
      }
    }

    const kelasData = await activeClassModel.updateClass(
      req.params.id,
      kelasPayload
    );
    return successResponse(res, kelasData, "Kelas berhasil diperbarui");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

export const deleteClass = async (req, res) => {
  try {
    await Class.deleteClass(req.params.id);
    return successResponse(res, {}, "Kelas berhasil dihapus");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

//
// SUBJECTS
//
export const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.getAllSubjects();
    return successResponse(
      res,
      subjects,
      "Daftar mata pelajaran berhasil diambil"
    );
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

export const createSubject = async (req, res) => {
  try {
    const subjectData = await Subject.createSubject(req.body);
    return successResponse(res, subjectData, "Mata pelajaran berhasil dibuat");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

export const updateSubject = async (req, res) => {
  try {
    const subjectData = await Subject.updateSubject(req.params.id, req.body);
    return successResponse(
      res,
      subjectData,
      "Mata pelajaran berhasil diperbarui"
    );
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

export const deleteSubject = async (req, res) => {
  try {
    await Subject.deleteSubject(req.params.id);
    return successResponse(res, {}, "Mata pelajaran berhasil dihapus");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

//
// SCHOOL PROFILE
//
export const getSchoolProfile = async (req, res) => {
  try {
    const profile = await SchoolProfile.getProfile();
    return successResponse(res, profile, "Profil sekolah berhasil diambil");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

export const updateSchoolProfile = async (req, res) => {
  try {
    const updated = await SchoolProfile.updateProfile(req.body);
    return successResponse(res, updated, "Profil sekolah berhasil diperbarui");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

//
// ACHIEVEMENTS
//
export const getAchievements = async (req, res) => {
  try {
    const achievements = await Achievement.getAllAchievements();
    return successResponse(
      res,
      achievements,
      "Daftar prestasi berhasil diambil"
    );
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

export const createAchievement = async (req, res) => {
  try {
    const achievementData = await Achievement.createAchievement(req.body);
    return successResponse(res, achievementData, "Prestasi berhasil dibuat");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

export const updateAchievement = async (req, res) => {
  try {
    const achievementData = await Achievement.updateAchievement(
      req.params.id,
      req.body
    );
    return successResponse(
      res,
      achievementData,
      "Prestasi berhasil diperbarui"
    );
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

export const deleteAchievement = async (req, res) => {
  try {
    await Achievement.deleteAchievement(req.params.id);
    return successResponse(res, {}, "Prestasi berhasil dihapus");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

//
// PROGRAMS
//
export const getPrograms = async (req, res) => {
  try {
    const programs = await Program.getAllPrograms();
    return successResponse(res, programs, "Daftar program berhasil diambil");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

export const createProgram = async (req, res) => {
  try {
    const programData = await Program.createProgram(req.body);
    return successResponse(res, programData, "Program berhasil dibuat");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

export const updateProgram = async (req, res) => {
  try {
    const programData = await Program.updateProgram(req.params.id, req.body);
    return successResponse(res, programData, "Program berhasil diperbarui");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

export const deleteProgram = async (req, res) => {
  try {
    await Program.deleteProgram(req.params.id);
    return successResponse(res, {}, "Program berhasil dihapus");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

//
// REGISTRATION LINKS
//
export const getRegistrationLinks = async (req, res) => {
  try {
    const links = await RegistrationLink.getAllLinks();
    return successResponse(
      res,
      links,
      "Daftar link registrasi berhasil diambil"
    );
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

export const createRegistrationLink = async (req, res) => {
  try {
    const linkData = await RegistrationLink.createLink(req.body);
    return successResponse(res, linkData, "Link registrasi berhasil dibuat");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

export const updateRegistrationLink = async (req, res) => {
  try {
    const linkData = await RegistrationLink.updateLink(req.params.id, req.body);
    return successResponse(
      res,
      linkData,
      "Link registrasi berhasil diperbarui"
    );
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

export const deleteRegistrationLink = async (req, res) => {
  try {
    await RegistrationLink.deleteLink(req.params.id);
    return successResponse(res, {}, "Link registrasi berhasil dihapus");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

//
// SEMESTERS
//
export const getSemesters = async (req, res) => {
  try {
    const semesters = await Semester.getAllSemesters();
    return successResponse(res, semesters, "Daftar semester berhasil diambil");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

export const createSemester = async (req, res) => {
  try {
    const semester = await Semester.createSemester(req.body);
    return successResponse(res, semester, "Semester berhasil dibuat");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

export const updateSemester = async (req, res) => {
  try {
    const semester = await Semester.updateSemester(req.params.id, req.body);
    return successResponse(res, semester, "Semester berhasil diperbarui");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

export const deleteSemester = async (req, res) => {
  try {
    await Semester.deleteSemester(req.params.id);
    return successResponse(res, {}, "Semester berhasil dihapus");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

//
// SETTINGS
//
const SEMESTER_ENFORCEMENT_SETTING_KEY = "semester_enforcement_mode";
const SEMESTER_ENFORCEMENT_VALID_MODES = ["relaxed", "strict"];

const normalizeSemesterEnforcementMode = (mode) => {
  if (!mode) return null;
  const normalized = String(mode).toLowerCase();
  return SEMESTER_ENFORCEMENT_VALID_MODES.includes(normalized)
    ? normalized
    : null;
};

export const getSemesterEnforcementSetting = async (req, res) => {
  try {
    const setting = await Settings.getSetting(SEMESTER_ENFORCEMENT_SETTING_KEY);
    const mode = normalizeSemesterEnforcementMode(setting?.value) ?? "relaxed";

    return successResponse(
      res,
      { mode },
      "Pengaturan mode semester berhasil diambil"
    );
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

export const updateSemesterEnforcementSetting = async (req, res) => {
  try {
    const mode = normalizeSemesterEnforcementMode(req.body?.mode);

    if (!mode) {
      return errorResponse(
        res,
        400,
        "Mode semester harus bernilai 'strict' atau 'relaxed'"
      );
    }

    const setting = await Settings.upsertSetting(
      SEMESTER_ENFORCEMENT_SETTING_KEY,
      mode
    );

    return successResponse(
      res,
      { mode: setting.value },
      "Pengaturan mode semester berhasil diperbarui"
    );
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

//
// SCHEDULES
//
const validateScheduleTimeRange = (jamMulai, jamSelesai) => {
  const start = toMinutes(jamMulai);
  const end = toMinutes(jamSelesai);

  if (start === null || end === null) {
    return {
      valid: false,
      message: "Format jamMulai atau jamSelesai tidak valid. Gunakan format HH:MM.",
    };
  }

  if (start >= end) {
    return {
      valid: false,
      message: "jamMulai harus lebih kecil daripada jamSelesai",
    };
  }

  return { valid: true };
};

export const getSchedules = async (req, res) => {
  try {
    const schedules = await activeScheduleModel.getSchedules(
      buildScheduleFilters(req.query)
    );
    return successResponse(res, schedules, "Daftar jadwal berhasil diambil");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

export const getScheduleDetail = async (req, res) => {
  try {
    const scheduleId = parseNumericId(req.params.id);
    if (scheduleId === null) {
      return errorResponse(res, 400, "ID jadwal tidak valid");
    }

    const schedule = await activeScheduleModel.getScheduleById(scheduleId);
    if (!schedule) {
      return errorResponse(res, 404, "Jadwal tidak ditemukan");
    }

    return successResponse(res, schedule, "Detail jadwal berhasil diambil");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

const validateScheduleReferences = async (
  { kelasId, subjectId, teacherId, semesterId },
  res
) => {
  const [kelas, subject, teacher, semester] = await Promise.all([
    activeClassModel.getClassById(kelasId),
    activeSubjectModel.getSubjectById(subjectId),
    activeTeacherModel.getTeacherById(teacherId),
    activeSemesterModel.getSemesterById(semesterId),
  ]);

  if (!kelas) {
    errorResponse(res, 404, "Kelas tidak ditemukan");
    return false;
  }

  if (!subject) {
    errorResponse(res, 404, "Mata pelajaran tidak ditemukan");
    return false;
  }

  if (!teacher) {
    errorResponse(res, 404, "Guru tidak ditemukan");
    return false;
  }

  if (!semester) {
    errorResponse(res, 404, "Semester tidak ditemukan");
    return false;
  }

  return true;
};

export const createSchedule = async (req, res) => {
  try {
    const requiredFields = [
      "kelasId",
      "subjectId",
      "teacherId",
      "semesterId",
      "hari",
      "jamMulai",
      "jamSelesai",
    ];

    const missingField = requiredFields.find(
      (field) => req.body[field] === undefined || req.body[field] === ""
    );

    if (missingField) {
      return errorResponse(
        res,
        400,
        "kelasId, subjectId, teacherId, semesterId, hari, jamMulai, dan jamSelesai wajib diisi"
      );
    }

    const kelasId = parseNumericId(req.body.kelasId);
    const subjectId = parseNumericId(req.body.subjectId);
    const teacherId = parseNumericId(req.body.teacherId);
    const semesterId = parseNumericId(req.body.semesterId);

    if (
      kelasId === null ||
      subjectId === null ||
      teacherId === null ||
      semesterId === null
    ) {
      return errorResponse(res, 400, "ID referensi harus berupa angka yang valid");
    }

    const timeValidation = validateScheduleTimeRange(
      req.body.jamMulai,
      req.body.jamSelesai
    );

    if (!timeValidation.valid) {
      return errorResponse(res, 400, timeValidation.message);
    }

    const referencesValid = await validateScheduleReferences(
      { kelasId, subjectId, teacherId, semesterId },
      res
    );

    if (!referencesValid) {
      return;
    }

    const conflicts = await activeScheduleModel.findConflictingSchedules({
      kelasId,
      teacherId,
      hari: req.body.hari,
      jamMulai: req.body.jamMulai,
      jamSelesai: req.body.jamSelesai,
    });

    if (conflicts.length > 0) {
      return errorResponse(
        res,
        409,
        "Jadwal bertabrakan dengan jadwal lain",
        conflicts
      );
    }

    const schedule = await activeScheduleModel.createSchedule({
      kelasId,
      subjectId,
      teacherId,
      semesterId,
      hari: req.body.hari,
      jamMulai: req.body.jamMulai,
      jamSelesai: req.body.jamSelesai,
      ruang: req.body.ruang ?? null,
      keterangan: req.body.keterangan ?? null,
    });

    return successResponse(res, schedule, "Jadwal berhasil dibuat");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

export const updateSchedule = async (req, res) => {
  try {
    const scheduleId = parseNumericId(req.params.id);
    if (scheduleId === null) {
      return errorResponse(res, 400, "ID jadwal tidak valid");
    }

    const existing = await activeScheduleModel.getScheduleById(scheduleId);
    if (!existing) {
      return errorResponse(res, 404, "Jadwal tidak ditemukan");
    }

    const kelasId =
      parseNumericId(req.body.kelasId) ?? parseNumericId(existing.kelasId);
    const subjectId =
      parseNumericId(req.body.subjectId) ?? parseNumericId(existing.subjectId);
    const teacherId =
      parseNumericId(req.body.teacherId) ?? parseNumericId(existing.teacherId);
    const semesterId =
      parseNumericId(req.body.semesterId) ?? parseNumericId(existing.semesterId);

    if (
      kelasId === null ||
      subjectId === null ||
      teacherId === null ||
      semesterId === null
    ) {
      return errorResponse(res, 400, "ID referensi harus berupa angka yang valid");
    }

    const hari = req.body.hari ?? existing.hari;
    const jamMulai = req.body.jamMulai ?? existing.jamMulai;
    const jamSelesai = req.body.jamSelesai ?? existing.jamSelesai;

    const timeValidation = validateScheduleTimeRange(jamMulai, jamSelesai);
    if (!timeValidation.valid) {
      return errorResponse(res, 400, timeValidation.message);
    }

    const referencesValid = await validateScheduleReferences(
      { kelasId, subjectId, teacherId, semesterId },
      res
    );

    if (!referencesValid) {
      return;
    }

    const conflicts = await activeScheduleModel.findConflictingSchedules(
      {
        kelasId,
        teacherId,
        hari,
        jamMulai,
        jamSelesai,
      },
      { excludeId: scheduleId }
    );

    if (conflicts.length > 0) {
      return errorResponse(
        res,
        409,
        "Jadwal bertabrakan dengan jadwal lain",
        conflicts
      );
    }

    const schedule = await activeScheduleModel.updateSchedule(scheduleId, {
      kelasId,
      subjectId,
      teacherId,
      semesterId,
      hari,
      jamMulai,
      jamSelesai,
      ruang: req.body.ruang ?? existing.ruang ?? null,
      keterangan: req.body.keterangan ?? existing.keterangan ?? null,
    });

    return successResponse(res, schedule, "Jadwal berhasil diperbarui");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

export const deleteSchedule = async (req, res) => {
  try {
    const scheduleId = parseNumericId(req.params.id);
    if (scheduleId === null) {
      return errorResponse(res, 400, "ID jadwal tidak valid");
    }

    const existing = await activeScheduleModel.getScheduleById(scheduleId);
    if (!existing) {
      return errorResponse(res, 404, "Jadwal tidak ditemukan");
    }

    await activeScheduleModel.deleteSchedule(scheduleId);
    return successResponse(res, {}, "Jadwal berhasil dihapus");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};
