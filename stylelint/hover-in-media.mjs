// Règle Stylelint maison : tout sélecteur contenant `:hover` doit se trouver dans
// `@media (hover: hover)`, pour qu'aucun style ne dépende du survol sur écran tactile
// (constitution I). Tailwind v4 enveloppe déjà ses variantes `hover:` de cette façon.
import stylelint from 'stylelint';

const ruleName = 'saloum/hover-in-media';
const messages = stylelint.utils.ruleMessages(ruleName, {
  rejected: (selector) => `« ${selector} » doit être placé dans @media (hover: hover).`,
});

const isInsideHoverMedia = (node) => {
  let parent = node.parent;
  while (parent) {
    if (
      parent.type === 'atrule' &&
      parent.name === 'media' &&
      /\(\s*hover\s*:\s*hover\s*\)/.test(parent.params)
    ) {
      return true;
    }
    parent = parent.parent;
  }
  return false;
};

const rule = (enabled) => (root, result) => {
  if (!enabled) return;
  root.walkRules((node) => {
    if (!node.selector.includes(':hover')) return;
    if (isInsideHoverMedia(node)) return;
    stylelint.utils.report({ ruleName, result, node, message: messages.rejected(node.selector) });
  });
};

rule.ruleName = ruleName;
rule.messages = messages;

export default stylelint.createPlugin(ruleName, rule);
