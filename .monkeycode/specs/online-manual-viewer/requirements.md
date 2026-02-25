# Requirements Document: Online Manual Viewer

## Introduction

在线文档浏览网站系统，支持 PDF 手册拆分为单页图片、分页浏览、后台管理、广告管理等功能。系统面向单人管理模式设计，性能优先，无第三方注册及评论功能，符合国际 Google AdSense 手册站标准。

核心业务流程：**PDF 上传 → 自动拆图 → 生成页面 → 分页浏览 → 广告展示**

## Glossary

- **Manual（手册）**: 一份完整的 PDF 文档，如设备说明书、维修手册等
- **Page（页面）**: 手册的单页图片，由 PDF 拆分生成
- **Ad Slot（广告位）**: 预留的广告展示区域，符合 AdSense 标准
- **Admin（管理员）**: 系统唯一的管理者，负责内容管理和广告配置
- **Visitor（访客）**: 匿名浏览网站的用户，无需注册

---

## Requirements

### R1: PDF 上传与拆分

**User Story:** AS Admin, I want to upload PDF files and have them automatically split into individual page images, so that each page becomes a standalone web page.

#### Acceptance Criteria

1. WHEN Admin uploads a PDF file, the system SHALL validate the file format and size (max 100MB)
2. WHEN PDF upload completes, the system SHALL automatically extract each page as a high-quality image (WebP/JPEG format)
3. WHILE PDF processing is in progress, the system SHALL display a progress indicator to the Admin
4. IF PDF processing fails, the system SHALL display a specific error message and allow retry
5. WHEN PDF processing completes, the system SHALL generate a unique manual ID and store metadata (title, brand, model, page count, upload date)

---

### R2: 手册元数据管理

**User Story:** AS Admin, I want to input manual metadata (brand, model, category, description), so that pages have proper SEO titles and descriptions.

#### Acceptance Criteria

1. WHEN Admin creates a new manual, the system SHALL require fields: brand name, model number, category, and manual title
2. WHEN Admin inputs metadata, the system SHALL automatically generate SEO-friendly page titles following format: "{Manual Title} | Page {N}"
3. WHEN Admin inputs metadata, the system SHALL automatically generate page descriptions following format: "Page {N} of {Model} {category}, including {section summary}..."
4. WHEN Admin saves metadata, the system SHALL create a slug-based URL pattern: `/manual/{brand}/{model}/page-{n}`
5. IF manual title exceeds 60 characters, the system SHALL truncate and add ellipsis for SEO compliance

---

### R3: 单页浏览与导航

**User Story:** AS Visitor, I want to browse manual pages one at a time with easy navigation, so that I can read the content clearly on any device.

#### Acceptance Criteria

1. WHEN Visitor opens a manual page, the system SHALL display a single page image centered in the content area
2. WHEN page loads, the system SHALL apply a watermark overlay to protect content
3. WHILE viewing a page, the system SHALL display pagination controls (Previous, Page X of Y, Next)
4. WHEN Visitor clicks "Next Page", the system SHALL navigate to the next page URL without full page reload (AJAX/image swap preferred for performance)
5. WHEN Visitor is on the first page, the system SHALL disable the "Previous" button
6. WHEN Visitor is on the last page, the system SHALL disable the "Next" button
7. WHILE page image is loading, the system SHALL display a loading placeholder

---

### R4: SEO 优化页面结构

**User Story:** AS System Owner, I want each page to have optimized SEO elements, so that search engines can index the content properly and drive organic traffic.

#### Acceptance Criteria

1. WHEN generating a page, the system SHALL set `<title>` to format: "Model ABC-123 Service Manual | Page 1"
2. WHEN generating a page, the system SHALL set `<meta name="description">` to format: "Page 1 of ABC-123 service manual, including specifications..."
3. WHEN generating a page, the system SHALL include Open Graph tags (og:title, og:description, og:image, og:url)
4. WHEN generating a page, the system SHALL include structured data (JSON-LD) for Article/HowTo schema
5. WHEN generating a page, the system SHALL include canonical URL pointing to the current page
6. WHEN generating a page, the system SHALL include breadcrumbs navigation with schema markup

---

