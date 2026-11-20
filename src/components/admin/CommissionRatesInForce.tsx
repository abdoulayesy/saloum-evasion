import type { UIFieldServerProps } from 'payload';
import { offerTypeOptions } from '@/fields/checkout';
import { rateFor } from '@/lib/checkout/commissionRate';
import { ratePercent } from '@/lib/checkout/statement';

// Taux en vigueur aujourd'hui par type d'offre, au-dessus de l'historique (002, US5, T096) :
// lecture du global enregistré, pour que l'équipe voie l'effet de l'historique sans calcul.

export const CommissionRatesInForce = async ({ req }: UIFieldServerProps) => {
  const today = new Date().toISOString().slice(0, 10);
  const global = await req.payload.findGlobal({ slug: 'commissionRates', depth: 0 });
  const rates = (global.rates ?? []).map((rate) => ({
    offerType: rate.offerType,
    rateBp: rate.rateBp,
    effectiveFrom: rate.effectiveFrom,
  }));
  return (
    <section style={{ marginBottom: 24 }} aria-labelledby="rates-in-force-title">
      <h3 id="rates-in-force-title" style={{ marginBottom: 8 }}>
        Taux en vigueur aujourd’hui ({today})
      </h3>
      <ul style={{ margin: 0, paddingLeft: 20 }} data-testid="rates-in-force">
        {offerTypeOptions.map((option) => {
          const offerType = rates.find((rate) => rate.offerType === option.value)?.offerType;
          const rateBp = offerType ? rateFor(rates, offerType, today) : null;
          return (
            <li key={option.value}>
              {option.label} : {rateBp === null ? 'taux par défaut' : `${ratePercent(rateBp)} %`}
            </li>
          );
        })}
      </ul>
    </section>
  );
};
