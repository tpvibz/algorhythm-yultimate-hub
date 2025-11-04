// controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Person from "../models/personModel.js";
import RoleRequest from "../models/roleRequestModel.js";
import CredentialPool from "../models/credentialPoolModel.js";
import PlayerProfile from "../models/playerProfileModel.js";
import CoachProfile from "../models/coachProfileModel.js";
import Notification from "../models/notificationModel.js";
import School from "../models/schoolModel.js";
import sendMail from "../utils/sendMail.js";
import { createNotification } from "./notificationController.js";

const JWT_SECRET = process.env.JWT_SECRET || "tamui_secret";

/* 🧍 PLAYER / VOLUNTEER SIGNUP (with password set by user) */
export const playerSignup = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, confirmPassword, role, age, gender, experience, affiliationType, affiliationId } = req.body;

    // Validation
    if (!firstName || !email || !phone || !password || !confirmPassword || !role) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    // Player-specific validation
    if (role === "player") {
      if (!age || !gender || !experience) {
        return res.status(400).json({ message: "Age, gender, and experience are required for players." });
      }
      if (typeof age !== "number" || age < 1 || age > 120) {
        return res.status(400).json({ message: "Please enter a valid age." });
      }
      
      // Affiliation validation for players
      if (!affiliationType || !affiliationId) {
        return res.status(400).json({ message: "Affiliation type and institution are required for players." });
      }
      if (!["school", "community"].includes(affiliationType)) {
        return res.status(400).json({ message: "Invalid affiliation type. Must be 'school' or 'community'." });
      }

      // Validate institution exists
      const institution = await School.findById(affiliationId);
      if (!institution) {
        return res.status(400).json({ message: "Selected institution not found." });
      }
      if (institution.type !== affiliationType) {
        return res.status(400).json({ message: "Institution type mismatch." });
      }
    }

    // Check if already registered
    const existingUser = await Person.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already registered!" });

    const existingRequest = await RoleRequest.findOne({ "applicantInfo.email": email, status: "pending" });
    if (existingRequest) return res.status(400).json({ message: "Signup request already pending!" });

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Prepare applicant info
    const applicantInfo = { firstName, lastName, email, phone };
    
    // Add player-specific fields if role is player
    if (role === "player") {
      applicantInfo.age = age;
      applicantInfo.gender = gender;
      applicantInfo.experience = experience;
      
      // Get institution details for affiliation
      const institution = await School.findById(affiliationId);
      applicantInfo.affiliation = {
        type: affiliationType,
        id: affiliationId,
        name: institution.name,
        location: institution.location,
      };
    }

    // Create pending request for admin approval
    const newRequest = new RoleRequest({
      applicantInfo,
      requestedRole: role,
      passwordHash,
    });
    await newRequest.save();

    // Notify all admins about the new account request
    try {
      const admins = await Person.find({ roles: { $in: ["admin"] } });
      const adminIds = admins.map(admin => admin._id);
      
      const roleLabel = role === "player" ? "Player" : role === "volunteer" ? "Volunteer" : "Coach";
      await Promise.all(adminIds.map(adminId => 
        createNotification(
          adminId,
          "account_request",
          "New Account Request",
          `${firstName} ${lastName} has applied for ${roleLabel} account.`,
          { relatedEntityId: newRequest._id, relatedEntityType: "role_request" }
        )
      ));
    } catch (notificationError) {
      console.error("Error creating notification for account request:", notificationError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      message: "Signup request submitted successfully. Wait for admin approval.",
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Signup failed", error: error.message });
  }
};

