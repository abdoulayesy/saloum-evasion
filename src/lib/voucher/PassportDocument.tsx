import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { ReactNode } from 'react';
import {
  BrandMark,
  Bubble,
  CardGlyph,
  CoverFrame,
  Diamond,
  Emblem,
  Guilloche,
  Illustration,
  PAGE,
  PaidStamp,
  Portrait,
  QrCode,
  StepStamp,
  Weave,
} from './artwork';
import { registerPassportFonts, SANS, SERIF } from './fonts';
import type { Passport, PassportStep } from './model';

// Passeport d'évasion (maquette « Bon de réservation · Passeport ») : couverture, page du
// voyageur, une page par étape, récapitulatif et contacts, dos de couverture. Une unité de la
// maquette (px) = un point PDF ; pages de 559 × 794, proportions A5.

const GREEN = '#123D2F';
const GOLD = '#D9B870';
const GOLD_SOFT = '#C8A75E';
const PAPER = '#F4EEE1';
const INK = '#1B2A24';
const INK_SOFT = '#2A3A33';
const MUTED = '#4B5A53';
const LABEL = '#6B5E4A';
const OCRE = '#9E4521';
const OCRE_DEEP = '#7A3417';
const LEAF = '#2E6B4F';
const RULE = '#D8CBB4';

const s = StyleSheet.create({
  page: {
    width: PAGE.width,
    height: PAGE.height,
    position: 'relative',
    fontFamily: SANS,
    color: INK,
  },
  cover: { backgroundColor: GREEN, color: GOLD },
  paper: { backgroundColor: PAPER },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: OCRE,
    paddingBottom: 9,
    fontSize: 11.5,
    fontWeight: 700,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: OCRE_DEEP,
  },
  label: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: LABEL,
  },
  kicker: {
    fontSize: 10.5,
    fontWeight: 800,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: LEAF,
  },
  folio: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 11.5,
    fontWeight: 700,
    color: LABEL,
  },
});

const Folio = ({ page }: { page: number }) => (
  <Text style={s.folio}>{String(page).padStart(2, '0')}</Text>
);

const Head = ({ left, right }: { left: string; right: string }) => (
  <View style={s.head}>
    <Text>{left}</Text>
    <Text>{right}</Text>
  </View>
);

const Bullets = ({ items }: { items: readonly string[] }) => (
  <View style={{ gap: 4 }}>
    {items.map((item) => (
      <View key={item} style={{ flexDirection: 'row', gap: 7 }}>
        <Diamond />
        <Text style={{ flex: 1, fontSize: 12.5, lineHeight: 1.4 }}>{item}</Text>
      </View>
    ))}
  </View>
);

/** Champ de la page du voyageur : libellé bilingue au-dessus de la valeur. */
const Field = ({
  label,
  value,
  size = 15,
  wide = false,
}: {
  label: string;
  value: string;
  size?: number;
  wide?: boolean;
}) => (
  <View style={{ width: wide ? '100%' : '50%', paddingRight: 12, marginBottom: 9 }}>
    <Text style={s.label}>{label}</Text>
    <Text style={{ marginTop: 2, fontSize: size, fontWeight: size > 16 ? 700 : 600 }}>{value}</Text>
  </View>
);

const Rotated = ({
  deg,
  opacity = 0.86,
  children,
}: {
  deg: number;
  opacity?: number;
  children: ReactNode;
}) => <View style={{ transform: `rotate(${deg}deg)`, opacity }}>{children}</View>;

