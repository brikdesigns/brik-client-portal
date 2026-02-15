import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe';

interface SyncResult {
  matched: { service_name: string; stripe_product_id: string; stripe_price_id: string | null }[];
  unmatched_stripe: { name: string; stripe_product_id: string }[];
  unmatched_portal: { name: string; service_id: string }[];
  errors: string[];
}

export async function POST(request: Request) {
  // ── Admin auth check (same pattern as invite/route.ts) ──
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // ── Parse options ──
  const body = await request.json().catch(() => ({}));
  const dryRun = body.dry_run === true;

  // ── Fetch all active Stripe products ──
  const stripe = getStripe();
  const stripeProducts: { id: string; name: string; default_price: string | null }[] = [];

  try {
    for await (const product of stripe.products.list({ active: true, limit: 100 })) {
      stripeProducts.push({
        id: product.id,
        name: product.name,
        default_price: typeof product.default_price === 'string'
          ? product.default_price
          : product.default_price?.id ?? null,
      });
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Stripe API error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 502 },
    );
  }

  // ── Fetch all portal services ──
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: services, error: dbError } = await serviceClient
    .from('services')
    .select('id, name, stripe_product_id, stripe_price_id');

  if (dbError || !services) {
    return NextResponse.json(
      { error: `Database error: ${dbError?.message ?? 'No services found'}` },
      { status: 500 },
    );
  }

  // ── Match by name (case-insensitive, trimmed) ──
  const normalize = (s: string) => s.trim().toLowerCase();

  const serviceMap = new Map<string, (typeof services)[number]>();
  for (const svc of services) {
    serviceMap.set(normalize(svc.name), svc);
  }

  const result: SyncResult = {
    matched: [],
    unmatched_stripe: [],
    unmatched_portal: [],
    errors: [],
  };

  const matchedServiceIds = new Set<string>();

  for (const product of stripeProducts) {
    const key = normalize(product.name);
    const svc = serviceMap.get(key);

    if (svc) {
      matchedServiceIds.add(svc.id);
      result.matched.push({
        service_name: svc.name,
        stripe_product_id: product.id,
        stripe_price_id: product.default_price,
      });

      if (!dryRun) {
        const { error: updateError } = await serviceClient
          .from('services')
          .update({
            stripe_product_id: product.id,
            stripe_price_id: product.default_price,
          })
          .eq('id', svc.id);

        if (updateError) {
          result.errors.push(`Failed to update "${svc.name}": ${updateError.message}`);
        }
      }
    } else {
      result.unmatched_stripe.push({
        name: product.name,
        stripe_product_id: product.id,
      });
    }
  }

  // Portal services with no Stripe match (and no existing ID)
  for (const svc of services) {
    if (!matchedServiceIds.has(svc.id) && !svc.stripe_product_id) {
      result.unmatched_portal.push({
        name: svc.name,
        service_id: svc.id,
      });
    }
  }

  return NextResponse.json({
    dry_run: dryRun,
    summary: {
      matched: result.matched.length,
      unmatched_stripe: result.unmatched_stripe.length,
      unmatched_portal: result.unmatched_portal.length,
      errors: result.errors.length,
    },
    ...result,
  });
}
