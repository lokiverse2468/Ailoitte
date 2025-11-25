const { Product, Category } = require('../models');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinaryUpload');

const createProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, description, price, stock, categoryId } = req.body;
    let imageUrl = null;

    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer);
        imageUrl = result.secure_url;
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image',
          error: uploadError.message
        });
      }
    }

    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
    }

    const product = await Product.create({
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock),
      categoryId: categoryId ? parseInt(categoryId) : null,
      imageUrl
    });

    const productWithCategory = await Product.findByPk(product.id, {
      include: [{
        association: 'category',
        attributes: ['id', 'name']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product: productWithCategory }
    });
  } catch (error) {
    next(error);
  }
};

const getAllProducts = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      minPrice,
      maxPrice,
      categoryId,
      search,
      page = 1,
      limit = 10
    } = req.query;

    const where = {};
    const include = [{
      association: 'category',
      attributes: ['id', 'name']
    }];

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) {
        where.price[Op.gte] = parseFloat(minPrice);
      }
      if (maxPrice) {
        where.price[Op.lte] = parseFloat(maxPrice);
      }
    }

    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    }

    if (search) {
      where.name = {
        [Op.iLike]: `%${search}%`
      };
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Product.findAndCountAll({
      where,
      include,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit))
      },
      data: { products: rows }
    });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      include: [{
        association: 'category',
        attributes: ['id', 'name', 'description']
      }]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { name, description, price, stock, categoryId } = req.body;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
    }

    let imageUrl = product.imageUrl;
    if (req.file) {
      try {
        if (product.imageUrl) {
          await deleteFromCloudinary(product.imageUrl).catch(() => {});
        }

        const result = await uploadToCloudinary(req.file.buffer);
        imageUrl = result.secure_url;
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image',
          error: uploadError.message
        });
      }
    }

    await product.update({
      name: name || product.name,
      description: description !== undefined ? description : product.description,
      price: price !== undefined ? parseFloat(price) : product.price,
      stock: stock !== undefined ? parseInt(stock) : product.stock,
      categoryId: categoryId !== undefined ? (categoryId ? parseInt(categoryId) : null) : product.categoryId,
      imageUrl
    });

    const updatedProduct = await Product.findByPk(product.id, {
      include: [{
        association: 'category',
        attributes: ['id', 'name']
      }]
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: { product: updatedProduct }
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.imageUrl) {
      try {
        await deleteFromCloudinary(product.imageUrl);
      } catch (deleteError) {
      }
    }

    await product.destroy();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct
};

