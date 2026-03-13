/**
 * Service task workflow definitions.
 *
 * Task *templates* live here in code (same pattern as report-config.ts).
 * Task *instances* are created in the service_tasks DB table when an admin
 * initializes the workflow for a specific company-service assignment.
 */

// ── Types ────────────────────────────────────────────────────

export type TaskPhase = 'content' | 'design' | 'development' | 'deployment';

export type TriggerType =
  | 'manual'         // Admin checks off
  | 'approval_gate'  // Requires explicit approval before next tasks unlock
  | 'ai_assisted'    // Has an AI action button (future)
  | 'automated';     // Fully automated (future)

export type TaskStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'blocked'
  | 'skipped';

export interface TaskActionConfig {
  /** Action type — expandable for future types (ai_action, external_link, etc.) */
  type: 'notion_select';
  /** Notion data source ID to query for options */
  notionDataSourceId: string;
  /** Modal title */
  label: string;
  /** Modal body description */
  description: string;
}

export interface SubtaskTemplate {
  key: string;
  label: string;
  description: string;
  /** Whether this substep must complete for parent auto-completion. Default true. */
  required?: boolean;
  sortOrder: number;
  /** Optional: reference to brik-llm script or automation */
  automationRef?: string;
  /** Optional: action config for modal-based subtask start (e.g., Notion select) */
  actionConfig?: TaskActionConfig;
}

export interface TaskTemplate {
  key: string;
  phase: TaskPhase;
  label: string;
  description: string;
  triggerType: TriggerType;
  sortOrder: number;
  /** Keys of tasks that must be completed/skipped before this one can start */
  dependsOn: string[];
  /** Optional: reference to brik-llm script or API endpoint */
  automationRef?: string;
  /** Optional: action config for modal-based task start (e.g., Notion select) */
  actionConfig?: TaskActionConfig;
  /** Optional: ordered substeps within this task */
  subtasks?: SubtaskTemplate[];
}

export interface PhaseConfig {
  key: TaskPhase;
  label: string;
}

export interface ServiceWorkflowConfig {
  serviceSlug: string;
  label: string;
  phases: PhaseConfig[];
  tasks: TaskTemplate[];
}

// ── Phase Labels ─────────────────────────────────────────────

export const PHASE_LABELS: Record<TaskPhase, string> = {
  content: 'Content',
  design: 'Design',
  development: 'Development',
  deployment: 'Deployment',
};

// ── Status Labels & Colors ───────────────────────────────────

export const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; variant: string }> = {
  not_started: { label: 'Not Started', variant: 'neutral' },
  in_progress: { label: 'In Progress', variant: 'info' },
  completed: { label: 'Completed', variant: 'success' },
  blocked: { label: 'Blocked', variant: 'warning' },
  skipped: { label: 'Skipped', variant: 'neutral' },
};

// ── Web Development Workflow ─────────────────────────────────

