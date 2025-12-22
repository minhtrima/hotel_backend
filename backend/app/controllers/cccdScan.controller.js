const crypto = require("crypto");

// Store active scan sessions in memory (in production, use Redis)
const activeSessions = new Map();

// Create a new scan session
exports.createScanSession = async (req, res) => {
  try {
    // Generate unique session ID
    const sessionId = crypto.randomBytes(16).toString("hex");

    // Store session with expiration (5 minutes)
    activeSessions.set(sessionId, {
      createdAt: Date.now(),
      status: "waiting",
      data: null,
    });

    // Auto-delete after 5 minutes
    setTimeout(
      () => {
        activeSessions.delete(sessionId);
      },
      5 * 60 * 1000
    );

    res.json({
      success: true,
      sessionId,
      expiresIn: 300, // seconds
    });
  } catch (error) {
    console.error("Error creating scan session:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create scan session",
    });
  }
};

// Mobile app submits scanned CCCD data
exports.submitCCCDData = async (req, res) => {
  try {
    const { sessionId, cccdData } = req.body;

    console.log("[CCCD Submit] Received request:", { sessionId, cccdData });

    if (!sessionId || !cccdData) {
      return res.status(400).json({
        success: false,
        message: "Missing sessionId or cccdData",
      });
    }

    // Check if session exists
    const session = activeSessions.get(sessionId);
    if (!session) {
      console.log("[CCCD Submit] Session not found:", sessionId);
      return res.status(404).json({
        success: false,
        message: "Session not found or expired",
      });
    }

    console.log("[CCCD Submit] Session found:", session);

    // Update session with data
    session.status = "completed";
    session.data = cccdData;
    activeSessions.set(sessionId, session);

    // Emit socket event to web client
    const io = req.app.get("io");
    if (io) {
      const eventName = `cccd-scanned:${sessionId}`;
      console.log("[CCCD Submit] Emitting socket event:", eventName, cccdData);
      console.log("[CCCD Submit] Connected sockets:", io.engine.clientsCount);

      // Emit to all connected clients
      io.emit(eventName, {
        success: true,
        data: cccdData,
      });

      console.log("[CCCD Submit] Event emitted successfully");
    } else {
      console.error("[CCCD Submit] Socket.IO instance not found!");
    }

    res.json({
      success: true,
      message: "CCCD data submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting CCCD data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit CCCD data",
    });
  }
};

// Check session status (for polling if needed)
exports.checkSessionStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found or expired",
      });
    }

    res.json({
      success: true,
      status: session.status,
      data: session.data,
    });
  } catch (error) {
    console.error("Error checking session status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check session status",
    });
  }
};

// Parse CCCD QR code data (format: ID|LocationCode|FullName|DDMMYYYY|Gender|Address|IssueDate)
exports.parseCCCDQR = (qrData) => {
  try {
    // CCCD QR format example: "089203001978|352693404|Mã Nguyễn Minh Trí|19082003|Nam|Châu Thới, Châu Phú B|04072022"
    const parts = qrData.split("|");

    if (parts.length < 7) {
      throw new Error("Invalid CCCD QR format");
    }

    const [
      identificationNumber,
      locationCode,
      fullName,
      dateOfBirth,
      gender,
      address,
      issueDate,
    ] = parts;

    // Parse full name into lastName and firstName
    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[nameParts.length - 1];
    const lastName = nameParts.slice(0, -1).join(" ");

    // Convert date format from DDMMYYYY to YYYY-MM-DD
    let formattedDOB = "";
    if (dateOfBirth && dateOfBirth.length === 8) {
      const day = dateOfBirth.slice(0, 2);
      const month = dateOfBirth.slice(2, 4);
      const year = dateOfBirth.slice(4, 8);
      formattedDOB = `${year}-${month}-${day}`;
    }

    // Determine honorific based on gender
    const honorific = gender.toLowerCase().includes("nam") ? "Ông" : "Bà";

    return {
      identificationNumber: identificationNumber.trim(),
      firstName,
      lastName,
      dateOfBirth: formattedDOB,
      honorific,
      gender: gender.toLowerCase().includes("nam") ? "male" : "female",
      identification: "national_id",
      nationality: "Việt Nam",
    };
  } catch (error) {
    console.error("Error parsing CCCD QR:", error);
    throw error;
  }
};
