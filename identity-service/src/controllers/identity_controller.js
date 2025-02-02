const logger = require("../utils/logger");

const { validateRegistration, validateLogin } = require("../utils/validation");

const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const RefreshToken = require("../models/RefreshToken");

// user registration
const registerUser = async (req, res) => {
  logger.info("Registration request received");

  try {
    const { error } = validateRegistration(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { username, email, password } = req.body;

    let user = await User.findOne({ $or: [{ email }, { username }] });

    if (user) {
      logger.warn("User already exists", { email, username });
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    user = new User({ username, email, password });
    await user.save();

    const { accessToken, refreshToken } = await generateToken(user);

    logger.info("Registration successful", user._id);
    return res.status(201).json({
      success: true,
      message: "Registration successful",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("Registration failed", error);
    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

// user login
const loginUser = async (req, res) => {
  logger.info("Login request received");

  try {
    const { error } = validateLogin(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      logger.warn("User not found", email);
      return res.status(400).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      logger.warn("Invalid password", email);
      return res.status(400).json({
        success: false,
        message: "Invalid Credentials",
      });
    }
    const { accessToken, refreshToken } = await generateToken(user);

    logger.info("Login successful", user._id);
    res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      refreshToken,
      userId: user._id,
    });
  } catch (error) {
    logger.error("Login failed", error);
    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

// refresh token
const refreshTokenUser = async (req, res) => {
  logger.info("Refresh token request received");

  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Refresh token not provided");
      return res.status(400).json({
        success: false,
        message: "Refresh token not provided",
      });
    }

    const storedToken = await RefreshToken.findOne({ refreshToken });
    if (!storedToken || storedToken.expiresAt < new Date()) {
      logger.warn("Invalid or expired refresh token");
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    const user = await User.findById(storedToken.user);
    if (!user) {
      logger.warn("User not found");
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await generateToken(user);

    await RefreshToken.deleteOne({ _id: storedToken._id });
    logger.info("Token refreshed", user._id);
    return res.status(200).json({
      success: true,
      message: "Token refreshed",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.error("Token refresh failed", error);
    return res.status(500).json({
      success: false,
      message: "Token refresh failed",
    });
  }
};

// logout
const logoutUser = async (req, res) => {
  logger.info("Logout request received");

  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Refresh token not provided");
      return res.status(400).json({
        success: false,
        message: "Refresh token not provided",
      });
    }

    await RefreshToken.deleteOne({ token: refreshToken });
    logger.info("Refresh token deleted for logout successful");
    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    logger.error("Logout failed", error);
    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

module.exports = { registerUser, loginUser, refreshTokenUser, logoutUser };