### R5: 广告位布局

**User Story:** AS System Owner, I want standardized AdSense-compliant ad placements on every page, so that I can monetize traffic effectively.

#### Acceptance Criteria

1. WHEN displaying a manual page, the system SHALL include a top banner ad slot (728x90 or responsive)
2. WHEN displaying a manual page, the system SHALL include a left sidebar ad slot (300x600)
3. WHEN displaying a manual page, the system SHALL include a right sidebar ad slot (300x600)
4. WHEN displaying a manual page, the system SHALL include a bottom banner ad slot (728x90)
5. IF screen width is less than 1024px, the system SHALL hide the right sidebar ad slot
6. IF screen width is less than 768px, the system SHALL hide both sidebar ad slots and show only top/bottom banners
7. WHEN ad slot is empty (no ad configured), the system SHALL display a placeholder with "Advertisement" label

---

### R6: 响应式布局

**User Story:** AS Visitor, I want the website to adapt to my screen size, so that I can browse manuals comfortably on desktop, tablet, or mobile.

#### Acceptance Criteria

1. WHEN screen width is greater than 1200px, the system SHALL display three-column layout (left sidebar, content, right sidebar)
2. WHEN screen width is between 768px and 1200px, the system SHALL display two-column layout (left sidebar, content)
3. WHEN screen width is less than 768px, the system SHALL display single-column layout (content only)
4. WHEN displaying on mobile, the system SHALL ensure page image width does not exceed screen width
5. WHEN displaying on mobile, the system SHALL provide swipe gesture support for page navigation
6. WHEN displaying on any device, the system SHALL ensure minimum touch target size of 44x44 pixels for navigation buttons

---

### R7: 后台管理面板

**User Story:** AS Admin, I want a secure admin panel to manage manuals, pages, and ads, so that I can maintain the website efficiently.

#### Acceptance Criteria

1. WHEN Admin accesses admin panel, the system SHALL require password authentication (single admin, no multi-user)
2. WHEN Admin logs in successfully, the system SHALL create a session valid for 24 hours
3. WHEN Admin session expires, the system SHALL redirect to login page
4. WHEN Admin is in dashboard, the system SHALL display summary statistics (total manuals, total pages, total views)
5. WHEN Admin manages manuals, the system SHALL provide CRUD operations (Create, Read, Update, Delete)
6. WHEN Admin deletes a manual, the system SHALL prompt for confirmation and delete all associated pages
7. WHEN Admin performs any action, the system SHALL log the action with timestamp

---

### R8: 广告管理

**User Story:** AS Admin, I want to manage ad configurations, so that I can control which ads appear on which pages.

#### Acceptance Criteria

1. WHEN Admin accesses ad management, the system SHALL display all ad slots with their current configuration
2. WHEN Admin configures an ad slot, the system SHALL accept AdSense code snippet or custom HTML
3. WHEN Admin sets ad configuration, the system SHALL allow page-level targeting (specific manuals or pages)
4. WHEN Admin saves ad configuration, the system SHALL apply changes immediately without page cache issues
5. WHEN Admin wants to test ads, the system SHALL provide a preview mode
6. IF ad code is invalid, the system SHALL display a validation error

---

### R9: 性能优化

**User Story:** AS System Owner, I want the website to load quickly, so that visitors have a good experience and bounce rate stays low.

#### Acceptance Criteria

1. WHEN page is requested, the system SHALL serve static HTML files (pre-generated, not dynamically rendered)
2. WHEN serving images, the system SHALL use WebP format with JPEG fallback
3. WHEN serving images, the system SHALL implement lazy loading for below-fold images
4. WHEN serving assets, the system SHALL set appropriate cache headers (1 year for static assets)
5. WHEN serving pages, the system SHALL enable gzip/brotli compression
6. WHEN page loads, the system SHALL achieve First Contentful Paint (FCP) under 1.5 seconds
7. WHEN page loads, the system SHALL achieve Largest Contentful Paint (LCP) under 2.5 seconds

---

### R10: 访问统计

**User Story:** AS Admin, I want to view access statistics, so that I can understand traffic patterns and optimize content.

#### Acceptance Criteria

