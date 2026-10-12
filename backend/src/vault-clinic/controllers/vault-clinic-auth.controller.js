import {
  loginStaff,
  changeStaffPassword,
  getStaffProfile,
} from "../services/vault-clinic-auth.service.js";

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];

    const result = await loginStaff({
      email,
      password,
      ipAddress,
      userAgent,
    });

    return res.status(200).json({
      success: true,
      message: "Authentication successful",
      data: result,
    });
  } catch (error) {
    const status = error.message.includes("locked") ? 423 : 401;
    return res.status(status).json({
      success: false,
      message: error.message || "Sign in failed",
    });
  }
}

export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];

    const result = await changeStaffPassword({
      staffId: req.vaultStaff.id,
      currentPassword,
      newPassword,
      ipAddress,
      userAgent,
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to change password",
    });
  }
}

export async function getMe(req, res) {
  try {
    const profile = await getStaffProfile(req.vaultStaff.id);
    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve profile",
    });
  }
}

export async function logout(req, res) {
  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
}
