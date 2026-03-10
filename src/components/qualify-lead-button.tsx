'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@bds/components/ui/Button/Button';
import { Modal } from '@bds/components/ui/Modal/Modal';
import { useToast } from '@/components/toast-provider';
import { font, color, space, gap } from '@/lib/tokens';

interface QualifyLeadButtonProps {
  companyId: string;
}

export function QualifyLeadButton({ companyId }: QualifyLeadButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selection, setSelection] = useState<'qualify' | 'not_qualified' | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toastSuccess, toastError } = useToast();

  function handleOpen() {
    setSelection(null);
    setIsOpen(true);
  }

  async function handleSave() {
    if (!selection) return;
    setLoading(true);
    const supabase = createClient();

    const qualified = selection === 'qualify';
    const update = qualified
      ? { type: 'prospect', status: 'needs_proposal' }
      : { status: 'not_active' };

    const { error } = await supabase
      .from('companies')
      .update(update)
      .eq('id', companyId);

    if (error) {
      toastError('Failed to update', error.message);
      setLoading(false);
      return;
    }

    setIsOpen(false);
    if (qualified) {
      toastSuccess('Lead qualified', 'Moved to prospect — ready for proposal.');
    } else {
      toastSuccess('Lead marked not qualified');
    }
    router.refresh();
  }

  const radioLabelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: gap.sm,
    fontFamily: font.family.body,
    fontSize: font.size.body.md,
    color: color.text.primary,
    cursor: 'pointer' as const,
  };

  return (
    <>
      <Button variant="primary" size="sm" onClick={handleOpen}>
        Qualify Lead
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Qualify Lead?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSave}
              loading={loading}
              disabled={!selection}
            >
              Save
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: space.lg }}>
          <p
            style={{
              fontFamily: font.family.body,
              fontSize: font.size.body.md,
              color: color.text.secondary,
              margin: 0,
            }}
          >
            Is this lead qualified to move forward as a prospect, or should it be marked as inactive?
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
            <p
              style={{
                fontFamily: font.family.label,
                fontSize: font.size.body.sm,
                fontWeight: font.weight.semibold,
                color: color.text.primary,
                margin: 0,
              }}
            >
              Select an option
            </p>

            <label style={radioLabelStyle}>
              <input
                type="radio"
                name="qualify"
                checked={selection === 'qualify'}
                onChange={() => setSelection('qualify')}
                style={{ accentColor: color.brand.primary }}
              />
              Qualify
            </label>

            <label style={radioLabelStyle}>
              <input
                type="radio"
                name="qualify"
                checked={selection === 'not_qualified'}
                onChange={() => setSelection('not_qualified')}
                style={{ accentColor: color.brand.primary }}
              />
              Not Qualified
            </label>
          </div>
        </div>
      </Modal>
    </>
  );
}
