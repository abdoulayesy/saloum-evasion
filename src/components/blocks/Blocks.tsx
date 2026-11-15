import { Cta } from './Cta';
import { Figures } from './Figures';
import { Gallery } from './Gallery';
import { Guarantees } from './Guarantees';
import { Hero } from './Hero';
import { ProcessingRegister } from './ProcessingRegister';
import { RichText } from './RichText';
import { Steps } from './Steps';
import { Team } from './Team';
import type { BlockContext, PageBlock } from './types';

type BlocksProps = {
  blocks: readonly PageBlock[];
  context: BlockContext;
  /** Titre de la page, porté en H1 par un héro placé en premier. */
  pageTitle?: string;
};

// Rendu des blocs d'une page éditoriale (T133) : composants serveur uniquement.
export const Blocks = ({ blocks, context, pageTitle }: BlocksProps) => (
  <>
    {blocks.map((block, index) => {
      const key = block.id ?? `${block.blockType}-${index}`;
      switch (block.blockType) {
        case 'hero':
          return (
            <Hero
              key={key}
              block={block}
              locale={context.locale}
              pageTitle={index === 0 ? pageTitle : undefined}
            />
          );
        case 'richText':
          return <RichText key={key} block={block} />;
        case 'team':
          return (
            <Team
              key={key}
              block={block}
              locale={context.locale}
              priority={
                index <= 1 && !blocks.slice(0, index).some((item) => item.blockType === 'hero')
              }
            />
          );
        case 'figures':
          return <Figures key={key} block={block} />;
        case 'gallery':
          return <Gallery key={key} block={block} locale={context.locale} />;
        case 'steps':
          return <Steps key={key} block={block} />;
        case 'guarantees':
          return <Guarantees key={key} block={block} settingsGlobal={context.settingsGlobal} />;
        case 'cta':
          return <Cta key={key} block={block} context={context} />;
        case 'processingRegister':
          return <ProcessingRegister key={key} block={block} locale={context.locale} />;
        default: {
          const unreachable: never = block;
          return unreachable;
        }
      }
    })}
  </>
);