// ---------------------------------------------------------------- Couverture
const CoverPage = ({ passport }: { passport: Passport }) => {
  const { labels } = passport;
  return (
    <Page size={[PAGE.width, PAGE.height]} style={[s.page, s.cover]}>
      <CoverFrame />
      <View
        style={[
          s.fill,
          {
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 76,
            paddingBottom: 64,
            paddingHorizontal: 48,
          },
        ]}
      >
        <View style={{ alignItems: 'center', gap: 12 }}>
          <Text
            style={{ fontSize: 12, fontWeight: 700, letterSpacing: 5, textTransform: 'uppercase' }}
          >
            {labels.region}
          </Text>
          <Text
            style={{
              fontFamily: SERIF,
              fontWeight: 600,
              fontSize: 44,
              lineHeight: 1.05,
              letterSpacing: 6,
              textTransform: 'uppercase',
              textAlign: 'center',
            }}
          >
            {passport.locale === 'fr' ? 'Passeport\nd’Évasion' : 'Escape\nPassport'}
          </Text>
          <Text
            style={{
              fontFamily: SERIF,
              fontStyle: 'italic',
              fontWeight: 500,
              fontSize: 20,
              letterSpacing: 1.5,
              color: GOLD_SOFT,
            }}
          >
            {labels.coverTagline}
          </Text>
        </View>
        <Emblem />
        <View style={{ alignItems: 'center', gap: 9 }}>
          <Text
            style={{
              fontFamily: SERIF,
              fontWeight: 700,
              fontSize: 30,
              letterSpacing: 6.5,
              textTransform: 'uppercase',
            }}
          >
            Saloum Évasion
          </Text>
          <Text
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 3.5,
              textTransform: 'uppercase',
              color: GOLD_SOFT,
            }}
          >
            {labels.voucher}
          </Text>
          <View style={{ marginTop: 8 }}>
            <CardGlyph />
          </View>
        </View>
      </View>
    </Page>
  );
};

// ---------------------------------------------------------- Page du voyageur
const TravellerPage = ({ passport }: { passport: Passport }) => {
  const { labels, traveller, stay } = passport;
  const half = Math.ceil(passport.toc.length / 2);
  const columns = [passport.toc.slice(0, half), passport.toc.slice(half)];
  return (
    <Page size={[PAGE.width, PAGE.height]} style={[s.page, s.paper]}>
      <Guilloche rosetteY={470} />
      <View style={[s.fill, { paddingTop: 40, paddingHorizontal: 40, paddingBottom: 96, gap: 16 }]}>
        <Head left={labels.passportBi} right={`${labels.number} ${passport.reference}`} />
        <Text style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 34 }}>
          {labels.travellerPage}{' '}
          <Text style={{ fontStyle: 'italic', fontWeight: 500, fontSize: 20, color: MUTED }}>
            {labels.travellerPageAlt}
          </Text>
        </Text>

        <View style={{ flexDirection: 'row', gap: 20 }}>
          <View
            style={{
              width: 128,
              height: 166,
              borderRadius: 6,
              backgroundColor: '#E3D9C6',
              borderWidth: 1,
              borderColor: '#C9BBA2',
              alignItems: 'center',
              justifyContent: 'flex-end',
              overflow: 'hidden',
            }}
          >
            <Portrait />
          </View>
          <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>
            <Field label={labels.surname} value={traveller.surname} size={17} />
            <Field label={labels.givenNames} value={traveller.givenNames} size={17} />
            <Field label={labels.travellers} value={traveller.travellers} />
            <Field label={labels.language} value={traveller.language} />
            <Field label={labels.arrival} value={traveller.arrival} />
            <Field label={labels.departure} value={traveller.departure} />
            <Field label={labels.host} value={traveller.host} wide />
          </View>
        </View>

        <View
          style={{
            backgroundColor: 'rgba(255,253,249,0.82)',
            borderWidth: 1,
            borderColor: RULE,
            borderRadius: 10,
            paddingVertical: 14,
            paddingHorizontal: 16,
            gap: 8,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: 10,
            }}
          >
            <Text style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 600, flex: 1 }}>
              {stay.title}
            </Text>
            {stay.detail ? (
              <Text style={{ fontSize: 12, fontWeight: 700, color: OCRE_DEEP }}>{stay.detail}</Text>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', gap: 14 }}>
            {columns.map((column, index) => (
              <View key={index} style={{ flex: 1, gap: 5 }}>
                {column.map((entry) => (
                  <View
                    key={entry.page}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      gap: 6,
                      borderBottomWidth: 1,
                      borderBottomColor: '#C9BBA2',
                      borderBottomStyle: 'dotted',
                      paddingBottom: 3,
                    }}
                  >
                    <Text style={{ fontSize: 12.5, flex: 1 }}>{entry.label}</Text>
                    <Text style={{ fontSize: 12.5, color: LABEL }}>p. {entry.page}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 16,
            marginTop: 'auto',
            marginBottom: 6,
          }}
        >
          {/* Largeur fixe : en largeur souple, le moteur PDF coupe ces lignes mot à mot. */}
          <View style={{ width: 300, gap: 3 }}>
            <Text
              style={{
                fontFamily: SERIF,
                fontStyle: 'italic',
                fontWeight: 500,
                fontSize: 26,
                color: '#1F3A6B',
              }}
            >
              {passport.signature}
            </Text>
            <Text style={[s.label, { borderTopWidth: 1, borderTopColor: LABEL, paddingTop: 4 }]}>
              {labels.signature}
            </Text>
          </View>
          {passport.paidStamp ? (
            <Rotated deg={-14} opacity={0.85}>
              <PaidStamp word={passport.paidStamp.word} method={passport.paidStamp.method} />
            </Rotated>
          ) : null}
        </View>
      </View>
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingTop: 10,
          paddingBottom: 14,
          paddingHorizontal: 40,
          backgroundColor: 'rgba(255,253,249,0.9)',
          borderTopWidth: 1,
          borderTopColor: RULE,
        }}
      >
        {passport.mrz.map((line) => (
          <Text
            key={line}
            style={{
              fontFamily: 'Courier',
              fontSize: 14,
              letterSpacing: 0.5,
              lineHeight: 1.5,
              color: INK_SOFT,
            }}
          >
            {line}
          </Text>
        ))}
      </View>
      <Text
        style={{
          position: 'absolute',
          right: 12,
          bottom: 70,
          fontSize: 11.5,
          fontWeight: 700,
          color: LABEL,
        }}
      >
        02
      </Text>
    </Page>
  );
};

