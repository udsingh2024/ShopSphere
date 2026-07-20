const Category = require('../models/Category');
const logger = require('../utils/logger');
const CacheService = require('../services/cache.service');

const slugifyText = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

const getCategories = async (req, res, next) => {
  try {
    const cacheKey = 'categories:all';
    const cachedCategories = await CacheService.get(cacheKey);
    if (cachedCategories) {
      return res.json({
        success: true,
        categories: cachedCategories,
      });
    }

    const categories = await Category.find().populate('parentCategory', 'name slug').lean();
    await CacheService.set(cacheKey, categories, 3600); // Cache for 1 hour

    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, parentCategory } = req.body;
    const slug = slugifyText(name);

    const exists = await Category.findOne({ slug });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists',
      });
    }

    const category = await Category.create({
      name,
      slug,
      parentCategory: parentCategory || null,
    });

    logger.info(`Category created: ${category.name}`);
    await CacheService.del('categories:all');

    res.status(201).json({
      success: true,
      category,
    });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, parentCategory } = req.body;
    
    const updateObj = {};
    if (name) {
      updateObj.name = name;
      updateObj.slug = slugifyText(name);
    }
    if (parentCategory !== undefined) {
      updateObj.parentCategory = parentCategory || null;
    }

    const updated = await Category.findByIdAndUpdate(id, updateObj, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    logger.info(`Category updated: ${updated.name}`);
    await CacheService.del('categories:all');

    res.json({
      success: true,
      category: updated,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }
    logger.info(`Category deleted: ${deleted.name}`);
    await CacheService.del('categories:all');
    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
