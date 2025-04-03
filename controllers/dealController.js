const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const { readFile, writeFile } = require("../utils/fileUtils");

const DEALS_FILE_PATH = path.join(__dirname, "../database/deal-of-the-day.json");

const getDeals = async (req, res, next) => {
  const { id } = req.params;
  
  try {
    let data = await readFile(DEALS_FILE_PATH);
    
    if (!data) {
      return res.status(404).json({ error: "No deals found" });
    }

    if (id) {
      const deal = data.find((deal) => deal.id === id);
      if (!deal) {
        return res.status(404).json({ error: "Deal not found" });
      }
      return res.status(200).json(deal);
    }

    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const addDeal = async (req, res, next) => {
  try {
    const newDeal = { 
      ...req.body, 
      id: uuidv4(), 
      createdAt: new Date().toISOString() 
    };
    
    const data = await readFile(DEALS_FILE_PATH) || [];
    
    data.push(newDeal);
    await writeFile(DEALS_FILE_PATH, data);
    
    return res.status(201).json(newDeal);
  } catch (error) {
    next(error);
  }
};

const updateDeal = async (req, res, next) => {
  const { id } = req.params;
  const updatedDeal = req.body;

  try {
    let data = await readFile(DEALS_FILE_PATH);
    
    if (!data) {
      return res.status(404).json({ error: "Deals file not found" });
    }
    
    const dealIndex = data.findIndex((deal) => deal.id === id);
    
    if (dealIndex === -1) {
      return res.status(404).json({ error: "Deal not found" });
    }

    data[dealIndex] = { 
      ...data[dealIndex], 
      ...updatedDeal, 
      updatedAt: new Date().toISOString() 
    };
    await writeFile(DEALS_FILE_PATH, data);
    
    return res.status(200).json(data[dealIndex]);
  } catch (error) {
    next(error);
  }
};

const deleteDeal = async (req, res, next) => {
  const { id } = req.params;
  
  try {
    let data = await readFile(DEALS_FILE_PATH);
    
    if (!data) {
      return res.status(404).json({ error: "Deals file not found" });
    }

    const updatedData = data.filter((deal) => deal.id !== id);
    
    if (updatedData.length === data.length) {
      return res.status(404).json({ status: false, deleted: "no", error: "Deal not found" });
    }
    
    await writeFile(DEALS_FILE_PATH, updatedData);
    return res.status(200).json({ status: true, deleted: "ok" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDeals,
  addDeal,
  updateDeal,
  deleteDeal
};