// ---------------------------------------------------------------- Étape
const StepPage = ({ passport, step }: { passport: Passport; step: PassportStep }) => {
  const { labels } = passport;
  const facts: [string, string][] = [
    [labels.time, step.time],
    [labels.place, step.place],
    [labels.duration, step.duration],
  ];
  return (
    <Page size={[PAGE.width, PAGE.height]} style={[s.page, s.paper]}>
      <Guilloche rosetteY={500} />
      <View style={[s.fill, { paddingTop: 36, paddingHorizontal: 40, paddingBottom: 34, gap: 10 }]}>
        <Head
          left={`${labels.passport} · ${labels.number} ${passport.reference}`}
          right={`${labels.step} ${String(step.number).padStart(2, '0')} / ${String(passport.steps.length).padStart(2, '0')}`}
        />
        <Illustration kind={step.illustration} />
        <View style={{ gap: 3 }}>
          <Text
            style={{
              fontSize: 11.5,
              fontWeight: 800,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: OCRE,
            }}
          >
            {step.eyebrow}
          </Text>
          <Text style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 34, lineHeight: 1.05 }}>
            {step.title}
          </Text>
          {step.subtitle ? (
            <Text
              style={{
                fontFamily: SERIF,
                fontStyle: 'italic',
                fontWeight: 500,
                fontSize: 17.5,
                color: MUTED,
              }}
            >
              {step.subtitle}
            </Text>
          ) : null}
        </View>
        <View
          style={{
            flexDirection: 'row',
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: RULE,
          }}
        >
          {facts.map(([label, value], index) => (
            <View
              key={label}
              style={{
                flex: 1,
                paddingVertical: 7,
                paddingLeft: index === 0 ? 0 : 9,
                paddingRight: 9,
                borderLeftWidth: index === 0 ? 0 : 1,
                borderLeftColor: RULE,
              }}
            >
              <Text style={s.label}>{label}</Text>
              <Text
                style={{
                  marginTop: 2,
                  fontSize: index === 0 ? 14 : 13,
                  fontWeight: index === 0 ? 700 : 600,
                  lineHeight: 1.3,
                }}
              >
                {value}
              </Text>
            </View>
          ))}
        </View>
        {step.description ? (
          <Text style={{ fontSize: 14, lineHeight: 1.55, color: INK_SOFT }}>
            {step.description}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <View style={{ flex: 1, gap: 5 }}>
            <Text style={s.kicker}>{labels.booked}</Text>
            <Bullets items={step.booked} />
          </View>
          <View style={{ flex: 1, gap: 5 }}>
            <Text style={s.kicker}>{labels.bring}</Text>
            <Bullets items={step.bring} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <Bubble />
          <Text style={{ fontSize: 12.5, fontWeight: 600, color: INK_SOFT, flex: 1 }}>
            {step.contact}
          </Text>
        </View>
        <View
          style={{
            marginTop: 'auto',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <View
            style={{
              width: 196,
              height: 104,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: '#B9AA8E',
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: LABEL,
              }}
            >
              {labels.visa}
            </Text>
            <Text style={{ fontSize: 11.5, color: LABEL }}>{labels.visaHint}</Text>
          </View>
          <Rotated deg={step.stamp.rotate}>
            <StepStamp stamp={step.stamp} />
          </Rotated>
        </View>
      </View>
      <Folio page={step.page} />
    </Page>
  );
};

// ------------------------------------------------- Récapitulatif et contacts
const SummaryPage = ({ passport }: { passport: Passport }) => {
  const { labels, summary } = passport;
  return (
    <Page size={[PAGE.width, PAGE.height]} style={[s.page, s.paper]}>
      <Guilloche />
      <View style={[s.fill, { paddingTop: 36, paddingHorizontal: 40, paddingBottom: 34, gap: 12 }]}>
        <Head
          left={`${labels.passport} · ${labels.number} ${passport.reference}`}
          right={labels.summaryTag}
        />
        <Text style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 32 }}>
          {labels.summaryTitle}
        </Text>

        <View style={{ backgroundColor: 'rgba(255,253,249,0.85)' }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              borderBottomWidth: 1.5,
              borderBottomColor: INK,
              paddingVertical: 5,
              paddingHorizontal: 8,
            }}
          >
            <Text style={[s.label, { color: INK }]}>{labels.service}</Text>
            <Text style={[s.label, { color: INK }]}>FCFA</Text>
          </View>
          {summary.rows.map((row) => (
            <View
              key={`${row.label}-${row.detail}`}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                gap: 10,
                borderBottomWidth: 1,
                borderBottomColor: RULE,
                paddingVertical: 4,
                paddingHorizontal: 8,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12.5 }}>{row.label}</Text>
                <Text style={{ fontSize: 10, color: MUTED }}>{row.detail}</Text>
              </View>
              <Text style={{ fontSize: 12.5 }}>{row.amount}</Text>
            </View>
          ))}
          {summary.totals.map((total) => (
            <View
              key={total.label}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingVertical: total.strong ? 7 : 3,
                paddingHorizontal: 8,
              }}
            >
              <Text
                style={{
                  fontSize: total.strong ? 13.5 : 12.5,
                  fontWeight: total.strong ? 800 : 500,
                }}
              >
                {total.label}
              </Text>
              <Text
                style={{
                  fontSize: total.strong ? 15.5 : 12.5,
                  fontWeight: total.strong ? 800 : 600,
                }}
              >
                {total.amount}
              </Text>
            </View>
          ))}
        </View>
        <Text style={{ marginTop: -6, fontSize: 11.5, color: MUTED }}>
          {[summary.eur, summary.payment].filter(Boolean).join(' · ')}
        </Text>

        <View style={{ flexDirection: 'row', gap: 16 }}>
          <View style={{ flex: 1, gap: 5 }}>
            <Text style={s.kicker}>{labels.contacts}</Text>
            {passport.contacts.map((contact) => (
              <View key={contact.title}>
                <Text style={{ fontSize: 12.5, fontWeight: 700 }}>{contact.title}</Text>
                {contact.lines.map((line) => (
                  <Text key={line} style={{ fontSize: 12.5, lineHeight: 1.35 }}>
                    {line}
                  </Text>
                ))}
              </View>
            ))}
          </View>
          <View style={{ flex: 1, gap: 5 }}>
            <Text style={s.kicker}>{labels.conditions}</Text>
            {passport.conditions.length > 0 ? <Bullets items={passport.conditions} /> : null}
          </View>
        </View>

        <View
          style={{
            marginTop: 'auto',
            flexDirection: 'row',
            gap: 16,
            alignItems: 'center',
            backgroundColor: 'rgba(255,253,249,0.9)',
            borderWidth: 1,
            borderColor: RULE,
            borderRadius: 12,
            padding: 14,
          }}
        >
          <View style={{ alignItems: 'center', gap: 3 }}>
            <View style={{ borderRadius: 6, backgroundColor: '#FFFDF9', padding: 2 }}>
              <QrCode text={passport.qr} size={96} />
            </View>
            <Text style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.8 }}>
              {passport.reference}
            </Text>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontSize: 14, fontWeight: 700 }}>{passport.verify.title}</Text>
            <Text style={{ fontSize: 12.5, lineHeight: 1.45, color: MUTED }}>
              {passport.verify.text}
            </Text>
          </View>
        </View>
      </View>
      <Folio page={passport.pages.summary} />
    </Page>
  );
};

