'use client';

import { Prose } from '@/components/prose';

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return <Prose content={content} />;
}
