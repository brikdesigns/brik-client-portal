-- Migration: 00013_agreements
-- Agreement system for Phase 3: Contract & Payment
-- Auto-generated from accepted proposals, signed via clickwrap (ESIGN Act compliant)
-- Two agreement types: marketing_agreement (all clients), baa (healthcare only)

-- Agreement templates (admin-editable legal text with merge tags)
create table public.agreement_templates (
  id uuid primary key default gen_random_uuid(),
  type text not null
    check (type in ('marketing_agreement', 'baa')),
  version integer not null default 1,
  title text not null,
  content text not null,
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),

  unique (type, version)
);

-- Agreements (generated from templates, linked to proposals)
create table public.agreements (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  proposal_id uuid references public.proposals(id),
  template_id uuid references public.agreement_templates(id),
  type text not null
    check (type in ('marketing_agreement', 'baa')),
  title text not null,
  status text default 'draft'
    check (status in ('draft','sent','viewed','signed','expired')),
  token text unique not null,
  content_snapshot text not null,
  valid_until date,

  -- Signing audit trail (ESIGN Act compliance)
  signed_at timestamptz,
  signed_by_name text,
  signed_by_email text,
  signed_by_ip text,
  signed_by_user_agent text,

  -- Tracking
  first_viewed_at timestamptz,
  view_count integer default 0,
  sent_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index idx_agreement_templates_type on public.agreement_templates(type);
create index idx_agreements_client_id on public.agreements(client_id);
create index idx_agreements_proposal_id on public.agreements(proposal_id);
create index idx_agreements_token on public.agreements(token);
create index idx_agreements_status on public.agreements(status);

-- RLS
alter table public.agreement_templates enable row level security;
alter table public.agreements enable row level security;

create policy "Admin full access to agreement_templates"
  on public.agreement_templates for all
  using ((select public.get_user_role()) = 'admin');

create policy "Admin full access to agreements"
  on public.agreements for all
  using ((select public.get_user_role()) = 'admin');

-- Updated_at trigger
create trigger agreements_updated_at before update on public.agreements
  for each row execute function public.update_updated_at();

-- Seed: Marketing Agreement template (v1)
-- Merge tags: {{client_name}}, {{client_address}}, {{client_contact_name}},
-- {{client_contact_email}}, {{client_phone}}, {{effective_date}},
-- {{services_table}}, {{monthly_total}}, {{onetime_total}}, {{total_amount}}
insert into public.agreement_templates (type, version, title, content, is_active) values
('marketing_agreement', 1, 'Marketing Agreement', '# Marketing Agreement

This Marketing Agreement ("Agreement") is entered into as of **{{effective_date}}** by and between:

**Company:** Brik Designs LLC, a Florida limited liability company ("Company")
**Client:** {{client_name}}, located at {{client_address}} ("Client")
**Contact:** {{client_contact_name}} ({{client_contact_email}})

---

## 1. Scope of Services

Company will provide the following services as outlined in the accepted proposal:

{{services_table}}

**Total Amount:** {{total_amount}}

## 1A. Strategic Plan Model

Company operates on a plan-driven model. All services are delivered according to a strategic plan developed collaboratively with Client, not on a request-by-request basis. This ensures cohesive brand development and measurable results.

## 1B. Fair Use Policy

Monthly service bundles include ongoing services under a Fair Use policy. Company reserves the right to adjust scope if usage significantly exceeds reasonable expectations for the selected service tier. Company will notify Client before any adjustment takes effect.

## 2. Fees and Billing

All fees are as stated in the accepted proposal. Payment is due upon receipt of invoice. Company accepts ACH and credit card payments. All fees are non-refundable once services have commenced. Late payments accrue interest at 1.5% per month on the outstanding balance.

## 3. Client Obligations

Client agrees to provide timely information, content, and access to accounts and systems as reasonably required for Company to perform services. Client is responsible for maintaining active hosting, domain registrations, and third-party service accounts related to their digital presence.

## 4. Term and Termination

This Agreement is effective on the date of acceptance and continues on a month-to-month basis. Either party may terminate with 30 days written notice. Upon termination, Client is responsible for payment of all services rendered through the termination date.

## 5. Default

If either party materially breaches this Agreement, the non-breaching party shall provide written notice specifying the breach. The breaching party has 10 business days to cure the breach. If not cured, the non-breaching party may terminate this Agreement immediately.

## 6. Intellectual Property and Work Ownership

All work product created by Company under this Agreement ("Work Product") is owned by Company until Client has paid all amounts due in full. Upon full payment, Company grants Client a non-exclusive license to use the Work Product for its intended business purposes. Full ownership transfers to Client only upon complete payment of all outstanding balances.

## 6A. Early Termination Buyout

Owned Deliverables — including but not limited to websites, branding assets, CRM configurations, and design systems — remain the property of Company until fully paid. If Client terminates this Agreement before all deliverables are fully paid, Client must pay the remaining balance for all Owned Deliverables to retain access and ownership.

## 6B. Hosting and Transfer

Access to and transfer of all digital assets, including websites, hosting accounts, and domain configurations, will only be provided after all amounts owed to Company have been paid in full.

## 7. Indemnification

Client agrees to indemnify and hold harmless Company from any claims, damages, or expenses arising from Client''s use of the Work Product or Client''s breach of this Agreement. Company''s total liability under this Agreement shall not exceed the total amount paid by Client to Company.

## 8. Attorney Fees

In the event of a dispute, the prevailing party shall be entitled to recover reasonable attorney fees and collection costs from the non-prevailing party.

## 9. Governing Law

This Agreement shall be governed by the laws of the State of Florida. Any disputes shall be resolved in the courts of Palm Beach County, Florida. Both parties waive the right to a jury trial.

## 10. Notices

All notices under this Agreement shall be in writing and sent to the addresses on file for each party. Notice is effective upon receipt.

## 11. Business Associate Agreement

If Client operates in a healthcare-related industry subject to HIPAA regulations, a separate Business Associate Agreement (BAA) is required and incorporated by reference into this Agreement. The BAA must be executed before Company handles any Protected Health Information (PHI).

## 12. Entire Agreement

This Agreement, together with the accepted proposal and any referenced documents, constitutes the entire agreement between the parties. Modifications must be in writing and signed by both parties.', true),

('baa', 1, 'Business Associate Agreement', '# Business Associate Agreement

This Business Associate Agreement ("BAA") is entered into as of **{{effective_date}}** by and between:

**Covered Entity:** {{client_name}}, located at {{client_address}} ("Covered Entity")
**Business Associate:** Brik Designs LLC, a Florida limited liability company ("Business Associate")

This BAA is entered into in connection with the Marketing Agreement between the parties and is incorporated by reference therein.

---

## 1. Definitions

Terms used in this BAA shall have the same meaning as those terms in the HIPAA Rules (45 CFR Parts 160 and 164). "Protected Health Information" or "PHI" means any information, whether oral or recorded in any form or medium, that relates to the past, present, or future physical or mental health condition of an individual and is created or received by a healthcare provider.

## 2. Obligations of Business Associate

Business Associate agrees to:

- Not use or disclose PHI other than as permitted by this BAA or as required by law
- Use appropriate safeguards to prevent unauthorized use or disclosure of PHI
- Report to Covered Entity any use or disclosure of PHI not provided for by this BAA
- Ensure any agents or subcontractors agree to the same restrictions
- Make PHI available to Covered Entity as required by the HIPAA Privacy Rule
- Make internal practices, books, and records available to the Secretary of HHS for compliance determination

## 3. Permitted Uses and Disclosures

Business Associate may use or disclose PHI only as necessary to perform services under the Marketing Agreement, provided that such use or disclosure would not violate the Privacy Rule if done by Covered Entity.

## 4. Term and Termination

This BAA shall be effective for the duration of the Marketing Agreement. Upon termination, Business Associate shall return or destroy all PHI received from Covered Entity. If return or destruction is not feasible, Business Associate shall extend the protections of this BAA to such PHI.

## 5. Breach Notification

Business Associate shall notify Covered Entity within 60 days of discovering a breach of unsecured PHI. The notification shall include identification of affected individuals, description of the breach, and steps taken to mitigate harm.

## 6. Mutual Indemnification

Each party agrees to indemnify and hold harmless the other party from any claims, damages, or expenses arising from the indemnifying party''s breach of this BAA or violation of HIPAA Rules.', true);