1. WHEN a page is viewed, the system SHALL record a page view with timestamp, manual ID, page number
2. WHEN recording page views, the system SHALL exclude admin's own IP address (configurable)
3. WHEN Admin views statistics, the system SHALL display daily/weekly/monthly page view charts
4. WHEN Admin views statistics, the system SHALL display top-viewed manuals and pages
5. WHEN Admin views statistics, the system SHALL display traffic sources (direct, search, referral)
6. WHEN storing statistics, the system SHALL aggregate data to reduce storage (raw data retained for 30 days)

---

### R11: 面包屑导航

**User Story:** AS Visitor, I want to see where I am in the site structure, so that I can navigate easily and understand the content hierarchy.

#### Acceptance Criteria

1. WHEN displaying a manual page, the system SHALL show breadcrumbs: Home > Brand > Model > Page N
2. WHEN Visitor clicks "Home", the system SHALL navigate to the homepage
3. WHEN Visitor clicks a brand name, the system SHALL navigate to the brand listing page
4. WHEN Visitor clicks a model name, the system SHALL navigate to the first page of that manual
5. WHEN generating breadcrumbs, the system SHALL include Schema.org BreadcrumbList markup

---

### R12: 目录导航

**User Story:** AS Visitor, I want to see a table of contents in the sidebar, so that I can quickly jump to relevant sections.

#### Acceptance Criteria

1. WHEN displaying a manual page, the system SHALL show a table of contents (TOC) in the left sidebar
2. WHEN Admin defines TOC, the system SHALL allow mapping sections to page ranges
3. WHEN Visitor clicks a TOC entry, the system SHALL navigate to the first page of that section
4. WHEN current page is within a section, the system SHALL highlight that TOC entry
5. IF TOC is not defined for a manual, the system SHALL display page number links instead

---

### R13: 内容保护

**User Story:** AS System Owner, I want to protect manual content from easy downloading, so that content value is preserved.

#### Acceptance Criteria

1. WHEN displaying a page, the system SHALL disable right-click context menu on images
2. WHEN displaying a page, the system SHALL apply a transparent watermark overlay
3. WHEN displaying a page, the system SHALL not provide a direct download link for PDF
4. IF Visitor attempts to drag an image, the system SHALL prevent the drag action
5. WHEN serving images, the system SHALL use lazy-loaded image tags without direct PDF URLs in HTML

---

### R14: 首页设计

**User Story:** AS Visitor, I want to see a well-organized homepage, so that I can quickly find manuals I need.

#### Acceptance Criteria

1. WHEN Visitor opens the homepage, the system SHALL display a search box prominently
2. WHEN Visitor opens the homepage, the system SHALL display popular brands with manual counts
3. WHEN Visitor opens the homepage, the system SHALL display featured/recent manuals
4. WHEN Visitor opens the homepage, the system SHALL display category listings
5. WHEN Visitor uses search, the system SHALL provide autocomplete suggestions from manual titles

---

### R15: 安全性

**User Story:** AS System Owner, I want the admin panel to be secure, so that unauthorized access is prevented.

#### Acceptance Criteria

1. WHEN Admin attempts login, the system SHALL rate-limit attempts to 5 per minute per IP
2. WHEN Admin enters wrong password 5 times, the system SHALL lock the IP for 15 minutes
3. WHEN Admin session is active, the system SHALL regenerate session ID on each request
4. WHEN Admin performs sensitive actions (delete, upload), the system SHALL require re-authentication
5. WHEN serving pages, the system SHALL include security headers (X-Frame-Options, X-Content-Type-Options, CSP)

---

## Non-Functional Requirements

### NFR1: Scalability
- The system SHALL support at least 10,000 manuals with 1,000,000 total pages
- The system SHALL handle 100 concurrent visitors without degradation

### NFR2: Availability
- The system SHALL achieve 99.9% uptime
- The system SHALL serve pages from CDN when available

### NFR3: Maintainability
- The system SHALL use static site generation for public pages
- The system SHALL separate admin panel from public-facing site

---

## Out of Scope

- User registration and login
- Third-party comments (Disqus, etc.)
- Social media login
- PDF download feature
- Multi-language support (initial version)
- Payment/subscription system
