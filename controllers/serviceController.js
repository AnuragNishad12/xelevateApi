const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const { readFile, writeFile } = require("../utils/fileUtils");

const SERVICES_FILE_PATH = path.join(__dirname, "../database/our-services.json");

const getServices = async (req, res, next) => {
  const { id } = req.params;

  try {
    let data = await readFile(SERVICES_FILE_PATH);

    if (!data) {
      return res.status(404).json({ error: "No services found" });
    }

    if (id) {
      const service = data.find((service) => service.id === id);
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      return res.status(200).json(service);
    }

    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const addService = async (req, res, next) => {
  try {
    const newService = { ...req.body, id: uuidv4(), createdAt: new Date().toISOString() };
    const data = await readFile(SERVICES_FILE_PATH) || [];

    data.push(newService);
    await writeFile(SERVICES_FILE_PATH, data);

    return res.status(201).json(newService);
  } catch (error) {
    next(error);
  }
};

const updateService = async (req, res, next) => {
  const { id } = req.params;
  const updatedService = req.body;

  try {
    let data = await readFile(SERVICES_FILE_PATH);

    if (!data) {
      return res.status(404).json({ error: "Services file not found" });
    }

    const serviceIndex = data.findIndex((service) => service.id === id);

    if (serviceIndex === -1) {
      return res.status(404).json({ error: "Service not found" });
    }

    data[serviceIndex] = { ...data[serviceIndex], ...updatedService, updatedAt: new Date().toISOString() };
    await writeFile(SERVICES_FILE_PATH, data);

    return res.status(200).json(data[serviceIndex]);
  } catch (error) {
    next(error);
  }
};

const deleteService = async (req, res, next) => {
  const { id } = req.params;

  try {
    let data = await readFile(SERVICES_FILE_PATH);

    if (!data) {
      return res.status(404).json({ error: "Services file not found" });
    }

    const updatedData = data.filter((service) => service.id !== id);

    if (updatedData.length === data.length) {
      return res.status(404).json({ status: true, deleted: "no", error: "Service not found" });
    }

    await writeFile(SERVICES_FILE_PATH, updatedData);
    return res.status(200).json({ status: true, deleted: "ok" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getServices,
  addService,
  updateService,
  deleteService
};