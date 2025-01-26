const products = require("./products");

/**
 * Returns all products
 * @returns {Array} Array of products
 */
const getAllProducts = () => {
  return products;
};

/**
 * Returns all visible products
 * @returns {Array} Array of products
 */
const getAllVisibleProducts = () => {
  return products.filter((product) => product.visible);
};

/**
 * Returns products by category
 * @param {string} type - Product type (clothing, stickers, etc)
 * @returns {Array} Filtered array of products
 */
const getProductsByType = (type) => {
  return products.filter((product) => product.visible && product.type === type);
};

/**
 * Returns a specific product by ID
 * @param {string} id - Product ID
 * @returns {Object|null} Product object or null if not found
 */
const getProductById = (id) => {
  return products.find((product) => product.id === id && product.visible);
};

/**
 * Returns featured products
 * @returns {Array} Array of featured products
 */
const getFeaturedProducts = () => {
  return products.filter((product) => product.visible && product.featured);
};

/**
 * Returns available variants for a product
 * @param {string} productId - Product ID
 * @returns {Array} Array of available variants
 */
const getAvailableVariants = (productId) => {
  const product = getProductById(productId);
  if (!product) return [];
  return product.variants.filter((variant) => variant.available);
};

/**
 * Checks if a product variant is available
 * @param {string} productId - Product ID
 * @param {string} size - Desired size
 * @returns {boolean} Availability status
 */
const checkVariantAvailability = (productId, size) => {
  const product = getProductById(productId);
  if (!product) return false;

  const variant = product.variants.find((v) => v.size === size);
  if (!variant) return false;

  return variant.available;
};

/**
 * Returns delivery information for a product
 * @param {string} productId - Product ID
 * @returns {Object|null} Delivery information
 */
const getDeliveryInfo = (productId) => {
  const product = getProductById(productId);
  if (!product) return null;

  if (product.stockType === "onDemand") {
    return {
      type: "onDemand",
      estimatedDelivery: product.orderInfo.estimatedDelivery,
      orderDeadline: product.orderInfo.orderDeadline,
    };
  }

  return {
    type: "immediate",
    estimatedDelivery: "1-5 business days",
  };
};

/**
 * Validates if an order can be placed with the specified quantity
 * @param {string} productId - Product ID
 * @param {string} size - Desired size
 * @param {number} quantity - Desired quantity
 * @returns {boolean} True if order is possible
 * @throws {Error} If order cannot be fulfilled
 */
const checkOrderPossibility = (productId, size, quantity) => {
  const product = getProductById(productId);

  if (!product) {
    throw new Error("Product not found");
  }

  const variant = product.variants.find((v) => v.size === size);
  if (!variant) {
    throw new Error("Variant not found");
  }

  if (!variant.available) {
    throw new Error("Variant not available");
  }

  // Check stock type
  if (product.stockType === "limited") {
    // For limited stock, check available quantity
    if (variant.stockQuantity < quantity) {
      throw new Error("Insufficient stock quantity");
    }
  } else if (product.stockType === "onDemand") {
    // For on-demand products, check deadline
    const orderDeadline = new Date(product.orderInfo.orderDeadline);
    if (orderDeadline < new Date()) {
      throw new Error("Order deadline has passed");
    }

    // Check minimum quantity
    if (quantity < product.orderInfo.minOrderQuantity) {
      throw new Error(
        `Minimum order quantity is ${product.orderInfo.minOrderQuantity}`
      );
    }
  }

  return true;
};

/**
 * Updates product stock (only for limited stock products)
 * @param {string} productId - Product ID
 * @param {string} size - Size
 * @param {number} quantity - Quantity to reduce
 * @returns {number} Updated stock quantity
 * @throws {Error} If update fails
 */
const updateStock = (productId, size, quantity) => {
  const product = products.find((p) => p.id === productId);
  if (!product || product.stockType !== "limited") {
    throw new Error("Product not found or does not have limited stock");
  }

  const variant = product.variants.find((v) => v.size === size);
  if (!variant) {
    throw new Error("Variant not found");
  }

  if (variant.stockQuantity < quantity) {
    throw new Error("Insufficient stock");
  }

  variant.stockQuantity -= quantity;
  variant.available = variant.stockQuantity > 0;

  // Here you would typically update the database
  products.save();

  return variant.stockQuantity;
};

module.exports = {
  getAllProducts,
  getAllVisibleProducts,
  getProductsByType,
  getProductById,
  getFeaturedProducts,
  getAvailableVariants,
  checkVariantAvailability,
  checkOrderPossibility,
  updateStock,
  getDeliveryInfo,
};
