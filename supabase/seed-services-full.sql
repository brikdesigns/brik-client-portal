-- ==========================================================
-- Brik Services Catalog - Full seed from Notion
-- 76 services from Services Catalog database
-- Generated: 2026-02-15
-- ==========================================================

BEGIN;

-- Delete existing services (cascade will handle client_services)
DELETE FROM client_services;
DELETE FROM services;

-- Brand Design (9 services)

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Brand Guidelines', 'brand-guidelines', 'Comprehensive guide outlining logo use, typography, color palette, and brand voice to ensure consistency across platforms.', 'one_time', 'one_time', 100000, true, (SELECT id FROM service_categories WHERE slug = 'brand'), 1);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Brand Identity Bundle', 'brand-identity-bundle', 'Complete package including logo, brand guidelines, business card, letterhead, and email signature for a cohesive brand launch or refresh.', 'one_time', 'one_time', 325000, true, (SELECT id FROM service_categories WHERE slug = 'brand'), 2);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Business Card', 'business-card', 'Professionally designed card aligned with brand identity, formatted for printing and digital sharing.', 'one_time', 'one_time', 50000, true, (SELECT id FROM service_categories WHERE slug = 'brand'), 3);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Email Signature', 'email-signature', 'Branded, clickable email signature formatted for major platforms and optimized for clean, consistent communication.', 'one_time', 'one_time', 25000, true, (SELECT id FROM service_categories WHERE slug = 'brand'), 4);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Letterhead Stationary', 'letterhead-stationary', 'Branded letterhead design optimized for both print and digital documentation, delivered in editable formats.', 'one_time', 'one_time', 35000, true, (SELECT id FROM service_categories WHERE slug = 'brand'), 5);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Logo Update', 'logo-update', 'Refines and modernizes an existing logo, delivering multiple file formats and color variations. Does not include new concepts; additional revisions are extra.', 'one_time', 'one_time', 50000, true, (SELECT id FROM service_categories WHERE slug = 'brand'), 6);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Online Business Listings', 'online-business-listings', 'Creates and optimizes business listings on Google, Yelp, Facebook, and directories for brand consistency and accuracy. Ensures NAP (name, address, phone) consistency but does not guarantee search ranking improvements.', 'one_time', 'one_time', 75000, true, (SELECT id FROM service_categories WHERE slug = 'brand'), 7);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Premium Logo Design', 'premium-logo-design', 'Includes three logo concepts, three revision rounds, consultation and one-on-one collaboration, multiple file formats, color variations, and a favicon. Additional revisions and brand guidelines available for an extra fee.', 'one_time', 'one_time', 145000, true, (SELECT id FROM service_categories WHERE slug = 'brand'), 8);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Standard Logo Design', 'standard-logo-design', 'Includes three logo concepts, two revision rounds, multiple file formats, color variations, and a favicon. Additional revisions and brand guidelines available for an extra fee.', 'one_time', 'one_time', 65000, true, (SELECT id FROM service_categories WHERE slug = 'brand'), 9);