const WEB_DEV_TASKS: TaskTemplate[] = [
  // Phase: Content (7 tasks)
  {
    key: 'content_intake',
    phase: 'content',
    label: 'Client intake & discovery',
    description: 'Gather brand info, preferences, goals, and existing assets from the client.',
    triggerType: 'manual',
    sortOrder: 1,
    dependsOn: [],
    subtasks: [
      {
        key: 'intake_form',
        label: 'Select intake form',
        description: 'Choose the web intake form for this client from Notion.',
        sortOrder: 1,
        actionConfig: {
          type: 'notion_select',
          notionDataSourceId: '2e597d34-ed28-809a-b7d6-000b3504c5c2',
          label: 'Select intake form',
          description: 'Choose the web intake form for this client. The intake data will be linked to this task for downstream automation.',
        },
      },
      {
        key: 'automated_setup',
        label: 'Automated project setup',
        description: 'Run new-client.sh to create folder structure, .env, project.json, sitemap.json, CLAUDE.md.',
        sortOrder: 2,
        automationRef: 'brik-llm/scripts/new-client.sh',
      },
      {
        key: 'figma_setup',
        label: 'Figma project setup',
        description: 'Create Figma project from template, set up page structure.',
        sortOrder: 3,
      },
      {
        key: 'notion_setup',
        label: 'Notion teamspace setup',
        description: 'Duplicate client teamspace template in Notion.',
        sortOrder: 4,
      },
      {
        key: 'ga4_setup',
        label: 'GA4 & tracking setup',
        description: 'Create GTM container, GA4 property, and Microsoft Clarity project.',
        sortOrder: 5,
      },
      {
        key: 'brand_extraction',
        label: 'Brand guide extraction',
        description: 'Run brand_guide_extractor.py to produce brand-tokens.json with BDS semantic mapping.',
        sortOrder: 6,
        automationRef: 'brik-llm/scripts/brand_guide_extractor.py',
      },
      {
        key: 'webflow_api_token',
        label: 'Webflow API token',
        description: 'Generate Webflow API token, store in 1Password, .env, and Notion API Keys.',
        sortOrder: 7,
        required: false,
      },
      {
        key: 'gcp_project',
        label: 'Google Cloud project',
        description: 'Create GCP project for service accounts and API access.',
        sortOrder: 8,
        required: false,
      },
    ],
  },
  {
    key: 'content_sitemap',
    phase: 'content',
    label: 'Sitemap planning',
    description: 'Define page structure, navigation hierarchy, and URL routes.',
    triggerType: 'manual',
    sortOrder: 2,
    dependsOn: [],
  },
  {
    key: 'content_homepage',
    phase: 'content',
    label: 'Homepage content',
    description: 'Generate hero, sections, and CTAs for the homepage.',
    triggerType: 'ai_assisted',
    sortOrder: 3,
    dependsOn: ['content_sitemap'],
    automationRef: 'brik-llm/websites/02-content-strategy',
  },
  {
    key: 'content_interior',
    phase: 'content',
    label: 'Interior pages content',
    description: 'Generate content for About, Services, and Contact pages.',
    triggerType: 'ai_assisted',
    sortOrder: 4,
    dependsOn: ['content_sitemap'],
    automationRef: 'brik-llm/websites/02-content-strategy',
  },
  {
    key: 'content_cms',
    phase: 'content',
    label: 'CMS content templates',
    description: 'Define content structure for Blog, Team, and other CMS collections.',
    triggerType: 'ai_assisted',
    sortOrder: 5,
    dependsOn: ['content_sitemap'],
    automationRef: 'brik-llm/websites/02-content-strategy',
  },
  {
    key: 'content_seo',
    phase: 'content',
    label: 'SEO metadata & page titles',
    description: 'Generate meta titles, descriptions, and Open Graph tags for all pages.',
    triggerType: 'ai_assisted',
    sortOrder: 6,
    dependsOn: ['content_homepage', 'content_interior'],
    automationRef: 'brik-llm/websites/02-content-strategy',
  },
  {
    key: 'content_review',
    phase: 'content',
    label: 'Content review & approval',
    description: 'Client reviews all content. Approval unlocks the Design phase.',
    triggerType: 'approval_gate',
    sortOrder: 7,
    dependsOn: ['content_homepage', 'content_interior', 'content_cms', 'content_seo'],
  },

  // Phase: Design (9 tasks)
  {
    key: 'design_research',
    phase: 'design',
    label: 'Competitor research & moodboard',
    description: 'Analyze competitor sites and assemble visual direction references.',
    triggerType: 'ai_assisted',
    sortOrder: 8,
    dependsOn: ['content_review'],
    automationRef: 'brik-llm/websites/03-design',
  },
  {
    key: 'design_brand_expression',
    phase: 'design',
    label: 'Brand expression selection',
    description: 'Select spacing, border radius, elevation, and motion modes for the brand.',
    triggerType: 'manual',
    sortOrder: 9,
    dependsOn: ['design_research'],
  },
  {
    key: 'design_homepage_mockups',
    phase: 'design',
    label: 'Homepage mockups (3 variations)',
    description: 'Create 3 distinct homepage design directions for client review.',
    triggerType: 'manual',
    sortOrder: 10,
    dependsOn: ['design_brand_expression'],
  },
  {
    key: 'design_homepage_approval',
    phase: 'design',
    label: 'Client selects homepage direction',
    description: 'Client picks the winning homepage design. Approval unlocks interior mockups.',
    triggerType: 'approval_gate',
    sortOrder: 11,
    dependsOn: ['design_homepage_mockups'],
  },
  {
    key: 'design_interior_mockups',
    phase: 'design',
    label: 'Interior page mockups',
    description: 'Design About, Services overview, and Contact page layouts.',
    triggerType: 'manual',
    sortOrder: 12,
    dependsOn: ['design_homepage_approval'],
  },
  {
    key: 'design_interior_approval',
    phase: 'design',
    label: 'Interior mockup approval',
    description: 'Client approves interior page designs before development begins.',
    triggerType: 'approval_gate',
    sortOrder: 13,
    dependsOn: ['design_interior_mockups'],
  },
  {
    key: 'design_cms_mockups',
    phase: 'design',
    label: 'CMS template mockups',
    description: 'Design blog post, blog listing, service detail, and team member templates.',
    triggerType: 'manual',
    sortOrder: 14,
    dependsOn: ['design_homepage_approval'],
  },
  {
    key: 'design_token_extraction',
    phase: 'design',
    label: 'Brand token extraction',
    description: 'Extract color primitives, alias chains, typography, and mode selections to JSON.',
    triggerType: 'ai_assisted',
    sortOrder: 15,
    dependsOn: ['design_interior_approval'],
    automationRef: 'brik-llm/websites/03-design',
  },
  {
    key: 'design_figma_setup',
    phase: 'design',
    label: 'Figma library setup',
    description: 'Update Figma variables, verify component inheritance, and prepare for handoff.',
    triggerType: 'manual',
    sortOrder: 16,
    dependsOn: ['design_token_extraction'],
  },

  // Phase: Development (10 tasks)
  {
    key: 'dev_project_setup',
    phase: 'development',
    label: 'Webflow project setup',
    description: 'Duplicate the website template, configure site settings, and set up DNS.',
    triggerType: 'manual',
    sortOrder: 17,
    dependsOn: ['design_figma_setup'],
  },
  {
    key: 'dev_variables',
    phase: 'development',
    label: 'Variable & brand application',
    description: 'Apply brand tokens to Webflow variables using the prep script.',
    triggerType: 'ai_assisted',
    sortOrder: 18,
    dependsOn: ['dev_project_setup'],
    automationRef: 'brik-llm/websites/04-development/webflow_prep.py',
  },
  {
    key: 'dev_component_check',
    phase: 'development',
    label: 'Component validation',
    description: 'Verify all 57 BDS components render correctly with the new brand tokens.',
    triggerType: 'manual',
    sortOrder: 19,
    dependsOn: ['dev_variables'],
  },
  {
    key: 'dev_navigation',
    phase: 'development',
    label: 'Navigation build',
    description: 'Build header and footer navigation components.',
    triggerType: 'manual',
    sortOrder: 20,
    dependsOn: ['dev_component_check'],
  },
  {
    key: 'dev_homepage',
    phase: 'development',
    label: 'Homepage build',
    description: 'Assemble homepage sections using the approved mockup and content.',
    triggerType: 'manual',
    sortOrder: 21,
    dependsOn: ['dev_navigation'],
  },
  {
    key: 'dev_interior_pages',
    phase: 'development',
    label: 'Interior page builds',
    description: 'Build About, Services overview, and Contact pages.',
    triggerType: 'manual',
    sortOrder: 22,
    dependsOn: ['dev_navigation'],
  },
  {
    key: 'dev_sub_pages',
    phase: 'development',
    label: 'Sub-page builds',
    description: 'Build individual service pages, team bios, and other sub-pages.',
    triggerType: 'manual',
    sortOrder: 23,
    dependsOn: ['dev_interior_pages'],
  },
  {
    key: 'dev_legal_pages',
    phase: 'development',
    label: 'Legal pages',
    description: 'Build Privacy Policy and Terms of Service pages.',
    triggerType: 'manual',
    sortOrder: 24,
    dependsOn: ['dev_navigation'],
  },
  {
    key: 'dev_cms_setup',
    phase: 'development',
    label: 'CMS collection setup',
    description: 'Create Webflow CMS collections for Blog, Services, Team, etc.',
    triggerType: 'manual',
    sortOrder: 25,
    dependsOn: ['dev_component_check'],
  },
  {
    key: 'dev_cms_templates',
    phase: 'development',
    label: 'CMS template page builds',
    description: 'Build CMS template pages that pull dynamic content from collections.',
    triggerType: 'manual',
    sortOrder: 26,
    dependsOn: ['dev_cms_setup'],
  },
  // Phase: Deployment (7 tasks)
  {
    key: 'dev_ga4_property',
    phase: 'deployment',
    label: 'GA4 property setup',
    description: 'Find GA4 property from measurement ID, grant service account viewer access, and configure timezone.',
    triggerType: 'ai_assisted',
    sortOrder: 27,
    dependsOn: ['dev_project_setup'],
    automationRef: 'google-analytics/scripts/new-client-ga4.py',
  },
  {
    key: 'dev_gtm_variables',
    phase: 'deployment',
    label: 'GTM variables setup',
    description: 'Locate GTM container and create GA4 Measurement ID and screen resolution variables.',
    triggerType: 'ai_assisted',
    sortOrder: 28,
    dependsOn: ['dev_ga4_property'],
    automationRef: 'google-analytics/scripts/new-client-ga4.py',
  },
  {
    key: 'dev_gtm_triggers',
    phase: 'deployment',
    label: 'GTM triggers setup',
    description: 'Create bot filter, All Pages, form submission, phone click, and email click triggers.',
    triggerType: 'ai_assisted',
    sortOrder: 29,
    dependsOn: ['dev_gtm_variables'],
    automationRef: 'google-analytics/scripts/new-client-ga4.py',
  },
  {
    key: 'dev_gtm_tags',
    phase: 'deployment',
    label: 'GTM tags setup',
    description: 'Create GA4 config tag with bot blocking exception and event tags for form, phone, and email tracking.',
    triggerType: 'ai_assisted',
    sortOrder: 30,
    dependsOn: ['dev_gtm_triggers'],
    automationRef: 'google-analytics/scripts/new-client-ga4.py',
  },
  {
    key: 'dev_gtm_publish',
    phase: 'deployment',
    label: 'Publish GTM & verify data flow',
    description: 'Publish the GTM container version and verify GA4 data flow via realtime report.',
    triggerType: 'ai_assisted',
    sortOrder: 31,
    dependsOn: ['dev_gtm_tags'],
    automationRef: 'google-analytics/scripts/new-client-ga4.py',
  },
  {
    key: 'dev_responsive_qa',
    phase: 'deployment',
    label: 'Responsive QA',
    description: 'Test all pages across desktop, tablet, and mobile breakpoints.',
    triggerType: 'manual',
    sortOrder: 32,
    dependsOn: ['dev_homepage', 'dev_interior_pages', 'dev_sub_pages', 'dev_legal_pages', 'dev_cms_templates', 'dev_gtm_publish'],
  },
  {
    key: 'dev_launch',
    phase: 'deployment',
    label: 'Staging review & production launch',
    description: 'Deploy to staging for final review, then publish to production.',
    triggerType: 'approval_gate',
    sortOrder: 33,
    dependsOn: ['dev_responsive_qa'],
  },
];

export const WEB_DEV_WORKFLOW: ServiceWorkflowConfig = {
  serviceSlug: 'custom-standard-web-development-and-design',
  label: 'Custom Standard Web Development and Design',
  phases: [
    { key: 'content', label: 'Content' },
    { key: 'design', label: 'Design' },
    { key: 'development', label: 'Development' },
    { key: 'deployment', label: 'Deployment' },
  ],
  tasks: WEB_DEV_TASKS,
};

// ── Registry ─────────────────────────────────────────────────

const WORKFLOW_CONFIGS: ServiceWorkflowConfig[] = [
  WEB_DEV_WORKFLOW,
];

/**
 * Look up a workflow config by service slug.
 * Returns null if no workflow is defined for the service.
 */
export function getWorkflowConfig(serviceSlug: string): ServiceWorkflowConfig | null {
  return WORKFLOW_CONFIGS.find((c) => c.serviceSlug === serviceSlug) ?? null;
}
