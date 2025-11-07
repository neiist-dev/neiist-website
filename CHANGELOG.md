# neiist

## 1.4.1

### Patch Changes

- Use both emails to filter meetings
- Use batching and api rate limit to avoid getting denied by google api
- Code clean up

## 1.4.0

### Minor Changes

- Notion and Google Calendar Integration

## 1.3.0

### Minor Changes

- Upgraded to Fenix API v2 for user data retrieval and course information.
- Added OAuth state validation and refresh token support for more secure and persistent sessions.
- Standardized cookie naming and handling across all auth endpoints.

## 1.2.3

### Patch Changes

- Updated installation docs with more details

## 1.2.2

### Minor Changes

- Updated installation and setup docs
- Admin override and permission changes via env file in dev mode

## 1.1.2

### Patch Changes

- Changed interface/type names and reordered imports
- Fixed style of description on the activity card

## 1.1.1

### Minor Changes

- Added new CV-Bank API using Google service account and in-memory cache

## 1.0.1

### Patch Changes

- Fixed navbar closing animation on mobile
- Improved logout redirect and callback handling for Fenix API

## 1.0.0

### Major Changes

- About Us
  - Redesigned About Us page with improved team grid and mobile scaling
  - "JoinUs" component for About Us page
  - Updated About Us description font size and scaling

- Activities Carrousel on Homepaeg
  - Improved activities slider scaling and responsiveness
  - Improved activities and hero responsiveness on homepage

- Homepage
  - New hero styling and improved responsiveness
  - Student on hero campus image now loops around and supports arrow keybinds for movement

- CV-Bank & Profile
  - New Profile Page design and CV-Bank integration
  - Added new fields to user database: GitHub and LinkedIn usernames

- Deployment & Scripts
  - Added deploy actions and scripts
  - Fixed deploy action typos and nvm path
  - Improved gdrive auth and setup scripts
  - Disabled features for first deploy

## 0.9.0

### Minor Changes

- Fixed name of hero assets
- Fixed PDF CV download formatting
- Fixed style of description on the activity card

## 0.8.1

### Patch Changes

- Moved setup script into scripts folder
- Repo cleanup and removed old assets

## 0.8.0

### Minor Changes

- Shop & Product Management
  - Improved image imports and product details image handling
  - Improved product details: all images shown, variant selection resets image
  - Added product image routes to local patterns
  - Simplified middleware/proxy logic
  - Fixed categories editing and creation on product form
  - Improved photo management card

## 0.7.0

### Minor Changes

- Notion Calendar provider:
  - Add support for Notion API v2022-06-28
  - New route to serve a calendar feed in ICAL format
  - For Meetings only displays the one where the user is an attendee
  - Add a link on the Profile page to access the feed and directly Add to Google Calendar

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
