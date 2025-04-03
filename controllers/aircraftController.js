const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const { readFile, writeFile } = require("../utils/fileUtils");

const AIRCRAFTS_FILE_PATH = path.join(__dirname, "../database/aircrafts.json");

const getAircrafts = async (req, res, next) => {
  const { id } = req.params;

  try {
    let data = await readFile(AIRCRAFTS_FILE_PATH);

    if (!data) {
      return res.status(404).json({ error: "No aircraft found" });
    }

    if (id) {
      const aircraft = data.find((aircraft) => aircraft.id === id);
      if (!aircraft) {
        return res.status(404).json({ error: "Aircraft not found" });
      }
      return res.status(200).json(aircraft);
    }

    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const addAircraft = async (req, res, next) => {
  try {
    const newAircraft = { 
      ...req.body, 
      id: uuidv4(),
      createdAt: new Date().toISOString() 
    };  // Automatically assign a UUID and timestamp
    const data = await readFile(AIRCRAFTS_FILE_PATH) || [];

    data.push(newAircraft);
    await writeFile(AIRCRAFTS_FILE_PATH, data);

    return res.status(201).json(newAircraft);
  } catch (error) {
    next(error);
  }
};

const updateAircraft = async (req, res, next) => {
  const { id } = req.params;
  const updatedAircraft = req.body;

  try {
    let data = await readFile(AIRCRAFTS_FILE_PATH);

    if (!data) {
      return res.status(404).json({ error: "Aircrafts file not found" });
    }

    const aircraftIndex = data.findIndex((aircraft) => aircraft.id === id);

    if (aircraftIndex === -1) {
      return res.status(404).json({ error: "Aircraft not found" });
    }

    data[aircraftIndex] = { 
      ...data[aircraftIndex], 
      ...updatedAircraft, 
      updatedAt: new Date().toISOString() 
    }; // Add updatedAt field for updated aircraft
    await writeFile(AIRCRAFTS_FILE_PATH, data);

    return res.status(200).json(data[aircraftIndex]);
  } catch (error) {
    next(error);
  }
};

const deleteAircraft = async (req, res, next) => {
  const { id } = req.params;

  try {
    let data = await readFile(AIRCRAFTS_FILE_PATH);

    if (!data) {
      return res.status(404).json({ error: "Aircrafts file not found" });
    }

    const updatedData = data.filter((aircraft) => aircraft.id !== id);

    if (updatedData.length === data.length) {
      return res.status(404).json({ status: false, deleted: "no", error: "Aircraft not found" });
    }

    await writeFile(AIRCRAFTS_FILE_PATH, updatedData);
    return res.status(200).json({ status: true, deleted: "ok" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAircrafts,
  addAircraft,
  updateAircraft,
  deleteAircraft
};