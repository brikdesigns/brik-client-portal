'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@bds/components/ui/Button/Button';
import { Modal } from '@bds/components/ui/Modal/Modal';
import { font, color } from '@/lib/tokens';

interface QualifyLeadButtonProps {
  companyId: string;
}

export function QualifyLeadButton({ companyId }: QualifyLeadButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDecision(qualified: boolean) {
    setLoading(true);
    const supabase = createClient();

    const update = qualified
      ? { type: 'prospect', status: 'needs_proposal' }
      : { status: 'inactive' };

    const { error } = await supabase
      .from('companies')
      .update(update)
      .eq('id', companyId);

    if (error) {
      alert(`Failed to update: ${error.message}`);
      setLoading(false);
      return;
    }

    setIsOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setIsOpen(true)}>
        Qualify Lead
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Qualify lead"
        size="sm"
        footer={
          <>
            <Button variant="outline" size="md" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => handleDecision(false)}
              loading={loading}
            >
              Not qualified
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => handleDecision(true)}
              loading={loading}
            >
              Qualified
            </Button>
          </>
        }
      >
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
      </Modal>
    </>
  );
}
