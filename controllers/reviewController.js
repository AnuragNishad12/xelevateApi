const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const { readFile, writeFile } = require("../utils/fileUtils");

const REVIEWS_FILE_PATH = path.join(__dirname, "../database/customer-reviews.json");

const getReviews = async (req, res, next) => {
  const { id } = req.params;

  try {
    let data = await readFile(REVIEWS_FILE_PATH);

    if (!data) {
      return res.status(404).json({ error: "No reviews found" });
    }

    if (id) {
      const review = data.find((review) => review.id === id);
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }
      return res.status(200).json(review);
    }

    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const addReview = async (req, res, next) => {
  try {
    const newReview = { 
      ...req.body, 
      id: uuidv4(), 
      createdAt: new Date().toISOString() 
    };
    const data = await readFile(REVIEWS_FILE_PATH) || [];

    data.push(newReview);
    await writeFile(REVIEWS_FILE_PATH, data);

    return res.status(201).json(newReview);
  } catch (error) {
    next(error);
  }
};

const updateReview = async (req, res, next) => {
  const { id } = req.params;
  const updatedReview = req.body;

  try {
    let data = await readFile(REVIEWS_FILE_PATH);

    if (!data) {
      return res.status(404).json({ error: "Reviews file not found" });
    }

    const reviewIndex = data.findIndex((review) => review.id === id);

    if (reviewIndex === -1) {
      return res.status(404).json({ error: "Review not found" });
    }

    data[reviewIndex] = { 
      ...data[reviewIndex], 
      ...updatedReview, 
      updatedAt: new Date().toISOString() 
    };
    await writeFile(REVIEWS_FILE_PATH, data);

    return res.status(200).json(data[reviewIndex]);
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (req, res, next) => {
  const { id } = req.params;

  try {
    let data = await readFile(REVIEWS_FILE_PATH);

    if (!data) {
      return res.status(404).json({ error: "Reviews file not found" });
    }

    const updatedData = data.filter((review) => review.id !== id);

    if (updatedData.length === data.length) {
      return res.status(404).json({ status: false, deleted: "no", error: "Review not found" });
    }

    await writeFile(REVIEWS_FILE_PATH, updatedData);
    return res.status(200).json({ status: true, deleted: "ok" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReviews,
  addReview,
  updateReview,
  deleteReview
};