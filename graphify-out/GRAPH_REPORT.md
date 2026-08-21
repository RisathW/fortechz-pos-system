# Graph Report - bookshop-system  (2026-08-21)

## Corpus Check
- 46 files · ~58,194 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1354 nodes · 5213 edges · 101 communities (62 shown, 39 thin omitted)
- Extraction: 76% EXTRACTED · 24% INFERRED · 0% AMBIGUOUS · INFERRED: 1243 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Chart Bundle: Backend Vendor Fragment 1
- Chart Bundle: Shared Vendor Fragment 1
- Chart Bundle: Angle/Radius Axis Drawing
- Chart Bundle: Frontend Vendor Fragment 1
- Chart Bundle: Shared Vendor Fragment 2
- Chart Bundle: Object Path Get/Set Utilities
- Chart Bundle: Area/Shape Generators & Curve Math
- Frontend Build Tooling & Dependencies
- Chart Bundle: Backend Vendor Fragment 2
- Backend Package & Electron Build Config
- Chart Bundle: Backend Vendor Fragment 3
- App Entry Points & Build Toolchain
- Chart Bundle: Frontend Vendor Fragment 2
- Chart Bundle: Shared Vendor Fragment 3
- Chart Bundle: Frontend Vendor Fragment 3
- Chart Bundle: Frontend Vendor Fragment 4
- Chart Bundle: Backend Vendor Fragment 4
- Frontend App Feature Components
- Chart Bundle: Backend Vendor Fragment 5
- Chart Bundle: Backend Vendor Fragment 6
- Chart Bundle: Backend Vendor Fragment 7
- Chart Bundle: Backend Vendor Fragment 8
- Chart Bundle: Tween Interpolation
- Chart Bundle: Backend Vendor Fragment 9
- Chart Bundle: Frontend Vendor Fragment 5
- Chart Bundle: Frontend Vendor Fragment 6
- Chart Bundle: Backend Vendor Fragment 10
- Chart Bundle: Shared Vendor Fragment 4
- Chart Bundle: Frontend Vendor Fragment 7
- Backend Express Server & Hardware I/O
- Chart Bundle: Backend Vendor Fragment 11
- Chart Bundle: Frontend Vendor Fragment 8
- Chart Bundle: Math/Color Utilities
- Chart Bundle: Frontend Vendor Fragment 9
- Chart Bundle: Frontend Vendor Fragment 10
- Chart Bundle: Frontend Vendor Fragment 11
- Chart Bundle: Canvas Path Drawing Primitives
- Chart Bundle: Backend Vendor Fragment 12
- Chart Bundle: Backend Vendor Fragment 13
- Chart Bundle: Backend Vendor Fragment 14
- Chart Bundle: Frontend Vendor Fragment 12
- Chart Bundle: Backend Vendor Fragment 15
- Chart Bundle: Backend Vendor Fragment 16
- Chart Bundle: Backend Vendor Fragment 17
- Chart Bundle: Backend Vendor Fragment 18
- Chart Bundle: Color Utilities (d3-color style)
- Chart Bundle: Animation Ticker
- Chart Bundle: Backend Vendor Fragment 19
- Chart Bundle: Frontend Vendor Fragment 13
- Electron Main Process
- Chart Bundle: Backend Vendor Fragment 20
- Factory Reset Utility
- Chart Bundle: Backend Vendor Fragment 21
- Chart Bundle: Backend Vendor Fragment 22
- Chart Bundle: Backend Vendor Fragment 23
- Chart Bundle: Backend Vendor Fragment 24
- Chart Bundle: Backend Vendor Fragment 25
- Chart Bundle: Backend Vendor Fragment 26
- Chart Bundle: Backend Vendor Fragment 27
- Chart Bundle: Backend Vendor Fragment 28
- Chart Bundle: Backend Vendor Fragment 29
- Chart Bundle: Shared Vendor Fragment 5
- Chart Bundle: Backend Vendor Fragment 30
- Chart Bundle: Backend Vendor Fragment 31
- Chart Bundle: Backend Vendor Fragment 32
- ForTechZ Logo Asset (backend, variant 2)
- ForTechZ Logo Asset (backend, variant 1)
- Backend Favicon
- Bluesky Icon (backend)
- Discord Icon (backend)
- Documentation Icon (backend)
- GitHub Icon (backend)
- Social Icon (backend)
- X/Twitter Icon (backend)
- Frontend Favicon (public)
- Bluesky Icon (frontend public)
- Discord Icon (frontend public)
- Documentation Icon (frontend public)
- GitHub Icon (frontend public)
- Social Icon (frontend public)
- X/Twitter Icon (frontend public)
- Hero Banner Image
- ForTechZ Logo Asset (frontend, variant 2)
- ForTechZ Logo Asset (frontend, variant 1)
- React Logo Asset
- Vite Logo Asset
- ForTechZ Logo Asset (frontend/ui build)
- Frontend Favicon (ui build)
- Bluesky Icon (frontend/ui build)
- Discord Icon (frontend/ui build)
- Documentation Icon (frontend/ui build)
- GitHub Icon (frontend/ui build)
- Social Icon (frontend/ui build)
- X/Twitter Icon (frontend/ui build)

