# neiist

## 0.6.0

### Minor Changes

- Shop and Product Management
  - Added shop categories for better product organization
  - Introduced product variants (color, size) with support for images
  - Enabled creating, editing, and removing product variants and stock
  - Updated product cards to show thumbnails for all available variants
  - Improved product management with support for multiple colors and sizes per product

  Orders
  - Added "My Orders" page with filters
  - Added "Orders Management" page with status and search filters

  Cart
  - Fixed cart item counter to correctly reflect items in the cart

  Database
  - Updated Postgres init.sql to support new features

## 0.5.0

### Minor Changes

- Use FuzyFind search (fuse.js) for all the search functionality on the page.

## 0.4.0

### Minor Changes

- Shop database tables and sql functions:
  - Create a new product and its varients
  - Add a new varient to an existing product
  - Get all available products with their varients
  - Get a specific product with its varients via product id
  - Update a product and its varients
  - Create a new Order
  - Get all orders with their order items
  - Update order details and status
    Shop main page:
  - List all products with their varients
  - View a specific product with its varients and add to cart option
    Shop management page:
  - Add a new product and its varients
  - Edit an existing product and its varients
  - Update and view the stock of each product

## 0.3.0

### Minor Changes

- Store the events/activities data on db. New page for managing the events/activities.

## 0.2.1

### Patch Changes

- Fix Hero and Activities css module issues

## 0.2.0

### Minor Changes

- Add and configurate the `changeset` package to automate changelog and version management.