/* 🧑‍💼 ADMIN APPROVES PLAYER / VOLUNTEER */
export const approvePlayer = async (req, res) => {
  try {
    const { requestId, coachId } = req.body;

    const request = await RoleRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    let finalCoachId = coachId;

    // Auto-link coach based on affiliation if coachId not provided and player has affiliation
    if (request.requestedRole === "player" && !coachId && request.applicantInfo.affiliation) {
      const { type, id: affiliationId } = request.applicantInfo.affiliation;
      
      // Find coaches linked to the same institution
      const institution = await School.findById(affiliationId);
      if (institution && institution.coachIds.length > 0) {
        // Get coaches with matching affiliation
        const coachProfiles = await CoachProfile.find({
          "affiliation.id": affiliationId,
          "affiliation.type": type,
        }).populate("personId");

        // Prefer coaches already linked to institution
        const preferredCoaches = coachProfiles.filter((cp) =>
          institution.coachIds.some((cid) => cid.toString() === cp.personId._id.toString())
        );

        if (preferredCoaches.length > 0) {
          // Use first coach from preferred list
          finalCoachId = preferredCoaches[0].personId._id;
        } else if (coachProfiles.length > 0) {
          // Fallback to any coach with matching affiliation
          finalCoachId = coachProfiles[0].personId._id;
        }
      }
    }

    // Validate coach if role is player and coach is selected
    if (request.requestedRole === "player" && finalCoachId) {
      const coach = await Person.findById(finalCoachId);
      if (!coach || !coach.roles.includes("coach")) {
        return res.status(400).json({ message: "Invalid coach selected." });
      }
    }

    // Generate unique code
    const uniqueUserId = `${request.requestedRole.substring(0, 3).toUpperCase()}-${Date.now()}`;

    // Create user in Person
    const newPerson = new Person({
      firstName: request.applicantInfo.firstName,
      lastName: request.applicantInfo.lastName,
      email: request.applicantInfo.email,
      phone: request.applicantInfo.phone,
      uniqueUserId,
      passwordHash: request.passwordHash, // ✅ copy from request
      roles: [request.requestedRole],
    });
    await newPerson.save();

    // Create PlayerProfile if role is player
    if (request.requestedRole === "player") {
      const profileData = {
        personId: newPerson._id,
        age: request.applicantInfo.age,
        gender: request.applicantInfo.gender,
        experience: request.applicantInfo.experience,
        assignedCoachId: finalCoachId || undefined,
      };

      // Add affiliation if present
      if (request.applicantInfo.affiliation) {
        profileData.affiliation = request.applicantInfo.affiliation;
      }

      await PlayerProfile.create(profileData);

      // Add coach to institution's coachIds if not already there
      if (finalCoachId && request.applicantInfo.affiliation) {
        const institution = await School.findById(request.applicantInfo.affiliation.id);
        if (institution && !institution.coachIds.includes(finalCoachId)) {
          institution.coachIds.push(finalCoachId);
          await institution.save();
        }
      }

      // Create notification for coach if assigned
      if (finalCoachId) {
        const coach = await Person.findById(finalCoachId);
        if (coach) {
          // Create in-app notification for coach
          await createNotification(
            finalCoachId,
            "player_assigned",
            "New Player Assigned",
            `A new player ${request.applicantInfo.firstName} ${request.applicantInfo.lastName} has been assigned to you.`,
            { relatedEntityId: newPerson._id, relatedEntityType: "player" }
          );

          // Legacy email notification
          await Notification.create({
            recipient: coach.email,
            messageType: "playerAssigned",
            messageBody: `A new player ${request.applicantInfo.firstName} ${request.applicantInfo.lastName} has been assigned to you.`,
            sentAt: new Date(),
            status: "sent",
          });

          // Also send email notification
          await sendMail(
            coach.email,
            "New Player Assigned",
            `A new player has been assigned to you:\n\nPlayer Name: ${request.applicantInfo.firstName} ${request.applicantInfo.lastName}\nAge: ${request.applicantInfo.age}\nExperience: ${request.applicantInfo.experience}\nAffiliation: ${request.applicantInfo.affiliation?.name || "N/A"}\n\nPlease check your dashboard for details.`
          );
        }
      }

      // Notify the player that they've been assigned to a coach
      if (finalCoachId) {
        const coach = await Person.findById(finalCoachId);
        if (coach) {
          await createNotification(
            newPerson._id,
            "coach_assigned",
            "Coach Assigned",
            `You have been assigned to Coach ${coach.firstName} ${coach.lastName}.`,
            { relatedEntityId: finalCoachId, relatedEntityType: "coach" }
          );
        }
      }
    }

    // Update request
    request.status = "approved";
    request.reviewedAt = new Date();
    await request.save();

    // Notify the user that their account has been approved
    try {
      await createNotification(
        newPerson._id,
        "account_approved",
        "Account Approved",
        `Your ${request.requestedRole} account has been approved! Your User ID is ${uniqueUserId}.`,
        { relatedEntityId: newPerson._id, relatedEntityType: "account" }
      );
    } catch (notificationError) {
      console.error("Error creating notification for account approval:", notificationError);
    }

    // Save credentials (only ID)
    await CredentialPool.create({
      personId: newPerson._id,
      uniqueUserId,
      sentVia: "email",
    });

    // Send only unique ID in mail
    await sendMail(
      newPerson.email,
      "TAMUI Account Approved",
      `Your account has been approved!\nUser ID: ${uniqueUserId}\nUse your password created during registration to log in.`
    );

    res.status(200).json({ message: "Account approved & Unique ID sent to user." });
  } catch (error) {
    console.error("Approval error:", error);
    res.status(500).json({ message: "Approval failed", error: error.message });
  }
};