## God Nodes (most connected - your core abstractions)
1. `n()` - 168 edges
2. `i()` - 150 edges
3. `t()` - 133 edges
4. `r()` - 128 edges
5. `a()` - 99 edges
6. `o()` - 97 edges
7. `i()` - 85 edges
8. `e()` - 78 edges
9. `rb()` - 74 edges
10. `s()` - 63 edges

## Surprising Connections (you probably didn't know these)
- `App Root Mount #root (backend/ui build)` --semantically_similar_to--> `App Root Mount #root (frontend/ui build)`  [INFERRED] [semantically similar]
  backend/ui/index.html → frontend/ui/index.html
- `v()` --indirect_call--> `aa()`  [INFERRED]
  backend/ui/assets/index-CcBWEApf.js → frontend/ui/assets/index-DZHljuzx.js
- `de()` --indirect_call--> `ce()`  [INFERRED]
  backend/ui/assets/index-CcBWEApf.js → frontend/ui/assets/index-DZHljuzx.js
- `Ze()` --indirect_call--> `de()`  [INFERRED]
  frontend/ui/assets/index-DZHljuzx.js → backend/ui/assets/index-CcBWEApf.js
- `fe()` --indirect_call--> `ce()`  [INFERRED]
  backend/ui/assets/index-CcBWEApf.js → frontend/ui/assets/index-DZHljuzx.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Vite React Template Toolchain** — frontend_readme_vitejs_plugin_react, frontend_readme_vitejs_plugin_react_swc, frontend_readme_react_compiler, frontend_readme_eslint [INFERRED 0.75]
- **React SPA Entry Point Across Build Stages** — frontend_index_app_entry, backend_ui_index_app_entry, frontend_ui_index_app_entry [INFERRED 0.75]
- **UI icon sprite set** — backend_ui_icons_bluesky, backend_ui_icons_discord, backend_ui_icons_documentation, backend_ui_icons_github, backend_ui_icons_social, backend_ui_icons_x [EXTRACTED 1.00]
- **UI Icon Sprite Set (icons.svg)** — frontend_public_icons_bluesky_icon, frontend_public_icons_discord_icon, frontend_public_icons_documentation_icon, frontend_public_icons_github_icon, frontend_public_icons_social_icon, frontend_public_icons_x_icon [EXTRACTED 1.00]
- **UI Icon Sprite Set** — frontend_ui_icons_bluesky, frontend_ui_icons_discord, frontend_ui_icons_documentation, frontend_ui_icons_github, frontend_ui_icons_social, frontend_ui_icons_x [EXTRACTED 1.00]

## Communities (101 total, 39 thin omitted)

### Community 0 - "Chart Bundle: Backend Vendor Fragment 1"
Cohesion: 0.05
Nodes (89): add(), applyPatches(), as(), Ba(), bs(), bu(), ch(), Co() (+81 more)

### Community 1 - "Chart Bundle: Shared Vendor Fragment 1"
Cohesion: 0.06
Nodes (85): ac(), Ai(), ao(), n(), bc(), bg(), Bi(), bl() (+77 more)

### Community 2 - "Chart Bundle: Angle/Radius Axis Drawing"
Cohesion: 0.03
Nodes (18): ag(), AR(), At(), eb(), ey(), formatHsl(), hj(), ip() (+10 more)

