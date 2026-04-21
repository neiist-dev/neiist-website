# neiist

## 1.10.0

### Minor Changes

- Added support for Special Categories to the shop.
- Implemented category-driven overrides for some flows on the shop experience:
  - POS-style checkout with no user/email requirements (To be used in Churrascos via the future mobile app)
  - Activity auto-registration on successful purchase
  - Select custom email dispatching
  - Different order status for special categories
- Special categories are excluded from default storefront queries but remain accessible in management interfaces.

## 1.9.1

### Patch Changes

- Display sumup transaction id on the orders table and enable search for it.
- On bulk email send it now asks for the correct google account to use.

## 1.9.0

### Minor Changes

- Shop and product management overhaul:
  - Reworked product create/edit into dedicated flows/pages with reusable management cards
  - Added dynamic variant definitions with automatic Cartesian-product variant matrix generation
  - Introduced TagInput + ColourPicker integration with named color variants support
  - Improved ProductForm structure/styling and responsive behavior
  - Added product archiving/deletion flow and improved shop management empty states

## 1.8.2

### Patch Changes

- Replaced ProductForm validation error state with toast notifications
- Enhanced dbUtils delete functions with improved error handling and mapping
- Added toast notifications for ShopManagement action errors

## 1.8.1

### Patch Changes

- Improved ProductDetail variant selection logic and stock handling
- Added no-image placeholder support for ProductCard and ProductDetail image sections
- Improved ProductForm calculations and variant definitions UX limits

## 1.8.0

### Minor Changes

- Added SumUp readers management and POS payment flow (send payment to physical TPA)
- Added Apple Pay integration with SumUp

## 1.7.2

### Patch Changes

- Added Next.js cron job to auto-cancel pending orders after 72h and send email notifications
- Added explicit message when event capacity is reached

## 1.7.1

### Patch Changes

- Added pickup_deadline to orders across SQL, dbUtils, and UI/UX
- Admin can override stock or order deadline when adding orders to the database

## 1.7.0

### Minor Changes

- Added SQL trigger to restock limited stock items on order cancellation
- Added created_by property to orders table
- Fixed SumUp UUID and transaction code persistence to the database
- Enforced stock and order deadline rules in SQL with custom exceptions
- Updated API routes and frontend behavior to reflect SQL enforcement changes

## 1.6.5

### Patch Changes

- Admins and coordinators can edit existing orders (campus, items, phone number, and NIF)

## 1.6.4

### Patch Changes

- Added email sending to selected users

## 1.6.3

### Patch Changes

- Added new filters UI/UX with per-column filtering and dedicated mobile filter UI

## 1.6.2

### Patch Changes

- Added flyout dropdown menu for choosing the product variant

## 1.6.1

### Patch Changes

- Implemented a token-based search logic in PhotoTeamMembers

## 1.6.0

### Minor Changes

- Order Management page redesign
- New order creation and user creation for orders
- My Orders page redesign
- Centerlized user roles checking
- Product Page redesign
- Shop page redesign

## 1.5.1

### Patch Changes

- Persist return URL across the Fenix OAuth flow so users are returned to the page they started on

## 1.5.0

### Minor Changes

- Activities Page
- Calendar with all NEIIST events updated from notion
- User sign up to events
- Events management for admin

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
