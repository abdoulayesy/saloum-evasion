import { NextResponse, type NextRequest } from 'next/server';
import { FINANCE_ROLES } from '@/components/admin/partnerStatementPath';
import { loadStatement } from '@/lib/booking/statementData';
import { periodErrors, statementCsv } from '@/lib/checkout/statement';
import { getPayloadClient } from '@/lib/cms/queries';

// Export tableur du relevé d'un prestataire (002, US5, T095, FR-036) : CSV `;`, UTF-8 avec BOM.
// Session de l'admin Payload (cookie), rôles `finance` et `admin` ; `?du=AAAA-MM-JJ&au=…`.

export const dynamic = 'force-dynamic';

const slugOf = (name: string): string =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'prestataire';

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> },
) => {
  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: request.headers });
  const role = user && 'role' in user ? user.role : null;
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  if (typeof role !== 'string' || !FINANCE_ROLES.has(role)) {
    return NextResponse.json({ error: 'Accès réservé à la finance' }, { status: 403 });
  }
  const partnerId = Number((await params).partnerId);
  const period = {
    from: request.nextUrl.searchParams.get('du') ?? '',
    to: request.nextUrl.searchParams.get('au') ?? '',
  };
  const errors = periodErrors(period);
  if (!Number.isInteger(partnerId) || partnerId <= 0 || errors.length > 0) {
    return NextResponse.json({ error: errors[0] ?? 'Prestataire invalide' }, { status: 400 });
  }
  const partner = await payload
    .findByID({ collection: 'partners', id: partnerId, depth: 0 })
    .catch(() => null);
  if (!partner) return NextResponse.json({ error: 'Prestataire introuvable' }, { status: 404 });
  const statement = await loadStatement(payload, partner.id, period);
  const filename = `releve-${slugOf(partner.name)}-${period.from}-${period.to}.csv`;
  return new NextResponse(statementCsv({ partnerName: partner.name, statement }), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
};
