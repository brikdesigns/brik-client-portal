import { NextResponse } from 'next/server';
import { z, type ZodSchema } from 'zod';

/**
 * Parse and validate a request body against a Zod schema.
 * Returns the validated data or a 400 error response.
 *
 * Usage in API routes:
 *   const result = await parseBody(request, mySchema);
 *   if (result instanceof NextResponse) return result;
 *   const { field1, field2 } = result;
 */
export async function parseBody<T extends ZodSchema>(
  request: Request,
  schema: T
): Promise<z.infer<T> | NextResponse> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    const firstError = result.error.issues[0];
    const path = firstError.path.length > 0 ? `${firstError.path.join('.')}: ` : '';
    return NextResponse.json(
      { error: `${path}${firstError.message}` },
      { status: 400 }
    );
  }

  return result.data;
}

/**
 * Type guard: check if parseBody returned an error response.
 */
export function isValidationError<T>(result: T | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}

// ── Reusable field schemas ────────────────────────────────────

export const emailSchema = z
  .string()
  .email('Invalid email address')
  .transform((e) => e.trim().toLowerCase());

export const uuidSchema = z.string().uuid('Invalid ID format');

export const nonEmptyString = z.string().min(1, 'This field is required').transform((s) => s.trim());

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters');
