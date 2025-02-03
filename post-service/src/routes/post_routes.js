const express = require("express");
const {
  createPost,
  getAllPosts,
  getPost,
  deletePost,
} = require("../controllers/post_controller");
const { authenticateRequest } = require("../middleware/authMiddleware");

const router = express();

router.use(authenticateRequest);

router.post("/", createPost);
router.get("/all", getAllPosts);
router.get("/:id", getPost);
router.delete("/:id", deletePost);

module.exports = router;
