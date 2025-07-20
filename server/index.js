require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./middleware/db");

const app = express();
connectDB();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/hospitals", require("./routes/hospitalRoutes"));
app.use("/api/doctors", require("./routes/doctorRoutes"));
app.use("/api/patients", require("./routes/patientRoutes"));
app.use("/api/consents", require("./routes/consentRoutes"));
app.use("/api/ledger", require("./routes/ledgerRoutes"));
app.use("/api/patient-history", require("./routes/patientHistoryRoutes"));

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`)); 