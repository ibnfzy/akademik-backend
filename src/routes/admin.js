// routes/adminRoutes.js
import express from "express";
import {
  // User Management
  getUsers,
  createUser,
  updateUser,
  deleteUser,

  // Classes
  getClasses,
  createClass,
  updateClass,
  deleteClass,

  // Subjects
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,

  // Students
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,

  // Teachers
  getTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,

  // School Profile
  getSchoolProfile,
  updateSchoolProfile,

  // Achievements
  getAchievements,
  createAchievement,
  updateAchievement,
  deleteAchievement,

  // Programs
  getPrograms,
  createProgram,
  updateProgram,
  deleteProgram,

  // Registration Links
  getRegistrationLinks,
  createRegistrationLink,
  updateRegistrationLink,
  deleteRegistrationLink,

  // Semesters
  getSemesters,
  createSemester,
  updateSemester,
  deleteSemester,
  // Settings
  getSemesterEnforcementSetting,
  updateSemesterEnforcementSetting,
  // Schedules
  getSchedules,
  getScheduleDetail,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getTeacherSubjectClasses,
} from "../controllers/adminController.js";

import { authenticate, authorize } from "../middlewares/auth.js";

const router = express.Router();

// Semua route admin dilindungi & hanya role admin
router.use(authenticate);

// ==========================
// User Management
// ==========================
router.get(
  "/users",
  authorize("admin", "guru", "walikelas", "siswa"),
  getUsers
);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// ==========================
// Student Management
// ==========================
router.get(
  "/students",
  authorize("admin", "guru", "walikelas", "siswa"),
  getStudents
);
router.post("/students", createStudent);
router.put("/students/:id", updateStudent);
router.delete("/students/:id", deleteStudent);

// ==========================
// Teacher Management
// ==========================
router.get(
  "/teachers",
  authorize("admin", "guru", "walikelas", "siswa"),
  getTeachers
);
router.post("/teachers", createTeacher);
router.put("/teachers/:id", updateTeacher);
router.delete("/teachers/:id", deleteTeacher);

// ==========================
// Subject Management
// ==========================
router.get(
  "/subjects",
  authorize("admin", "guru", "walikelas", "siswa"),
  getSubjects
);
router.post("/subjects", createSubject);
router.put("/subjects/:id", updateSubject);
router.delete("/subjects/:id", deleteSubject);

// ==========================
// Class Management
// ==========================
router.get(
  "/classes",
  authorize("admin", "guru", "walikelas", "siswa"),
  getClasses
);
router.post("/classes", createClass);
router.put("/classes/:id", updateClass);
router.delete("/classes/:id", deleteClass);

// ==========================
// School Profile Management
// ==========================
router.get(
  "/school-profile",
  authorize("admin", "guru", "walikelas", "siswa"),
  getSchoolProfile
);
router.put("/school-profile", updateSchoolProfile);

// ==========================
// Achievement Management
// ==========================
router.get(
  "/achievements",
  authorize("admin", "guru", "walikelas", "siswa"),
  getAchievements
);
router.post("/achievements", createAchievement);
router.put("/achievements/:id", updateAchievement);
router.delete("/achievements/:id", deleteAchievement);

// ==========================
// Program Study Management
// ==========================
router.get(
  "/programs",
  authorize("admin", "guru", "walikelas", "siswa"),
  getPrograms
);
router.post("/programs", createProgram);
router.put("/programs/:id", updateProgram);
router.delete("/programs/:id", deleteProgram);

// ==========================
// Registration Link Management
// ==========================
router.get(
  "/registration-links",
  authorize("admin", "guru", "walikelas", "siswa"),
  getRegistrationLinks
);
router.post("/registration-links", createRegistrationLink);
router.put("/registration-links/:id", updateRegistrationLink);
router.delete("/registration-links/:id", deleteRegistrationLink);

// ==========================
// Semester Management
// ==========================
router.get(
  "/semesters",
  authorize("admin", "guru", "walikelas", "siswa"),
  getSemesters
);
router.post("/semesters", createSemester);
router.put("/semesters/:id", updateSemester);
router.delete("/semesters/:id", deleteSemester);

// ==========================
// Settings Management
// ==========================
router.get(
  "/settings/semester-enforcement",
  authorize("admin", "guru", "walikelas", "siswa"),
  getSemesterEnforcementSetting
);
router.put("/settings/semester-enforcement", updateSemesterEnforcementSetting);

// ==========================
// Schedule Management
// ==========================
router.get(
  "/teacher-subject-classes",
  authorize("admin", "guru", "walikelas", "siswa"),
  getTeacherSubjectClasses
);
router.get(
  "/schedules",
  authorize("admin", "guru", "walikelas", "siswa"),
  getSchedules
);
router.get(
  "/schedules/:id",
  authorize("admin", "guru", "walikelas", "siswa"),
  getScheduleDetail
);
router.post("/schedules", createSchedule);
router.put("/schedules/:id", updateSchedule);
router.delete("/schedules/:id", deleteSchedule);

export default router;