-- Marketing Design (27 services)

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Comprehensive Marketing Audit & Consultation', 'comprehensive-marketing-audit-consultation', 'One-time session to review your current marketing and provide personalized recommendations. Includes a follow-up summary. No deliverables or ongoing support included.', 'one_time', 'one_time', NULL, false, (SELECT id FROM service_categories WHERE slug = 'marketing'), 10);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Custom Large E-Commerce Web Development and Design', 'custom-large-e-commerce-web-development-and-design', 'A fully custom, conversion-focused website that is a branded, online store with product layouts and shopping functionality for up to 15+ products. Featuring unique design elements, SEO-friendly structure, and mobile responsiveness. Includes basic content input, with additional pages and content upda', 'one_time', 'one_time', 950000, true, (SELECT id FROM service_categories WHERE slug = 'marketing'), 11);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Custom Large Web Development and Design', 'custom-large-web-development-and-design', 'A fully custom, 10+ page website tailored to your brand, featuring unique design elements, SEO-friendly structure, and mobile responsiveness. Includes basic content input, with additional pages and content updates available for an extra cost.', 'one_time', 'one_time', 725000, true, (SELECT id FROM service_categories WHERE slug = 'marketing'), 12);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Custom Standard E-Commerce Web Development and Design', 'custom-standard-e-commerce-web-development-and-design', 'A fully custom, conversion-focused website that is a branded, online store with product layouts and shopping functionality for up to 5–10 products. Featuring unique design elements, SEO-friendly structure, and mobile responsiveness. Includes basic content input, with additional pages and content upd', 'one_time', 'one_time', 650000, true, (SELECT id FROM service_categories WHERE slug = 'marketing'), 13);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Custom Standard Web Development and Design', 'custom-standard-web-development-and-design', 'A fully custom, five-page website tailored to your brand, featuring unique design elements, SEO-friendly structure, and mobile responsiveness. Includes basic content input, with additional pages and content updates available for an extra cost.', 'one_time', 'one_time', 450000, true, (SELECT id FROM service_categories WHERE slug = 'marketing'), 14);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Email Drip Campaign (Up to 6 Emails)', 'email-drip-campaign-up-to-6-emails', 'A six-email sequence designed for engagement and conversions. Includes branded design and formatting but does not cover automation, list segmentation, or analytics.', 'one_time', 'one_time', 100000, true, (SELECT id FROM service_categories WHERE slug = 'marketing'), 15);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Email Marketing (Bundle - Up to 3 Emails)', 'email-marketing-bundle-up-to-3-emails', 'Three custom-branded emails with strategy, design, and formatting for email platforms. Automation, list growth, and analytics tracking available for an additional fee.', 'one_time', 'one_time', 60000, true, (SELECT id FROM service_categories WHERE slug = 'marketing'), 16);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Email Marketing (Single Email)', 'email-marketing-single-email', 'A branded, optimized email designed for platforms like Mailchimp or HubSpot, with clickable CTAs. Does not include automation setup, list management, or analytics tracking.', 'one_time', 'one_time', 30000, true, (SELECT id FROM service_categories WHERE slug = 'marketing'), 17);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Email Marketing – Ongoing Management', 'email-marketing-ongoing-management', 'One professionally designed email per month, formatted for email platforms, mobile-optimized, and with clickable CTAs. Automation and performance tracking available as add-ons.', 'recurring', 'monthly', 24900, true, (SELECT id FROM service_categories WHERE slug = 'marketing'), 18);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Fractional CMO & Strategic Marketing Oversight', 'fractional-cmo-strategic-marketing-oversight', 'These services cover strategic marketing, brand management, project oversight, and performance reporting. Includes 10 hours per month, with additional services available at an hourly rate.', 'recurring', 'monthly', 325000, true, (SELECT id FROM service_categories WHERE slug = 'marketing'), 19);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Landing Pages', 'landing-pages', 'A well-designed landing page can turn interest into action. We build strategic, conversion-focused pages that guide visitors toward taking the next step, whether it’s signing up, purchasing, or learning more.', 'one_time', 'one_time', 65000, true, (SELECT id FROM service_categories WHERE slug = 'marketing'), 20);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Marketing Support', 'marketing-support', 'Full-service marketing support that strengthens your brand, improves your website, fixes listings, and creates strategic campaigns (email, landing pages, collateral, and branded content). Perfect for businesses needing consistent, professional marketing without hiring an in-house team.', 'recurring', 'monthly', 125000, true, (SELECT id FROM service_categories WHERE slug = 'marketing'), 21);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('On Demand: Builder's Choice', 'on-demand-builders-choice', 'Builder''s Choice provides 10 hours of monthly design work, delivering 4-6 marketing and branding projects with print and digital formats for businesses needing consistent brand presence.', 'recurring', 'monthly', 140000, true, (SELECT id FROM service_categories WHERE slug = 'marketing'), 22);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('On Demand: Starter Stack', 'on-demand-starter-stack', 'The Starter Stack provides 5 hours monthly on-demand design work ($750/month) for small businesses. Includes 2-3 design requests with professional branding and high-resolution files for print/digital marketing materials like flyers, brochures, and social media graphics.', 'recurring', 'monthly', 75000, true, (SELECT id FROM service_categories WHERE slug = 'marketing'), 23);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('On-Demand: The Brikhouse', 'on-demand-the-brikhouse', 'The Brikhouse provides 20 monthly hours of professional design work, delivering 7-10+ smaller or 3-5 larger projects including booklets, merchandise, emails, landing pages and documents, with consistent branding for print and digital.', 'recurring', 'monthly', 260000, true, (SELECT id FROM service_categories WHERE slug = 'marketing'), 24);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Press Release + Distribution', 'press-release-distribution', 'Professional press release writing and submission through an industry-standard distribution platform. Includes one release (400–600 words), revisions, and submission to a PR wire. Media outreach not included.', 'one_time', 'one_time', 55000, true, (SELECT id FROM service_categories WHERE slug = 'marketing'), 25);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Press Release + Distribution + Media Pitching', 'press-release-distribution-media-pitching', 'End-to-end press release development, distribution, and personalized media outreach to targeted journalists or outlets. Includes custom media list, direct outreach, and follow-up. Media placements not guaranteed.', 'one_time', 'one_time', 225000, true, (SELECT id FROM service_categories WHERE slug = 'marketing'), 26);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Social Media Graphic Bundle of 10', 'social-media-graphic-bundle-of-10', 'Set of 10 social graphics designed around a campaign or content theme, ready for publishing.', 'one_time', 'one_time', 125000, true, (SELECT id FROM service_categories WHERE slug = 'marketing'), 27);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Social Media Graphic Bundle of 5', 'social-media-graphic-bundle-of-5', 'Branded post graphic designed for engagement, formatted for your preferred platform.', 'one_time', 'one_time', 40000, true, (SELECT id FROM service_categories WHERE slug = 'marketing'), 28);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Software Automation Setup', 'software-automation-setup', 'Setup and branding of existing automation features (e.g. reminders, welcome emails) within your current software. No custom workflows or integrations included.', 'one_time', 'one_time', 55000, true, (SELECT id FROM service_categories WHERE slug = 'marketing'), 29);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Swag & Merchandise Design Bundle (Up to 5 Items)', 'swag-merchandise-design-bundle-up-to-5-items', 'Designs for up to five branded merchandise items, formatted for production with consistent branding. Printing and vendor management not included.', 'one_time', 'one_time', 120000, true, (SELECT id FROM service_categories WHERE slug = 'marketing'), 30);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Swag and Merchandise Design (1 Item)', 'swag-and-merchandise-design-1-item', 'Custom design for one branded item (t-shirts, hats, mugs, etc.), including vendor-ready print files. Does not include printing or vendor management.', 'one_time', 'one_time', 40000, true, (SELECT id FROM service_categories WHERE slug = 'marketing'), 31);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Templated Website Design & Development', 'templated-website-design-development', 'A pre-designed, industry-specific website template customized with your branding, responsive for mobile and desktop, and optimized for SEO. Includes basic content input with ongoing edits available through a monthly subscription. No custom layouts or extensive content writing.', 'recurring', 'monthly', 39900, true, (SELECT id FROM service_categories WHERE slug = 'marketing'), 32);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Web Design', 'web-design', NULL, 'one_time', 'one_time', NULL, false, (SELECT id FROM service_categories WHERE slug = 'marketing'), 33);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Website Experience Mapping', 'website-experience-mapping', 'Identify gaps and friction in your website journey to improve user flow, engagement, and conversion.', 'one_time', 'one_time', 82500, true, (SELECT id FROM service_categories WHERE slug = 'marketing'), 34);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Website Maintenance', 'website-maintenance', 'Ensures your website stays updated, secure, and functional, with basic content edits and inquiry reporting. Client-provided edits are implemented, while extensive content writing and additional pages are extra.', 'add_on', 'monthly', 19900, true, (SELECT id FROM service_categories WHERE slug = 'marketing'), 35);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Website Maintenance (E-Commerce)', 'website-maintenance-e-commerce', 'Ensures your website stays updated, secure, and functional, with basic content edits and inquiry reporting. Client-provided edits are implemented, while extensive content writing and additional pages are extra.', 'add_on', 'monthly', 29900, true, (SELECT id FROM service_categories WHERE slug = 'marketing'), 36);

