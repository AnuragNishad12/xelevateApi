const express = require("express");
const router = express.Router();
const teamMemberController = require("../controllers/teamMemberController");

router.get("/:id?", teamMemberController.getTeamMembers);
router.post("/", teamMemberController.addTeamMember);
router.patch("/:id", teamMemberController.updateTeamMember);
router.delete("/:id?", teamMemberController.deleteTeamMember);

module.exports = router;