/* 🧑‍💻 LOGIN (Admin, Player, Coach, Volunteer) */
export const loginUser = async (req, res) => {
  try {
    const { uniqueUserId, password, role } = req.body;

    if (!uniqueUserId) return res.status(400).json({ message: "User ID is required." });

    const person = await Person.findOne({ uniqueUserId });
    if (!person) return res.status(404).json({ message: "Account not found!" });

    // 🔹 ADMIN LOGIN
    if (role === "admin" && person.roles.includes("admin")) {
      if (uniqueUserId !== "admin123") return res.status(401).json({ message: "Invalid Admin Code!" });

      const token = jwt.sign({ userId: person._id, role: person.roles }, JWT_SECRET, { expiresIn: "7d" });
      return res.status(200).json({
        message: "Admin login successful!",
        user: {
          id: person._id,
          name: `${person.firstName} ${person.lastName}`,
          role: person.roles,
          uniqueUserId: person.uniqueUserId,
        },
        token,
      });
    }

    // 🔹 COACH LOGIN (has credentials created directly by admin)
    if (role === "coach") {
      if (!password) return res.status(400).json({ message: "Password is required for coach login." });

      const isMatch = await bcrypt.compare(password, person.passwordHash);
      if (!isMatch) return res.status(401).json({ message: "Invalid credentials!" });

      const token = jwt.sign({ userId: person._id, role: person.roles }, JWT_SECRET, { expiresIn: "7d" });

      return res.status(200).json({
        message: "Coach login successful!",
        user: {
          id: person._id,
          name: `${person.firstName} ${person.lastName}`,
          role: person.roles,
          uniqueUserId: person.uniqueUserId,
        },
        token,
      });
    }

    // 🔹 PLAYER / VOLUNTEER LOGIN
    if (!password) return res.status(400).json({ message: "Password is required for login." });
    if (!person.passwordHash) return res.status(400).json({ message: "Password not set for this account." });

    const isMatch = await bcrypt.compare(password, person.passwordHash);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials!" });

    const token = jwt.sign({ userId: person._id, role: person.roles }, JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({
      message: "Login successful!",
      user: {
        id: person._id,
        name: `${person.firstName} ${person.lastName}`,
        role: person.roles,
        uniqueUserId: person.uniqueUserId,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

/* 📋 GET PENDING REQUESTS */
export const getPendingRequests = async (req, res) => {
  try {
    const pending = await RoleRequest.find({ status: "pending" }).sort({ createdAt: -1 });
    res.status(200).json(pending);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch pending requests", error: error.message });
  }
};

/* ❌ REJECT REQUEST */
export const rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const request = await RoleRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    request.status = "rejected";
    request.reviewedAt = new Date();
    await request.save();

    // Notify the user if they have an account (in case they registered before rejection)
    try {
      const person = await Person.findOne({ email: request.applicantInfo.email });
      if (person) {
        await createNotification(
          person._id,
          "account_rejected",
          "Account Request Rejected",
          `Your ${request.requestedRole} account request has been rejected. Please contact admin for more information.`,
          { relatedEntityId: request._id, relatedEntityType: "role_request" }
        );
      }
    } catch (notificationError) {
      console.error("Error creating notification for account rejection:", notificationError);
    }

    res.status(200).json({ message: "Request rejected successfully." });
  } catch (error) {
    res.status(500).json({ message: "Rejection failed", error: error.message });
  }
};

/* 👨‍🏫 GET ACTIVE COACHES */
export const getActiveCoaches = async (req, res) => {
  try {
    const coaches = await Person.find({
      roles: { $in: ["coach"] },
      accountStatus: "active"
    }).select("firstName lastName email uniqueUserId _id");

    res.status(200).json(coaches);
  } catch (error) {
    console.error("Get coaches error:", error);
    res.status(500).json({ message: "Failed to fetch coaches", error: error.message });
  }
};