-- Information Design (13 services)

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Booklet Design', 'booklet-design', 'A professionally designed multi-page booklet for reports, catalogs, or guides. Additional pages cost $100 each. Printing and interactive versions available at extra cost.', 'one_time', 'one_time', 175000, true, (SELECT id FROM service_categories WHERE slug = 'information'), 37);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Brochure', 'brochure', 'Folded print or digital piece designed to tell your story or showcase services in a professional, branded format.', 'one_time', 'one_time', 125000, true, (SELECT id FROM service_categories WHERE slug = 'information'), 38);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Flyer', 'flyer', 'Custom flyer, brochure, or trade show material designed for print and digital use, including one revision round. Printing services and additional revisions available at extra cost.', 'one_time', 'one_time', 24900, true, (SELECT id FROM service_categories WHERE slug = 'information'), 39);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Infographics', 'infographics', 'Visually engaging, branded data or process visualization optimized for digital or print distribution.', 'one_time', 'one_time', 75000, true, (SELECT id FROM service_categories WHERE slug = 'information'), 40);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Intake Forms', 'intake-forms', 'Branded, user-friendly form design optimized for efficient client intake and available in fillable digital or print-ready formats.', 'one_time', 'one_time', 42500, true, (SELECT id FROM service_categories WHERE slug = 'information'), 41);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Large Signage Design', 'large-signage-design', 'Custom design for entrance signs, billboards, property maps, and monument signs, with a 3D mockup. Does not include printing or permitting guidance.', 'one_time', 'one_time', 50000, true, (SELECT id FROM service_categories WHERE slug = 'information'), 42);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Layout Design', 'layout-design', 'Custom layout and design of long-form materials like eBooks, guides, or reports with cohesive branding throughout - up to 20 pages.', 'one_time', 'one_time', 150000, true, (SELECT id FROM service_categories WHERE slug = 'information'), 43);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('One-Pager', 'one-pager', 'Includes custom layout design for print and digital use, content formatting for visual clarity, one round of revisions, and high-res files with bleed (PDF, PNG, JPG). Additional revisions, multi-location versions, translations, and print management available for an extra fee.', 'one_time', 'one_time', 50000, true, (SELECT id FROM service_categories WHERE slug = 'information'), 44);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Sales Pitch Deck', 'sales-pitch-deck', 'Professionally designed slide deck to support sales conversations, including branded layout, visuals, and structure.', 'one_time', 'one_time', 120000, true, (SELECT id FROM service_categories WHERE slug = 'information'), 45);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Sales Proposal', 'sales-proposal', 'Branded, easy-to-edit proposal template or document with clearly defined sections for scope, pricing, and next steps.', 'one_time', 'one_time', 60000, true, (SELECT id FROM service_categories WHERE slug = 'information'), 46);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Sales Resources', 'sales-resources', 'Custom-designed assets (e.g. pricing sheets, FAQs) that support sales teams in closing leads with clear and consistent visuals.', 'one_time', 'one_time', 60000, true, (SELECT id FROM service_categories WHERE slug = 'information'), 47);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Small Signage Design', 'small-signage-design', 'Custom design for directional, restroom, or amenity signs, delivered in print-ready formats. Printing, vendor communication, and additional revisions available for a fee.', 'one_time', 'one_time', 24900, true, (SELECT id FROM service_categories WHERE slug = 'information'), 48);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Welcome Onboarding Kit', 'welcome-onboarding-kit', 'Branded packet for clients or team onboarding, including materials like welcome letters, checklists, and FAQs.', 'one_time', 'one_time', 95000, true, (SELECT id FROM service_categories WHERE slug = 'information'), 49);

