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
} from "../controllers/adminController.js";

import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

// Semua route admin dilindungi & hanya role admin
router.use(authenticate);

// ==========================
// User Management
// ==========================
router.get("/users", getUsers);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// ==========================
// Student Management
// ==========================
router.get("/students", getStudents);
router.post("/students", createStudent);
router.put("/students/:id", updateStudent);
router.delete("/students/:id", deleteStudent);

// ==========================
// Teacher Management
// ==========================
router.get("/teachers", getTeachers);
router.post("/teachers", createTeacher);
router.put("/teachers/:id", updateTeacher);
router.delete("/teachers/:id", deleteTeacher);

// ==========================
// Subject Management
// ==========================
router.get("/subjects", getSubjects);
router.post("/subjects", createSubject);
router.put("/subjects/:id", updateSubject);
router.delete("/subjects/:id", deleteSubject);

// ==========================
// Class Management
// ==========================
router.get("/classes", getClasses);
router.post("/classes", createClass);
router.put("/classes/:id", updateClass);
router.delete("/classes/:id", deleteClass);

// ==========================
// School Profile Management
// ==========================
router.get("/school-profile", getSchoolProfile);
router.put("/school-profile", updateSchoolProfile);

// ==========================
// Achievement Management
// ==========================
router.get("/achievements", getAchievements);
router.post("/achievements", createAchievement);
router.put("/achievements/:id", updateAchievement);
router.delete("/achievements/:id", deleteAchievement);

// ==========================
// Program Study Management
// ==========================
router.get("/programs", getPrograms);
router.post("/programs", createProgram);
router.put("/programs/:id", updateProgram);
router.delete("/programs/:id", deleteProgram);

// ==========================
// Registration Link Management
// ==========================
router.get("/registration-links", getRegistrationLinks);
router.post("/registration-links", createRegistrationLink);
router.put("/registration-links/:id", updateRegistrationLink);
router.delete("/registration-links/:id", deleteRegistrationLink);

export default router;