### Community 3 - "Chart Bundle: Frontend Vendor Fragment 1"
Cohesion: 0.10
Nodes (72): aa(), ae(), as(), b(), bi(), Bo(), ca(), ce() (+64 more)

### Community 4 - "Chart Bundle: Shared Vendor Fragment 2"
Cohesion: 0.10
Nodes (55): F(), Ac(), bc(), be(), c(), cc(), cf(), dc() (+47 more)

### Community 5 - "Chart Bundle: Object Path Get/Set Utilities"
Cohesion: 0.10
Nodes (48): a(), d(), f(), m(), n(), p(), ap(), u() (+40 more)

### Community 6 - "Chart Bundle: Area/Shape Generators & Curve Math"
Cohesion: 0.06
Nodes (51): areaEnd(), areaStart(), bezierCurveTo(), clear(), s(), dg(), eh(), fy() (+43 more)

### Community 7 - "Frontend Build Tooling & Dependencies"
Cohesion: 0.05
Nodes (43): autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, dependencies, lucide-react, react (+35 more)

### Community 8 - "Chart Bundle: Backend Vendor Fragment 2"
Cohesion: 0.12
Nodes (43): bf(), Bt(), cd(), cn(), dc(), dd(), Ed(), ep() (+35 more)

### Community 9 - "Backend Package & Electron Build Config"
Cohesion: 0.05
Nodes (42): author, build, appId, asar, directories, files, nsis, productName (+34 more)

### Community 10 - "Chart Bundle: Backend Vendor Fragment 3"
Cohesion: 0.09
Nodes (42): Ab(), bb(), bx(), cb(), cx(), db(), ex(), fb() (+34 more)

### Community 11 - "App Entry Points & Build Toolchain"
Cohesion: 0.06
Nodes (38): App Root Mount #root (backend/ui build), index-cJctbp67.css (bundled CSS), index-CcBWEApf.js (bundled JS), App Root Mount #root (frontend dev entry), /src/main.jsx entry script, ESLint, Oxc, React Compiler (+30 more)

### Community 12 - "Chart Bundle: Frontend Vendor Fragment 2"
Cohesion: 0.08
Nodes (38): ap(), ba(), ci(), cp(), ct(), dd(), di(), dp() (+30 more)

### Community 13 - "Chart Bundle: Shared Vendor Fragment 3"
Cohesion: 0.18
Nodes (35): be(), br(), D(), x(), Ge(), He(), j(), i() (+27 more)

### Community 14 - "Chart Bundle: Frontend Vendor Fragment 3"
Cohesion: 0.10
Nodes (24): ad(), bs(), Bt(), cs(), fs(), Gd(), hs(), jd() (+16 more)

### Community 15 - "Chart Bundle: Frontend Vendor Fragment 4"
Cohesion: 0.11
Nodes (32): at(), Au(), Cu(), De(), ec(), Eu(), Fa(), gu() (+24 more)

### Community 16 - "Chart Bundle: Backend Vendor Fragment 4"
Cohesion: 0.12
Nodes (26): Aa(), Ca(), da(), di(), fa(), fi(), hi(), iA() (+18 more)

### Community 17 - "Frontend App Feature Components"
Cohesion: 0.11
Nodes (13): App(), CheckoutPos(), GeneralInventory(), InventoryDashboard(), Login(), ReservationsDashboard(), ReturnsDashboard(), SalesHistory() (+5 more)

### Community 18 - "Chart Bundle: Backend Vendor Fragment 5"
Cohesion: 0.10
Nodes (26): av(), ay(), bv(), clamp(), cv(), dv(), fv(), hv() (+18 more)

### Community 19 - "Chart Bundle: Backend Vendor Fragment 6"
Cohesion: 0.11
Nodes (23): an(), dp(), ff(), fp(), t(), gt(), H(), ht() (+15 more)

### Community 20 - "Chart Bundle: Backend Vendor Fragment 7"
Cohesion: 0.17
Nodes (23): am(), ax(), l(), b(), C(), cy(), o(), dispatch() (+15 more)

### Community 21 - "Chart Bundle: Backend Vendor Fragment 8"
Cohesion: 0.11
Nodes (22): aj(), Bj(), cl(), ej(), ij(), il(), jp(), mf() (+14 more)