-- Service Design (Back Office) (20 services)

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Automated Workflow and AI Integration (Basic)', 'automated-workflow-and-ai-integration-basic', 'Implement automation in sales, marketing, and operations to reduce manual tasks, improve efficiency, and enhance customer engagement.', 'one_time', 'one_time', 350000, true, (SELECT id FROM service_categories WHERE slug = 'service'), 50);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Automated Workflow and AI Integration (High-End)', 'automated-workflow-and-ai-integration-high-end', 'Implement automation in sales, marketing, and operations to reduce manual tasks, improve efficiency, and enhance customer engagement.', 'one_time', 'one_time', 750000, true, (SELECT id FROM service_categories WHERE slug = 'service'), 51);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Automated Workflow and AI Integration (Mid-Range)', 'automated-workflow-and-ai-integration-mid-range', 'Implement automation in sales, marketing, and operations to reduce manual tasks, improve efficiency, and enhance customer engagement.', 'one_time', 'one_time', 600000, true, (SELECT id FROM service_categories WHERE slug = 'service'), 52);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Back Office Support', 'back-office-support', 'Operational support to organize your business behind the scenes — CRM setup, workflows, forms, automations, SOPs, and customer journey improvements. Perfect for businesses needing smoother operations, better follow-up, and less manual work.', 'recurring', 'monthly', 125000, true, (SELECT id FROM service_categories WHERE slug = 'service'), 53);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('CRM Setup and Data Cleanup (Base)', 'crm-setup-and-data-cleanup-base', 'Structure and optimize your CRM by cleaning existing data, setting up custom fields, and ensuring a scalable system for lead and customer management.', 'one_time', 'one_time', 500000, true, (SELECT id FROM service_categories WHERE slug = 'service'), 54);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('CRM Setup and Data Cleanup (High-End)', 'crm-setup-and-data-cleanup-high-end', 'Structure and optimize your CRM by cleaning existing data, setting up custom fields, and ensuring a scalable system for lead and customer management.', 'one_time', 'one_time', 1200000, true, (SELECT id FROM service_categories WHERE slug = 'service'), 55);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('CRM Setup and Data Cleanup (Mid-Range)', 'crm-setup-and-data-cleanup-mid-range', 'Structure and optimize your CRM by cleaning existing data, setting up custom fields, and ensuring a scalable system for lead and customer management.', 'one_time', 'one_time', 950000, true, (SELECT id FROM service_categories WHERE slug = 'service'), 56);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Customer Journey Mapping (High-End)', 'customer-journey-mapping-high-end', 'Identify friction points in your customer’s journey and optimize touchpoints for better engagement and conversion rates.', 'one_time', 'one_time', 800000, true, (SELECT id FROM service_categories WHERE slug = 'service'), 57);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Customer Journey Mapping (Mid-Range)', 'customer-journey-mapping-mid-range', 'Identify friction points in your customer’s journey and optimize touchpoints for better engagement and conversion rates.', 'one_time', 'one_time', 675000, true, (SELECT id FROM service_categories WHERE slug = 'service'), 58);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Customer Journey Mapping (Standard)', 'customer-journey-mapping-standard', 'Identify friction points in your customer’s journey and optimize touchpoints for better engagement and conversion rates.', 'one_time', 'one_time', 450000, true, (SELECT id FROM service_categories WHERE slug = 'service'), 59);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Digital File Organization', 'digital-file-organization', 'Declutter your digital workspace with organized, easy-to-navigate file systems your team can actually maintain.', 'one_time', 'one_time', 250000, true, (SELECT id FROM service_categories WHERE slug = 'service'), 60);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Ongoing Data Management & Reporting (Basic)', 'ongoing-data-management-reporting-basic', 'Maintain clean, structured data while generating reports and insights to track key performance metrics for smarter decision-making.', 'recurring', 'monthly', 100000, true, (SELECT id FROM service_categories WHERE slug = 'service'), 61);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Ongoing Data Management & Reporting (High-End)', 'ongoing-data-management-reporting-high-end', 'Maintain clean, structured data while generating reports and insights to track key performance metrics for smarter decision-making.', 'recurring', 'monthly', 250000, true, (SELECT id FROM service_categories WHERE slug = 'service'), 62);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Ongoing Data Management & Reporting (Mid-Range)', 'ongoing-data-management-reporting-mid-range', 'Maintain clean, structured data while generating reports and insights to track key performance metrics for smarter decision-making.', 'recurring', 'monthly', 250000, true, (SELECT id FROM service_categories WHERE slug = 'service'), 63);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Patient Experience Mapping', 'patient-experience-mapping', 'Design a smoother, more consistent patient experience to reduce no-shows, improve retention, and enhance marketing results.', 'one_time', 'one_time', 125000, true, (SELECT id FROM service_categories WHERE slug = 'service'), 64);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Software and Subscription Audit (Base)', 'software-and-subscription-audit-base', 'A full review of software tools and subscriptions to eliminate unnecessary costs, identify redundancies, and optimize expenses.', 'one_time', 'one_time', 35000, true, (SELECT id FROM service_categories WHERE slug = 'service'), 65);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Software and Subscription Audit (High-End)', 'software-and-subscription-audit-high-end', 'A full review of software tools and subscriptions to eliminate unnecessary costs, identify redundancies, and optimize expenses.', 'one_time', 'one_time', 120000, true, (SELECT id FROM service_categories WHERE slug = 'service'), 66);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Software and Subscription Audit (Mid-Range)', 'software-and-subscription-audit-mid-range', 'A full review of software tools and subscriptions to eliminate unnecessary costs, identify redundancies, and optimize expenses.', 'one_time', 'one_time', 70000, true, (SELECT id FROM service_categories WHERE slug = 'service'), 67);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Standard Operating Procedures (SOP) Creation', 'standard-operating-procedures-sop-creation', 'Document clear, repeatable processes that improve consistency, speed up onboarding, and reduce internal confusion.', 'one_time', 'one_time', 95000, true, (SELECT id FROM service_categories WHERE slug = 'service'), 68);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Training Setup & Organization', 'training-setup-organization', 'Centralize your internal resources so training new hires and managing knowledge becomes effortless.', 'one_time', 'one_time', 525000, true, (SELECT id FROM service_categories WHERE slug = 'service'), 69);