// ------------------------------------------------------------ Dos de couverture
const BackPage = ({ passport }: { passport: Passport }) => {
  const { labels, back } = passport;
  return (
    <Page size={[PAGE.width, PAGE.height]} style={[s.page, s.cover]}>
      <CoverFrame dashed={false} mirror />
      <View style={{ position: 'absolute', top: 262, left: 60 }}>
        <Weave />
      </View>
      <View
        style={[
          s.fill,
          { paddingTop: 88, paddingHorizontal: 64, paddingBottom: 64, alignItems: 'center' },
        ]}
      >
        <Text
          style={{
            fontFamily: SERIF,
            fontStyle: 'italic',
            fontWeight: 500,
            fontSize: 30,
            lineHeight: 1.25,
            color: '#E6C989',
            textAlign: 'center',
          }}
        >
          {labels.quote}
        </Text>
        <Text
          style={{
            marginTop: 14,
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: 3.5,
            textTransform: 'uppercase',
            color: GOLD_SOFT,
          }}
        >
          {labels.quoteTag}
        </Text>
        <View style={{ marginTop: 92, alignItems: 'center', gap: 11 }}>
          <BrandMark />
          <Text
            style={{
              fontFamily: SERIF,
              fontWeight: 700,
              fontSize: 26,
              letterSpacing: 5,
              textTransform: 'uppercase',
            }}
          >
            Saloum Évasion
          </Text>
          <Text style={{ fontSize: 13.5, lineHeight: 1.6, color: '#E1CB97', textAlign: 'center' }}>
            {labels.tagline}
          </Text>
          <Text
            style={{
              marginTop: 4,
              fontSize: 13.5,
              fontWeight: 600,
              letterSpacing: 1,
              color: '#E1CB97',
              textAlign: 'center',
            }}
          >
            {[back.site, back.address].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <Text
          style={{
            marginTop: 'auto',
            fontSize: 10.5,
            lineHeight: 1.5,
            color: '#B89C5C',
            maxWidth: 360,
            textAlign: 'center',
          }}
        >
          {labels.disclaimer}
        </Text>
      </View>
    </Page>
  );
};

export const PassportDocument = ({ passport, author }: { passport: Passport; author: string }) => {
  registerPassportFonts();
  return (
    <Document
      title={`${passport.reference} · ${passport.labels.passport}`}
      author={author}
      language={passport.locale}
    >
      <CoverPage passport={passport} />
      <TravellerPage passport={passport} />
      {passport.steps.map((step) => (
        <StepPage key={step.page} passport={passport} step={step} />
      ))}
      <SummaryPage passport={passport} />
      <BackPage passport={passport} />
    </Document>
  );
};
