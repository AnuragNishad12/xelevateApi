const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const { readFile, writeFile } = require("../utils/fileUtils");

const TEAM_MEMBERS_FILE_PATH = path.join(__dirname, "../database/teamMembers.json");

const getTeamMembers = async (req, res, next) => {
  const { id } = req.params;

  try {
    let data = await readFile(TEAM_MEMBERS_FILE_PATH);

    if (!data) {
      return res.status(404).json({ error: "No team members found" });
    }

    if (id) {
      const teamMember = data.find((member) => member.id === id);
      if (!teamMember) {
        return res.status(404).json({ error: "Team member not found" });
      }
      return res.status(200).json(teamMember);
    }

    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const addTeamMember = async (req, res, next) => {
  try {
    const newTeamMember = { 
      ...req.body, 
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };

    const data = await readFile(TEAM_MEMBERS_FILE_PATH) || [];

    data.push(newTeamMember);
    await writeFile(TEAM_MEMBERS_FILE_PATH, data);

    return res.status(201).json(newTeamMember);
  } catch (error) {
    next(error);
  }
};

const updateTeamMember = async (req, res, next) => {
  const { id } = req.params;
  const updatedTeamMember = req.body;

  try {
    let data = await readFile(TEAM_MEMBERS_FILE_PATH);

    if (!data) {
      return res.status(404).json({ error: "Team members file not found" });
    }

    const teamMemberIndex = data.findIndex((member) => member.id === id);

    if (teamMemberIndex === -1) {
      return res.status(404).json({ error: "Team member not found" });
    }

    data[teamMemberIndex] = { 
      ...data[teamMemberIndex], 
      ...updatedTeamMember,
      updatedAt: new Date().toISOString(),
    };
    
    await writeFile(TEAM_MEMBERS_FILE_PATH, data);

    return res.status(200).json(data[teamMemberIndex]);
  } catch (error) {
    next(error);
  }
};

const deleteTeamMember = async (req, res, next) => {
  const { id } = req.params;

  try {
    let data = await readFile(TEAM_MEMBERS_FILE_PATH);

    if (!data) {
      return res.status(404).json({ error: "Team members file not found" });
    }

    const updatedData = data.filter((member) => member.id !== id);

    if (updatedData.length === data.length) {
      return res.status(404).json({ status: false, deleted: "no", error: "Team member not found" });
    }

    await writeFile(TEAM_MEMBERS_FILE_PATH, updatedData);
    
    return res.status(200).json({ status: true, deleted: "ok" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTeamMembers,
  addTeamMember,
  updateTeamMember,
  deleteTeamMember,
};