### Community 22 - "Chart Bundle: Tween Interpolation"
Cohesion: 0.11
Nodes (21): Bm(), Dr(), Fr(), getFrom(), getInterpolated(), getProgress(), getTo(), gr() (+13 more)

### Community 23 - "Chart Bundle: Backend Vendor Fragment 9"
Cohesion: 0.11
Nodes (21): cr(), dk(), et(), fk(), Ft(), gk(), hk(), it() (+13 more)

### Community 24 - "Chart Bundle: Frontend Vendor Fragment 5"
Cohesion: 0.16
Nodes (20): ar(), Cn(), cr(), dr(), Ed(), Er(), fr(), gr() (+12 more)

### Community 25 - "Chart Bundle: Frontend Vendor Fragment 6"
Cohesion: 0.16
Nodes (19): af(), df(), ds(), gf(), go(), gs(), Gt(), h() (+11 more)

### Community 26 - "Chart Bundle: Backend Vendor Fragment 10"
Cohesion: 0.27
Nodes (18): af(), df(), ef(), gl(), If(), jf(), kf(), lf() (+10 more)

### Community 27 - "Chart Bundle: Shared Vendor Fragment 4"
Cohesion: 0.14
Nodes (15): re(), dt(), en(), t(), n(), ko(), os(), t() (+7 more)

### Community 28 - "Chart Bundle: Frontend Vendor Fragment 7"
Cohesion: 0.21
Nodes (15): cl(), fl(), gc(), Il(), Ll(), ma(), Nl(), no() (+7 more)

### Community 29 - "Backend Express Server & Hardware I/O"
Cohesion: 0.17
Nodes (9): app, cors, escpos, { exec }, express, fs, os, path (+1 more)

### Community 30 - "Chart Bundle: Backend Vendor Fragment 11"
Cohesion: 0.20
Nodes (12): ah(), Bh(), ih(), nh(), oh(), Qm(), rh(), th() (+4 more)

### Community 31 - "Chart Bundle: Frontend Vendor Fragment 8"
Cohesion: 0.18
Nodes (12): bl(), el(), gl(), Hf(), hl(), jl(), ml(), vl() (+4 more)

### Community 32 - "Chart Bundle: Math/Color Utilities"
Cohesion: 0.18
Nodes (10): divide(), gg(), gv(), lg(), lv(), multiply(), parse(), subtract() (+2 more)

### Community 33 - "Chart Bundle: Frontend Vendor Fragment 9"
Cohesion: 0.24
Nodes (11): fd(), fn(), Ft(), Ht(), Nd(), nn(), on(), pd() (+3 more)

### Community 34 - "Chart Bundle: Frontend Vendor Fragment 10"
Cohesion: 0.20
Nodes (10): bu(), lt(), Lu(), mn(), qf(), sn(), _u(), Uu() (+2 more)

### Community 35 - "Chart Bundle: Frontend Vendor Fragment 11"
Cohesion: 0.29
Nodes (10): dl(), ef(), kl(), Lf(), ol(), pf(), Qd(), ul() (+2 more)

### Community 36 - "Chart Bundle: Canvas Path Drawing Primitives"
Cohesion: 0.22
Nodes (9): arc(), closePath(), Ct(), draw(), Jr(), lineTo(), moveTo(), rect() (+1 more)

### Community 37 - "Chart Bundle: Backend Vendor Fragment 12"
Cohesion: 0.36
Nodes (8): gd(), hn(), ir(), Qn(), tr(), v(), wd(), zf()

### Community 38 - "Chart Bundle: Backend Vendor Fragment 13"
Cohesion: 0.29
Nodes (7): dm(), fm(), Hm(), mm(), pm(), um(), Vm()

### Community 39 - "Chart Bundle: Backend Vendor Fragment 14"
Cohesion: 0.29
Nodes (7): fg(), Ig(), Ug(), i(), wg(), d(), zg()

### Community 40 - "Chart Bundle: Frontend Vendor Fragment 12"
Cohesion: 0.29
Nodes (6): bd(), cd(), et(), mp(), sd(), ut()

### Community 41 - "Chart Bundle: Backend Vendor Fragment 15"
Cohesion: 0.33
Nodes (6): ad(), Al(), jl(), kl(), Ml(), Ol()

