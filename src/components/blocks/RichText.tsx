import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react';
import { Container } from '@/components/ui/Container';
import type { BlockOf } from './types';

// Texte libre (T133).
export const RichText = ({ block }: { block: BlockOf<'richText'> }) => (
  <Container className="py-6">
    <div className="rich-text max-w-prose">
      <LexicalRichText data={block.content} />
    </div>
  </Container>
);
