# Changelog

## v0.7.0

<!-- generated comparing v0.6.0..master -->

_Sep 20, 2024_

A big thanks to the 5 contributors who made this release possible. Here are some highlights ✨:

- **BREAKING** Dynamic navigation segments can't have a leading slash (`/orders/:id` should be `orders/:id`)
- Make it possible to override title and breadcrumbs in PageContainer for dynamic routes.
- Upgrade `path-to-regexp` to fix vulnerabilities.

### `@toolpad/core`

- Fixes for docs and DashboardLayout component (#4104) @apedroferreira
- Make PageContainer customizable for dynamic routes (#4114) @Janpot

### Docs

- Add Toolpad Core readme video (#4006) @prakhargupta1
- Add integration, base concepts (#4080) @bharatkashyap
- add maxwidth section in the page container docs (#4103) @prakhargupta1
- Fix typo from feedback (#4105) @Janpot

### Core

- Update/correct toolpad repository links in package.json (#4113) @Janpot
- Update path-to-regexp to 6.3.0 (#4126) @Janpot
- Rename repo to mui/toolpad (#4062) @Janpot
- Bring CI to node 20 (#4038) @Janpot
- Fix redirection @oliviertassinari
- Fix 301 link to Next.js and git diff @oliviertassinari
- Copy vale-action.yml from main repo @oliviertassinari
- Fix Vale error @oliviertassinari
- [core] Fix package.json repository rule @oliviertassinari
- Fix 301 link to authjs @oliviertassinari

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @Janpot, @oliviertassinari, @prakhargupta1

## v0.6.0

<!-- generated comparing v0.5.2..master -->

_Sep 13, 2024_

A big thanks to the 6 contributors who made this release possible. Here are some highlights ✨:

- Migrate to Material UI v6
- Collapsible sidebar in `DashboardLayout` component with mini drawer variant
- Support route patterns in navigation
- Add more OAuth providers to `SignInPage`
- Docs and website improvements

### `@toolpad/core`

- Use outlined button for logout (#4016) @Janpot
- Clean templates, fix a bunch of issues in generated apps (#4040) @bharatkashyap
- Add mini drawer variant to DashboardLayout (#4017) @apedroferreira
- Add more OAuth providers to `SignInPage` (#3933) @bharatkashyap
- Refactor `<Account />` (#3992) @bharatkashyap
- Add toolbarActions and toolbarAccount slots to DashboardLayout (#3984)
- Migrate to Material UI v6 (#3862) @Janpot
- Support route patterns in navigation (#3991) @apedroferreira

### Docs

- Adjust DashboardLayout documentation to link to AppProvider more clearly (#4083) @apedroferreira
- Fix 301 link @oliviertassinari
- Add missing end of sentence ponctuation @oliviertassinari
- Link docs from component demos on Toolpad Core landing page (#4013) @prakhargupta1
- Remove the list of upcoming features (#4041) @prakhargupta1
- Add `next-auth` v4 example (#3982) @bharatkashyap
- Fix 404 links @oliviertassinari
- Add signed in state as default on `<Account />` docs (#3970) @bharatkashyap
- Strengthen CSP (#4075) @oliviertassinari
- Explain props of text-field component with demos (#4012) @prakhargupta1

### Core

- Update renovate.json @Janpot
- Update package.json @Janpot
- Update netlify.toml to install with `--frozen-lockfile` (#4014) @Janpot
- Upgrade monorepo (#4010) @Janpot @apedroferreira
- Remove unnecessary lock file (#4011) @Janpot
- Adds reusable workflow for new issue cleanup (#4077) @michelengelen
- Adds reusable workflow for closing messages (#4076) @michelengelen
- Fix Calendly link for Toolpad Studio demo (#4035) @prakhargupta1

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @Janpot, @michelengelen, @oliviertassinari, @prakhargupta1

## v0.5.2

<!-- generated comparing v0.5.1..master -->

_Aug 27, 2024_

A big thanks to the 4 contributors who made this release possible. Here are some highlights ✨:

- Add authentication when bootstrapping a new project using `create-toolpad-app`
- Fix some layout issues in the component attribute editor for Studio
- Docs and website improvements

### `@toolpad/core`

- Bootstrap authentication from `create-toolpad-app` (#3860) @bharatkashyap
- Polish `SignInPage` and docs (#3935) @bharatkashyap

### `@toolpad/studio`

- Fix layout issues in the component attribute editor (#3966) @Janpot

### Docs

- Clarify contribution guide references @oliviertassinari
- Fix description of eslint-plugin-material-ui @oliviertassinari
- Fix Core docs navigation sidebar links (#3986) @bharatkashyap
- Follow theme on `SignInPage` docs demos (#3968) @bharatkashyap
- Sign-in page grammar (#3977) @bharatkashyap
- Improve docs and address some ahrefs reported 404s (#3928) @Janpot
- Fix redirection to react tree fiber @oliviertassinari
- Update to have API page URLs built correctly (#3999) @bharatkashyap
- Add og image (#3965) @prakhargupta1
- Add missing <Head> (#3939) @oliviertassinari
- Fix brand copy (#3938) @bharatkashyap
- Improve hero (#3936) @bharatkashyap

### Core

- Update renovate.json @Janpot
- Update renovate.json @Janpot
- Fully resolve imports in ESM target (#3975) @Janpot

All contributors of this release in alphabetical order: @bharatkashyap, @Janpot, @oliviertassinari, @prakhargupta1

## v0.5.1

<!-- generated comparing v0.5.0..master -->

_Aug 9, 2024_

A big thanks to the 5 contributors who made this release possible. Here are some highlights ✨:

- Support Material UI v5 and v6 in `@toolpad/core`, especially regarding CSS variables themes
- Fix theme switcher in documentation examples
- Fix DashboardLayout bugs with theming and mobile navigation
- Fix some file handling restrictions in `@toolpad/studio`

### `@toolpad/core`

- Replace `CssVarsProvider` with `ThemeProvider` (#3872) @siriwatknp
- Match v5 compatibility (#3906) @bharatkashyap
- Fix some DashboardLayout bugs and make some docs examples more consistent (#3905) @apedroferreira
- Refix mobile menu closing when link is clicked (#3915) @apedroferreira
- Remove @mui/base dependency from @toolpad/core (#3912) @Janpot
- Add test for nested routes in PageContainer (#3840) @Janpot

### `@toolpad/studio`

- Increase body-parser limit (#3903) @Janpot
- Support Blob in js expressions (#3907) @Janpot

### Core

- Support `require` (#3908) @bharatkashyap
- Port fixes from Material UI v6 migration branch (#3910) @Janpot
- Upgrade monorepo (#3911) @Janpot
- Clarify security policy @oliviertassinari
- Update smoke test instructions (#3899) @Janpot

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @Janpot, @oliviertassinari, @siriwatknp

## v0.5.0

<!-- generated comparing v0.4.0..master -->

_Aug 5, 2024_

A big thanks to the 4 contributors who made this release possible. Here are some highlights ✨:

This is the first production-ready release of Toolpad Core! This version includes:

- A new SignInPage component
- Updates to the `create-toolpad-app` CLI to bootstrap Toolpad Core projects
- Many documentation updates and improvements

### Breaking Changes

The `create-toolpad-app` CLI now by default bootstraps a Toolpad Core project.

Please use the `--studio` flag to generate a Toolpad Studio project.

### `@toolpad/core`

- Add authentication to Toolpad Core (#3609) @bharatkashyap
- Make Core the default project (#3868) @bharatkashyap
- Make navigation item segments optional (#3838) @apedroferreira
- Ensure Material UI v5 compatibility (#3894) @Janpot
- Bring in some fixes from the next update branch (#3866) @Janpot

### Docs

- Improve DashboardLayout navigation docs (#3864) @apedroferreira
- Fix Core example (#3847) @bharatkashyap
- Fix issues with DashboardLayout in Toolpad Core homepage (#3893) @apedroferreira
- Fix grid layout in examples (#3848) @Janpot
- Fix missing Studio examples grid (#3897) @bharatkashyap
- Add PageContainer content and make the theme follow the docs theme (#3895) @Janpot
- Improve Core tutorial (#3874) @bharatkashyap
- Core docs edits (#3844) @prakhargupta1

### Core

- Upgrade `inquirer` to `@inquirer/prompts` (#3843) @bharatkashyap
- Export `@mui/toolpad/internals` (#3873) @Janpot

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @Janpot, @prakhargupta1

## v0.4.0

<!-- generated comparing v0.3.2..master -->

_Jul 25, 2024_

A big thanks to the 4 contributors who made this release possible. Here are some highlights ✨:

Adds a new `PageContainer` component to wrap page content, add titles, breadcrumbs and custom action toolbars! Also, adds the ability to add actions to the sidebar navigation. Miscellaneous fixes and docs improvements.

### `@toolpad/core`

- Add PageContainer component (#3713) @Janpot
- Tweak navigation API (#3794) @Janpot
- Add navigation actions (#3776) @apedroferreira

### Docs

- Bring back studio landing page (#3828) @Janpot
- Fix mobile menu in landing page (#3829) @apedroferreira
- Fix theme switcher in Toolpad Core landing page (#3837) @apedroferreira
- Remove absolute url from get started button (#3832) @Janpot
- Fix landing page warnings (#3830) @Janpot
- Use the latest version for Toolpad Core (#3834) @bharatkashyap
- Add Toolpad core landing page (#3690) @prakhargupta1

### Core

- OOM issues during build (#3825) @Janpot
- Fix theming bugs (#3809) @apedroferreira
- Fix create-toolpad-app content margin (#3813) @Janpot

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @Janpot, @prakhargupta1

## v0.3.2

<!-- generated comparing v0.3.1..master -->

_Jul 19, 2024_

A big thanks to the 3 contributors who made this release possible. Here are some highlights ✨:

This release adds a theme switcher and a responsive drawer to the App Layout component.

### `@toolpad/core`

- Make DashboardLayout navigation responsive (#3750) @apedroferreira
- Add theme switcher to dashboard layout (#3674) @apedroferreira
- Remove data providers (#3797) @Janpot

### Docs

- Add tabs example (#3803) @Janpot
- Migrate Grid2 in the docs to fix landing page layout (#3790) @Janpot

### Core

- Remove lib dom from create-toolpad-app (#3796) @Janpot
- Link GH issue for import/prefer-default-export @oliviertassinari
- Improve changelog format (#3789) @Janpot

All contributors of this release in alphabetical order: @apedroferreira, @Janpot, @oliviertassinari

## v0.3.1

<!-- generated comparing v0.3.0..master -->

_Jul 12, 2024_

A big thanks to the 5 contributors who made this release possible. Here are some highlights ✨:

Improve Toolpad home page, add persistent state hooks to Toolpad Core and fix some performance issues in Toolpad Studio production apps.

- Remove dead code (#3754) @Janpot
- Lock file maintenance (#3740) @renovate[bot]
- Lock file maintenance Docs (#3743) @renovate[bot]
- Lock file maintenance Examples (#3742) @renovate[bot]
- Lock file maintenance Docs (#3741) @renovate[bot]
- [cli] Add information when `--example` is present (#3749) @bharatkashyap
- [code-infra] Use `@mui/docs` where possible (#3751) @LukasTy
- [core] Fix a few performance issues in Toolpad production apps (#3756) @Janpot
- [core] Optimize studio production build (#3755) @Janpot
- [core] Implement persistent state hooks (#3696) @Janpot
- [docs] Update to match monorepo script (#3753) @bharatkashyap
- [docs] Use product demo video of the onboarding on the landing page (#3555) @Janpot
- [security] Slightly improve CSP header (#3757) @oliviertassinari

All contributors of this release in alphabetical order: @bharatkashyap, @Janpot, @LukasTy, @oliviertassinari, @renovate[bot]

## v0.3.0

<!-- generated comparing v0.2.0..master -->

_Jun 28, 2024_

A big thanks to the 6 contributors who made this release possible. Here are some highlights ✨:

This release adds Dialogs and Notifications hooks to Toolpad Core! Supporting the Next.js Pages router in the Core playground app. Small feature addition to Studio as well: Column Pinning. More tests and documentation fixes.

- Update README.md @Janpot
- Update README.md @Janpot
- [Update readme] Add openssf badge and fix browerstack logo (#3694) @prakhargupta1
- Implement notifications/dialogs RFCs (#3584) @Janpot
- Add Next.js pages router app to Toolpad Core playground (#3588) @apedroferreira
- Run toolpad/core tests in the browser (#3640) @Janpot
- Add dashboard tutorial to introduction (#3637) @Janpot
- Lock file maintenance Docs (#3623) @renovate[bot]
- [AppProvider] Create basic router adapters (#3638) @Janpot
- [code-infra] Add eslint plugin for testing-library (#3648) @Janpot
- [core] Remove update-monorepo.yml (#3712) @oliviertassinari
- [core] Add browserslistrc (#3711) @Janpot
- [core] dedupe emotion and react-query (#3695) @Janpot
- [core] Fix a few more React compiler warnings (#3644) @Janpot
- [core] Remove quickjs-emscripten dependency (#3689) @Janpot
- [DataContext] Support global filtering (#3618) @Janpot
- [docs] Fix link icons for file reference section titles (#3709) @Janpot
- [docs] Fix incorrect heading (#3636) @bharatkashyap
- [docs-infra] Sync \_app file with monorepo (#3698) @Janpot
- [studio] Add column pinning (#3693) @Janpot
- [Studio] Remove old canvas entrypoint (#3642) @Janpot
- [test] Enable test coverage for @toolpad/core (#3697) @Janpot
- [test] Test from the user's perspective with user-event (#3670) @Janpot
- [test] Data grid CRUD tests (#3646) @Janpot

## v0.2.0

<!-- generated comparing v0.1.55..master -->

_Jun 3, 2024_

A big thanks to the 6 contributors who made this release possible. Here are some highlights ✨:

First components in @toolpad/core: [DashboardLayout](https://github.com/mui/toolpad/discussions/3309#:~:text=per%20authentication%20page.-,Dashboard%20layout,-provides%20UI%20for), DataGrid and LineChart. Initial [data providers](https://github.com/mui/toolpad/discussions/3311) implementation.

- Lock file maintenance (#3622) @renovate[bot]
- Lock file maintenance Examples (#3624) @renovate[bot]
- Add Next.js app router Toolpad Core playground (#3587) @apedroferreira
- Isolate api-docs-builder deps @Janpot
- isolate react-docgen @Janpot
- Update renovate.json @Janpot
- Group vite dependency updates @Janpot
- Generate API docs for Toolpad Core (#3536) @apedroferreira
- Add DashboardLayout component to @toolpad/core (#3554) @apedroferreira
- Some fixes from new react compiler eslint plugin (#3562) @Janpot
- Update renovate.json @Janpot
- Updates to project setup (#3561) @Janpot
- Add keywords and other info in package.json (#3556) @prakhargupta1
- Toolpad Core build process (#3552) @apedroferreira
- Group docs dependencies for renovate bot @Janpot
- Bring back some dependency update grouping (#3551) @Janpot
- [core] Initial DataGrid component (#3558) @Janpot
- [core] Base typescript projects on the file location instead of on cwd (#3580) @Janpot
- [DataGrid] Data provider create and update fixes (#3621) @Janpot
- [DataGrid] Add height property (#3612) @Janpot
- [DataProvider] Support custom Id field (#3613) @Janpot
- [docs] Start Toolpad Core docs (#3383) @bharatkashyap
- [docs] Add Toolpad core tutorial example (#3617) @bharatkashyap
- [docs] Add badges like in Material UI @oliviertassinari
- [docs] Add badges like in Material UI @oliviertassinari
- [docs] Add badges like in Material UI @oliviertassinari
- [docs] Update twitter.com to x.com @oliviertassinari
- [docs] Support demo previews with comments (#3577) @Janpot
- [docs] Fix demo codesandbox dependencies (#3578) @Janpot
- [docs] Keep referrer for GA (#3530) @oliviertassinari
- [LineChart] initial LineChart (#3611) @Janpot

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @Janpot, @oliviertassinari, @prakhargupta1, @renovate[bot]

## v0.1.55

<!-- generated comparing v0.1.54..master -->

_May 8, 2024_

A big thanks to the 7 contributors who made this release possible. Here are some highlights ✨:

Add max width option to page container, auto-scroll to selected elements, support enabling/disabling initial visibility in Data Grid columns, environment variable preview fixes, fix functions on Windows, add deployment guides for some other platforms.

- Add max width option to the page (#3484) @Janpot
- Changes required for the React integration (#3493) @Janpot
- feat: add auto-scroll to canvas elements when selected from panel (#3344) @b4s36t4
- Lock file maintenance Examples (#3486) @renovate[bot]
- Lock file maintenance (#3485) @renovate[bot]
- Work on decoupling studio server constituents (#3482) @Janpot
- Update README files (#3463) @prakhargupta1
- Remove dead code (#3460) @Janpot
- Fix custom components for id cells (#3459) @Janpot
- Fix performance regression (#3458) @Janpot
- Link/Update docs in Studio (#3448) @prakhargupta1
- Fix default value not initializing for controlled properties (#3445) @Janpot
- Revert using published @mui/docs (#3440) @Janpot
- Fix issues from trying MUI ESM branch (#3417) @Janpot
- Fix environment binding preview (#3413) @Janpot
- Use url.pathToFileURL to correctly resolve functions paths on windows (#3412) @Janpot
- Remove renovate grouping (#3325) @Janpot
- Remove unsupported engines section from renovate (#3376) @Janpot
- fix: Duplicate entry in `CHANGELOG.md` (#3388) @bharatkashyap
- [code-infra] Closer sync with eslint config of codebase (#3441) @oliviertassinari
- [core] Support toggling initial visibility of columns (#3490) @Janpot
- [core] ESLint unification (#3488) @oliviertassinari
- [core] Remove react pages experiment (#3483) @Janpot
- [core] Update monorepo (#3424) @oliviertassinari
- [core] Match other .eslintrc.js files @oliviertassinari
- [core] Add notes to help future blame (#3426) @oliviertassinari
- [core] Use the root dependency (#3425) @oliviertassinari
- [core] Remove engine please-use-pnpm (#3399) @oliviertassinari
- [docs] Fix pnpm install command (#3525) @konekoya
- [docs] Fix Netlify preview 301 JS assets @oliviertassinari
- [docs] [ui] Make Pro badge style consistent (#3418) @bharatkashyap
- [docs] Fix typos on the roadmap page @oliviertassinari
- [docs] Make sure we install the latest version of Toolpad Studio (#3454) @oliviertassinari
- [docs] Remove MarkdownElement import (#3451) @Janpot
- [docs] Add documentation on how to create controlled properties (#3444) @Janpot
- [docs] Add a guide on how to deploy on railway (#3381) @prakhargupta1
- [docs] Remove double redirections (#3415) @bharatkashyap
- [docs] Fix broken paths, meta for ahrefs (#3409) @bharatkashyap
- [docs] Fix some of the double redirections (#3411) @oliviertassinari
- [docs] Add guide on deployment to Google cloud (#3387) @prakhargupta1
- [docs] Revert monorepo update (#3403) @Janpot
- [docs] Fix trailing slashes on server render (#3402) @Janpot
- [docs] Remove more traces of yarn (#3400) @oliviertassinari
- [ux] Disable Open in editor button if no function is selected (#3492) @bharatkashyap

All contributors of this release in alphabetical order: @b4s36t4, @bharatkashyap, @Janpot, @konekoya, @oliviertassinari, @prakhargupta1, @renovate[bot]

## v0.1.54

<!-- generated comparing v0.1.53..master -->

_Apr 12, 2024_

A big thanks to the 8 contributors who made this release possible. Here are some highlights ✨:

Adds groupable and aggregable columns for the Premium data grid, a faster editor for Toolpad Studio, and introduces Toolpad Core under `--core` on the CLI! Plus a new custom components example, multiple documentation updates and bug fixes.

- Update renovate.json @Janpot
- Update renovate.json @Janpot
- Add RFC to readme (#3353) @prakhargupta1
- Move TreeView icons into the theme (#3337) @Janpot
- Lock file maintenance (#3351) @renovate[bot]
- Fix screenshot flakeyness (#3341) @Janpot
- Add rename, duplicate and delete for Page Hierarchy (#3336) @asif-choudhari
- Upgrade vite (#3340) @Janpot
- Add custom component example (#3329) @Janpot
- Fix dedupe check (#3330) @Janpot
- Fix crash when components folder contains a tsconfig (#3327) @Janpot
- Allow OPTIONS method in HTTP queries (#3308) @Janpot
- Remove fallback modules (#3326) @Janpot
- Update Node.js in circleci (#3324) @Janpot
- Update renovate.json @Janpot
- Update renovate.json @Janpot
- Fix typo : use npm instead of pnpm in instruction (#3323) @HazzazBinFaiz
- [cli] Introduce `--core` (#3304) @bharatkashyap
- [code-infra] Use @mui/docs from npm (#3301) @michaldudak
- [code-infra] Fix prettier in scripts (#3382) @Janpot
- [core] Move Monaco setup outside of the library (#3206) @Janpot
- [core] Make inline canvas the default (#3370) @Janpot
- [core] Remove deprecated usage of LicenseInfo (#3372) @Janpot
- [core] Continue rename of Toolpad @oliviertassinari
- [DataGrid] Add support for groupable and aggregable columns (#3369) @Janpot
- [docs] Improve the writing on the "why Toolpad" doc (#3377) @Janpot
- [docs] Update delete-grid-row.md (#3354) @prakhargupta1
- [docs] remove redirect to component reference (#3356) @Janpot
- [examples] Premium grid example (#3360) @Janpot
- [queries] Remove locally hosted demo data (#3374) @Janpot
- [ui] Add a chip to indicate pro features (#3358) @bharatkashyap

All contributors of this release in alphabetical order: @asif-choudhari, @bharatkashyap, @HazzazBinFaiz, @Janpot, @michaldudak, @oliviertassinari, @prakhargupta1, @renovate[bot]

## v0.1.53

<!-- generated comparing v0.1.52..master -->

_Mar 22, 2024_

A big thanks to the 5 contributors who made this release possible. Here are some highlights ✨:

Very early first version of @toolpad/core, fix examples, and documentation fixes and updates.

- Remove deprecated dependencies (#3313) @Janpot
- Remove lerna isolation (#3312) @Janpot
- Toolpad core project setup (#3291) @apedroferreira
- isolate lerna in renovatebot @Janpot
- Remove renovatebot vitest-fail-on-console exception @Janpot
- Fix flaky authentication test: Wait for network idle in tests again (#3290) @apedroferreira
- Fix flaky auth test with console error "Failed to fetch" (#3287) @apedroferreira
- Update renovate.json @Janpot
- [code-infra] Update renove.json (#3288) @Janpot
- [core] Lower the frequency of no-response action runs (#3302) @michaldudak
- [core] Use Circle CI context @oliviertassinari
- [docs] Fix support link (#3306) @oliviertassinari
- [docs] Link blog post from examples overview page and some minor edits. (#3299) @prakhargupta1
- [docs] Fix Vale error @oliviertassinari
- [docs] Fix some Vale errors (#3293) @oliviertassinari
- [examples] @toolpad/studio@0.1.51 doesn't exist @oliviertassinari

All contributors of this release in alphabetical order: @apedroferreira, @Janpot, @michaldudak, @oliviertassinari, @prakhargupta1

## v0.1.52

<!-- generated comparing v0.1.51..master -->

_Mar 9, 2024_

A big thanks to the 2 contributors who made this release possible. Here are some highlights ✨:

Preparing the repository and documentation for an upcoming change to Toolpad: the low-code features will live in `@toolpad/studio`, while components, functions and utilies for building dashboards and internal tools will live in `@toolpad/core`!

- Rename Toolpad to Toolpad Studio (#3238) @apedroferreira
- [docs] Split Toolpad into Studio and Core (#3250) @bharatkashyap
- [website] Add star count fallback (#3278) @bharatkashyap

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap

## v0.1.51

<!-- generated comparing v0.1.50..master -->

_Mar 4, 2024_

A big thanks to the 8 contributors who made this release possible. Here are some highlights ✨:

This release contains mostly bug fixes and improvements to the docs, eamples and stability.
It will be the last release of @mui/toolpad before we rename the package to @toolpad/studio.

- Add list, datepicker and textfield component guides (#2827) @prakhargupta1
- Isolate Next.js in renovatebot @Janpot
- Lock file maintenance (#3263) @renovate[bot]
- Update monorepo (#3259) @Janpot
- Remove isInvalid prop from all components (#3260) @apedroferreira
- Global functions explorer and header (#2690) @apedroferreira
- Add scroll fixes to DataGrid skeleton loading (#3257) @Janpot
- Image error overlay fixes (#3256) @Janpot
- Stabilize visual regression tests (#3253) @Janpot
- Add some missing docs for the hasNextPage property (#3255) @Janpot
- Add a data providers CRUD page to basic crud app example (#3211) @prakhargupta1
- Fix and improve resizing in editor (incl. Add Spacer component) (#2818) @apedroferreira
- Make building layout visual tests more stable (#3237) @apedroferreira
- Update CONTRIBUTING.md (#3114) @apedroferreira
- Show loading indicator when runtime config is loading in query editor (#3169) @Janpot
- Fix unintentional page rows being created (#3221) @apedroferreira
- Prevent app header from covering page elements (#3220) @apedroferreira
- chore(deps): bump @mui/toolpad to 0.1.50 (#3219) @renovate[bot]
- Update CHANGELOG.md (typo) @apedroferreira
- [code-infra] Use the @mui/internal-markdown package (#3235) @michaldudak
- [code-infra] Bump monorepo (#3232) @Janpot
- [code-infra] Remove pnpm cache on CircleCI (#3133) @Janpot
- [code-infra] Disable renovatebot semantic commits (#3224) @Janpot
- [code-infra] Use `experimental.cpus` to control amount of export workers in Next.js (#3222) @Janpot
- [core] Fix infinite loop in inline canvas mode (#3265) @Janpot
- [core] add engines field to @mui/toolpad package.json (#3254) @JerryWu1234
- [DataGrid] fix errors not showing up in the rows area (#3264) @Janpot
- [docs] Prefer https links @oliviertassinari
- [docs-infra] Fixes for vale-action with shared config (#3234) @bharatkashyap
- [docs-infra] Fix Stack Overflow breaking space @oliviertassinari
- [docs-infra] Add vale for style-guide lint on docs (#3178) @bharatkashyap
- [examples] Hacker News client example (#2170) @Janpot

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @Janpot, @JerryWu1234, @michaldudak, @oliviertassinari, @prakhargupta1, @renovate[bot]

## v0.1.50

<!-- generated comparing v0.1.49..master -->

_Feb 15, 2024_

A big thanks to the 5 contributors who made this release possible. Here are some highlights ✨:

Move editor canvas inline, add authenticated session data to server context, fix bugs in drag-and-drop, data grid and editable tree items, improve project setup documentation and add authentication examples for Google and GitHub.

- Show save/discard for created record when updateRecords is unavailable (#3215) @Janpot
- Add documentation about installing Toolpad in an existing project (#3214) @Janpot
- Reroute "open in editor" link in app preview (#3207) @Janpot
- Add authentication examples (#3135) @apedroferreira
- Make sure the inline canvas uses the correct font (#3208) @Janpot
- Remove semicolon from jsx (#3210) @iamsaumya
- Fix vm shim in the editor (#3189) @Janpot
- Remove second usePageTitle from RenderedLowCodePage (#3204) @iamsaumya
- Create predictably named test directories (#3194) @Janpot
- Fix test for code components under new editor runtime (#3193) @Janpot
- Correct test urls for canvas tests (#3192) @Janpot
- Fix undo/redo in new canvas implementation (#3191) @Janpot
- Add authenticated session to app server context (#3157) @apedroferreira
- Fix editable tree item bugs (#3187) @apedroferreira
- Fix project loading several times (#3188) @Janpot
- Add pie chart future component (#3185) @Janpot
- Fix drag-and-drop when dragging outside components (#3177) @apedroferreira
- [code-infra] Deprecate usage of the next export command (#3217) @Janpot
- [core] Fix link to issue template @oliviertassinari
- [core] Add canvas mode that doesn't rely on vite (#3171) @Janpot
- [core] Define routes statically (#3176) @Janpot
- [docs] Fix typo @oliviertassinari
- [docs] Fix spelling of GitHub @oliviertassinari

All contributors of this release in alphabetical order: @apedroferreira, @iamsaumya, @Janpot, @oliviertassinari, @renovate[bot]

## v0.1.49

<!-- generated comparing v0.1.48..master -->

_Feb 8, 2024_

A big thanks to the 5 contributors who made this release possible. Here are some highlights ✨:

- Adds **authentication and authorization** support with Google, GitHub, and Azure AD (_paid_), along with detailed documentation on how to get up and running.

- Miscellaneous bug fixes and maintenance work.

- Authentication fixes/improvements (#3174) @apedroferreira
- Add isCanvas into app host context (#3170) @Janpot
- Fix a few react-resizable-panels warnings (#3173) @Janpot
- Improve package layout (#3148) @Janpot
- Add authorization docs (#3067) @apedroferreira
- Authentication/authorization tests (#3056) @apedroferreira
- Update renovate.json @Janpot
- fix: "Unexpected token ';'" in expressions with trailing ';' (#3147) @bharatkashyap
- Lock file maintenance (#3150) @renovate[bot]
- Add stronger warning to the auto generated files to avoid hand-editing (#3146) @Janpot
- Add RBAC with Azure AD authentication provider (#3077) @apedroferreira
- Run prettier (#3144) @Janpot
- Update monorepo (#3134) @apedroferreira
- [code-infra] Avoid aliasing to the monorepo dependencies (#3137) @Janpot
- [core] [docs] Add warnings, docs and gating for paid features (#3156) @bharatkashyap
- [core] Use non breaking spaces (#3145) @oliviertassinari
- [core] Sync with main repo @oliviertassinari
- [docs] Fix 301 link @oliviertassinari

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @Janpot, @oliviertassinari, @renovate[bot]

## 0.1.48

<!-- generated comparing v0.1.47..master -->

_Jan 26, 2024_

Fixing a failed release

## 0.1.47

<!-- generated comparing v0.1.46..master -->

_Jan 25, 2024_

A big thanks to the 3 contributors who made this release possible. Here are some highlights ✨:

Small improvements to documentation and examples, general cleanup and enhancements for more stability.

- Improve portability of ToolpadApp (#3126) @Janpot
- Run prettier on files after generating schema json (#3123) @Janpot
- Add missing dependencies to the next.js example (#3124) @Janpot
- Move App dom to Toolpad core (#3116) @Janpot
- In the readme.md replaced product demo video with gif (#3069) @prakhargupta1
- Remove old package.json (#3101) @Janpot
- Adjust schedule for monorepo update (#3112) @Janpot
- Make toolpad-core and toopad-components ESM only (#3099) @Janpot
- Remove types and useBoolean proxy modules (#3088) @Janpot
- [docs] `;` causes query to fail (#3119) @bharatkashyap

All contributors of this release in alphabetical order: @bharatkashyap, @Janpot, @prakhargupta1

## 0.1.46

<!-- generated comparing v0.1.45..master -->

_Jan 17, 2024_

A big thanks to the 2 contributors who made this release possible. Here are some highlights ✨:

Improvements to authorization and data providers, and some behind-the-scenes clean up!

- Fix screenshot flakeyness (#3087) @Janpot
- Load dotenv/config before reading the config (#3085) @Janpot
- Tweak data providers UI in the grid (#3084) @Janpot
- Improve authorization middleware (#3048) @apedroferreira
- Add universal required email configuration for authentication (#3047) @apedroferreira
- [code-infra] Replace hardcoded repository in monorepo update script (#3092) @Janpot
- [code-infra] Add monorepo update script (#3091) @Janpot
- [core] Use pnpm (#3065) @Janpot

All contributors of this release in alphabetical order: @apedroferreira, @Janpot

## 0.1.45

<!-- generated comparing v0.1.44..master -->

_Jan 12, 2024_

A big thanks to the 3 contributors who made this release possible. Here are some highlights ✨:

Enable creating rows in data providers. Support pnpm as a package manager for installing Toolpad. Improvements to our new query editor.

- Make Toolpad apps compatible with pnpm (#3074) @Janpot
- Handle errors during data provider introspection (#3076) @Janpot
- Update help text of --install flag in create-toolpad-app (#3072) @Janpot
- Don't create private packages with create-toolpad-app (#3073) @Janpot
- Add serverside row creation (#3058) @Janpot
- Revert pnpm migration (#3064) @Janpot
- Fix mismatch in query names (#3054) @bharatkashyap
- Remove cache from useStorageState (#3057) @Janpot
- add pnpmDedupe to renovate.json (#3062) @Janpot
- [code infra] pnpm take 2 (#2546) @Janpot
- Remove react-devtools (#3044) @Janpot
- [core] Remove issue emoji @oliviertassinari

All contributors of this release in alphabetical order: @bharatkashyap, @Janpot, @oliviertassinari

## 0.1.44

<!-- generated comparing v0.1.43..master -->

_Jan 3, 2024_

A big thanks to the 4 contributors who made this release possible. Here are some highlights ✨:

More live examples, some documentation fixes.

- Hosted 5 more examples on railway and linked them to docs (#3043) @prakhargupta1
- Add authentication (#2925) @apedroferreira
- Lock file maintenance (#3040) @renovate[bot]
- [docs] Fix dead link to live demo (#3041) @oliviertassinari
- [docs] Fix example image scale @oliviertassinari
- [docs] Fix 301 link to Render.com @oliviertassinari
- [docs] Lint next.config.mjs (#3027) @oliviertassinari

All contributors of this release in alphabetical order: @apedroferreira, @oliviertassinari, @prakhargupta1, @renovate[bot]

## 0.1.43

<!-- generated comparing v0.1.42..master -->

_Dec 28, 2023_

A big thanks to the 3 contributors who made this release possible. Here are some highlights ✨:

Happy holidays! House keeping, minor documentation updates and some clean up to the marketing website.

- [chore] Upgrade monorepo 5.15.2 (#3033) @bharatkashyap
- [code-infra] Sync bug issue template (#3029) @oliviertassinari
- [core] Fix use of correct CSS syntax @oliviertassinari
- [core] Yaml format match most common convention @oliviertassinari
- [core] Delete strange issue template (#3025) @oliviertassinari
- [docs] Fix typo (#3032) @bharatkashyap
- [docs] Flatten the getting-started folder (#3028) @oliviertassinari
- [docs] Fix missing issue template (#3026) @oliviertassinari
- [website] Update the social preview image (#3031) @danilo-leal

## 0.1.42

<!-- generated comparing v0.1.41..master -->

_Dec 22, 2023_

A big thanks to the 5 contributors who made this release possible. Here are some highlights ✨:

This week: a big overhaul to the query editor! Improved titles for pages in the sidebar. Support server-side row updates for the data grid.

- Remove components from appDom (#3017) @Janpot
- Introduce pagesManifest (#3016) @Janpot
- Add labels to form validation properties (#3015) @Janpot
- Guess proper default page titles based on page name (#3014) @Janpot
- Remove functions worker (#3013) @Janpot
- Add a new query panel (#2393) @bharatkashyap
- Support updating rows in the data provider (#3001) @Janpot
- Improve styling of the application navigation (#2993) @Janpot
- Bring in some fixes from pnpm migration branch (#3010) @Janpot
- Update yarn.lock (#3008) @apedroferreira
- Update monorepo (#2998) @apedroferreira
- fix 2527, customize page name (#2850) @JerryWu1234
- Fix changelog (#2995) @apedroferreira
- [docs] Update documentation for query panel (#3000) @bharatkashyap
- [docs] Fix 301 links @oliviertassinari

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @Janpot, @JerryWu1234, @oliviertassinari

## 0.1.41

<!-- generated comparing v0.1.40..master -->

_Dec 13, 2023_

A big thanks to the 3 contributors who made this release possible. Here are some highlights ✨:

Support server-side sorting and filtering, support delete in data providers.

- improve vite omptimizeDeps after recent dataSource updates (#2990) @Janpot
- Support serverside sorting/filtering (#2982) @Janpot
- Fix formatting for Date objects in the grid (#2984) @Janpot
- Open links in the same tab unless configured otherwise (#2983) @Janpot
- Support delete in data providers (#2978) @Janpot
- Initial authorization implementation (#2931) @Janpot
- Update custom server nextjs README.md (#2977) @prakhargupta1
- [core] Update workflows and issue templates to reflect the updated label (#2992) @MBilalShafi
- [core] Update `no-response` workflow (#2989) @MBilalShafi

All contributors of this release in alphabetical order: @Janpot, @MBilalShafi, @prakhargupta1

## 0.1.40

<!-- generated comparing v0.1.39..master -->

_Dec 7, 2023_

A big thanks to the 5 contributors who made this release possible. Here are some highlights ✨:

Some important fixes, code pages UI improvements, preparation for new features and docs improvements!

- Fix sizing of page container (#2974) @Janpot
- Fix crash when a query name is the same as a page name (#2975) @Janpot
- Move custom server documentation to concepts section (#2972) @prakhargupta1
- Add json-schema url to yaml files (#2970) @Janpot
- Add a new feature as default Value (#2922) @JerryWu1234
- Unclutter UI for code pages (#2961) @Janpot
- Update release instructions smoke test (#2958) @Janpot
- Remove id from examples (#2959) @Janpot
- [core] Upgrade monorepo (#2979) @bharatkashyap
- [docs] Why Toolpad? iteration (#2854) @oliviertassinari
- [examples] Polish examples (#2962) @oliviertassinari
- [WIP] Allow importing server functions in custom pages (#2953) @Janpot

All contributors of this release in alphabetical order: @bharatkashyap, @Janpot, @JerryWu1234, @oliviertassinari, @prakhargupta1

## 0.1.39

<!-- generated comparing v0.1.38..master -->

_Dec 1, 2023_

A big thanks to the 4 contributors who made this release possible. Here are some highlights ✨:

Pages are now routed to by their name. Bug fixes.

- Make routing page name based (#2949) @Janpot
- Update monorepo (#2955) @Janpot
- Tweak titles to improve SERP results (#2954) @Janpot
- Allow omitting page.yml for code pages (#2947) @Janpot
- Use ESM for CLI (#2920) @Janpot
- Update documentation for HTTP requests secret handling (#2951) @prakhargupta1
- Refactor virtual files implementation (#2946) @Janpot
- Make page title optional in the yml files (#2948) @Janpot
- Update CONTRIBUTING.md (#2940) @Janpot
- Fix Toolpad not picking a free port (#2943) @Janpot
- Fix crash when function result type contains a constructor property (#2941) @Janpot
- Fix Date serialization in serverless functions (#2942) @Janpot
- Link the latest 3 examples to the overview page (#2933) @prakhargupta1
- [docs] Fix 404 regressions in the docs (#2939) @oliviertassinari
- [examples] Run Next.js and Toolpad together (#2918) @Janpot

All contributors of this release in alphabetical order: @Janpot, @oliviertassinari, @prakhargupta1, @renovate[bot]

## v0.1.38

<!-- generated comparing v0.1.37..master -->

_Nov 23, 2023_

A big thanks to the 4 contributors who made this release possible. Here are some highlights ✨:

Support custom code files for pages, fixes for the CLI tool, documentation improvements for examples and other behind the scenes work!

- Fix reactDevtools build location for dev mode (#2921) @Janpot
- Try out circleci parallelism (#2895) @Janpot
- Update README of examples with new CTA instructions (#2885) @Janpot
- Improve custom server documentation (#2898) @Janpot
- Remove --create option from toolpad CLI (#2899) @Janpot
- Isolate tsx in renovate.json (#2905) @Janpot
- Fix failing CTA test (#2900) @Janpot
- Update instructions for smoke testing the release (#2894) @Janpot
- [core] Upgrade monorepo (#2926) @bharatkashyap
- [core] Rename OpenCollective @oliviertassinari
- [docs] Add button and datagrid component guide, split Managing state doc (#2678) @prakhargupta1
- [docs] Add README to Stripe example (#2892) @bharatkashyap
- [experiment] Support custom code files for pages (#2891) @Janpot

All contributors of this release in alphabetical order: @bharatkashyap, @Janpot, @oliviertassinari, @prakhargupta1

## 0.1.37

<!-- generated comparing v0.1.36..master -->

_Nov 10, 2023_

A big thanks to the 4 contributors who made this release possible. Here are some highlights ✨:

Allow bootstrapping examples with `create-toolpad-app`, support integrating Toolpad apps programmatically in custom servers. Bind any HTTP query variable to an environment variable. Support a new Switch component.

- Support create-toolpad-app --example argument (#2884) @Janpot
- Add custom server documentation (#2879) @Janpot
- Link issues in docs (#2890) @prakhargupta1
- Support running multiple handlers side-by-side in a custom server (#2882) @Janpot
- charts example (#2880) @prakhargupta1
- Fix editor command failing on master (#2881) @Janpot
- Add instructions to start the editor for custom servers (#2878) @Janpot
- Add Toolpad editor command for connecting to custom servers (#2800) @Janpot
- Allow binding query parameters to environment variables (#2777) @JerryWu1234
- Close the editor vite devserver when the program exits (#2877) @Janpot
- Fix a deprecation message in the tests (#2876) @Janpot
- Add Switch component as a variant to Checkbox (#2787) @JerryWu1234
- Remove PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD (#2855) @Janpot
- [docs] Fix images width overflow on Firefox (#2874) @bharatkashyap

All contributors of this release in alphabetical order: @bharatkashyap, @Janpot, @JerryWu1234, @prakhargupta1

## 0.1.36

<!-- generated comparing v0.1.35..master -->

_Nov 3, 2023_

A big thanks to the 1 contributor who made this release possible. Here are some highlights ✨:

Fix app not loading due to ESM issues in charts.

- Fix ESM charts issues in production (#2861) @apedroferreira

All contributors of this release in alphabetical order: @apedroferreira

## 0.1.35

<!-- generated comparing v0.1.34..master -->

_Nov 2, 2023_

A big thanks to the 6 contributors who made this release possible. Here are some highlights ✨:

Use `@mui/x-charts` in Chart component, better preview header in apps, fix port option alias, add Stripe and Supabase examples.

- Add supabase example showcasing list component (#2851) @prakhargupta1
- Migrate Chart component to X charts library (#2500) @apedroferreira
- Fix port option alias (#2847) @Janpot
- Add preview header to custom server (#2845) @Janpot
- Update monorepo (#2852) @apedroferreira
- Lock file maintenance (#2849) @renovate[bot]
- Remove crypto-js (#2843) @Janpot
- [docs] Casing consistency @oliviertassinari
- [docs] Add Stripe script example (#2477) @bharatkashyap

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @Janpot, @oliviertassinari, @prakhargupta1, @renovate[bot]

## 0.1.34

<!-- generated comparing v0.1.33..master -->

_Oct 25, 2023_

A big thanks to the 2 contributors who made this release possible. Here are some highlights ✨:

Improvements to the Support page, some fixes to the tests.

- Update Support URL in Help menu (#2832) @bharatkashyap
- Fix flaky tests (#2812) @apedroferreira
- [core] Monorepo upgrade (#2825) @bharatkashyap
- [docs] A few Support page improvements (#2824) @bharatkashyap

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap

## 0.1.33

<!-- generated comparing v0.1.32..master -->

_Oct 19, 2023_

A big thanks to the 6 contributors who made this release possible. Here are some highlights ✨:

Add a new password option to the TextField component, improvements to the docs and examples, and some core infrastructure updates!

- Add support page (#2807) @prakhargupta1
- Link WASM example to overview page and improve crud app (#2726) @prakhargupta1
- Run prettier on project (#2811) @apedroferreira
- Changed MenuItem to ToggleButton (#2776) (#2796) @biplobsd
- Add password option to TextField Component (#2797) @Kirera-Wainaina
- Add tests for custom server (#2798) @Janpot
- Improve release docs wording (#2794) @Janpot
- Isolate project runtime from editor (#2788) @Janpot
- Remove babel-plugin-transform-rename-import (#2786) @Janpot
- Update release process (#2793) @Janpot
- Fix creating new page with blur and default name + scroll only below explorer headers (#2790) @apedroferreira
- Turn integration tests into a yarn workspace (#2783) @Janpot
- [docs] Update Data Providers (#2813) @bharatkashyap
- [docs] Add 'Why Toolpad?' (#2632) @prakhargupta1

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @biplobsd, @Janpot, @Kirera-Wainaina, @prakhargupta1

## 0.1.32

<!-- generated comparing v0.1.31..master -->

_Oct 12, 2023_

A big thanks to the 4 contributors who made this release possible. Here are some highlights ✨:

Added new data providers feature. Improved UX around the pages explorer. Added new Markdown and Link components.

- Fix createDataProvider imports in the integration tests (#2780) @Janpot
- Remove container sx default (#2779) @Janpot
- Use a context to distribute project API (#2766) @Janpot
- Demonstrate how data providers can be used with prisma (#2774) @Janpot
- Unify preview and canvas entrypoints (#2760) @Janpot
- Use toggle buttons for text mode property (#2764) @Janpot
- Add Markdown and Link components (#2763) @Janpot
- fix lock file @Janpot
- Block next.js from updating (#2768) @Janpot
- New page creation UX (#2728) @apedroferreira
- Introduce Data providers (#2644) @Janpot
- Update monorepo (#2758) @apedroferreira
- Simplify the editor RPC implementation (#2756) @Janpot
- Allow integrating toolpad applications in a custom server (#2747) @Janpot
- Move the perf cascade CSS file to the HarViewer component (#2755) @Janpot
- [core] Smoothen edges on the new Editable Tree component (#2778) @bharatkashyap
- [core] Revert Next to v13.4.19 @oliviertassinari

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @Janpot, @oliviertassinari

## 0.1.31

<!-- generated comparing v0.1.30..master -->

_Oct 4, 2023_

A big thanks to the 5 contributors who made this release possible. Here are some highlights ✨:

Add component search box, fix editor failing to open, allow custom base path for Toolpad applications, improve automatic formatting of binding expressions.

- Fix Data grid invalid date handling (#2748) @Janpot
- Fix editor failing to open (#2745) @Janpot
- add a search box on the top (#2692) @JerryWu1234
- Add global sidebar (#2730) @apedroferreira
- format IDE code (#2674) @JerryWu1234
- Move server files to the src folder (#2746) @Janpot
- Update PULL_REQUEST_TEMPLATE.md @mbrookes
- Support --base option to set a custom base path (#2740) @Janpot
- Remove Chart as future component (#2738) @Janpot
- Isolate the Toolpad router from Toolpad server (#2735) @Janpot
- Correct types of component labels (#2736) @Janpot
- Run required PR label action on synchronize event (#2734) @Janpot
- Refactor cli interface (#2729) @Janpot
- [docs] Fix docs title regression (#2739) @oliviertassinari
- [docs] Header captialization with sidenav consistency @oliviertassinari

All contributors of this release in alphabetical order: @apedroferreira, @Janpot, @JerryWu1234, @mbrookes, @oliviertassinari

## 0.1.30

<!-- generated comparing v0.1.29..master -->

_Sep 28, 2023_

A big thanks to the 3 contributors who made this release possible. Here are some highlights ✨:

Some more documentation improvements, move to Vitest and minor bug fixes.

- fix 2704 (#2725) @JerryWu1234
- Fix prettier changes script (#2722) @Janpot
- Remove unused address dependency (#2723) @Janpot
- yarn prettier @oliviertassinari
- Move to vitest (#2709) @Janpot
- Run full prettier in CI (#2713) @Janpot
- Improve docs language consistency (#2715) @Janpot
- Fix typo in docs description (#2714) @Janpot
- Update monorepo (#2712) @Janpot
- [core] Sync prism-okaidia.css with docs-infra @oliviertassinari
- [core] Straight quotes & website monorepo change @oliviertassinari

All contributors of this release in alphabetical order: @Janpot, @JerryWu1234, @oliviertassinari

✨ Done in 1.32s.

## 0.1.29

<!-- generated comparing v0.1.28..master -->

_Sep 22, 2023_

A big thanks to the 6 contributors who made this release possible. Here are some highlights ✨:

Documentation improvements. Fix handling of dates in the data grid.

- Update package.json (#2708) @JerryWu1234
- Fix create-toolpad-app for absolute paths (#2682) @Janpot
- Fix DataGrid date inferencing (#2706) @Janpot
- Fix reset the value and fix 404 (#2693) @JerryWu1234
- Add with-wasm example (#2700) @Janpot
- hoist documentation dependencies again (#2701) @Janpot
- Memory optimizations (#2689) @Janpot
- Remove useEvent in favor for @mui/utils useEventCallback (#2702) @Janpot
- Update theming docs (#2672) @Janpot
- Bring in some fixes from #2546 (#2687) @Janpot
- Remove unused eslint-plugin-prettier (#2688) @Janpot
- Unify useDom, useDomLoader and useAppState (#2677) @Janpot
- Avoid reloading queries twice on changes (#2675) @Janpot
- Explicit dependencies (#2673) @Janpot
- Update monorepo (#2681) @apedroferreira
- Remove unused hook (#2671) @Janpot
- [docs] Fix incorrect nomenclature (#2705) @bharatkashyap
- [docs] Add file structure concepts page (#2636) @prakhargupta1
- [docs] Replace some images, gifs with videos (#2662) @prakhargupta1
- [website] Improve loading image @oliviertassinari

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @Janpot, @JerryWu1234, @oliviertassinari, @prakhargupta1

## 0.1.28

<!-- generated comparing v0.1.27..master -->

_Sep 13, 2023_

A big thanks to the 5 contributors who made this release possible. Here are some highlights ✨:

Support date and time formats in DataGrid, upgrade to Node 18, fix container components, respect user's prettier config when formatting files.

- Simplify component loading (#2667) @Janpot
- Fix gap and direction in layout slots (#2653) @apedroferreira
- Support date/dateTime formatting (#2589) @Janpot
- Remove monaco-editor special case in renovatebot (#2663) @Janpot
- format component and function (#2665) @JerryWu1234
- Upgrade react-inspector (#2647) @Janpot
- Remove fetch polyfills for node 18 (#2651) @Janpot
- respect the user's prettier config when writing yml files (#2638) @JerryWu1234
- Allow execa update (#2654) @Janpot
- Fix container components (#2635) @apedroferreira
- Upgrade to Node 18 (#2505) @apedroferreira
- [docs] Simpler package readme @oliviertassinari
- [docs] Fix /toolpad/reference/api/get-context/ 404 (#2656) @oliviertassinari
- [docs] Fix description @oliviertassinari
- [docs] Fix 404 link @oliviertassinari
- [docs] Sync prism with docs-infra (#2652) @oliviertassinari
- [examples] Migrate to railsway (#2646) @oliviertassinari
- [refactor] Refactor worker rpc (#2645) @Janpot
- [website] Tweak a few elements on the landing page (#2666) @danilo-leal
- [website] Remove dead code @oliviertassinari
- [website] Fix redirection @oliviertassinari

All contributors of this release in alphabetical order: @apedroferreira, @danilo-leal, @Janpot, @JerryWu1234, @oliviertassinari

## 0.1.27

<!-- generated comparing v0.1.26..master -->

_Sep 6, 2023_

A big thanks to the 8 contributors who made this release possible. Here are some highlights ✨:

Add support for setting cookies inside custom functions, add a Checkbox component and link docs to more places inside the app!

- Fix stackblitz issues with setCookie (#2641) @Janpot
- Support setCookie API (#2630) @Janpot
- Replace @mui/lab with @mui/x-tree-view (#2639) @Janpot
- Fix TreeView types after core update (#2634) @Janpot
- [Toolpad Editor] Add tooltip to custom component subtitle (#2612) @rohanprasadofficial
- [Toolpad Editor] Fix Markdown text alignment issue (#2591) @rohanprasadofficial
- [Toolpad Editor] Fix : text component alignment rendering (#2587) @rohanprasadofficial
- fix add a new property placeholder (#2622) @JerryWu1234
- Improve visual test for resizing columns (#2610) @apedroferreira
- Disallow binding to event handlers and list templates (#2600) @Janpot
- Exclude esm folder from icons alias (#2606) @Janpot
- add checkbox (#2494) @JerryWu1234
- Fix typo in the code snippet of createComponent API (#2605) @Janpot
- Lock file maintenance (#2604) @renovate[bot]
- Lock file maintenance (#2603) @renovate[bot]
- [core] Finish migration to GA4 @oliviertassinari
- [docs] Add live apps link to the homepage examples (#2633) @prakhargupta1
- [docs] Rename Examples group (#2628) @bharatkashyap
- [docs] Open docs link in a new page @oliviertassinari
- [docs] Fix references @oliviertassinari
- [docs] Fix shell layout @oliviertassinari
- [docs] Clean-up examples (#2611) @oliviertassinari
- [docs] Official URL (#2609) @oliviertassinari
- [refactor] Move Toolpad runtime to the RPC mechanism (#2582) @Janpot
- [website] Fix `NpmCopyButton` placement (#2640) @bharatkashyap

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @Janpot, @JerryWu1234, @oliviertassinari, @prakhargupta1, @renovate[bot], @rohanprasadofficial

## 0.1.26

<!-- generated comparing v0.1.25..master -->

_Aug 31, 2023_

A big thanks to the 8 contributors who made this release possible. Here are some highlights ✨:

Improve date columns on the grid, Support `Intl` in bindings.

- Add visual regression tests for text component (#2593) @Janpot
- Auto-create a theme when the user starts editing (#2594) @Janpot
- Show page parameters in url form and add link to docs (#2577) @Kirera-Wainaina
- [Toolpad Editor] Add tooltip to display more dropdown (#2590) @rohanprasadofficial
- Stabilize query editor screenshots (#2584) @Janpot
- [Toolpad Editor] Add themes docs link to theme panel (#2583) @rohanprasadofficial
- Bypass server context for stackblitz (#2579) @Janpot
- Improve columns editor UX (#2570) @Janpot
- Allow using Intl in bindings (#2586) @Janpot
- Stabilize visual regression test (#2574) @Janpot
- fix 2467_AutoComplete (#2540) @JerryWu1234
- Allow theme files to not specify a palette (#2556) @Janpot
- Auto parse date strings on data grids (#2371) @bharatkashyap
- Fix query editor panels orientation (#2557) @Janpot
- Remove lodash from @mui/components (#2545) @Janpot
- Update monorepo (#2544) @apedroferreira
- Refactor Toolpad App Navigation (#2535) @Janpot
- [core] Remove dead code (#2580) @oliviertassinari
- [core] Remove S3 orb from circleci config (#2547) @Janpot
- [docs] add graphQL to overview page and add 2 readme docs (#2576) @prakhargupta1
- [Docs] Add initial steps of creating a custom component (#2534) @prakhargupta1
- [website] Add GA4 events (#2532) @bharatkashyap

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @Janpot, @JerryWu1234, @Kirera-Wainaina, @oliviertassinari, @prakhargupta1, @rohanprasadofficial

## 0.1.25

<!-- generated comparing v0.1.24..master -->

_Aug 23, 2023_

A big thanks to the 4 contributors who made this release possible. Here are some highlights ✨:

Add GraphQL example app, add descriptions to component docs, improve resizable panels, improve custom component creation UX, simplify page layouts.

- Stall package updates for dependencies that require node 18 (#2533) @Janpot
- Add more examples page (#2447) @prakhargupta1
- React resizable panels (#2398) @Janpot
- Make module exports compatible with node module resolution in TypeScript (#2522) @Janpot
- Require a helperText for builtin components and argTypes (#2456) @Janpot
- Fix esbuild warning (#2521) @Janpot
- Improve open code editor snackbar (#2520) @Janpot
- Add graphQL example (#2471) @prakhargupta1
- Update bug template to ask for specific environment (#2513) @Janpot
- Add an explanation on why the use of structuredClone in the canvas (#2514) @Janpot
- Avoid single child layout containers (#2388) @apedroferreira
- [docs] Add 'Miscellaneous' section to How-to guides (#2524) @bharatkashyap
- [website] Fix typo (#2530) @bharatkashyap

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @Janpot, @prakhargupta1

## 0.1.24

<!-- generated comparing v0.1.23..master -->

_Aug 17, 2023_

A big thanks to the 6 contributors who made this release possible. Here are some highlights ✨:

Add support for reading cookies in custom functions, allow editing page title from the page editor UI and other miscellaneous fixes!

- Fix falsy prop updates (#2495) @apedroferreira
- Chart adjustments (#2493) @apedroferreira
- Support reading cookies in backend functions (#2491) @Janpot
- Fix issues with vite deps optimizer (#2490) @Janpot
- fix background color style (#2326) @JerryWu1234
- Update npm stats example to use new chart component (#2385) @apedroferreira
- Update monorepo (#2475) @apedroferreira
- [core] Upgrade monorepo (#2496) @bharatkashyap
- [core] Fix confusing component nomenclature (#2479) @bharatkashyap
- [core] Set GitHub Action top level permission @oliviertassinari
- [core] Remove dead code HTML meta (#2476) @oliviertassinari
- [docs] Cleanup (#2497) @bharatkashyap
- [docs] Fix 301 reports in ahrefs @oliviertassinari
- [Enhancement] Edit page title from page editor (#2480) @Kirera-Wainaina

## 0.1.23

<!-- generated comparing v0.1.22..master -->

_Aug 10, 2023_

A big thanks to the 8 contributors who made this release possible. Here are some highlights ✨:

Chart component improvements, add scrolling to pages in app sidebar, Windows fixes, UI fixes, test and app cleanup improvements.

- Fix cycle of SIGINT disposal event (#2472) @apedroferreira
- Clean up env watcher and build contexts on process exit (#2461) @Janpot
- Fix full page error overflow (#2460) @Janpot
- Fix app not starting in Windows (10) (#2442) @apedroferreira
- Remove ses (#2462) @Janpot
- Chart improvements from npm stats example update (#2400) @apedroferreira
- add scroll (#2459) @JerryWu1234
- Bring back grid remount to update columns (#2450) @Janpot
- Gracefully shut down Toolpad editor (#2443) @Janpot
- Fix new components not showing up when component folder doesn't exist (#2454) @Janpot
- Improve undo/redo test flakyness (#2455) @Janpot
- Improve setup time of tests (#2452) @Janpot
- Improve prisma example (#2441) @prakhargupta1
- Update ensure triage label workflow (#2444) @DanailH
- Remove some Next.js leftovers around monaco-editor (#2437) @Janpot
- Improve rest test flakyness (#2438) @Janpot
- Remove logging of RPC errors (#2410) @Janpot
- Scope MUI X license to builtin components only (#2427) @Janpot
- Clean up worker communication with devserver (#2418) @Janpot
- Add note about why we need usePolling (#2426) @Janpot
- Adjust timeout and import node-fetch in create-toolpad-app test (#2414) (#2419) @Kirera-Wainaina
- Increase localApp fixture timeout (#2416) @Janpot
- [docs] Follow Docs-infra default design (#2458) @oliviertassinari
- [docs] Improve deployment instructions (#2440) @bharatkashyap
- [docs] Fix 404s (#2424) @bharatkashyap

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @DanailH, @Janpot, @JerryWu1234, @Kirera-Wainaina, @oliviertassinari, @prakhargupta1

## 0.1.22

<!-- generated comparing v0.1.21..master -->

_Aug 3, 2023_

A big thanks to the 6 contributors who made this release possible. Here are some highlights ✨:

Performance improvements in resource usage and startup time. Improve the chart component. Continue refining the page hierarchy explorer. Fix problems with renaming pages.

- Improve Toolpad startup time (#2412) @Janpot
- Update monorepo (#2411) @Janpot
- Components explorer improvements (#2397) @bharatkashyap
- Improve docs (#2394) @prakhargupta1
- Fix Windows EBUSY error when removing files during tests (#2401) @apedroferreira
- Delete old page while adding new page (#2171) @JerryWu1234
- Avoid running the server in a separate process (#2381) @Janpot
- Chart component improvements (#2343) @apedroferreira
- Refactor deleting nodes (#2322) @apedroferreira
- Remove redundant integration tests section from contribution docs (#2383) @apedroferreira
- Upgrade monorepo (#2382) @apedroferreira
- Decrease memory usage of functions in production mode (#2354) @Janpot
- Fix examples order in home page (#2375) @prakhargupta1
- Fix rest tests flakyness around env reloading (#2363) @Janpot
- Automerge Toolpad updates in the examples (#2364) @Janpot
- [core] Fix pnpm install instruction @oliviertassinari
- [Docs] Connect to Google sheet (#2223) @prakhargupta1
- [docs] Get ready for next docs-infra change @oliviertassinari
- [docs] Improve the docs (#2366) @oliviertassinari
- [docs] Fine for production (#2356) @oliviertassinari
- [website] Add "Book Demo" button (#2405) @bharatkashyap
- [website] Add a social preview (#2380) @bharatkashyap
- [website] Update image paths on landing page (#2359) @bharatkashyap

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @Janpot, @JerryWu1234, @oliviertassinari, @prakhargupta1

## 0.1.21

<!-- generated comparing v0.1.20..master -->

_Jul 25, 2023_

A big thanks to the 6 contributors who made this release possible. Here are some highlights ✨:

New Chart and Metric components, a page structure explorer to view components hierarchy and a new Page panel to contain page level state!

- Move more APIs to utils package (#2352) @Janpot
- Add page tab suggestions/improvements (#2342) @apedroferreira
- Add visual regression test for resize grid (#2337) @apedroferreira
- try with a lower memory limit @oliviertassinari
- add example live @oliviertassinari
- Fix the datagrid remounting when columns change (#2327) @Janpot
- Fix: Improve missing editor scenario (#2238) @bharatkashyap
- Update with-prisma README.md (#2336) @prakhargupta1
- Upgrade monorepo (#2333) @bharatkashyap
- Remove httpbin from rest tests to try and fix flakyness (#2330) @Janpot
- Update CONTRIBUTING.md (#2328) @bharatkashyap
- Fix some flakyness in the visual regression testing (#2329) @Janpot
- Add Page tab to right-side panel (#2311) @apedroferreira
- Default vertical alignment to top instead of center (#2312) @apedroferreira
- Chart component (#2081) @apedroferreira
- Remove Next.js (#2288) @Janpot
- Remove packages/toolpad (#2287) @Janpot
- Codify lodash usage in eslint (#1270) @Janpot
- Add some visual regression tests (#1959) @Janpot
- Add Metric component (#2202) @Janpot
- Switch to stackblitz links for examples (#2307) @Janpot
- [docs] Add link to live demo to KPI example (#2341) @prakhargupta1
- [docs] Fix npx folder confusion (#2346) @oliviertassinari
- [docs] Fix fs usage example @oliviertassinari
- [docs] Fix fs usage example @oliviertassinari
- [docs] Fix Connecting to databases page (#2345) @oliviertassinari
- [docs] [cli] Add `createFunction` deprecation notices (#2334) @bharatkashyap
- [feat] Add page structure explorer (#2246) @bharatkashyap
- [test] Fail the CI when new unexpected files are created (#2332) @oliviertassinari
- [website] Toolpad landing page design upgrade (#2266) @danilo-leal
- [website] Fix CLS on hero icon (#2344) @oliviertassinari

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @danilo-leal, @Janpot, @oliviertassinari, @prakhargupta1

✨ Done in 2.82s.

## 0.1.20

<!-- generated comparing v0.1.19..master -->

_Jul 12, 2023_

A big thanks to the 5 contributors who made this release possible. Here are some highlights ✨:

Use vite for the Toolpad application instead of Next.js, Windows support, documentation updates.

- Remove createFunction from examples (#2298) @Janpot
- Add extra note about aspect ratio of screenshots (#2300) @Janpot
- images aspect ratio 1.8090 (#2299) @prakhargupta1
- Disallow access to DOM globals in bindings (#1991) @Janpot
- Clarify the rules around documentation screenshots (#2296) @Janpot
- Isolate prettier in renovatebot (#2295) @Janpot
- Add eslint rule restricting React import style (#2286) @Janpot
- Provide all exports of @mui/toolpad on @mui/toolpad-app (#2284) @Janpot
- Resolve components from source for docs:build:api (#2280) @Janpot
- Use vite for Toolpad editor (#1999) @Janpot
- Add note about light theme (#2283) @Janpot
- Hardcode prisma db in with-prisma example (#2282) @Janpot
- Add prisma example (#2262) @Janpot
- Update MUI monorepo (#2271) @apedroferreira
- Fix Windows issues (#2181) @apedroferreira
- Allow loading partial theme (#2270) @Janpot
- [core] Polish imports to React (#2285) @oliviertassinari
- [docs] Fix MUI reference (#2276) @oliviertassinari
- [website] use `theme.applyDarkStyles` on marketing website (#2305) @bharatkashyap

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @Janpot, @oliviertassinari, @prakhargupta1

## 0.1.19

<!-- generated comparing v0.1.18..master -->

_Jul 5, 2023_

A big thanks to the 7 contributors who made this release possible. Here are some highlights ✨:

Improved theme editor palette, allow multiple function files, support importing .sql and .txt files, link to examples in landing page and enable Autocomplete input in forms.

- Fix missing typography variant (#2265) @Janpot
- qrcode-example-folder-change (#2269) @prakhargupta1
- Add some documentation about screenshot sizes (#2268) @Janpot
- Connect Autocomplete to forms and refactor form logic (#2115) @apedroferreira
- Support loading raw text for .txt files and .sql files (#2250) @Janpot
- Lay foundation for new and improved theme editor (#2260) @Janpot
- Use links for the runtime navigation bar (#2247) @Janpot
- On landingpage add buttons to examples (#2196) @prakhargupta1
- Pin dependencies (#2253) @renovate[bot]
- Avoid double submit when function file is created (#2252) @Janpot
- optimized deleting file (#2177) @JerryWu1234
- Move license key logic into the components (#2248) @Janpot
- Export canvas and runtime from @mui/toolpad (#2245) @Janpot
- Move monaco-editor to devDependencies (#2241) @Janpot
- Create update monorepo workflow (#2243) @Janpot
- Allow multiple function files (#2236) @Janpot
- Add a warning when required environment variables are missing (#2228) @Janpot
- Remove legacy file format (#2227) @Janpot
- [core] Remove mention of Crowdin @oliviertassinari
- [fix] disable auto formatting `_redirects` (#2251) @bharatkashyap

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @Janpot, @JerryWu1234, @oliviertassinari, @prakhargupta1, @renovate[bot]

## 0.1.18

<!-- generated comparing v0.1.17..master -->

_Jun 28, 2023_

A big thanks to the 4 contributors who made this release possible. Here are some highlights ✨:

Allow detecting parameters from types in function files, instead of having to explicitly specify them. Also, a couple of example apps, bug fixes and some behind-the-scenes work!

- Isolate marked in renovatebot (#2237) @Janpot
- Fix broken query editor when env vars are defined (#2231) @Janpot
- Increase timeout when running integration tests in dev mode (#2222) @Janpot
- Fix GitHub rest call in triage label action (#2225) @Janpot
- Add needs triage action (#2221) @Janpot
- Reload queries when env changes (#2214) @Janpot
- Example-4: npm stats (#2151) @prakhargupta1
- Example-1: admin app (#2096) @prakhargupta1
- Upgrade @mui/monorepo (#2212) @Janpot
- Explore banning any types (#2201) @Janpot
- Add error mode to the text component (#2203) @Janpot
- Add no-op serviceworker (#2190) @Janpot
- Extract parameters from ts types in function files (#2133) @Janpot
- [core] Upgrade monorepo (#2232) @bharatkashyap
- [docs] Leading dot @oliviertassinari
- [docs] Fix redirection @oliviertassinari

All contributors of this release in alphabetical order: @bharatkashyap, @Janpot, @oliviertassinari, @prakhargupta1

## 0.1.17

<!-- generated comparing v0.1.16..master -->

_Jun 22, 2023_

A big thanks to the 3 contributors who made this release possible. Here are some highlights ✨:

Improve error propagation in queries, add product walkthrough video.

- Fix wrong environment variable in contributing guide (#2199) @Janpot
- Add contributor guide for running integration tests (#2192) @Janpot
- Disable a query as long as its input is still loading (#2197) @Janpot
- Add contributing docs for codesandbox CI (#2198) @Janpot
- Remove renovate docs dependencies group (#2191) @Janpot
- Added product walkthrough video (#2175) @prakhargupta1
- Update contributing guide for local development (#2176) @Janpot
- Simplify next.config.js (#1944) @Janpot
- Update monorepo dependency (#2172) @apedroferreira
- Add QRcode example to docs and add dogApp (#1445) @prakhargupta1
- Allow nested bindings (#2114) @apedroferreira
- Remove pino for rpc logging (#1839) @Janpot
- [docs] Pass productId to the pagecontext (#2178) @Janpot

All contributors of this release in alphabetical order: @apedroferreira, @Janpot, @prakhargupta1

## 0.1.16

<!-- generated comparing v0.1.15..master -->

_Jun 14, 2023_

A big thanks to the 3 contributors who made this release possible. Here are some highlights ✨:

Editor performance improvements, fix autocomplete for page parameters, better type inference for createFunction.

- Fix invalid serializations in queries (#2163) @Janpot
- Send dom diffs to the server to avoid overly large payloads (#2167) @Janpot
- Fix create-toolpad-app missing gitignore file (#2169) @Janpot
- Increase amount of playwright workers (#2160) @Janpot
- Fix passing double dollars in the inlined DOM (#2165) @Janpot
- Avoid too many binding evaluations in the runtime (#2142) @Janpot
- Fix autocomplete for page parameters (#2156) @Janpot
- Fix broken import in cli (#2155) @Janpot
- Show error when Toolpad is started on a non-existing folder (#2144) @Janpot
- Consolidate fs utils into single file (#2140) @Janpot
- Infer the createFunction parameters type for objects from the schema (#2137) @Janpot
- Improve contributing guidelines for starting the application (#2149) @Janpot
- Replace ts-node with tsx (#2146) @Janpot
- Enable sourcemaps for the runtime builds (#2143) @Janpot
- [core] Remove @mui/x-data-grid-generator dependency (#2154) @oliviertassinari
- [docs] Fix missing leading / @oliviertassinari
- [docs] Fix 301 redirection link @oliviertassinari
- [docs] Move the label from "Alpha" to "Beta" (#2024) @bharatkashyap

All contributors of this release in alphabetical order: @bharatkashyap, @Janpot, @oliviertassinari

## 0.1.15

<!-- generated comparing v0.1.14..master -->

_Jun 7, 2023_

A big thanks to the 5 contributors who made this release possible. Here are some highlights ✨:

Allow binding arbitrary environment variables in bindings, improved error handling in Image and Data grid components, and a new version of the documentation!

- [core] Improve publish process (#2134) @Janpot
- [core] Upgrade monorepo (#2141) @bharatkashyap
- Make sure global variables are retained in between invocations (#2136) @Janpot
- Allow arbitrary env variables in bindings, use process.env (#2109) @apedroferreira
- [core] add ts declaration for package and check node version on initial star… (#2124) @JerryWu1234
- Try fixing build on windows (#2131) @Janpot
- Improve error handling in image and datagrid (#2073) @Janpot
- Restrict node version for renovatebot (#2129) @Janpot
- Create global functions manager (#2103) @Janpot
- [core] Add codesandbox CI (#2111) @Janpot
- [chore] Set minimum node at 16.14.2 (#1934) @Janpot
- [chore] Update @mui/monorepo (#2106) @Janpot
- [core] Avoid PR sandbox notifications (#2116) @oliviertassinari
- [core] Fix GitHub typo @oliviertassinari
- [docs] Restructure (#2082) @bharatkashyap
- [docs] Fix docs issues (#2123) @oliviertassinari

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @Janpot, @JerryWu1234, @oliviertassinari

## 0.1.14

<!-- generated comparing v0.1.13..master -->

_May 31, 2023_

A big thanks to the 3 contributors who made this release possible. Here are some highlights ✨:

Add new reference documentation, add new QR-code example.

- Pin dependencies (#2102) @Janpot
- Fix React function ref warning for the row id selector component (#2100) @Janpot
- Allow inlining the proptype jsonschema (#2080) @Janpot
- Add redirect for moved file-schema page (#2090) @Janpot
- Several fixes around local functions (#2074) @Janpot
- Add 404 page to application runtime (#2077) @Janpot
- Avoid component catalog opening while hovering the snackbar (#2079) @Janpot
- Fix broken documentation links (#2076) @Janpot
- Add new example for QR Code generator (#2067) @Janpot
- Avoid restarting vite devserver when env file changes (#2069) @Janpot
- Reference documentation (#2001) @Janpot
- Fix websocket connection in codesandbox (#2068) @Janpot
- Remove dead code from browser queries (#2066) @Janpot
- [docs] Add docs update checklist item (#2078) @bharatkashyap
- [docs] Fix missing redirection for data binding (#2083) @oliviertassinari

All contributors of this release in alphabetical order: @bharatkashyap, @Janpot, @oliviertassinari

## 0.1.13

<!-- generated comparing v0.1.12..master -->

_May 24, 2023_

A big thanks to the 5 contributors who made this release possible. Here are some highlights ✨:

Allow binding to environment variables, UI, and docs improvements, bug fixes.

- Fix manual queries losing parameters when called (#2060) @bharatkashyap
- Fix function parameters (#2056) @Janpot
- Fix overlay grid spacing (#2026) @apedroferreira
- pin toolpad packages versions again (#2054) @Janpot
- Fix orphaned node delete order (#2042) @apedroferreira
- Fix property control tooltips showing over dialogs (#2041) @Janpot
- Ignore warning for first-child pseudo selector in Markdown component (#2034) @Janpot
- Allow binding to environment variables (#1859) @apedroferreira
- Reorganize core exports to ease extracting API docs (#2040) @Janpot
- Split data binding page in docs (#1996) @apedroferreira
- [docs] Fix casing (#2046) @oliviertassinari
- [docs] Add product identifier to page context (#2043) @m4theushw
- [refactor] Move toolpad components into the runtime (#2036) @Janpot

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @Janpot, @m4theushw, @oliviertassinari

## 0.1.12

<!-- generated comparing v0.1.11..master -->

_May 17, 2023_

A big thanks to the 4 contributors who made this release possible. Here are some highlights ✨:

Added a new Autocomplete component, simplify the configuration for creating custom components, improve performance with websocket updates instead of polling.

- Fix race condition with initializing the canvas bridge (#2035) @Janpot
- Add Autocomplete component (#1427) @bharatkashyap
- Upgrade monorepo (#2023) @bharatkashyap
- Improve isolation of runtime from editor (#2021) @Janpot
- Replace polling for updates with websocket (#2007) @Janpot
- Improve and test basic auth implementation (#2022) @Janpot
- Reorganize @mui/toolpad-core exports (#2018) @Janpot
- version examples instead of using latest (#2030) @Janpot
- Add section about page configuration to docs (#1997) @apedroferreira
- Add theming to docs (#1993) @apedroferreira
- Improve types for onChangeProp (#2002) @Janpot
- Remove hideControls and button type (#2017) @Janpot
- Correctly set charset for preview html (#2020) @Janpot
- Remove unused config (#2008) @Janpot
- Make canvas column spacing the same as in the runtime (#2016) @Janpot
- Move to zod-to-json-schema (#2003) @Janpot
- Deprecate typeDef (#1994) @Janpot
- Clean up dead code (#2000) @Janpot
- Add jest tests for `create-toolpad-app` (#1965) @bharatkashyap
- [docs] Make code the hero (#1992) @bharatkashyap
- [docs] Fix 404 link to fix the page (#2009) @oliviertassinari

## 0.1.11

<!-- generated comparing v0.1.10..master -->

_May 10, 2023_

A big thanks to the 3 contributors who made this release possible. Here are some highlights ✨:

Allow setting page parameters in navigation actions, fix overlay grid spacing, add schema reference to docs.

- Update references and screenshots (#1987) @apedroferreira
- Add Toolpad file schema reference to the docs (#1940) @Janpot
- Fix broken preview in vite runtime (#1989) @Janpot
- Deps fix (#1985) @Janpot
- Fix console.error being called in tests (#1966) @Janpot
- Change tests structure to use ESM (#1970) @bharatkashyap
- Fix overlay grid spacing (#1947) @apedroferreira
- Add page parameters to navigation actions (#1876) @apedroferreira
- Separate deps updates for docs in renovatebot (#1980) @Janpot
- Isolate next updates (#1979) @Janpot
- Pin all dependencies (#1968) @Janpot

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @Janpot

## 0.1.10

<!-- generated comparing v0.1.9..master -->

_May 5, 2023_

A big thanks to the 1 contributors who made this release possible. Here are some highlights ✨:

This is a hotfix to deal with broken dependency upgrade in next.js.

- Pin next.js (#1967) @Janpot
- Upgrade monorepo (#1964) @Janpot

All contributors of this release in alphabetical order: @Janpot

## 0.1.9

<!-- generated comparing v0.1.8..master -->

_May 3, 2023_

A big thanks to the 4 contributors who made this release possible. Here are some highlights ✨:

Fixing regressions, set new runtime as default.

- Fix preview header missing in app preview (#1962) @Janpot
- small improvements (#1960) @Janpot
- Fix: Wrapping on Text/Link (#1956) @bharatkashyap
- Added dog app arcade to quickstart section of docs (#1942) @prakhargupta1
- Optimize some docs images (#1946) @apedroferreira
- Fix autocomplete after monaco-editor upgrade (#1943) @Janpot
- Make vite runtime default (#1938) @Janpot

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @Janpot, @prakhargupta1

## 0.1.8

<!-- generated comparing v0.1.7..master -->

_Apr 26, 2023_

A big thanks to the 4 contributors who made this release possible. Here are some highlights ✨:

Use page name as a routing alias, add a Form component, and replace Next.js API routes with Express under the hood.

- Add page name as an alias for routing in the runtime (#1925) @Janpot
- Use correct command for opening vscode (#1931) @Janpot
- Replace next API routes with express (#1920) @Janpot
- Add link to open example in CodeSandbox (#1936) @Janpot
- Fix: Local installation needs new resolution (#1932) @bharatkashyap
- Fix: Use `nanonid/non-secure` instead of `cuid` (#1912) @bharatkashyap
- Form component (#1926) @apedroferreira
- Import correct font in vite runtime (#1924) @Janpot
- Update CONTRIBUTING.md @apedroferreira
- Fix gitignore file creation log message (#1923) @Janpot
- Add utils package for generic non-toolpad utilities (#1915) @Janpot
- [docs] Polish a bit the docs (#1927) @oliviertassinari

## 0.1.7

<!-- generated comparing v0.1.6..master -->

_Apr 20, 2023_

A big thanks to the 5 contributors who made this release possible. Here are some highlights ✨:

Tweak the landing page design. Improve `create-toolpad-app` CLI, support node modules in custom code components.

- Add folder as argument to `create-toolpad-app` (#1795) @bharatkashyap
- Delete page on file system when deleted in UI (#1913) @Janpot
- New vite based application runtime (#1881) @Janpot
- Fix Windows issues (WIP) (#1910) @apedroferreira
- Use npm registry to check for new versions (#1895) @Janpot
- Update MUI monorepo (#1883) @apedroferreira
- Fix: Remove `default` from `toolpad dev --port` option (#1911) @bharatkashyap
- Deprecate `createQuery` and replace with `createFunction` (#1908) @bharatkashyap
- Show border on hover in interactive nodes (#1907) @apedroferreira
- Fix: Better represent the new direction on landing (#1863) @bharatkashyap
- Revert "Form component (#1598)" @apedroferreira
- Form component (#1598) @bytasv
- Update links on contributing guide (#1893) @Janpot
- [website] Landing page design tweaks (#1786) @danilo-leal

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @bytasv, @danilo-leal, @Janpot

## 0.1.6

<!-- generated comparing v0.1.5..master -->

_Apr 13, 2023_

A big thanks to the 1 contributors who made this release possible. Here are some highlights ✨:

Fix regression that applies the wrong theme to the user application when they have dark color scheme.

- Fix app theming (#1888) @Janpot

All contributors of this release in alphabetical order: @Janpot

## 0.1.5

<!-- generated comparing v0.1.4..master -->

_Apr 13, 2023_

A big thanks to the 2 contributors who made this release possible. Here are some highlights ✨:

Fix broken CLI due to missing dependency

- Add missing extraneous dependencies (#1885) @Janpot
- Update playwright to latest (#1884) @Janpot
- Small fixes to CLI (#1882) @Janpot
- Update release instructions (#1880) @apedroferreira

All contributors of this release in alphabetical order: @apedroferreira, @Janpot

## 0.1.4

<!-- generated comparing v0.1.3..master -->

_Apr 12, 2023_

A big thanks to the 3 contributors who made this release possible. Here are some highlights ✨:

Revamped file system layout, updated docs.

- Factor out in-memory toolpad project (#1878) @Janpot
- Revamp toolpad file system layout (#1831) @Janpot
- Docs-update (#1829) @prakhargupta1
- Update README.md @prakhargupta1
- Update README.md @prakhargupta1
- Refactor: extract custom components loading logic (#1862) @Janpot
- Clean dist dirs on rebuild (#1858) @Janpot
- [docs] Fix 301 redirections @oliviertassinari

All contributors of this release in alphabetical order: @Janpot, @oliviertassinari, @prakhargupta1

## 0.1.3

<!-- generated comparing v0.1.2..master -->

_Apr 5, 2023_

A big thanks to the 3 contributors who made this release possible. Here are some highlights ✨:

Fixed a regression with the query transformation feature, removed some obsolete code and a few improvements to the editor user experience!

- Fix transform regression (#1856) @bharatkashyap
- Try replacing tsc with tsup as build tool (#1727) @Janpot
- Remove obsolete onDelete datagrid property (#1850) @Janpot
- Editor UX fixes (#1844) @apedroferreira

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @Janpot

## 0.1.2

<!-- generated comparing v0.1.1..master -->

_Mar 31, 2023_

A big thanks to the 3 contributors who made this release possible. Here are some highlights ✨:

Add end-user application navigation! Various fixes.

- Add app navigation sidebar (#1819) @apedroferreira
- Load queries by name instead of id (#1842) @Janpot
- Fix issues around custom datagrid columns (#1840) @Janpot
- Fix broken theming (#1834) @apedroferreira
- Do Toolpad app migration on startup (#1832) @Janpot
- Remove ECS and Recaptcha + move request/response logs to trace level (#1833) @apedroferreira
- Remove deprecated scope query (#1827) @apedroferreira
- Use worker scoped fixtures for integration tests (#1813) @Janpot
- Remove quickjs-emscripten (#1820) @Janpot
- Rewrite argument handling in `@mui/toolpad` CLI with `yargs` (#1794) @bharatkashyap
- Update CONTRIBUTING.md (Fix typo) (#1826) @apedroferreira

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @Janpot

## 0.1.1

<!-- generated comparing v0.1.0..master -->

_Mar 28, 2023_

A big thanks to the 4 contributors who made this release possible. Here are some highlights ✨:

Mutate state in event handlers by assigning to properties of page elements. Make binding to DataGrid selection easier with improved typings. Big cleanup of dead code.

- Use node name in the canvas HUD (#1818) @Janpot
- Allow mutating page state in event handlers (#1807) @Janpot
- Improve UX around integration testing (#1808) @Janpot
- Disable property control for controlled properties (#1809) @Janpot
- Use next.js custom server (#1723) @Janpot
- Remove postgres (#1799) @Janpot
- Remove example and docker files (#1798) @Janpot
- Clean up more obsolete things in the repo (#1797) @Janpot
- Fix errors when running the project the first time (#1796) @Janpot
- Fix imports from toolpad (#1793) @Janpot
- Fix changing tabs closing query editor (#1784) @apedroferreira
- Generate .gitignore on dev command (#1705) @apedroferreira
- Improve dataGrid.selection types (#1790) @Janpot
- Dependency cleanup (#1791) @Janpot
- Fixes on the dev pipeline (#1789) @Janpot
- Remove Prisma, isolated-vm and dead code (#1787) @Janpot
- Update release instructions (#1788) @Janpot
- Fix capitalization of elements (#1782) @Janpot
- Update moduleresolution for core and components (#1780) @Janpot
- Remove the localMode flag (#1768) @Janpot
- Convert tests to local mode (#1718) @Janpot
- Add docs contributing instructions (#1779) @Janpot
- Allow falsy MySQL variable values (#1738) @evankennedy
- Add Toolpad to cspell config for the workspace (#1767) @Janpot
- Use latest version for examples (#1764) @Janpot
- Rename dev13 script to dev (#1766) @Janpot
- Small typo fix @prakhargupta1
- Docs updates for the new direction (#1743) @Janpot

All contributors of this release in alphabetical order: @apedroferreira, @evankennedy, @Janpot, @prakhargupta1

## 0.1.0

<!-- generated comparing v0.0.41..master -->

_Mar 20, 2023_

A big thanks to the 3 contributors who made this release possible. Here are some highlights ✨:

Today we're taking a big step. We're making Toolpad focus much more on integrating with your IDE, while providing the ease of building UI fast with a drag and drop. Read more [here](https://github.com/mui/toolpad/discussions/1748).

- Add create-toolpad-app CLI (#1700) @bharatkashyap
- Direction 13 (#1651) @Janpot
- Fix dragged element corners (#1750) @Janpot
- Turn off preview environments (#1697) @Janpot
- this don't work @Janpot
- build to legacy master @Janpot
- add ignore console to test @Janpot
- Disable bindings for properties that can be controlled in canvas (#1696) @apedroferreira

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @Janpot

## 0.0.41

<!-- generated comparing v0.0.40..master -->

_Feb 22, 2023_

A big thanks to the 4 contributors who made this release possible. Here are some highlights ✨:

Add a List component, polish Markdown component, easier access to Page module settings, feedback for mutation queries, and a new option to edit Text component directly in canvas!

- Fix binding editor confirm on unsaved changes (#1695) @apedroferreira
- Adjust margins for Markdown component (#1690) @Janpot
- Remove deprecated waitForNavigation playwright API (#1699) @Janpot
- Make text component editable in the canvas (#1694) @Janpot
- Hide resizable height prop controls (#1641) @apedroferreira
- Move selected node state to page view only (#1679) @apedroferreira
- Fix DataGrid number formats for non-numerical values (#1626) @Janpot
- Add feedback for mutating queries (#1691) @Janpot
- Show confirmation dialog when there are unsaved changes (#1618) @apedroferreira
- Fix resizing after drag & drop UI changes (#1639) @apedroferreira
- Polish Markdown component (#1477) @bharatkashyap
- Confirm unsaved code component changes (#1628) @apedroferreira
- Add in page settings option to sidebar to allow for easier access to page module settings (#1672) @scouttyg
- Add List component (#1527) @apedroferreira
- Fix: Column changes dropped on prop update (#1583) @bharatkashyap
- Fix: Disable "Remove" on draft nodes (#1681) @bharatkashyap
- Align headers and typography in the theme (#1627) @Janpot

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @Janpot, @scouttyg

## 0.0.40

<!-- generated comparing v0.0.39..master -->

_Feb 15, 2023_

A big thanks to the 1 contributors who made this release possible. Here are some highlights ✨:

- Fix HMR issues with the canvas bridge (#1640) @Janpot

All contributors of this release in alphabetical order: @Janpot

## 0.0.39

<!-- generated comparing v0.0.39-alpha.0..master -->

_Feb 8, 2023_

A big thanks to the 3 contributors who made this release possible. Here are some highlights ✨:

Edit option from preview, improved Select component behavior, updated drag & drop UI/UX, improved image columns in Data Grid, add Data Grid documentation.

- Improve behavior of image columns (#1637) @Janpot
- Add DataGrid docs (#1616) @bytasv
- Fix console errors @apedroferreira
- Improve drag & drop / canvas UI (#1553) @apedroferreira
- Add some new future components (#1631) @Janpot
- Fix design issue template (#1636) @bytasv
- Add design GH template (#1632) @bytasv
- Remove - from select options (#1630) @Janpot
- Improve deploy in iframe tests (#1622) @Janpot
- disable server code build when not in local mode @Janpot
- Remove firefox specific branch in tests (#1620) @Janpot
- Add fast edit option from preview (#1603) @bytasv
- Be more accepting of select options (#1604) @Janpot

All contributors of this release in alphabetical order: @apedroferreira, @bytasv, @Janpot

## 0.0.38

<!-- generated comparing v0.0.37..master -->

_Feb 1, 2023_

A big thanks to the 5 contributors who made this release possible. Here are some highlights ✨:

Improved default template.

- Dual build toolpad-core for esm and cjs (#1617) @Janpot
- Add new custom GA events to demo (#1588) @apedroferreira
- Change default template (#1601) @bytasv
- Add MySQL datasource (#1313) @bharatkashyap
- Cherrypick some changes from direction 13 branch (#1599) @Janpot
- [core] Remove dead code @oliviertassinari
- [core] Fix Next.js warning @oliviertassinari

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @bytasv, @Janpot, @oliviertassinari

## 0.0.37

<!-- generated comparing v0.0.36..master -->

_Jan 25, 2023_

A big thanks to the 3 contributors who made this release possible. Here are some highlights ✨:

Added a new FilePicker component, some changes to page navigation and improvements to JavaScript runtime code.

- Fix navigation through DOM views with pages (#1565) @apedroferreira
- Add FilePicker component (#1537) @bytasv
- Split browser and server js runtimes (#1584) @Janpot
- Fix webpack missing exports warnings (#1582) @Janpot
- Make applyTransform runtime agnostic (#1585) @Janpot
- Recreate yarn.lock (#1577) @Janpot
- Upgrade monorepo dependency (#1580) @Janpot
- Remove onChangeHandler from Select and TextField (#1576) @Janpot

All contributors of this release in alphabetical order: @apedroferreira, @bytasv, @Janpot

✨ Done in 1.69s.

## 0.0.36

<!-- generated comparing v0.0.35..master -->

_Jan 18, 2023_

A big thanks to the 3 contributors who made this release possible. Here are some highlights ✨:

Added Tabs component and new canvas bridge implementation, fixed DatePicker localization, binding to objects, link redirection. Improved code around js evaluation.

- Fix DatePicker localization issues (#1575) @Janpot
- Avoid resubscribing in useSyncExternalStore on every render (#1554) @Janpot
- Rename Tabs main prop (#1568) @bytasv
- Add tabs and container components (#1549) @bytasv
- Reorganize js evaluation across project (#1548) @Janpot
- New canvas bridge implementation (#1550) @Janpot
- Fix binding to objects with more than one property (#1542) @Janpot
- [core] Add missing need triage label on RFC @oliviertassinari
- [docs] Fix link redirection @oliviertassinari

All contributors of this release in alphabetical order: @bytasv, @Janpot, @oliviertassinari

## 0.0.35

<!-- generated comparing v0.0.34..master -->

_Jan 11, 2023_

A big thanks to the 4 contributors who made this release possible. Here are some highlights ✨:

Custom column types, add search to apps overview, add inline tooltips to components and properties, component library tweaks.

- Fix templates after dog API changed (#1544) @Janpot
- Reorganize shared utils (#1539) @Janpot
- Remove obsolete dom reducer actions (#1541) @Janpot
- Some component library tweaks (#1526) @Janpot
- Pin react-router-dom instead of resolutions (#1519) @Janpot
- Update README.md @prakhargupta1
- Add inline documentation to components and properties (#1518) @Janpot
- Correct types in Datepicker (#1517) @Janpot
- Promote previously experimental config (#1515) @Janpot
- Add search to the apps overview (#1402) @bharatkashyap
- Custom column types (#1462) @bytasv
- Restructure installation docs (#1511) @Janpot

All contributors of this release in alphabetical order: @bharatkashyap, @bytasv, @Janpot, @prakhargupta1

## 0.0.34

<!-- generated comparing v0.0.33..master -->

_Jan 4, 2023_

A big thanks to the 4 contributors who made this release possible. Here are some highlights ✨:

New Date Picker component, Make switching views part of undo/redo cycle.

- Fix dependabot vulnerabilities (#1512) @Janpot
- Don't import from dist folders (#1513) @Janpot
- Root type check (#1510) @bytasv
- Fix function editor save (#1507) @Janpot
- Do not rename nodes when migrating Typography components (#1509) @Janpot
- Just re-export the prettier config (#1508) @Janpot
- Datepicker format handling changes (#1504) @bytasv
- Undo/redo through different views (#1417) @apedroferreira
- Make sure npm package is splitted out correctly (#1502) @Janpot
- Date Picker component (#1499) @bytasv
- [core] Remove dead prettier config @oliviertassinari

All contributors of this release in alphabetical order: @apedroferreira, @bytasv, @Janpot, @oliviertassinari

## 0.0.33

<!-- generated comparing v0.0.32..master -->

_Dec 28, 2022_

A big thanks to the 2 contributors who made this release possible. Here are some highlights ✨:

Improvements to the scope explorer, and some other bug fixes an improvements.

- Fix: Demo reCaptcha v2 fallback does not work (#1485) @bharatkashyap
- Group scope variables by function in global scope explorer (#1464) @Janpot
- Fix canvas ref timing issues (#1476) @Janpot
- Fix flaky rest-basics test (#1481) @Janpot

All contributors of this release in alphabetical order: @bharatkashyap, @Janpot

## 0.0.32

<!-- generated comparing v0.0.31..master -->

_Dec 21, 2022_

A big thanks to the 5 contributors who made this release possible. Here are some highlights ✨:

Added survey for the Toolpad usage, simplified RPC logs, added latest deployment preview in the editor, undo/redo improvements, improved grid columns editor, added visual feedback when query runs, as well as various fixes.

- Add survey dialog (#1480) @bytasv
- Simplify RPC logs (#1473) @Janpot
- Move recaptcha script away from \_app (#1472) @Janpot
- Add latest deployment preview in editor (#1423) @bytasv
- Single-update undo/redo (#1374) @apedroferreira
- Non permanent root redirection (#1468) @oliviertassinari
- Fix display of errors during loading of data (#1457) @Janpot
- Replace gridcolumns editor dialog with popover (#1455) @Janpot
- Fix: Incorrect migration for Text component (#1451) @bharatkashyap
- Add formatting options to DataGrid columns (#1449) @Janpot
- Add visual feedback when query is running (#1454) @Janpot
- [docs] Banner tweaks (#1475) @bharatkashyap

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @bytasv, @Janpot, @oliviertassinari

## 0.0.31

<!-- generated comparing v0.0.30..master -->

_Dec 14, 2022_

A big thanks to the 5 contributors who made this release possible. Here are some highlights ✨:

Add a new Text component that subsumes Typography and Link, and allows support for Markdown. Allow support for dynamic templates, and fix a bug around the default value of components.

- Add Text component to merge Typography, Markdown, Link (#1298) @bharatkashyap
- Document and cleanup of utility functions (#1442) @Janpot
- Revert react-router-dom to 6.3 (#1444) @Janpot
- Update README.md @prakhargupta1
- Fix yarnlock (#1443) @bytasv
- Add roadmap to the docs (#1424) @bytasv
- Landing page tweaks (#1433) @bharatkashyap
- Fix controlled value reset when default value changes (#1434) @bytasv
- Add integration test for default template (#1429) @bharatkashyap
- Support dynamic app templates (#1430) @apedroferreira
- Fix changelog @Janpot

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @bytasv, @Janpot, @prakhargupta1

✨ Done in 1.75s.

## 0.0.30

<!-- generated comparing v0.0.29..master -->

_Dec 7, 2022_

A big thanks to the 3 contributors who made this release possible. Here are some highlights ✨:

Release the demo version, update app duplication UX.

- Revert accidental react-router-dom update (#1426) @Janpot
- Add demo link to the docs (#1319) @bharatkashyap
- Add Demo link to landing page (#1228) @bharatkashyap
- Add a Default app template (#1381) @bharatkashyap
- Remove stats template (#1418) @apedroferreira
- Propose solution for flaky undo test (#1415) @Janpot
- Update dependencies (#1403) @Janpot
- Move to next.config.mjs (#1404) @Janpot
- Add note about missing connections to demo footer (#1406) @apedroferreira
- Try out transpilePackages on latest next (#1362) @Janpot
- Don't immediately open duplicated apps (#1397) @Janpot
- Make sure EditableText updates when underlying string changes (#1400) @Janpot
- Undoable/redoable node selection (#1394) @apedroferreira

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @Janpot

## 0.0.29

<!-- generated comparing v0.0.28..master -->

_Nov 30, 2022_

A big thanks to the 4 contributors who made this release possible. Here are some highlights ✨:

Improved query options in demo, fixed time property in HAR, unified app editor options menus

- Undo redo tests (#1308) @bytasv
- Hide connections tree in demo (#1393) @apedroferreira
- Create apps programmatically in integration tests (#1384) @Janpot
- Set connection/query available options in demo (#1323) @apedroferreira
- Add some tips about writing highlights in release docs (#1352) @Janpot
- Fix time property in HAR (#1383) @Janpot
- Unify app editor options menus (#1286) @bharatkashyap

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @bytasv, @Janpot

## 0.0.28

<!-- generated comparing v0.0.27..master -->

_Nov 23, 2022_

A big thanks to the 4 contributors who made this release possible. Here are some highlights ✨:

Client-side functions, migration fixes, add sidebar to overview page, support visual captcha as fallback, add "alpha" label to app and landing page, automatic app names in demo.

- Fix landing page hydration issue (#1375) @bharatkashyap
- Update demo bar copy (#1371) @apedroferreira
- Fix overflow for explorer (#1372) @Janpot
- Add "alpha" label to app and landing page hero (#1356) @bharatkashyap
- Add missing sucrase helper (#1360) @Janpot
- Remove demo docker (#1369) @apedroferreira
- Remove demo configuration from render.yaml (#1368) @apedroferreira
- Move TypeScript to devDependencies (#1366) @Janpot
- Remove sentry debug option (#1361) @Janpot
- Fix yarn.lock @Janpot
- Upgrade eslint (#1287) @Janpot
- Fallback to visible captcha if invisible captcha fails (#1272) @apedroferreira
- Refactor overview page (#1357) @Janpot
- Fix migration to v3 (#1359) @Janpot
- Run functions client-side (#1325) @Janpot
- Show IP address in log messages (#1350) @apedroferreira
- Fix prettier script in CI (#1355) @Janpot
- Automatic app names in demo (#1351) @apedroferreira
- [core] Group renovate GitHub Action dependency updates (#1341) @oliviertassinari

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @Janpot, @oliviertassinari

## 0.0.27

<!-- generated comparing v0.0.26..master -->

_Nov 16, 2022_

A big thanks to the 5 contributors who made this release possible. Here are some highlights ✨:

Upgraded to Next.js 13, some fixes on undo/redo and also an improvement to the cloud demo which allows continuing work on the latest-used app.

- Allow working on latest used app from demo home page (#1304) @apedroferreira
- Make sure to show a 404 for non existing apps in the preview (#1344) @Janpot
- Make sure code components can run against React in production mode (#1348) @Janpot
- Disable baseUrl when ran in browser (#1346) @Janpot
- Upgrade to next 13 (#1294) @Janpot
- Show self-host bar in demo (#1309) @apedroferreira
- Move component compilation serverside (#1332) @Janpot
- Remove externalResolver for Sentry (#1343) @Janpot
- Convert scripts to ESM (#1307) @Janpot
- Add github repository link from landing page (#1342) @bharatkashyap
- Fix windows and AZERTY shortcuts for undo redo (#1274) @bytasv
- Simplify menu actions (#1281) @oliviertassinari
- Fix undo/redo race condition (#1328) @bytasv
- Fix hud overlay index (#1329) @bytasv
- Reorganize QueryEditor into its own folder (#1322) @Janpot
- Upgrade docs to Next.js 13 (#1297) @Janpot
- Remove package.json resolutions field (#1316) @Janpot
- Show creation dialog as loading while navigating to newly created app (#1317) @Janpot
- Change dots to ellipsis (#1314) @Janpot
- [core] Show the whole version to make blame easier @oliviertassinari
- [core] Pin GitHub Action versions @oliviertassinari
- [core] Feedback on branch protection @oliviertassinari
- [core] Remove scorecard default permissions @oliviertassinari
- [docs] Fix path typo in Fetch docs (#1331) @bharatkashyap

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @bytasv, @Janpot, @oliviertassinari

## 0.0.26

<!-- generated comparing v0.0.25..master -->

_Nov 9, 2022_

A big thanks to the 5 contributors who made this release possible. Here are some highlights ✨:

A new Link component, undo/redo in the editor, fix UX on renaming elements.

- Remove pullRequestPreviewsEnabled from render.yml (#1315) @Janpot
- Fix adding parameter with duplicate name (#1282) @Janpot
- Make sure to define a \_jsxFilename for custom components (#1306) @Janpot
- Upgrade monorepo dependency (#1299) @Janpot
- Remove react from the runtime chunk (#1302) @Janpot
- Add prefix to custom GA event (#1305) @apedroferreira
- Send custom GA event when new app is created (#1285) @apedroferreira
- Some tweaks to integration tests while debugging (#1300) @Janpot
- schedule @Janpot
- Reduce amount of chunks for the runtime (#1301) @Janpot
- Update code component name on save (#1283) @Janpot
- Add Next.js bundle analyzer (#1276) @Janpot
- Small improvements to Datagrid component (#1284) @apedroferreira
- Client-side fetch queries (#1252) @Janpot
- Add undo & redo functionality (#1225) @bytasv
- useEvent: Only check for calls during render in development (#1269) @Janpot
- Index pino logs to data stream (#1267) @apedroferreira
- Add Link Component (#1234) @bharatkashyap
- [core] Fix Scorecard fail Action @oliviertassinari
- [core] Try running integration tests against self-hosted httpbin (#1253) @Janpot
- [core] Add OSSF Scorecard action (#1295) @oliviertassinari
- [core] Remove default access to GitHub action scopes @oliviertassinari
- [core] Fix Pinned-Dependencies @oliviertassinari
- [docs] Link changelog (#1279) @oliviertassinari

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @bytasv, @Janpot, @oliviertassinari

## 0.0.25

<!-- generated comparing v0.024..master -->

_Nov 2, 2022_

A big thanks to the 4 contributors who made this release possible. Here are some highlights ✨:

Added new Data Grid column types, improved dev mode performance, support for pages, connections, and components duplication, updated remaining documentation parts

- Fix Elastic Search configuration (#1256) @apedroferreira
- Provide accessible locators (#1264) @Janpot
- Improve dev mode performance (#1232) @Janpot
- Fix app templates tests (#1257) @apedroferreira
- Support duplicating queries (#1229) @Janpot
- Deploy latest Docker image in demo (#1255) @apedroferreira
- App templates tests (#1220) @apedroferreira
- Add new column types (#1223) @apedroferreira
- Fix node not found error (#1233) @apedroferreira
- improve renovatebot @Janpot
- Support undefined values in serverside bindings (#1226) @Janpot
- Disable making applications public in demo mode (#1212) @apedroferreira
- Use link component in app overview (#1218) @Janpot
- Support duplicating pages, connection, components (#1210) @Janpot
- Part 5: Update building ui docs (#1215) @bytasv
- Part 6: Update data binding docs (#1216) @bytasv
- [core] Fixes for upcoming eslint upgrade (#1249) @Janpot
- [core] Remove unused GitHub Action permission @oliviertassinari
- [core] Pin GitHub Action to digests (#1250) @oliviertassinari
- [core] Fix permissions in workflow @oliviertassinari
- [core] Add clarifying comment in the dev env compose file (#1206) @Janpot
- [ui] Add button size property (#1193) @Janpot

All contributors of this release in alphabetical order: @apedroferreira, @bytasv, @Janpot, @oliviertassinari

## 0.0.24

<!-- generated comparing v0.0.23..master -->

_Oct 26, 2022_

A big thanks to the 5 contributors who made this release possible. Here are some highlights ✨:

Add element duplication, improved Paper component, improved node naming UX, support for server logs, autocomplete for event arguments, update docs screenshots.

- Part 4: Update datasource docs (#1205) @bytasv
- renovatebot, tweak playwright @Janpot
- Add API and datasource logging (#1066) @apedroferreira
- fix name @Janpot
- Codify the icons exception in eslint (#1211) @Janpot
- Improve Paper component (#1031) @apedroferreira
- Deploy with keyboard enter (#1188) @bytasv
- Part 3: Update connections docs (#1203) @bytasv
- Part 1: Update overview + quickstart screenshots (#1200) @bytasv
- Use public environment settings for demo (#1191) @apedroferreira
- Part 2: Update queries docs (#1202) @bytasv
- Fix fetch query preview (#1165) @bytasv
- Try fixing renovatebot @Janpot
- Add option to DataGrid to hide toolbar (#1187) @Janpot
- Use latest version of Toolpad in demo (#1190) @apedroferreira
- Remove branch option from database in render.yaml (#1189) @apedroferreira
- Implement component duplication logic (#1169) @bytasv
- Set up demo with Docker (#1092) @apedroferreira
- Add a staleTime to queries (#1167) @Janpot
- Add room for post transformations (#1185) @oliviertassinari
- Allow typing event arguments for autocomplete (#1180) @Janpot
- [core] Fix duplicate CodeQL build @oliviertassinari
- [core] query editor, only insert node after the flow (#1207) @Janpot
- [core] Relax the restrictions on node naming (#1194) @Janpot
- [core] Harden the datasource handler implementation (#1199) @Janpot
- [core] Add code scanning via CodeQL (#1197) @oliviertassinari
- [ui] Some tweaks to the Monaco editor theme (#1181) @Janpot
- [website] Remove LanguageNegotation (#1186) @bharatkashyap

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @bytasv, @Janpot, @oliviertassinari

## 0.0.23

<!-- generated comparing v0.0.22..master -->

_Oct 20, 2022_

A big thanks to the 5 contributors who made this release possible. Here are some highlights ✨:

A new theme for the UI (with light and dark mode), allowing Toolpad apps to be used in iFrames, UI improvements and bug fixes.

- Allow iframes (#1162) @oliviertassinari
- Make sure Monaco theme switches correctly (#1179) @Janpot
- Replace chevron icons with arrow icons (#1178) @Janpot
- Remove false sourceMapReference in next config (#1170) @apedroferreira
- Disable queries until dom node has been saved serverside (#1149) @Janpot
- Improvements to Sentry and sourcemaps (#1129) @apedroferreira
- Enforce the restriction on how icons are imported (#1160) @Janpot
- Improve preview feedback in fetch query (#1153) @bytasv
- Fix visible horizontal scroll (#1154) @bytasv
- Mandate node version for toolpad-app (#1141) @Janpot
- Some smoke test for rest datasource (#1147) @Janpot
- Change url in function default source to static self hosted file (#1152) @Janpot
- Move event handler setup to the bridge (#1097) @Janpot
- Try changing @mui/toolpad/index.d.ts to global.d.ts (#1148) @Janpot
- Use Map for app template options (#1135) @apedroferreira
- [app] Fix manifest 401 loading (#1146) @oliviertassinari
- [core] Add CI check that the PR has label (#849) @oliviertassinari
- [core] eslint: Disallow enum (#1151) @Janpot
- [core] Harden GitHub Actions permissions (#1161) @oliviertassinari
- [docs] Add missing redirections @oliviertassinari
- [docs] Improve markdownlint (#1159) @oliviertassinari
- [docs] Update descriptions that are over 160 characters @oliviertassinari
- [runtime] hide queries in the browser (#1155) @Janpot
- [ui] Add branding theme to Toolpad app (#988) @bharatkashyap
- [ui] New component catalog (#1003) @bharatkashyap

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @bytasv, @Janpot, @oliviertassinari

## v0.0.22

<!-- generated comparing v0.0.21..master -->

_Oct 12, 2022_

A big thanks to the 5 contributors who made this release possible. Here are some highlights ✨:

Improve update notification, fold mutations into queries, support duplicating application, support public applications, rename parameters in queries, add observability for our demo mode.

- Fix saving issues (#1142) @Janpot
- Add update notification instead of banner (#1128) @bharatkashyap
- Fix parameters for fetch queries (#1140) @Janpot
- Migrate existing mutations to queries (#1130) @Janpot
- Memoize useMenu onMenuClose (#1139) @Janpot
- Make sure parameters work in query preview (#1138) @Janpot
- Fix a few issues with app DOM migrations (#1133) @Janpot
- Update resource class for test_static (#1103) @Janpot
- Update renovate.json for playwright @Janpot
- remove manager @Janpot
- core-js restriction @Janpot
- Fix warning on save (#1125) @Janpot
- Make queries capable of mutations (#1122) @Janpot
- pin node version for more reproducability in the builds (#1119) @Janpot
- Allow duplicating apps (#658) @bharatkashyap
- Google Analytics improvements (#1090) @apedroferreira
- reCAPTCHA improvements (#1087) @apedroferreira
- Silence sentry warning (#1102) @Janpot
- Update playwright (#1118) @Janpot
- Handle appDom versioning (#776) @bharatkashyap
- Update renovate.json @Janpot
- Revert "[core] Add default data to DataGrid, Image, Select components" (#1106) @Janpot
- Update renovate.json @Janpot
- New renovatebot schedule (#1099) @Janpot
- Try out sharing vscode setup (#782) @Janpot
- Allow empty argTypes object in component config (#1088) @Janpot
- Alternative fix for 1050 (#1091) @Janpot
- Add enableColorScheme to CssBaseline in app theme (#1100) @Janpot
- Store next.js cache after the build (#1104) @Janpot
- Avoid state update during layout effect in NoSsr (#857) @Janpot
- Add a few more cache folders in circleci (#1089) @Janpot
- Support public applications (#1009) @Janpot
- [app] Select options editor enhancements (#1055) @bharatkashyap
- [core] disable react-router-dom update (#1123) @Janpot
- [core] Remove jsdoc eslint (#1109) @Janpot
- [core] Remove dead dependency @oliviertassinari
- [core] Rename query and params to parameters in fetch and function editors (#1096) @bytasv
- [core] x10 speedup of yarn install in the CI (#1098) @oliviertassinari

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @bytasv, @Janpot, @oliviertassinari

## v0.0.21

<!-- generated comparing v0.0.20..master -->

_Oct 5, 2022_

A big thanks to the 3 contributors who made this release possible. Here are some highlights ✨:

Major groundwork to get online demo ready

- Attempt to fix render.yaml (#1069) @apedroferreira
- Fix component flicker (#1061) @apedroferreira
- Add Sentry (#1043) @apedroferreira
- Fix moving same row elements into same column (#1060) @apedroferreira
- Add Google reCAPTCHA v3 to online demo (#1054) @apedroferreira
- Online demo (#1002) @apedroferreira
- [core] Fix buildFilter property in render.yml (#1085) @Janpot
- [core] We don't build the database @oliviertassinari
- [core] Don't build on render for docs changes (#1081) @oliviertassinari
- [core] Remove outdated docsearch.js dependency (#1046) @oliviertassinari
- [docs] Fix outdated URL @oliviertassinari

All contributors of this release in alphabetical order: @apedroferreira, @Janpot, @oliviertassinari

## v0.0.20

<!-- generated comparing v0.0.19..master -->

_Sep 28, 2022_

A big thanks to the 4 contributors who made this release possible. Here are some highlights ✨:

Add default data to DataGrid, Image, and Select components, add optional Google Analytics integration and improve Windows compatibility.

- Add Google Analytics (#1049) @apedroferreira
- [core] Add default data to DataGrid, Image, Select components (#1048) @bharatkashyap
- [core] Improve Windows compatibility (#1042) @oliviertassinari
- [Docs] Disable todo pages in docs (#1053) @bytasv

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @bytasv, @oliviertassinari

## v0.0.19

<!-- generated comparing v0.0.18..master -->

_Sep 21, 2022_

A big thanks to the 5 contributors who made this release possible. Here are some highlights ✨:

A big improvement to the documentation, the ability to use templates to create a new app and the beginning of some UI improvements to the app.

- Improve update notifications (#1006) @bharatkashyap
- Prebuilt app templates (#926) @apedroferreira
- Editor integration tests (#831) @apedroferreira
- Header layout towards UI revamp (#986) @Janpot
- Add instruction for testing a random commit on master (#1004) @Janpot
- Self-document integration test mode (#995) @Janpot
- [core] Fix scroll restoration in the docs (#866) @oliviertassinari
- [core] Fix markdown format (#889) @oliviertassinari
- [Docs] Fix self host url (#1033) @bytasv
- [Docs] Documentation docker (#1030) @bytasv
- [docs] Link the docs in the README.md (#1012) @oliviertassinari
- [docs] Add Building UI documentation (#1011) @bytasv
- [docs] Toolpad docs part 1 (#859) @bytasv
- [security] Improve the HTTP headers for security (#1013) @oliviertassinari

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @bytasv, @Janpot, @oliviertassinari

## v0.0.18

<!-- generated comparing v0.0.17..master -->

_Sep 14, 2022_

A big thanks to the 5 contributors who made this release possible. Here are some highlights ✨:

Fixes and improvements all around, banner prompting to upgrade Toolpad

- Make errors visible in the runtime (#985) @Janpot
- Put Toolpad user in charge of response parsing (#987) @Janpot
- Group a few more packages for renovate (#982) @Janpot
- Revert "Make errors visible in the runtime" (#954) @Janpot
- Add a DataGrid to preview GoogleSheets response (#952) @bharatkashyap
- Fix DataGrid double scroll (#945) @apedroferreira
- Editable text component batched fixes (#898) @bharatkashyap
- Unify RFC template using core version (#951) @bytasv
- Make errors visible in the runtime (#946) @Janpot
- Remove editor segment from route (#800) @Janpot
- Preserve JavaScript semantics when dependencies fail (#948) @Janpot
- Rename parseError to errorFrom (#944) @Janpot
- Fix node and jsdom tests interferring with each other (#939) @Janpot
- Add components integration test (#938) @Janpot
- Fix naive content-type sniffing implementation (#940) @Janpot
- Format function source on save (#942) @Janpot
- Allow recreating data grid columns from existing data (#914) @apedroferreira
- Port MUI X renovate.json (#933) @Janpot
- Run yarn upgrade (#923) @apedroferreira
- Try enabling renovate again (#913) @Janpot
- Make sure to always assign the overlayroot (#915) @Janpot
- Toolpad-app dependencies update (#909) @Janpot
- [app] Add an update banner (#839) @bharatkashyap
- [core] Add release step for the docs (#890) @oliviertassinari
- [docs] Fix capitalization @oliviertassinari
- [docs] Fix typo @oliviertassinari
- [ui] Toolpad app favicon (#984) @bharatkashyap
- [ui] Toolpad logo favicon (#911) @bharatkashyap
- [website] Landing Page follow up (#906) @bharatkashyap

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @bytasv, @Janpot, @oliviertassinari

## v0.0.17

<!-- generated comparing v0.0.16..master -->

_Sep 7, 2022_

A big thanks to the 4 contributors who made this release possible. Here are some highlights ✨:

Landing page, configure body and headers in REST datasources, support bindable default values for inputs, improved save state display, minimum, and maximum values for number props.

- Support DatePicker examples in custom components (#903) @Janpot
- Disable binding for layout props (#862) @apedroferreira
- Update screen after every render (#896) @Janpot
- Rest datasource configure bodies and headers (#721) @Janpot
- Use PostgreSQL as displayName instead of Postgres (#894) @Janpot
- Upgrade TypeScript across packages (#897) @Janpot
- Allow minimum and maximum value for component number props (#871) @apedroferreira
- Fix typo in code (#883) @Janpot
- Simplify deploy flow (#875) @Janpot
- Add more info to console error detection in integration tests (#881) @Janpot
- Force node 16 on render.com (#880) @Janpot
- Editor and save state tweaks (#879) @apedroferreira
- Be more accepting in postgres error parsing (#877) @Janpot
- Support bindable default value for inputs (#838) @Janpot
- [core] Update monorepo (#891) @oliviertassinari
- [docs] Fix screenshot link in the README (#893) @bharatkashyap
- [website] Fix GA events going to development (#899) @bharatkashyap
- [website] Improve video poster (#892) @oliviertassinari
- [website] Fix logo dimension (#888) @oliviertassinari
- [website] Landing page (#809) @bharatkashyap

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @Janpot, @oliviertassinari

## v0.0.16

<!-- generated comparing v0.0.15..master -->

_Aug 31, 2022_

A big thanks to the 4 contributors who made this release possible. Here are some highlights ✨:

Simplify interaction between canvas and editor, new interface to view unsaved changes, improve the flow for creating and editing queries and improve the localStorage hook implementation. Also, some documentation improvements!

- Nudge PRs to have linked issues, visual demos (#836) @bharatkashyap
- Fix error when rendering empty grid (#872) @Janpot
- Hide number of changes in UI, add it in debug logging utility (#861) @apedroferreira
- Props panel sections (#855) @apedroferreira
- Simplify interaction between canvas and editor (#858) @Janpot
- Improved and updated tutorial.md (#865) @VasuDevrani
- Only sign in to dockerhub if we intend to push images (#867) @Janpot
- Remove baseline overrides from eslintrc (#835) @Janpot
- Allow intercepting the console on CanvasHost (#856) @Janpot
- Improve drop area design (#854) @apedroferreira
- Improve QueryEditor flow (#844) @Janpot
- Fix missing jsx key warning (#851) @Janpot
- Improve localStorage implementation (#846) @Janpot
- Parse numbers as ms from epoch for date/datetime columns (#848) @Janpot

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @Janpot, @VasuDevrani

## v0.0.15

<!-- generated comparing v0.0.14..master -->

_Aug 24, 2022_

A big thanks to the 3 contributors who made this release possible. Here are some highlights ✨:

New Postgres datasource, support mutations.

- Support mutations as non-idempotent version of queries (#698) @Janpot
- Verify that the base image exists in the docker release script (#824) @Janpot
- Fix missing key warning (#842) @Janpot
- Tweak release instructions (#829) @bytasv
- Remove obsolete core lib patch (#801) @Janpot
- Debounce code component renderering (#805) @Janpot
- Validate the name when creating code components (#802) @Janpot
- Create postgres dataSource prototype (#811) @Janpot
- Add tooltip to WIP components (#837) @Janpot
- Automatically wrap non-layout components in box containers (#804) @apedroferreira
- Use short ids for dom nodes (#807) @Janpot
- Remove dom duplication (#825) @Janpot
- Use prettier CLI + pretty-quick (#823) @Janpot
- App renaming integration test (#820) @Janpot
- Add hook to ease menu implementation (#821) @Janpot

All contributors of this release in alphabetical order: @apedroferreira, @bytasv, @Janpot

## v0.0.14

<!-- generated comparing v0.0.13..master -->

_Aug 18, 2022_

A big thanks to the 4 contributors who made this release possible. Here are some highlights ✨:
Add app overview list view, allow setting properties in code component debugger, Fix artifacts in the page designer, visual tweaks to the select component options editor.

- Add List view for apps as default (#690) @bharatkashyap
- Add interface to debug properties for code components (#803) @Janpot
- Fix custom component slots (#750) @apedroferreira
- Prevent node HUD from getting cut-off (#772) @apedroferreira
- Improve JsonView component UX (#797) @Janpot
- Fix deleting newly placed components with Backspace key (#771) @apedroferreira
- Update/improve release guide (#770) @apedroferreira
- Upgrade @mui/\* packages (#785) @Janpot
- Use stable version of react-query (#784) @Janpot
- Use stable version of monaco-editor (#783) @Janpot
- Add tooling to facilitate integration testing (#786) @Janpot
- Fix scrollbar when selection options (#788) @oliviertassinari
- Make sure the application isn't saved during mounting (#779) @Janpot
- Make sure old style references are backwards compatible (#780) @Janpot
- Improve handling of React keys in ComponentCatalog (#775) @Janpot
- Fix missing key warning (#774) @Janpot
- Support default datasources (#691) @Janpot
- Put datasource in charge of saving the QueryNode (#764) @Janpot

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @Janpot, @oliviertassinari

## v0.0.13

<!-- generated comparing v0.0.12..master -->

_Aug 10, 2022_

A big thanks to the 3 contributors who made this release possible. Here are some highlights ✨:

Add user feedback, add network panel to REST datasources, make network panel clearable.

- Move google sheets preview inside of datasource (#761) @Janpot
- Make sure queries are default enabled (#768) @Janpot
- Add AbortController to function runtime (#766) @Janpot
- Remove docs aria-label (#716) @Janpot
- Add user feedback (#723) @Janpot
- Fix function datasource layout issue (#765) @Janpot
- Add RFC template (#729) @bytasv
- Extract presentational QueryInputPanel component for reuse (#762) @Janpot
- Rest datasource: add network inspection (#737) @Janpot
- Make network panel clearable (#760) @Janpot
- Drag and drop refactor (#730) @apedroferreira
- Optimize logic in bindings parsing (#759) @Janpot
- Only overwrite the default value when a prop has a binding (#757) @Janpot
- Extract Devtools component from function datasource for reuse in fetch (#740) @Janpot
- Refactor har generation utilities for reuse (#738) @Janpot
- Release script update (#731) @Janpot
- Release workflow continuation (#728) @Janpot
- Fixes to release action (#727) @Janpot
- Add docker tag GitHub action (#726) @Janpot

All contributors of this release in alphabetical order: @apedroferreira, @bytasv, @Janpot

## v0.0.12

<!-- generated comparing v0.0.11..master -->

_Aug 3, 2022_

A big thanks to the 4 contributors who made this release possible. Here are some highlights ✨:

Allow vertically resizing components, add configuration options to Fetch datasource.

- Allow scrolling the page when over the monaco editor (#719) @Janpot
- Make DataTable vertically resizeable (#700) @apedroferreira
- Fix typo (#715) @oliviertassinari
- Make fetch method configurable (#708) @Janpot
- Remove some unnecessary component sizing (#710) @Janpot
- [core] `NodeReference` type for references to nodes (#720) @bharatkashyap
- [core] Remove duplicated file (#714) @oliviertassinari
- [core] Prepare automation for support (#612) @oliviertassinari

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @Janpot, @oliviertassinari

## v0.0.11

<!-- generated comparing v0.0.10..master -->

_Jul 29, 2022_

A big thanks to the 4 contributors who made this release possible. Here are some highlights ✨:

Split pane layout for queries, resize components in the visual editor, improve post-request transformation UX.

- Satisfy dependabot (#706) @Janpot
- Add autocomplete to post-request transform editor (#546) @bharatkashyap
- Support async code in event handlers (#697) @Janpot
- Fix interferring monaco editor instances (#702) @Janpot
- Add bindable enabled property to queries (#696) @Janpot
- Fix column sizing when there's not enough space (#699) @apedroferreira
- Editor - Resizing elements inside page rows (#645) @apedroferreira
- Add default control to BindableEditor (#695) @Janpot
- Fixes to query editor layout (#693) @Janpot
- Make function runtime fetch implementation more spec-compliant (#668) @Janpot
- Fix overflow widgets for monaco (#682) @Janpot
- Increase yarn network timeout (#688) @Janpot
- Standardize on React invariant library (#683) @Janpot
- Tweak update button position and visibility in component editor (#673) @bytasv
- Add split panes to connections dialog (#676) @bytasv
- Remove obsolete DataGrid license code (#679) @Janpot

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @bytasv, @Janpot

## v0.0.10

<!-- generated comparing v0.0.9..master -->

_Jul 22, 2022_

A big thanks to the 4 contributors who made this release possible. Here are some highlights ✨:

Getting a first version of the docs app working. Fixes to the UI on the application overview, thanks to our new team member @bytasv!

- Fix app name overflow (#672) @bytasv
- Add fetch polyfills to jest (#669) @Janpot
- [docs] Fix Next.js hosting on mui.com (#661) @bharatkashyap
- [docs] Lint markdown (#675) @oliviertassinari
- [docs] Bootstrap docs/landing page site (#542) @bharatkashyap

All contributors of this release in alphabetical order: @bharatkashyap, @bytasv, @Janpot, @oliviertassinari

## v0.0.9

<!-- generated comparing v0.0.8..master -->

_Jul 14, 2022_

A big thanks to the 3 contributors who made this release possible. Here are some highlights ✨:

Refine the drag & drop UX, optimize usage of `googleapis`, add new serverless function datasource.

- Move the toolpad app out of the components folder (#657) @Janpot
- Support serverless Function datasource (#641) @Janpot
- Move control of spacing into the datasource QueryEditor (#656) @Janpot
- Rework query editor layout (#655) @Janpot
- Update usePrivateQuery options to follow useQuery options (#654) @Janpot
- Fix Overlay sizing (#543) @Janpot
- Make sure Monaco resizes with its container (#653) @Janpot
- Fix sizing inside columns (#650) @apedroferreira
- Preview query button (#647) @bharatkashyap
- Extract canvas logic in top level layout (#644) @Janpot
- Replace `googleapis` with individual pacakges (#648) @bharatkashyap
- Avoid crash when a query is edited for a non-existing datasource (#640) @Janpot
- Fix the list in setup docs (#643) @Janpot
- Remove MonacoEditor path property (#639) @Janpot
- Bag of tweaks (#637) @Janpot
- Fixes and remove unneeded stylings in recent visual editor update (#638) @apedroferreira

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @Janpot

## v0.0.8

<!-- generated comparing v0.0.7..master -->

_Jul 6, 2022_

A big thanks to the 4 contributors who made this release possible. Here are some highlights ✨:

Improve the drag&drop UX of the visual editor. Add more functionality to the Application overview page. Make the release process more intuitive.

- Make sure to only send frontend dom nodes to the browser (#635) @Janpot
- Improve visual editor UX (#466) @apedroferreira
- Add instructions on configuring a different port in dev mode (#629) @Janpot
- Fix expression editor for code actions (#633) @Janpot
- Fix height issues with application root element (#634) @Janpot
- Hide preview banner on deployed pages (#630) @Janpot
- Fix no-restricted-syntax not applying to some files (#632) @Janpot
- Make monaco editor work offline (#619) @Janpot
- Add missing node-fetch dependency (#627) @Janpot
- Dom loader suspense (#625) @Janpot
- Use next.config.mjs (#626) @Janpot
- Add demo mode (#607) @Janpot
- Memoize selectionModel in DataGrid (#616) @Janpot
- Use pull tag push strategy to fix released docker images (#623) @Janpot
- Migrate to prisma v4 (#622) @Janpot
- Upgrade to latest Next.js (#620) @Janpot
- reset binding dialog on open (#621) @Janpot
- Add banner to the app when running in preview mode (#608) @Janpot
- Persist component panel size (#604) @Janpot
- Remove some obsolete components (#605) @Janpot
- Add screenshot to README (#601) @Janpot
- Introduce running actions on events (#565) @Janpot
- Enforce yarn for usage with the monorepo (#599) @Janpot
- Upgrade dependencies (#600) @Janpot
- App card enhancements (#591) @bharatkashyap
- Enhance release flow (#583) @Janpot
- Expand e2e test to create/delete an app (#597) @Janpot
- Remove submit from buttons (#596) @Janpot
- Upgrade next.js (#595) @Janpot
- Add codeFrame to compiler errors (#593) @Janpot
- Get rid of next.js custom server (#452) @Janpot
- Fix some type issues coming up with React 18 (#594) @Janpot
- [docs] Fix Netlify deploy with a dummy index.html (#606) @oliviertassinari

All contributors of this release in alphabetical order: @apedroferreira, @bharatkashyap, @Janpot, @oliviertassinari

## v0.0.7

<!-- generated comparing v0.0.6..master -->

_Jun 22, 2022_

A big thanks to the 2 contributors who made this release possible. Here are some highlights ✨:

Fixes for Firefox users. Resizable right-hand panel. Improve Google Sheets connection reliability. Support customizing the global scope used in the bindings.

- Support customizing global scope of bindings (#588) @Janpot
- Make sure the component properties panel overflows correctly (#587) @Janpot
- Extract module loading logic from code components in the runtime (#586) @Janpot
- Improve validity check for Google Sheets connection (#501) @bharatkashyap
- Extract reusable code editor for TypeScript modules (#584) @Janpot
- Add Tooltip explaining that a non-deployed app can't be opened (#582) @Janpot
- setting editingTitle to false does not blur input (#580) @bharatkashyap
- Disable view button on apps that aren't deployed yet (#581) @Janpot
- Delete confirmation dialog Doesn't need to be a form (#579) @Janpot
- Make component panel resizable (#570) @Janpot
- Ask for confirmation when not on master (#563) @Janpot
- Fix issue with BindableAttrValues type (#564) @Janpot
- Fix dom loading behavior for non-existing apps (#569) @Janpot

All contributors of this release in alphabetical order: @bharatkashyap, @Janpot

## v0.0.6

<!-- generated comparing v0.0.5..master -->

_Jun 15, 2022_

This release serves as an end-to-end test for the release workflow. It contains fixes for bugs that emerged while creating the first releases of toolpad.

- Move NodeId to @mui/toolpad-core (#561) @Janpot
- Add react as peer dependency to supporting libs (#560) @Janpot
- Run linters in CI (#559) @Janpot
- Fix image existence check in release script (#558) @Janpot
- Support page parameters (#555) @Janpot
- Some fixes on the release script (#557) @Janpot

## v0.0.5

Initial release
