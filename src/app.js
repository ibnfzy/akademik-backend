import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { errorHandler, notFound } from "./middlewares/error.js";

import authRoutes from "./routes/auth.js";
import siswaRoutes from "./routes/student.js";
import adminRoutes from "./routes/admin.js";
import guruRoutes from "./routes/guru.js";
import walikelasRoutes from "./routes/walikelas.js";
import {
  getSchoolProfile,
  getAchievements,
  getPrograms,
  getUsersOnly,
} from "./controllers/adminController.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/siswa", siswaRoutes);
app.use("/admin", adminRoutes);
app.use("/guru", guruRoutes);
app.use("/walikelas", walikelasRoutes);

app.get("/school-profile", getSchoolProfile);
app.get("/achievements", getAchievements);
app.get("/programs", getPrograms);
app.get("/users", getUsersOnly);

app.get("/", (req, res) => res.send("SIA SMA Negeri 1 Nosu API Ready 🚀"));

// jika route tidak ditemukan
app.use(notFound);

// error handler global
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