-- Product Design (7 services)

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Content Design', 'content-design', 'Structured formatting and visual enhancement of written content for digital products, help docs, or onboarding flows.', 'one_time', 'one_time', 650000, true, (SELECT id FROM service_categories WHERE slug = 'product'), 70);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Design Systems', 'design-systems', 'Reusable component library with typography, color rules, and UI styles to ensure consistency in product development.', 'one_time', 'one_time', 1000000, true, (SELECT id FROM service_categories WHERE slug = 'product'), 71);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Full SaaS or Enterprise Product Design (15 Screens)', 'full-saas-or-enterprise-product-design-15-screens', 'UI/UX design for up to 15 screens with high-fidelity mockups and consistent design system components.', 'one_time', 'one_time', 1500000, true, (SELECT id FROM service_categories WHERE slug = 'product'), 72);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Full SaaS or Enterprise Product Design (16–30 Screens)', 'full-saas-or-enterprise-product-design-1630-screens', 'Expanded product design for larger platforms including user flows, responsive layouts, and up to 30 screens.', 'one_time', 'one_time', 2500000, true, (SELECT id FROM service_categories WHERE slug = 'product'), 73);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Mobile App Design (10 Screens)', 'mobile-app-design-10-screens', 'Custom UI design for up to 10 mobile app screens, optimized for user experience and responsive performance.', 'one_time', 'one_time', 1200000, true, (SELECT id FROM service_categories WHERE slug = 'product'), 74);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Mobile App Design (11–20 Screens)', 'mobile-app-design-1120-screens', 'Expanded mobile app design for more complex flows, including user journey optimization and screen consistency.', 'one_time', 'one_time', 1800000, true, (SELECT id FROM service_categories WHERE slug = 'product'), 75);

INSERT INTO services (name, slug, description, service_type, billing_frequency, base_price_cents, active, category_id, sort_order)
VALUES ('Product Support', 'product-support', 'UX/UI and product design support for improving workflows, redesigning features, upgrading onboarding, building design systems, and creating intuitive interfaces. Perfect for SaaS teams needing ongoing UX expertise without hiring in-house.', 'recurring', 'monthly', 250000, false, (SELECT id FROM service_categories WHERE slug = 'product'), 76);

COMMIT;