### Community 42 - "Chart Bundle: Backend Vendor Fragment 16"
Cohesion: 0.33
Nodes (6): cj(), dj(), fj(), lj(), pj(), uj()

### Community 43 - "Chart Bundle: Backend Vendor Fragment 17"
Cohesion: 0.33
Nodes (6): dh(), fh(), lh(), mh(), ph(), uh()

### Community 44 - "Chart Bundle: Backend Vendor Fragment 18"
Cohesion: 0.40
Nodes (5): ak(), ik(), nk(), ok(), rk()

### Community 45 - "Chart Bundle: Color Utilities (d3-color style)"
Cohesion: 0.40
Nodes (5): displayable(), f(), g_(), rgb(), vf()

### Community 46 - "Chart Bundle: Animation Ticker"
Cohesion: 0.40
Nodes (5): n(), getState(), nextAnimationUpdate(), setProgress(), tick()

### Community 47 - "Chart Bundle: Backend Vendor Fragment 19"
Cohesion: 0.40
Nodes (5): Gw(), Hw(), Uw(), Vw(), Ww()

### Community 48 - "Chart Bundle: Frontend Vendor Fragment 13"
Cohesion: 0.40
Nodes (5): jr(), Mr(), Nr(), Pr(), Ru()

### Community 50 - "Chart Bundle: Backend Vendor Fragment 20"
Cohesion: 0.50
Nodes (4): bw(), Sw(), xw(), Yw()

### Community 52 - "Chart Bundle: Backend Vendor Fragment 21"
Cohesion: 0.67
Nodes (3): Au(), sd(), Ze()

### Community 53 - "Chart Bundle: Backend Vendor Fragment 22"
Cohesion: 0.67
Nodes (3): cM(), lM(), updateYAxisWidth()

### Community 54 - "Chart Bundle: Backend Vendor Fragment 23"
Cohesion: 0.67
Nodes (3): concat(), ms(), prepend()

### Community 55 - "Chart Bundle: Backend Vendor Fragment 24"
Cohesion: 0.67
Nodes (3): Cp(), wp(), xp()

### Community 56 - "Chart Bundle: Backend Vendor Fragment 25"
Cohesion: 0.67
Nodes (3): ee(), nE(), tE()

## Ambiguous Edges - Review These
- `App Root Mount #root (frontend dev entry)` → `App Root Mount #root (frontend/ui build)`  [AMBIGUOUS]
  frontend/index.html · relation: shares_data_with

## Knowledge Gaps
- **113 isolated node(s):** `{ Pool }`, `{ app, BrowserWindow, dialog }`, `path`, `name`, `productName` (+108 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **39 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `App Root Mount #root (frontend dev entry)` and `App Root Mount #root (frontend/ui build)`?**
  _Edge tagged AMBIGUOUS (relation: shares_data_with) - confidence is low._
- **Why does `Fa()` connect `Chart Bundle: Frontend Vendor Fragment 4` to `Chart Bundle: Angle/Radius Axis Drawing`, `Chart Bundle: Frontend Vendor Fragment 1`, `Chart Bundle: Frontend Vendor Fragment 3`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `Ro()` connect `Chart Bundle: Shared Vendor Fragment 4` to `Chart Bundle: Angle/Radius Axis Drawing`, `Chart Bundle: Frontend Vendor Fragment 1`, `Chart Bundle: Shared Vendor Fragment 2`, `Chart Bundle: Frontend Vendor Fragment 3`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `Ll()` connect `Chart Bundle: Frontend Vendor Fragment 7` to `Chart Bundle: Backend Vendor Fragment 1`, `Chart Bundle: Angle/Radius Axis Drawing`, `Chart Bundle: Frontend Vendor Fragment 3`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Are the 106 inferred relationships involving `n()` (e.g. with `Aa()` and `ac()`) actually correct?**
  _`n()` has 106 INFERRED edges - model-reasoned connections that need verification._
- **Are the 63 inferred relationships involving `i()` (e.g. with `f()` and `ac()`) actually correct?**
  _`i()` has 63 INFERRED edges - model-reasoned connections that need verification._
- **Are the 66 inferred relationships involving `t()` (e.g. with `ac()` and `am()`) actually correct?**
  _`t()` has 66 INFERRED edges - model-reasoned connections that need verification._