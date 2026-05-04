# neiist

## [1.13.1](https://github.com/neiist-dev/neiist-website/compare/v1.13.0...v1.13.1) (2026-05-04)


### Bug Fixes

* **shop:** add links for availability on tagus and alameda, new custom ([2bcfcfb](https://github.com/neiist-dev/neiist-website/commit/2bcfcfb0b0003fafba125f45380fa43d83b92136))

## [1.13.0](https://github.com/neiist-dev/neiist-website/compare/v1.12.0...v1.13.0) (2026-05-04)


### Features

* **security:** add bot protection, sitemap and robots.txt ([09d1a49](https://github.com/neiist-dev/neiist-website/commit/09d1a49438438b8d9f6113f30644c9a5de3b38a4))


### Bug Fixes

* **shop:** add override for status labels, with conditional messages for ([3d72068](https://github.com/neiist-dev/neiist-website/commit/3d720683f4db6a1ab37eb60bf04efc58765a0d4f))

## [1.12.0](https://github.com/neiist-dev/neiist-website/compare/v1.11.0...v1.12.0) (2026-05-01)


### Features

* **shop:** allow selling to guest user for now only admin can via ([a3f9651](https://github.com/neiist-dev/neiist-website/commit/a3f96514f2f194dc9962e224859e10f74ac7095c))

## [1.11.0](https://github.com/neiist-dev/neiist-website/compare/v1.10.2...v1.11.0) (2026-05-01)


### Features

* **orderStatus:** refactor order status so they are centerlized and can ([dc0d287](https://github.com/neiist-dev/neiist-website/commit/dc0d287dff9d2b9999d1e6eff6c3d2eaa168d9e2))


### Bug Fixes

* **dinnerProdcut:** allow multiple products of same special category ([41e5fe8](https://github.com/neiist-dev/neiist-website/commit/41e5fe80b49971a4f588a9164eac4cb5a2078a6e))
* **shop:** make payment_reference and order number visible at all times ([18583ce](https://github.com/neiist-dev/neiist-website/commit/18583ce132c12303c347838cb3b757c59a19cdb2))

## [1.10.2](https://github.com/neiist-dev/neiist-website/compare/v1.10.1...v1.10.2) (2026-04-30)


### Bug Fixes

* **email:** add open hours for NEIIST to email and ShopCheckoutOverlay ([7f1732d](https://github.com/neiist-dev/neiist-website/commit/7f1732dfbcce78d1a0a82acc08c9e5701b214051))
* **shop:** progres steps for special categories, show on order details ([3026a0a](https://github.com/neiist-dev/neiist-website/commit/3026a0ab122d1a31da04bb932ab6386b2325fc03))

## 1.0.0 (2026-04-30)


### ⚠ BREAKING CHANGES

* new unified user roles checks
* add new fields to user db now it also store the github and linkdin usernames
* **db:** normalize database to 3NF/BCNF all functions updated to send data in a trasnparent way to the application
* **pre-commit:** setup pre-commit hooks with husky
* new middleware + api's for updated db structure
* Now using NextJS framework
* rewrite backend in typescript ([#450](https://github.com/neiist-dev/neiist-website/issues/450))

### Features

* about us page new design ([99af392](https://github.com/neiist-dev/neiist-website/commit/99af392221c8d313c6c61a75bd7b6be3e79c772a))
* **about-us:** new about us page built dynamically with db membership data ([a32507e](https://github.com/neiist-dev/neiist-website/commit/a32507eb4fa8de6e1b403e87b7e0fdc026f437db))
* **about-us:** visual drag-and-drop editor for the about-us page roles hierarchy. Use dnd-kit package. ([d249c58](https://github.com/neiist-dev/neiist-website/commit/d249c5890907b91f01ca9102d79fc23bf89bc256))
* Activities page ([e9fb8cb](https://github.com/neiist-dev/neiist-website/commit/e9fb8cb8208d9b35c67ad07664340fa9387eff41)), closes [#582](https://github.com/neiist-dev/neiist-website/issues/582)
* **activities:** new calendar style and EventsDetails modal ([687b766](https://github.com/neiist-dev/neiist-website/commit/687b76678b8971a53186a85102692c83d44b0d3f))
* **ActivitiesSlider:** activities slider for the homepage (needs some admin page to manage or blog integration) ([ea9021a](https://github.com/neiist-dev/neiist-website/commit/ea9021a97ce880d51acadab8d34bd1e0245dc4ea))
* add a maintenance page (Closes [#469](https://github.com/neiist-dev/neiist-website/issues/469)) ([6aa4fbd](https://github.com/neiist-dev/neiist-website/commit/6aa4fbd8e7fb02cc76db4e8a4e44ee7acfe32bef))
* Add Advent of Code 2024 NEIIST x Cloudflare as an html page ([#388](https://github.com/neiist-dev/neiist-website/issues/388)) ([ac119f3](https://github.com/neiist-dev/neiist-website/commit/ac119f3096e342fa1d035fb02c49af557f1154b3))
* add apple pay sumup integration ([c2dbebc](https://github.com/neiist-dev/neiist-website/commit/c2dbebc8c61c95765afaea00589a143242a83360))
* add Code of Conduct and contributing guidelines ([c6c8b55](https://github.com/neiist-dev/neiist-website/commit/c6c8b55138002b0f32de24820f7d57a0068bc1cc))
* add confirmation dialogs for all order realted operations ([062f76d](https://github.com/neiist-dev/neiist-website/commit/062f76d9ffb3b059608f068f0d8f05f2c90ade7d))
* add feature and bug issue templates ([ab69477](https://github.com/neiist-dev/neiist-website/commit/ab694770ea28c43569f79355b68e49baf7410312))
* add fuse.js to the website, used for all the search functionality ([ddc517b](https://github.com/neiist-dev/neiist-website/commit/ddc517b51e54e67529f33e7133f6f1e1a05196cd))
* add new fields to user db now it also store the github and linkdin usernames ([3e1a4a9](https://github.com/neiist-dev/neiist-website/commit/3e1a4a9187ae60a3af63b03a59bd08f00e312336))
* add new user role (shop manager) ([6fd8eee](https://github.com/neiist-dev/neiist-website/commit/6fd8eee38ff0e0ea01a2865e8a3fd6ddb5723fa1))
* add pickup_deadline to orders (sql, dbUtils and ui/ux) ([ed6a277](https://github.com/neiist-dev/neiist-website/commit/ed6a277485563d046809641de8f4db3e0f203479))
* add size guide ([a741474](https://github.com/neiist-dev/neiist-website/commit/a74147440b80c4480fb9fda044951bec6dc4c43c))
* add toast feedback to event details actions ([#633](https://github.com/neiist-dev/neiist-website/issues/633)) ([9c2183c](https://github.com/neiist-dev/neiist-website/commit/9c2183c927d05f5682f59dfc10510bca353e33f4))
* add toast notifications with Soonner ([5af06dc](https://github.com/neiist-dev/neiist-website/commit/5af06dc013fca5a3ea4262b72fb1e85e773e912d))
* add trigger on orders to restock limited stock items on order cancellation ([6d64cb2](https://github.com/neiist-dev/neiist-website/commit/6d64cb20cf47e1264d8634d3b340f523a3acc3dc))
* added created_by property to orders table. ([ef0b0e7](https://github.com/neiist-dev/neiist-website/commit/ef0b0e76d66244e7bc2226acaee56a3cfde0a439))
* admin and coordinators can edit orders (campus, itens, phone ([d060212](https://github.com/neiist-dev/neiist-website/commit/d060212089b39be3494f14c7364c24dee43b3285)), closes [#626](https://github.com/neiist-dev/neiist-website/issues/626)
* **admin:** admin management pages for departments (teams and admin bodies), roles in each department and their access level, members of each department and their role. ([d72880e](https://github.com/neiist-dev/neiist-website/commit/d72880ec8c5a49456de567a4e5985c51821857b1))
* **adminApi:** new admin api, manage user and permissions + code cleanup ([71554a6](https://github.com/neiist-dev/neiist-website/commit/71554a6db5daf70d0f771a8aafa54e74a6b44f9e))
* **admin:** wip admin page and collab manaager + user roles ([3c0c32a](https://github.com/neiist-dev/neiist-website/commit/3c0c32a3dfb19bf9c21c6685ceacee7f9bb80bc3))
* AoC page ([#387](https://github.com/neiist-dev/neiist-website/issues/387)) ([751b315](https://github.com/neiist-dev/neiist-website/commit/751b315e9173d3bc510a703e2151efe2e6ee657f))
* **aoc:** add AoC page and styles ([#380](https://github.com/neiist-dev/neiist-website/issues/380)) ([a0b65af](https://github.com/neiist-dev/neiist-website/commit/a0b65af50ee41308a445baadb3f6c6686dc8e6d2))
* **auth:** add OAuth state cookie for CSRF protection ([3405bd8](https://github.com/neiist-dev/neiist-website/commit/3405bd88b0a87bb958d1e0451279d631d6c6f662))
* **auth:** implement refresh token endpoint ([2c37009](https://github.com/neiist-dev/neiist-website/commit/2c37009dbe5747b0d0499db7de5de9ad956a04a4))
* **auth:** persist return URL across OAuth flow and restore after login ([e1b89e3](https://github.com/neiist-dev/neiist-website/commit/e1b89e32fb9852fc0d867ce7732d7d33cf0ca5d5))
* **cart:** improve item spacing and update imageWrapper max-width ([e58a189](https://github.com/neiist-dev/neiist-website/commit/e58a189ae48d94ef8f9a6de602a05db17ae59ec8))
* centraize email sending logic nodemailer util ([453c532](https://github.com/neiist-dev/neiist-website/commit/453c5328d7ed3d7adf60d20b7c793892087bf081))
* checkout page ([a8f883f](https://github.com/neiist-dev/neiist-website/commit/a8f883f8a463753395bd42a4f0e66553574a9fbf))
* close shop only acessible for admins ([d8ee7ea](https://github.com/neiist-dev/neiist-website/commit/d8ee7eafe63c68637051eb8d7817005b8ab3be17))
* **confirm-dialog:** new confirmation dialog to use in place of the ([d215733](https://github.com/neiist-dev/neiist-website/commit/d215733806a786d264e8e4c6597884f85e50f3a9))
* copiable public google calendar link ([b4df249](https://github.com/neiist-dev/neiist-website/commit/b4df2496d0864840bdfe83a844909411fb31cfea))
* corrected emails information and made campus an required field ([bb8b60b](https://github.com/neiist-dev/neiist-website/commit/bb8b60b186a1330e8a4bcb49e476083645f8c793))
* **cron:** use a next cron job to auto cancel any order that is still pending 72h after it was created ([cacc02e](https://github.com/neiist-dev/neiist-website/commit/cacc02e43a750c6d837ef8fd76acc565eb10c1e0))
* **database:** shema store user data and retriving ([1193af0](https://github.com/neiist-dev/neiist-website/commit/1193af0207a207f5d862058b325710ed0715d53d))
* **db:** allow products to be deleted and trigger to update products of old orders ([bca1752](https://github.com/neiist-dev/neiist-website/commit/bca175262039a855834a1697eedaa18e4abc7169))
* **db:** database backend users, admin, members and collab ([494439b](https://github.com/neiist-dev/neiist-website/commit/494439b232fe130364080227c5b79282ba878b36))
* **db:** normalize database to 3NF/BCNF all functions updated to send data in a trasnparent way to the application ([c761de4](https://github.com/neiist-dev/neiist-website/commit/c761de418163e7eea9d28ac14f72739e298dd209))
* **deploy:** add deploy actions ([28ccfd6](https://github.com/neiist-dev/neiist-website/commit/28ccfd6d64754cc8e5452c431a1ba29d45105cf3))
* **deploy:** add deploy scripts ([6dc84c0](https://github.com/neiist-dev/neiist-website/commit/6dc84c052f78005f10b954d15d9330cbb6c324af))
* **deploy:** add staging deployment step to GitHub Actions workflow ([3fabb54](https://github.com/neiist-dev/neiist-website/commit/3fabb5470e753d0c4f989039cace121f03877b5c))
* dinner page layout, styles, and content ([4c06489](https://github.com/neiist-dev/neiist-website/commit/4c06489ef3a6f894327c13221a181e4380518c40))
* **email-verification:** Use nodemailer to send a confirmation when a user sets a secondary email. Confirmation page and email template. Api route to confirm and send magic link email. ([ce7b07d](https://github.com/neiist-dev/neiist-website/commit/ce7b07d24a46be7ef60c6462be40aaa30cf20d23))
* **events-activities:** store evenst/activities data on db, admin page for managment. Moved events images to public folder. ([3ac708e](https://github.com/neiist-dev/neiist-website/commit/3ac708e9912aaaae4a9bdfb08e29d71b1d8c65f8))
* **eventsDetails:** description with support for web links ([7a45740](https://github.com/neiist-dev/neiist-website/commit/7a4574006d0ae9581255268e5839f1b7a582663e))
* flyout dropdown menu for choosing the products varient ([331b5b9](https://github.com/neiist-dev/neiist-website/commit/331b5b9e7075050d7431b404672c9102e854dcd2))
* **footer:** add YouTube icon link to footer social icons ([c38adfe](https://github.com/neiist-dev/neiist-website/commit/c38adfeabf98f82f1d5bfca5edaa590b542dcdc5))
* **footer:** implement responsive footer ([109cf20](https://github.com/neiist-dev/neiist-website/commit/109cf20a2ea3b95a447acd989dd252c7d17b7294))
* Google Calendar integration with Notion using service account ([e412482](https://github.com/neiist-dev/neiist-website/commit/e412482927b59d766f7b2abbfe8173400f537790))
* **Hero:** new homepage hero ([c754663](https://github.com/neiist-dev/neiist-website/commit/c7546634a89fa46a65f089bdc13fef7e5928957e))
* Highlight all coordinator cards. ([e14d690](https://github.com/neiist-dev/neiist-website/commit/e14d69019e0eb7d60a587df8c902964494f28138))
* **homepage:** add sweats layout constest to activities section ([#423](https://github.com/neiist-dev/neiist-website/issues/423)) ([87256de](https://github.com/neiist-dev/neiist-website/commit/87256dec060210481226664f8034bc470e808376))
* **homepage:** SINFO and Partnerships styled +  Activities component (not styled) ([fedb9f3](https://github.com/neiist-dev/neiist-website/commit/fedb9f322e8fe75d6d0ca29c095c7e14dcfbf523))
* **homepage:** update partnership section homepage ([00f4986](https://github.com/neiist-dev/neiist-website/commit/00f4986666d4a0f5c72f7dd82f2eb3c4b565592c))
* ical feed from notion api, direct link on profile to add to google calendar ([6ef2387](https://github.com/neiist-dev/neiist-website/commit/6ef2387b0b05e0bb07ed6e1c5e94b9bf90c57875))
* implement better search logic in MembershipsSearchList ([43d7768](https://github.com/neiist-dev/neiist-website/commit/43d776850581a942812a2f55bccad93e035afcf2))
* implement better search logic in OrdersTable ([3ec68b0](https://github.com/neiist-dev/neiist-website/commit/3ec68b05b9fa7845b649ad09125d29f0172f0013))
* implemented a better search logic in PhotoTeamMembers ([6f2939f](https://github.com/neiist-dev/neiist-website/commit/6f2939f8f016b2eb87292922371e9f4a41f0417d))
* improve search logic in UsersSearchList ([bf36cf3](https://github.com/neiist-dev/neiist-website/commit/bf36cf33fb3efbb914c906a9f2f89e6a666e32ae))
* JoinUs component for the about us ([83c5b36](https://github.com/neiist-dev/neiist-website/commit/83c5b360b389090703f8eae90445a39ee1a69d49))
* jwt for user data signing and verification ([3489377](https://github.com/neiist-dev/neiist-website/commit/3489377a4d533eaa4178cef65525dd2cae73bfcf))
* LICENSE ([f9ebb7d](https://github.com/neiist-dev/neiist-website/commit/f9ebb7dbd36e80f392664d5d4bc8c5066e6c1996))
* **management:** separate admin pages into two one to manage users and members other to manage the departments strutures ([afa45e8](https://github.com/neiist-dev/neiist-website/commit/afa45e8162872ae678a1ceb3e2fd4ce749d611b1))
* **management:** teams and user management api routes added. Fixed a small issue with permission and user roles on the api routes and middleware. ([3a15d09](https://github.com/neiist-dev/neiist-website/commit/3a15d09640ce1e066f7aebced759330ba2e0d091))
* mbway for jantar de curso (update emails and payment pages). New util to select the mbway number from a list ([3ab3e25](https://github.com/neiist-dev/neiist-website/commit/3ab3e25b51e0531e98125ac3cf6271f0390d72a9))
* my orders page + order management page + create new orders from managment page ([6d3aad8](https://github.com/neiist-dev/neiist-website/commit/6d3aad88dfaf87dc917c443d47b5717e8beabc98))
* my orders page with filters ([8dad2a8](https://github.com/neiist-dev/neiist-website/commit/8dad2a8ebf524fc388a3f0fe4e4997e48c82bc30))
* navbar menu animations + refactor and new css variable names ([f433f59](https://github.com/neiist-dev/neiist-website/commit/f433f59c67734f2748867213f7c750db793b3e06))
* **navbar:** all mobile menus working and srcoll sticky ([50d437a](https://github.com/neiist-dev/neiist-website/commit/50d437ad11be7b5c49b08ae11f6d2bad778dea9d))
* **navbar:** new color scheme and layout ([10e9f81](https://github.com/neiist-dev/neiist-website/commit/10e9f8176f805ed4a058a6c253b0d0df7c8c6d77))
* **navbar:** new navbar design ([cd1e186](https://github.com/neiist-dev/neiist-website/commit/cd1e1867e16209d9e33fd9d74ae5c9e9fa0412fe))
* **navbar:** User profile menu refactor. ([3c1cb61](https://github.com/neiist-dev/neiist-website/commit/3c1cb61669cd13faf2641ce8676c30231402b032))
* new cvBank api using google service account and in-memory cache ([89a921e](https://github.com/neiist-dev/neiist-website/commit/89a921e2ce635c53763e2ab7a50433c316e25829))
* new filters ui/ux with filters per data column and dedicated mobile ui for filters ([16501b2](https://github.com/neiist-dev/neiist-website/commit/16501b225f2c859282b197ee88d3d50a7e8dac53)), closes [#621](https://github.com/neiist-dev/neiist-website/issues/621)
* new fuzzy search paraments ([6820b8d](https://github.com/neiist-dev/neiist-website/commit/6820b8d55e37c6af61f63ec119e9a392ab130742))
* new middleware + api's for updated db structure ([e09bade](https://github.com/neiist-dev/neiist-website/commit/e09bade9a454e7abe46011e982d08b822505f216))
* new Profile Page design and CV-Bank ([2bf8869](https://github.com/neiist-dev/neiist-website/commit/2bf8869cf68022d8c8388ee16a8c9a1b0f216c51))
* new styling calendar component ([e6c9566](https://github.com/neiist-dev/neiist-website/commit/e6c956659df63450f5bdbd554a6f6c2bea4d03ac))
* new unified user roles checks ([b3d8c30](https://github.com/neiist-dev/neiist-website/commit/b3d8c306f093e5a6509f0ec46410b038db16b9ab))
* next-js rewrite initial commit ([b1ff579](https://github.com/neiist-dev/neiist-website/commit/b1ff5792b55b4ebee8bf92957bb03bd45ca344db))
* order details manager overlay ([5a9bc0c](https://github.com/neiist-dev/neiist-website/commit/5a9bc0ce5696ca34ca8b9009826572492442fc27))
* order notes editing ([e0112b1](https://github.com/neiist-dev/neiist-website/commit/e0112b13a227792ff7b1273ab0f8848034011aca)), closes [#626](https://github.com/neiist-dev/neiist-website/issues/626)
* orders management page with filters for status and search ([2a1eb5a](https://github.com/neiist-dev/neiist-website/commit/2a1eb5a69b70527132c717107fa5cf89fa07984e))
* **orders:** add detailed order fetching and update orders page component ([1857d76](https://github.com/neiist-dev/neiist-website/commit/1857d76ba4b21bb9d2260ce981cf085476ebea0f))
* **orders:** admin can override stock or order deadline when adding ([4a30c0e](https://github.com/neiist-dev/neiist-website/commit/4a30c0e67c85be217431124e1c3098ce21fab4c0))
* **orders:** choose google account before opening gmail. ([c8fd469](https://github.com/neiist-dev/neiist-website/commit/c8fd469298c8da39257ba58f381073bba231c75c))
* **orders:** optimize order fetching with improved error handling and update dependencies in AllOrdersPage and SearchOrders components ([907311a](https://github.com/neiist-dev/neiist-website/commit/907311ad3a10bc1b527d936eca1691c19160d449))
* **orders:** update order details modal and search orders component for improved functionality ([1817aec](https://github.com/neiist-dev/neiist-website/commit/1817aecba907580ac924ccb18c0ac227a79c332d))
* **photo-upload:** upload custom photos and cache/save fenix photos. ([a3a1eac](https://github.com/neiist-dev/neiist-website/commit/a3a1eacfdb21fe349366e8de1755d90b9c3d402d))
* **photo:** new page for photo coordinator to change photos for all members. ([7c74f38](https://github.com/neiist-dev/neiist-website/commit/7c74f38e18eb5cdcff61302cca13846b2b91c164))
* **photos:** admins can set custom photos for the users. ([756ab67](https://github.com/neiist-dev/neiist-website/commit/756ab67cb0f16d0b2e3c7596e219ad9553ef9ef9))
* **pre-commit:** setup pre-commit hooks with husky ([ab98d15](https://github.com/neiist-dev/neiist-website/commit/ab98d15a5b5232f733abeca56350b84a666d388e))
* **product detail:** add expandable Size Guide and Quality Guarantee sections ([a272898](https://github.com/neiist-dev/neiist-website/commit/a272898d06d30d5bd56cf618d0f2314c7e4c5c78))
* **product-detail:** UI improvements, spacing fixes and variant selector update ([d37ff6b](https://github.com/neiist-dev/neiist-website/commit/d37ff6b3328e4227cf0683745f7af50f09450442))
* **ProductDetail:** add markdown redering format support ([47553d4](https://github.com/neiist-dev/neiist-website/commit/47553d43c6f841ed5fc7db16af32e98909e77e07))
* **profile-page:** User profile page with prefered contact method. ([5196272](https://github.com/neiist-dev/neiist-website/commit/5196272d1e654677717cf54700e387316234fe1e))
* **profile:** refactor profile page ([5df73f1](https://github.com/neiist-dev/neiist-website/commit/5df73f1ce903493428c157965bba78d31237eee2))
* **profile:** wip profile page ([7c8a2e1](https://github.com/neiist-dev/neiist-website/commit/7c8a2e1ef4ab30d9ddcf3e14f598acbefec07607))
* pull_request_template.md ([1fb08b1](https://github.com/neiist-dev/neiist-website/commit/1fb08b1c08b0eda5894a69099cbefc704e1799fa))
* **refactor:** refactor code of admin and collaborator managemnt pages. ([764f0aa](https://github.com/neiist-dev/neiist-website/commit/764f0aacc562876fd6c0dac0680b623c9d406236))
* rewrite backend in typescript ([#450](https://github.com/neiist-dev/neiist-website/issues/450)) ([960a9b9](https://github.com/neiist-dev/neiist-website/commit/960a9b96aab7be77a388cba7b77d1be9d6434847))
* rollback to old cvbank api (service account on personal doesnt have storage write access) ([5ca890e](https://github.com/neiist-dev/neiist-website/commit/5ca890e6beba86c8f8c4028c53fd377ed95cabfa))
* SECURITY.md ([d33f17c](https://github.com/neiist-dev/neiist-website/commit/d33f17ce4b28c355406feb5102f6d889cc9add6f))
* **security:** add rate limiting and CSP headers ([58b86d1](https://github.com/neiist-dev/neiist-website/commit/58b86d1771fc5a7b01f4642f2e9717915c15b863))
* send email to selected users ([1d9bade](https://github.com/neiist-dev/neiist-website/commit/1d9bade7a9311693a48c6880203d122c38bfa5b1))
* **setup script:** add a setup script to create the dev env ([9ecd024](https://github.com/neiist-dev/neiist-website/commit/9ecd024dac47168183b00d75f9a917526833e264))
* shop categories, product varients and images. Create, edit, and remove products variants and stocks. Updated postgres db init.sql ([e4c2c36](https://github.com/neiist-dev/neiist-website/commit/e4c2c360ceff2ef711ed98fcea31ec62940938b0))
* shop product cards with thumbnails for all colors or variants of the product. Shop Product management with creation of variants like color and size (one product multiple colors and sizes) ([4213376](https://github.com/neiist-dev/neiist-website/commit/42133765202c426163c487c29b7621bfe90b4ef5))
* **shop:** add sumup readers management and pos payment flow(send payment to physical tpa) ([395f99b](https://github.com/neiist-dev/neiist-website/commit/395f99b202e47bfc24b402f2d56a3ea67f1c5625))
* **shop:** main shop page and data types ([c7644bc](https://github.com/neiist-dev/neiist-website/commit/c7644bc8ebc4accb6128362d5bb210c365886dc5))
* **shop:** new product management page complete ([8a13ef7](https://github.com/neiist-dev/neiist-website/commit/8a13ef7f60550090372e5ed8ed1148fe1ead7767))
* **shop:** new shop homepage layout and product details page ([3b1d083](https://github.com/neiist-dev/neiist-website/commit/3b1d0836d509ce668101619887d088860a49eca1))
* **shop:** products management page (css wip) no image upload ([1be4ac1](https://github.com/neiist-dev/neiist-website/commit/1be4ac10d8677739d68bdf3b7814d9a0c13a1589))
* **shop:** special categories that override some specific flows on the shop experience ("Jantar de Curso" e "Churrasco") ([1eda52a](https://github.com/neiist-dev/neiist-website/commit/1eda52a3a829ff55c00d4b598fb0355eb1224c48))
* **shop:** sql tables and functions in 3NF. Data types for shop products and orders. DB init file updated to have sample products. ([d3fbcda](https://github.com/neiist-dev/neiist-website/commit/d3fbcda0e836d045c60639bb0f0e8df85f4ac207))
* **shop:** stock and order deadline enforced in sql (custom execptions). Updated api routes and frontend to reflect this changes. Shop open but products are displayed but cannot be bought. ([a09c238](https://github.com/neiist-dev/neiist-website/commit/a09c238760a84982464f472074c0baead4adf736))
* show orders notes on the order details overlay ([4b758c1](https://github.com/neiist-dev/neiist-website/commit/4b758c11c9d6b99556feaae53fa70808508028e7))
* SumUp integration with iframe widget ([af42694](https://github.com/neiist-dev/neiist-website/commit/af42694d42e59df7ddcf918f6f0a45cb00bb1a4f))
* sweats design contest banner and submissions google drive api ([bcb00ef](https://github.com/neiist-dev/neiist-website/commit/bcb00ef3c2c3ae191f4d127e6e9d99ccbd724c75))
* sweats design contest ended (remove from homepage, disable api) ([feb864d](https://github.com/neiist-dev/neiist-website/commit/feb864d4ae97a173aa4c78fca732f3167c38e32b))
* **team-management:** new coordinator team management page to manage ([cde20a4](https://github.com/neiist-dev/neiist-website/commit/cde20a46ae7edb32d648fc54bd3033debdaeac3e))
* the cool student now loops arround, we can never leave tecnico ([b5090af](https://github.com/neiist-dev/neiist-website/commit/b5090af2476344f339a13d147d0c4879a222fe2c)), closes [#600](https://github.com/neiist-dev/neiist-website/issues/600)
* **theme:** implemented dark mode using next-themes defaults ([5f604a5](https://github.com/neiist-dev/neiist-website/commit/5f604a58bcdc34e80d040a2fb4a82e704010a024))
* **themeToggle:** fixed animation and icon ([3cf4645](https://github.com/neiist-dev/neiist-website/commit/3cf4645c000bc5029a5e25fae1667574001c381f))
* **unauthorized:** new unauthorized access page ([85d6391](https://github.com/neiist-dev/neiist-website/commit/85d639159200373715efed5f7e0910a1dc8622cb))
* **UserContext:** save user context after login ([90fe9e0](https://github.com/neiist-dev/neiist-website/commit/90fe9e0aba9f79da163e5017c3dda726a57e5aeb))
* yarn script using changeset package for automatic versioning and changelog generation ([ad60c90](https://github.com/neiist-dev/neiist-website/commit/ad60c909d6ee8bf751ee8f812f1c097a94432e52))


### Bug Fixes

* (activitities): carroussell now only stops autoplay on hover. On db name of events needs to be unique ([2608645](https://github.com/neiist-dev/neiist-website/commit/2608645b30e0ca8aa8cdf147cbbdbc9b03852f08))
* about us page academic year logic and showing old deactivated departments. ([bfc8dcd](https://github.com/neiist-dev/neiist-website/commit/bfc8dcd46343b72359d280f73730fb8c5fcf5601))
* academic year and memberships filter on about us page ([5e6fd1a](https://github.com/neiist-dev/neiist-website/commit/5e6fd1a06871e5d2ddd66dba90679a369661ee34))
* activities and hero scalling ([32061d3](https://github.com/neiist-dev/neiist-website/commit/32061d3f0e7f81623ac57942f5fca2088feae084))
* activities carroussell no data on the db ([55a8524](https://github.com/neiist-dev/neiist-website/commit/55a8524738cba630585e3ddd7f79be4d6521900c))
* add and remove functions teams and admin bodies ([49fa4a0](https://github.com/neiist-dev/neiist-website/commit/49fa4a04af3039cce95847dd2f82d2c383996a30))
* add cart item counter ([71637eb](https://github.com/neiist-dev/neiist-website/commit/71637ebcd5e371bb2dcd24bdad1bfd153601b1fd))
* add more than six variants, use of db ids and random ids ([a2530b2](https://github.com/neiist-dev/neiist-website/commit/a2530b2bf86d471c69ba59e642a5353bc362595a))
* add product image routes to local patterns ([6e06a95](https://github.com/neiist-dev/neiist-website/commit/6e06a95e3ab1daf5e9857eb8302368ff5e369559))
* admin bodies doesn't have a descprition, team descprition is required, active and inactive filters now filter the data correctly ([0758673](https://github.com/neiist-dev/neiist-website/commit/07586733e420316c4aba90df08298b4b7985fc62))
* **api-admin:** fixes to permissions and data type on the admin api functions and database access. ([9ebc0cd](https://github.com/neiist-dev/neiist-website/commit/9ebc0cd178277358693bb58f244cfed0a990da20))
* **auth:** callback/lougout route use env variable instead of request ([768b1d0](https://github.com/neiist-dev/neiist-website/commit/768b1d0a2ec7614618a37c9150e3927eebdb714c))
* auto expand notes on modal open when notes exist ([0882504](https://github.com/neiist-dev/neiist-website/commit/08825048f11a38659123cb489d7892cec573a4e0))
* Better type safety on user data from db. ([17b4e14](https://github.com/neiist-dev/neiist-website/commit/17b4e149e308aebdc616a67bc67cd8912c451263))
* **calendar-rate:** adjust google calendar api rate limit ([5b4b08e](https://github.com/neiist-dev/neiist-website/commit/5b4b08eafd0d80f90ff90e1cc6de596f97d3aa05))
* **calendar:** service account json parsing permissions ([4b43fe5](https://github.com/neiist-dev/neiist-website/commit/4b43fe5e6eb9b157633ef1b7d94c7ccafa0efbc9))
* callback fenix api ([11ae5b1](https://github.com/neiist-dev/neiist-website/commit/11ae5b17ca6745763855ce6143440c6675ede341))
* CartItem data type for ShopContext and Cart component. ([8b56788](https://github.com/neiist-dev/neiist-website/commit/8b5678867a23ecf11786d3bdc5c78641526f6c05))
* **cart:** show price and "remove button" for products without variants ([1e9ddd0](https://github.com/neiist-dev/neiist-website/commit/1e9ddd04009076512606eda55407c87eccc186ea))
* categories edting and creation on product form and categories view and save on cart ([acd7231](https://github.com/neiist-dev/neiist-website/commit/acd72310f55b6222dcfe7ac7d86c7121f0d1b7aa))
* **CollabCard:** multiple coordinators one team ([b44ad9b](https://github.com/neiist-dev/neiist-website/commit/b44ad9bf16301efd5ad7ba107d969ed3f28813a8))
* correct route handling for all requests in server.js ([c0d08f1](https://github.com/neiist-dev/neiist-website/commit/c0d08f1ca8eee1f0db356f5936ce39fa497e6f3d))
* correct static file paths for frontend and images ([f6d73e9](https://github.com/neiist-dev/neiist-website/commit/f6d73e9c28d8469267df585afdbcfee31ee6ebbd))
* corrected small errors in setup docs and scripts ([34f9f3a](https://github.com/neiist-dev/neiist-website/commit/34f9f3a619516ec659b6081f97a6c80de6d996ae))
* correctly format pdf cv download ([43ee79a](https://github.com/neiist-dev/neiist-website/commit/43ee79ae7e97d71b74531228c4e3b2abbe85402c))
* **datetime:** fix rendering of data and time ([7a04034](https://github.com/neiist-dev/neiist-website/commit/7a0403490ff8a99154726a2065d56ed637facd89))
* db schema sql ids ([6c4b93a](https://github.com/neiist-dev/neiist-website/commit/6c4b93a796953572ccddf04b6b359dc896791299))
* **db:** remove duplicated functions ([c6ae32a](https://github.com/neiist-dev/neiist-website/commit/c6ae32a6b5025e6fbf0b56a1ac78900a5f004185))
* **db:** sql add_user function missing DEFAULT NULL for p_github and p_linkedin ([c002b16](https://github.com/neiist-dev/neiist-website/commit/c002b1675803875f49211d2bcce9f95e87e089ea))
* department managment requirement to add at least one role when creating a new one. ([927b43d](https://github.com/neiist-dev/neiist-website/commit/927b43d1de4a2476b1bfe5a35a0c2456b5e19422))
* deploy actions ([367e291](https://github.com/neiist-dev/neiist-website/commit/367e291d5d629f817e154a8220cc4c642234a381))
* **deploy:** correct nvm path ([4aa8122](https://github.com/neiist-dev/neiist-website/commit/4aa8122c9fa5a4c5febf28422fb3ab1f90eb0872))
* **deps:** update dependency axios to v1.10.0 ([#497](https://github.com/neiist-dev/neiist-website/issues/497)) ([181138a](https://github.com/neiist-dev/neiist-website/commit/181138acc6af10b06b61456d354dddd2396c16a0))
* **deps:** update dependency axios to v1.11.0 [security] ([#526](https://github.com/neiist-dev/neiist-website/issues/526)) ([31c8820](https://github.com/neiist-dev/neiist-website/commit/31c88201c97359f6534d54e00fd454c78685b4ca))
* **deps:** update dependency axios to v1.12.0 [security] ([#559](https://github.com/neiist-dev/neiist-website/issues/559)) ([7f1e5b4](https://github.com/neiist-dev/neiist-website/commit/7f1e5b4eb00da4f1ee1e36b7fa46fce034c1560c))
* **deps:** update dependency axios to v1.12.2 ([#561](https://github.com/neiist-dev/neiist-website/issues/561)) ([623de41](https://github.com/neiist-dev/neiist-website/commit/623de41a800254be7498973208b0971eb61da64c))
* **deps:** update dependency axios to v1.7.9 ([#386](https://github.com/neiist-dev/neiist-website/issues/386)) ([c7e3623](https://github.com/neiist-dev/neiist-website/commit/c7e3623420d76e1a85c05371a78892e9512503fa))
* **deps:** update dependency axios to v1.8.2 [security] ([#414](https://github.com/neiist-dev/neiist-website/issues/414)) ([f005e0c](https://github.com/neiist-dev/neiist-website/commit/f005e0c1c35a31f5227bac0959086802b9ad8c47))
* **deps:** update dependency axios to v1.8.4 ([#416](https://github.com/neiist-dev/neiist-website/issues/416)) ([06ea283](https://github.com/neiist-dev/neiist-website/commit/06ea283cb818022b4696cd0f2d813e6ad50d429f))
* **deps:** update dependency axios to v1.9.0 ([9f240e6](https://github.com/neiist-dev/neiist-website/commit/9f240e638c90c480a339c1575693f5dde1e6afb7))
* **deps:** update dependency bootstrap to v5.3.5 ([cd089e3](https://github.com/neiist-dev/neiist-website/commit/cd089e397a109dc2fdcf90fbae6276fa65bd24cf))
* **deps:** update dependency bootstrap to v5.3.7 ([#484](https://github.com/neiist-dev/neiist-website/issues/484)) ([7e8de79](https://github.com/neiist-dev/neiist-website/commit/7e8de79f82ff7d269cf473913b8943ecca1ceb37))
* **deps:** update dependency bootstrap to v5.3.8 ([#553](https://github.com/neiist-dev/neiist-website/issues/553)) ([51b30a5](https://github.com/neiist-dev/neiist-website/commit/51b30a51be4db23e517c145870781eeaec0f57c9))
* **deps:** update dependency dotenv to v16.4.7 ([#390](https://github.com/neiist-dev/neiist-website/issues/390)) ([1a2e85c](https://github.com/neiist-dev/neiist-website/commit/1a2e85c2db4447111e162a31bea2d14e36a19b36))
* **deps:** update dependency dotenv to v16.5.0 ([fcce288](https://github.com/neiist-dev/neiist-website/commit/fcce288810ba49e35b969e3451c2f1877df9c8a1))
* **deps:** update dependency dotenv to v17 ([#504](https://github.com/neiist-dev/neiist-website/issues/504)) ([159e857](https://github.com/neiist-dev/neiist-website/commit/159e85787dfb6514fd898ce15316df99bfaae53b))
* **deps:** update dependency dotenv to v17.0.1 ([#505](https://github.com/neiist-dev/neiist-website/issues/505)) ([33cca2b](https://github.com/neiist-dev/neiist-website/commit/33cca2b6bdc25bbe0a12829506347c20cfa64b90))
* **deps:** update dependency dotenv to v17.2.0 ([#509](https://github.com/neiist-dev/neiist-website/issues/509)) ([6ded998](https://github.com/neiist-dev/neiist-website/commit/6ded998e6ed919544d04fe08eeb1b47e9c753cb0))
* **deps:** update dependency dotenv to v17.2.1 ([#529](https://github.com/neiist-dev/neiist-website/issues/529)) ([399e2e9](https://github.com/neiist-dev/neiist-website/commit/399e2e9a6501be7c337a0cea4d8755d80a3068d5))
* **deps:** update dependency dotenv to v17.2.2 ([#555](https://github.com/neiist-dev/neiist-website/issues/555)) ([dc66fc9](https://github.com/neiist-dev/neiist-website/commit/dc66fc97345ee4e3b5ff50219c6c301e8d9a84d5))
* **deps:** update dependency express to v4.21.1 ([#367](https://github.com/neiist-dev/neiist-website/issues/367)) ([6249f8e](https://github.com/neiist-dev/neiist-website/commit/6249f8eb1b1b219e92889b9ef8578365ae8852f7))
* **deps:** update dependency express to v4.21.2 ([#396](https://github.com/neiist-dev/neiist-website/issues/396)) ([a33b5ff](https://github.com/neiist-dev/neiist-website/commit/a33b5fffe4e308dff8c68ccf783e98b83df09ce7))
* **deps:** update dependency express to v5 ([0eaca61](https://github.com/neiist-dev/neiist-website/commit/0eaca61b616028f2b540bfa202e5e063c3110982))
* **deps:** update dependency express-fileupload to v1.5.1 ([#333](https://github.com/neiist-dev/neiist-website/issues/333)) ([9702eed](https://github.com/neiist-dev/neiist-website/commit/9702eed3563ad4eb38501457d3527b856b576419))
* **deps:** update dependency express-fileupload to v1.5.2 ([#507](https://github.com/neiist-dev/neiist-website/issues/507)) ([858cfd2](https://github.com/neiist-dev/neiist-website/commit/858cfd2ad3ac77280f41eaee983fe24d16f1e71c))
* **deps:** update dependency express-session to v1.18.2 ([#517](https://github.com/neiist-dev/neiist-website/issues/517)) ([72a8c38](https://github.com/neiist-dev/neiist-website/commit/72a8c38899435af9cf4ca6bddf91f333209d731b))
* **deps:** update dependency html-react-parser to v5.1.16 ([#336](https://github.com/neiist-dev/neiist-website/issues/336)) ([fd8bbf6](https://github.com/neiist-dev/neiist-website/commit/fd8bbf67e9940b1f5056b90edb1d44de08893bda))
* **deps:** update dependency html-react-parser to v5.1.18 ([#364](https://github.com/neiist-dev/neiist-website/issues/364)) ([9b24030](https://github.com/neiist-dev/neiist-website/commit/9b240304d26ad0daa1c15ee9526ce47ef6d1bb4b))
* **deps:** update dependency html-react-parser to v5.2.2 ([#393](https://github.com/neiist-dev/neiist-website/issues/393)) ([dd0d9d6](https://github.com/neiist-dev/neiist-website/commit/dd0d9d641ade03aa22a417dd42d18bbec8ff0842))
* **deps:** update dependency html-react-parser to v5.2.3 ([7ed08ef](https://github.com/neiist-dev/neiist-website/commit/7ed08ef71b8a158661232faa887060e41c3141b5))
* **deps:** update dependency html-react-parser to v5.2.5 ([4950fac](https://github.com/neiist-dev/neiist-website/commit/4950facd31515031ed3ae50e4f2791c023a4d441))
* **deps:** update dependency html-react-parser to v5.2.6 ([#520](https://github.com/neiist-dev/neiist-website/issues/520)) ([c09afec](https://github.com/neiist-dev/neiist-website/commit/c09afec89e50bc692968421e092eec0a9c509c6d))
* **deps:** update dependency htmlparser2 to v10 ([#402](https://github.com/neiist-dev/neiist-website/issues/402)) ([8afb428](https://github.com/neiist-dev/neiist-website/commit/8afb428e6c60dc5c8d37f04638cb621dbeb4c007))
* **deps:** update dependency morgan to v1.10.1 ([#518](https://github.com/neiist-dev/neiist-website/issues/518)) ([d5c7493](https://github.com/neiist-dev/neiist-website/commit/d5c74937af0959dd281f4bf8fdff45ee016a4d4c))
* **deps:** update dependency natural to v6.12.0 ([#293](https://github.com/neiist-dev/neiist-website/issues/293)) ([6e660e0](https://github.com/neiist-dev/neiist-website/commit/6e660e0ca69036e9c7e62dcda2eed7cff604ce45))
* **deps:** update dependency natural to v8 ([#349](https://github.com/neiist-dev/neiist-website/issues/349)) ([f76a016](https://github.com/neiist-dev/neiist-website/commit/f76a0165b302450dc5adc7939bf99ef73725b4f2))
* **deps:** update dependency natural to v8.1.0 ([#499](https://github.com/neiist-dev/neiist-website/issues/499)) ([bf03a37](https://github.com/neiist-dev/neiist-website/commit/bf03a37185813e9561c7ef0b471bb5cedc73d9c7))
* **deps:** update dependency pg to v8.13.0 ([#354](https://github.com/neiist-dev/neiist-website/issues/354)) ([d59066b](https://github.com/neiist-dev/neiist-website/commit/d59066b524ce4e9fb30cecfb0e5891f20e88cc60))
* **deps:** update dependency pg to v8.13.1 ([#374](https://github.com/neiist-dev/neiist-website/issues/374)) ([4559c7a](https://github.com/neiist-dev/neiist-website/commit/4559c7abb8c0529e132568ef232194ff2b0cb05b))
* **deps:** update dependency pg to v8.14.1 ([#410](https://github.com/neiist-dev/neiist-website/issues/410)) ([bbb0a1d](https://github.com/neiist-dev/neiist-website/commit/bbb0a1db84a6f77ab018de01275be36c8c47d1e0))
* **deps:** update dependency pg to v8.15.6 ([fb5952e](https://github.com/neiist-dev/neiist-website/commit/fb5952e1c2c331ce44e4794c6204c71fd374d49a))
* **deps:** update dependency pg to v8.16.3 ([#500](https://github.com/neiist-dev/neiist-website/issues/500)) ([582eca5](https://github.com/neiist-dev/neiist-website/commit/582eca5e3584a0eff19d81c2e7b9acab09cc047e))
* **deps:** update dependency react-bootstrap to v2.10.10 ([093254a](https://github.com/neiist-dev/neiist-website/commit/093254a37e7b650fd992b3cc2360fa1b6e5e1c05))
* **deps:** update dependency react-bootstrap to v2.10.5 ([#361](https://github.com/neiist-dev/neiist-website/issues/361)) ([b262a96](https://github.com/neiist-dev/neiist-website/commit/b262a9612c1c1c9e1ab6117f4c94e844df2acb60))
* **deps:** update dependency react-bootstrap to v2.10.5 ([#361](https://github.com/neiist-dev/neiist-website/issues/361)) ([3c3372c](https://github.com/neiist-dev/neiist-website/commit/3c3372c201c104a943c5a755af59aa243481dd94))
* **deps:** update dependency react-bootstrap to v2.10.7 ([#385](https://github.com/neiist-dev/neiist-website/issues/385)) ([e0fe1b7](https://github.com/neiist-dev/neiist-website/commit/e0fe1b70f4df2be2f08119844bc8a332016c62cb))
* **deps:** update dependency react-bootstrap to v2.10.9 ([#405](https://github.com/neiist-dev/neiist-website/issues/405)) ([92480c3](https://github.com/neiist-dev/neiist-website/commit/92480c38c4a7ad5404cb3ffd451b4714830c7f44))
* **deps:** update dependency react-icons to v5.4.0 ([#391](https://github.com/neiist-dev/neiist-website/issues/391)) ([6969fb6](https://github.com/neiist-dev/neiist-website/commit/6969fb6906dc9b0d0ebd6ea40749251f3dda7ade))
* **deps:** update dependency react-icons to v5.5.0 ([#411](https://github.com/neiist-dev/neiist-website/issues/411)) ([a240878](https://github.com/neiist-dev/neiist-website/commit/a2408786d24b80736438d736ba02b45a80effd1a))
* **deps:** update dependency react-multi-carousel to v2.8.6 ([#452](https://github.com/neiist-dev/neiist-website/issues/452)) ([d8e095d](https://github.com/neiist-dev/neiist-website/commit/d8e095d1ef51ed37eddc10c8c297a862baa2bf57))
* **deps:** update dependency react-router-dom to v6.27.0 ([#368](https://github.com/neiist-dev/neiist-website/issues/368)) ([bd0f59d](https://github.com/neiist-dev/neiist-website/commit/bd0f59dc9ad49f1747600c04f6797fc7bd62842e))
* **deps:** update dependency react-router-dom to v6.30.0 ([#378](https://github.com/neiist-dev/neiist-website/issues/378)) ([97637b6](https://github.com/neiist-dev/neiist-website/commit/97637b64f964f9f4711c9926fc45e8e53dd6da6d))
* **deps:** update dependency react-router-dom to v7 ([#418](https://github.com/neiist-dev/neiist-website/issues/418)) ([055f58b](https://github.com/neiist-dev/neiist-website/commit/055f58b8872db6d0711e5259102b7e77ae88113c))
* **deps:** update dependency react-router-dom to v7.5.0 ([53c94d6](https://github.com/neiist-dev/neiist-website/commit/53c94d616402f765ea2e9e85ef78cf5c372d829d))
* **deps:** update dependency react-router-dom to v7.5.1 ([129124c](https://github.com/neiist-dev/neiist-website/commit/129124c2fa1edb185536326ab26b47ed88f42c97))
* **deps:** update dependency react-router-dom to v7.5.2 ([fa8c2ec](https://github.com/neiist-dev/neiist-website/commit/fa8c2ec9dfaeac989a77fba8cdce09c07d9189c4))
* **deps:** update dependency react-router-dom to v7.6.3 ([#478](https://github.com/neiist-dev/neiist-website/issues/478)) ([40d56b2](https://github.com/neiist-dev/neiist-website/commit/40d56b20f414e82c89f25edf41e5f7c42df8989f))
* **deps:** update dependency react-router-dom to v7.7.0 ([#515](https://github.com/neiist-dev/neiist-website/issues/515)) ([f5a4725](https://github.com/neiist-dev/neiist-website/commit/f5a4725cbe8b3269bf516a5f0db0265bcee3b723))
* **deps:** update dependency react-router-dom to v7.7.1 ([#528](https://github.com/neiist-dev/neiist-website/issues/528)) ([6b946c4](https://github.com/neiist-dev/neiist-website/commit/6b946c4bbf5c7b174a986bf9a036f17d9445881c))
* **deps:** update dependency react-router-dom to v7.8.0 ([#542](https://github.com/neiist-dev/neiist-website/issues/542)) ([0b79103](https://github.com/neiist-dev/neiist-website/commit/0b79103caca3db46f0573d43f9812a559f8ce3ae))
* **deps:** update dependency react-router-dom to v7.9.1 ([#549](https://github.com/neiist-dev/neiist-website/issues/549)) ([2840cf6](https://github.com/neiist-dev/neiist-website/commit/2840cf65d8c31274870f4d96c565bb23f961d4fa))
* **deps:** update dependency react-select to v5.10.1 ([#406](https://github.com/neiist-dev/neiist-website/issues/406)) ([a5ee804](https://github.com/neiist-dev/neiist-website/commit/a5ee804fa5213ccc3e5940cabf1e3ad209e5bfb0))
* **deps:** update dependency react-select to v5.10.2 ([#512](https://github.com/neiist-dev/neiist-website/issues/512)) ([b88f1e2](https://github.com/neiist-dev/neiist-website/commit/b88f1e28bd051aeea1f0ed9d3ab91f72aefe341f))
* **deps:** update dependency react-select to v5.8.1 ([#356](https://github.com/neiist-dev/neiist-website/issues/356)) ([329e12f](https://github.com/neiist-dev/neiist-website/commit/329e12f7120753100b475323bafdd2fa9fa69435))
* **deps:** update dependency react-select to v5.9.0 ([#376](https://github.com/neiist-dev/neiist-website/issues/376)) ([2d3b599](https://github.com/neiist-dev/neiist-website/commit/2d3b5993a22d4065819dbf4b80d4c392c77ba474))
* **deps:** update mantine monorepo to v7.13.2 ([#359](https://github.com/neiist-dev/neiist-website/issues/359)) ([9a4958b](https://github.com/neiist-dev/neiist-website/commit/9a4958b481d47cdc65ead73dcb7d041b7aa1861d))
* **deps:** update mantine monorepo to v7.17.2 ([#401](https://github.com/neiist-dev/neiist-website/issues/401)) ([1530473](https://github.com/neiist-dev/neiist-website/commit/1530473ab66e36aa8d6a97df4bba48a5164c923b))
* **deps:** update mantine monorepo to v7.17.3 ([0458f53](https://github.com/neiist-dev/neiist-website/commit/0458f534ae644685a3d234a9fcb00db2e481b2f3))
* **deps:** update mantine monorepo to v7.17.4 ([3012216](https://github.com/neiist-dev/neiist-website/commit/301221673140c958a07a48d470b8fbb432cc664b))
* **deps:** update mantine monorepo to v8 ([#483](https://github.com/neiist-dev/neiist-website/issues/483)) ([6573447](https://github.com/neiist-dev/neiist-website/commit/6573447459d67eb62791a8bad74bde3ff055ed85))
* **deps:** update mantine monorepo to v8.1.2 ([#501](https://github.com/neiist-dev/neiist-website/issues/501)) ([05382d2](https://github.com/neiist-dev/neiist-website/commit/05382d23cfa858c8af4232f83c7af96bdf9ccde6))
* **deps:** update mantine monorepo to v8.1.3 ([#508](https://github.com/neiist-dev/neiist-website/issues/508)) ([1c916f6](https://github.com/neiist-dev/neiist-website/commit/1c916f6e5fe110f0811fb4c498fd2237bd780052))
* **deps:** update mantine monorepo to v8.2.1 ([#522](https://github.com/neiist-dev/neiist-website/issues/522)) ([ef68d08](https://github.com/neiist-dev/neiist-website/commit/ef68d084a4c53a7998b21f06b3b8ed8dd06f5517))
* **deps:** update mantine monorepo to v8.2.2 ([#535](https://github.com/neiist-dev/neiist-website/issues/535)) ([64c29f6](https://github.com/neiist-dev/neiist-website/commit/64c29f618f913a9651bb7e05cc20623dce0cffe8))
* **deps:** update mantine monorepo to v8.2.4 ([#539](https://github.com/neiist-dev/neiist-website/issues/539)) ([5498d0d](https://github.com/neiist-dev/neiist-website/commit/5498d0d83eff2c7ae78f1657124c57d1cc55cdc7))
* **deps:** update mantine monorepo to v8.3.1 ([#550](https://github.com/neiist-dev/neiist-website/issues/550)) ([9260b67](https://github.com/neiist-dev/neiist-website/commit/9260b67e0f1c304946bb4d82b05e0b575c0765cf))
* **deps:** update react monorepo to v19 ([#404](https://github.com/neiist-dev/neiist-website/issues/404)) ([d57d5c9](https://github.com/neiist-dev/neiist-website/commit/d57d5c9edfa86f99b5dbbf079b59e96296b6c353))
* **deps:** update react monorepo to v19.1.1 ([#531](https://github.com/neiist-dev/neiist-website/issues/531)) ([97247cf](https://github.com/neiist-dev/neiist-website/commit/97247cf946d854866ce6a036aabb88f3dd72c243))
* **deps:** update security deps ([377a5d3](https://github.com/neiist-dev/neiist-website/commit/377a5d3a9255de16c3ea17f75683146057a615b6))
* **deps:** update test deps ([d2ec546](https://github.com/neiist-dev/neiist-website/commit/d2ec5460cd6edd9a2fbae712426197e61239b836))
* **dev-tools:** add pre-commit hook, fix setup script ([0a58854](https://github.com/neiist-dev/neiist-website/commit/0a588546f74363c06b429a3798e7c3f07f41b034))
* **dev-tools:** SIGINT on yarn dev stops docker container ([0a68173](https://github.com/neiist-dev/neiist-website/commit/0a68173f9f0626ccffd3228c3c9aec9059375e89))
* **dev-tools:** updated eslint config for new format used & pre-commit script ([a40d587](https://github.com/neiist-dev/neiist-website/commit/a40d587a34d0575474f19ba08268ffcbfe89e3d0))
* **dinner-shop:** orderKind derivation form cart items category ([5f2b47a](https://github.com/neiist-dev/neiist-website/commit/5f2b47a6de07b1e1ca3a6412aa642f2ad2620061))
* **dinner:** remove fullscreen from waiting page (only be used to ([de3b5b8](https://github.com/neiist-dev/neiist-website/commit/de3b5b819293130a75879fecfda606c1388df766))
* **docker:** fix naming in docker-compose ([427a370](https://github.com/neiist-dev/neiist-website/commit/427a370cb2b512956d995e9274933032b1a69784))
* docs for installation and setup of dev env ([2428b23](https://github.com/neiist-dev/neiist-website/commit/2428b23f1eb593435b2cf5bd1cca4cb64105c2b4))
* email now says location to pickup ([d3be9a8](https://github.com/neiist-dev/neiist-website/commit/d3be9a86f6595e85a86b495832614972e2bac5bb))
* **email:** use gmail app password ([37d22cb](https://github.com/neiist-dev/neiist-website/commit/37d22cb0a7294446f3aff49b1a209c75855d97a4))
* errors arising from previous merge commit ([35be157](https://github.com/neiist-dev/neiist-website/commit/35be157daf2abf3159f045875f75c33510c9c7e2))
* fix Hero and Activities css module issues ([a3b0669](https://github.com/neiist-dev/neiist-website/commit/a3b0669e51dc91b1b08dbf3f41f299c2d464f24e))
* **footer-link:** changed page link to reflect correct page ([775bf80](https://github.com/neiist-dev/neiist-website/commit/775bf8025ebf26824fc3605844b386bb4726f615))
* **fullscreen:** full screen wrapper ([2dd5e4c](https://github.com/neiist-dev/neiist-website/commit/2dd5e4c9401c9b604d20b96d61d55ec984e78efd))
* function order to allow creation of db tables ([b275a36](https://github.com/neiist-dev/neiist-website/commit/b275a3624ed749b378f52913b7bfcf6a906b9fb7))
* gitignore ([7fb1b5a](https://github.com/neiist-dev/neiist-website/commit/7fb1b5ae0ad508d63a2b98c38b3551e64a282449))
* Highlight coordinators styling and cleared code. ([7da84b5](https://github.com/neiist-dev/neiist-website/commit/7da84b5548d1f6c6de068144143e9a1998703658))
* hydration flash on userdata on website reload after login ([e6a8999](https://github.com/neiist-dev/neiist-website/commit/e6a89997ba17effdfe19111a678b87bb56b61ec5))
* ignoring python venv and ensuring init script is run with bash ([28a8b87](https://github.com/neiist-dev/neiist-website/commit/28a8b87636f9620f937260b96f13abc04210bb42))
* image imports homepage ([8e807f8](https://github.com/neiist-dev/neiist-website/commit/8e807f8288ea34c48973f9cb505764fb3180cc27))
* improve color selection by showing variant colors as colored circles ([962f28a](https://github.com/neiist-dev/neiist-website/commit/962f28a080712e5d908f5601582bb0ee6b5e39b4))
* improve viewport settings and enhance footer styling for better layout ([55eab40](https://github.com/neiist-dev/neiist-website/commit/55eab402a7be14871d14a18126e1e90357137b7c))
* increase payload limit for URL-encoded data in storeRoute ([1f53aff](https://github.com/neiist-dev/neiist-website/commit/1f53aff2f64d67d59f9de1f7f841f9af9f7b802f))
* inline editing on safari and webkit browsers ([848d851](https://github.com/neiist-dev/neiist-website/commit/848d85156ead2e5f710a21ef0e823a409650f78e))
* location tag on events sync ([45dffa2](https://github.com/neiist-dev/neiist-website/commit/45dffa24425e0c77ac8257c328fce50fdf8df119))
* logout redurect use next base url ([b18ee94](https://github.com/neiist-dev/neiist-website/commit/b18ee94a3c35d534d61a635914d9dbbcec4b3984))
* **memberCard:** show linkedin username ([e2283f9](https://github.com/neiist-dev/neiist-website/commit/e2283f944a9e36148b569d537b9d5ec6c1472051))
* memberships api permissions fixed, better variables names and error ([b19b828](https://github.com/neiist-dev/neiist-website/commit/b19b8284dbed2658a4ea10652b1176ede285b0be))
* middleware allow images from public folder ([84cfc02](https://github.com/neiist-dev/neiist-website/commit/84cfc026faaed1bc334caa885d80383547eeb681))
* middleware serve images from public (png, svg) ([8fe9449](https://github.com/neiist-dev/neiist-website/commit/8fe9449903f04f3aae137469189146c0461cc175))
* mobile scalling for activities slider and about-us team grid ([6672721](https://github.com/neiist-dev/neiist-website/commit/6672721fa1d02448c1db6f99cf22332a5371f69f))
* mobile scalling on the shop and product details page ([05d65c0](https://github.com/neiist-dev/neiist-website/commit/05d65c0161f555fc3b234492e252fe4955de6f28))
* name of hero assets ([1deadc4](https://github.com/neiist-dev/neiist-website/commit/1deadc4c5a3a03c754902b64e00a0a6578f2efb7))
* navbar closing animation on mobile ([e2b9b7e](https://github.com/neiist-dev/neiist-website/commit/e2b9b7e1e5d01568bf145b5816f65c4cb8ff70ea))
* new fuzzy search params for User search on NewOrderModal ([a740f1e](https://github.com/neiist-dev/neiist-website/commit/a740f1e4c1717a06ceedb090eeb296213d886955))
* new membership data type + code refactor ([bed3dce](https://github.com/neiist-dev/neiist-website/commit/bed3dceebc0d2bc320b8adb50df4f334442a7332))
* new orders stock override dialog formating ([df55824](https://github.com/neiist-dev/neiist-website/commit/df55824bab164b0196c4ab738088f65103324f15))
* notion api auth headers for google calendar integration ([3a333f1](https://github.com/neiist-dev/neiist-website/commit/3a333f1963e83b4b5ee6c263d68ee9cce41f5443))
* notion api database query method ([f79655d](https://github.com/neiist-dev/neiist-website/commit/f79655dc6117a20de6db775c28dad51ab335bd97))
* notion api webhook with validation using @notionhq/client ([82c7f51](https://github.com/neiist-dev/neiist-website/commit/82c7f514faa09f9eb2c6f808493bf6b8e3bf60b7))
* notion calemndar api using webhook and cache ([9a7aed5](https://github.com/neiist-dev/neiist-website/commit/9a7aed5c065977e166accda4fe464db9eed06622))
* orderKind payment methods for Jantar de Curso ([2545e9f](https://github.com/neiist-dev/neiist-website/commit/2545e9fc8486c44e024c0564f05b7ec941f53dfa))
* password mismatch example env and setup.sh with schema ([05cbb8d](https://github.com/neiist-dev/neiist-website/commit/05cbb8dc548bc8d39b531112f69d6eab5cdf81d3))
* paths to .md files ([4aa43ae](https://github.com/neiist-dev/neiist-website/commit/4aa43ae2108549f62410d7d4b1bd73a02316bce0))
* **payment:** correct enum for POS payment methods for normal categories ([f1054df](https://github.com/neiist-dev/neiist-website/commit/f1054dfc80fdacf112e89e1c2a3c31742db1a3bc))
* phone number saving on new order creation and user order canceling ([0abda28](https://github.com/neiist-dev/neiist-website/commit/0abda28b41eedb551a2524b884d5ac8c226592c2))
* photo management card ([a53cf59](https://github.com/neiist-dev/neiist-website/commit/a53cf592891946cd5f1c4a665cfc1138402cd8d8))
* Product Details images. ([6d64956](https://github.com/neiist-dev/neiist-website/commit/6d6495680591bfa5baa3edba05bfe3dcb021b587))
* **products:** image upload format ([4e8b8c0](https://github.com/neiist-dev/neiist-website/commit/4e8b8c089f06ee7a405c8da3ba8b6ca31efde0f6))
* profile page css ([2a8bada](https://github.com/neiist-dev/neiist-website/commit/2a8bada2e69e9a81fb18ce0701e49d1fdb73f1d7))
* **profile:** now able to delete contacts methods and update the data on the locked section can only be changed on fenix ([269c04d](https://github.com/neiist-dev/neiist-website/commit/269c04dbe9301596a92da5c0c6f5df4893dadf5e))
* **redirect:** fix data autofill redirect behavior in OrderDetails [#444](https://github.com/neiist-dev/neiist-website/issues/444) ([a93a1c5](https://github.com/neiist-dev/neiist-website/commit/a93a1c5e89b627fd7d1318dbdf0e7948226c9fee))
* refactor excel orders export ([5177190](https://github.com/neiist-dev/neiist-website/commit/51771909f360fe8c7d3dc7892be421fcac8debfc))
* remove broken dependencies from the shop ([ab35cc6](https://github.com/neiist-dev/neiist-website/commit/ab35cc66cee448948060c8eaca0d6397cc4eb289))
* remove debug console.log from DivPersonCard component ([1cd4837](https://github.com/neiist-dev/neiist-website/commit/1cd483739db9184fce729fa8960aad55da97b24f))
* remove redundant express.json() ([5c806d5](https://github.com/neiist-dev/neiist-website/commit/5c806d5d02c0de3bb3beb128861475ded92f669e))
* remove unused fenix (tecnico api v2) scopes ([713253f](https://github.com/neiist-dev/neiist-website/commit/713253f90b47ca2f93dd220dcb0024105edb5d47))
* route url redirect to confirmation page ([0cae6c0](https://github.com/neiist-dev/neiist-website/commit/0cae6c0cac8ae85a467fcd1d40730bd975b9ced2))
* **scripts:** input validation in setup.sh and remove deprecated version in docker-compose.yml. ([e963034](https://github.com/neiist-dev/neiist-website/commit/e963034f36c03f2295783019cde024b5ad30bb99))
* search users on NewOrderModal ([238cfd1](https://github.com/neiist-dev/neiist-website/commit/238cfd160411012eff4b1a5e12abcff256371b64))
* **setup:** Script was referencing old location of script. ([77368e8](https://github.com/neiist-dev/neiist-website/commit/77368e840fef2f66b79838b562e3ef68bb739d43))
* shop schema name for payment_checked_by ([3f530f1](https://github.com/neiist-dev/neiist-website/commit/3f530f1beb92f4c292d429e121834531fcb241b6))
* **shop:** allow add-to-cart for products without variants ([75811d3](https://github.com/neiist-dev/neiist-website/commit/75811d305528ba98574b44e2ba3042b0b2beeb67))
* **shop:** change max upload size of files for images ([1fd57bc](https://github.com/neiist-dev/neiist-website/commit/1fd57bc699e7ee8f06cc2d861b819cdfa86522f3))
* **shop:** correctly identify OrderKind on CheckoutForm and ProductDetails ([4f970fb](https://github.com/neiist-dev/neiist-website/commit/4f970fbc3ebdcba1dfa9ee9d199de4c18ad671ad))
* **shop:** css changes ([5af7d4c](https://github.com/neiist-dev/neiist-website/commit/5af7d4cbada744ac328111a8776c45aec5caf2ec))
* **shop:** new messages for payment order overlay confirmation ([9987bfe](https://github.com/neiist-dev/neiist-website/commit/9987bfe273ed36fd1f5e9ed4f81dd97949791fc4))
* **shop:** show apple pay option correct ([fc9a688](https://github.com/neiist-dev/neiist-website/commit/fc9a688e8666f9f7e1ad753bf1e83e12efa41cd3))
* **shop:** variant order and block cart updates for special categories ([967ec51](https://github.com/neiist-dev/neiist-website/commit/967ec51d908f5b82c3509b06d37e58f245c6514a))
* show all academic years on the about us page ([01ed4c7](https://github.com/neiist-dev/neiist-website/commit/01ed4c7986d83d2e5b88ea8c1675c59bcf8944eb))
* show first name, last name and position on the user menu ([d7617d5](https://github.com/neiist-dev/neiist-website/commit/d7617d5d214de8d917abca62431e49f2a4e29f24))
* small scalling issues on mobile and larger screens ([c664894](https://github.com/neiist-dev/neiist-website/commit/c664894748cf73927c3cd77a0c1aa410662f87bb))
* sql getter functions ([60e1fa4](https://github.com/neiist-dev/neiist-website/commit/60e1fa444b20615cbf585a35ae716c7ca05bd829))
* style of descprition on the activity card ([1d66e5d](https://github.com/neiist-dev/neiist-website/commit/1d66e5d1e770b12c94db3582090f4b0157066ce3))
* **style:** about us description font size and scalling. Home page activities scalling on mobile ([4fb25ea](https://github.com/neiist-dev/neiist-website/commit/4fb25ea5add94907316966c42a7254940475d467))
* **styles:** mobile scalling fixed for some components. ([b445e3b](https://github.com/neiist-dev/neiist-website/commit/b445e3bb10109bbc223b5d608b419a644d49f7e0))
* sumup use amount information from db not client ([4e5304a](https://github.com/neiist-dev/neiist-website/commit/4e5304a911fe2608e63e5291b276eea998c70970))
* **sumup:** better product descprition ([e9adf9b](https://github.com/neiist-dev/neiist-website/commit/e9adf9b1e6713659a6ccc0da54d7fc21c3cb1323))
* **sumup:** send complete descprition with list of products in order, ([86178f4](https://github.com/neiist-dev/neiist-website/commit/86178f40a9d6a7893dd808ec4667f636fd117d0a))
* typo on campus settings on email template ([e246431](https://github.com/neiist-dev/neiist-website/commit/e246431bf68cd694a817387b029ad7f92c24fcaa))
* typo on deploy actions ([660d965](https://github.com/neiist-dev/neiist-website/commit/660d965c79c38079b70516f94ec716c78af66667))
* **UnauthorizedPage:** fixed size it is now centenred and shows footer and navbar. ([9433131](https://github.com/neiist-dev/neiist-website/commit/9433131662c4e5e857ebfecaa0a67926b7cce63a))
* update NavBar and ShopPage content; correct order deadline in products ([3065c45](https://github.com/neiist-dev/neiist-website/commit/3065c459f1883b61814224121acb4dde07292aca))
* update Node.js version to 24.11.1 in .nvmrc and installation guide ([2747fd2](https://github.com/neiist-dev/neiist-website/commit/2747fd2b2c64685862ad616e64ddf2dab11b619d))
* Updated url of links in the user menu. ([27f5cc0](https://github.com/neiist-dev/neiist-website/commit/27f5cc041908287f77990f63dee44b684a1154a5))
* use webcal for google calendar subscripition ([5b277c7](https://github.com/neiist-dev/neiist-website/commit/5b277c71a28f729060cff1561fb0fbbf44f56bec))
* **userContext:** user context now auto reload on sucessful login ([ca7059d](https://github.com/neiist-dev/neiist-website/commit/ca7059d5c286dfae20cd6fc9e14426cf6cb1d476))
* when adding a new department it ask/reminds the user to add the new roles for that department. ([8ea7c9d](https://github.com/neiist-dev/neiist-website/commit/8ea7c9dff7fb456cb911a2e2d55a3ee2d06ba644))

## 1.10.1

### Patch Changes

- Added MBWay as a payment method in checkout flows where it is allowed by order-kind rules.
- Updated the Jantar de Curso pending email to include MBWay payment instructions and the assigned number.
- Added deterministic MBWay number allocation from a configured pool, with each configured number weighted for up to 30 allocations.

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
