// functions/config.js — Cloudflare Pages Functions (tam dosya)
// GET /config → { projectId, modelId, stoken } (Origin/Host kontrolü ile)

function parseCsv(v) {
  return (v || '').split(',').map(s => s.trim()).filter(Boolean);
}

function isAllowedOrigin(origin, host, { exacts, suffixes, allowLocalhost, openCors }) {
  if (openCors) return true;
  if (origin && exacts.includes(origin)) return true;
  if (origin && suffixes.some(s => origin.endsWith(s))) return true;
  if (allowLocalhost && origin && /^http:\/\/localhost(:\d+)?$/i.test(origin)) return true;

  // Bazı tarayıcılar aynı origin isteklerinde 'Origin' header göndermiyor.
  // Bu durumda host’tan türetip kontrol edelim:
  if (!origin && host) {
    const derived = `https://${host}`;
    if (exacts.includes(derived) || suffixes.some(s => derived.endsWith(s))) return true;
  }

  // Hiç kısıtlama tanımlı değilse (exacts/suffixes boş) ve origin yoksa izin ver
  if (!origin && host && exacts.length === 0 && suffixes.length === 0) return true;

  return false;
}

export const onRequestOptions = async (ctx) => {
  // Basit CORS preflight cevabı
  const origin = ctx.request.headers.get('Origin') || '';
  const exacts   = parseCsv(ctx.env.ALLOWED_ORIGINS);
  const suffixes = parseCsv(ctx.env.ALLOWED_SUFFIXES);
  const allowLocalhost = ctx.env.ALLOW_LOCALHOST === '1';
  const openCors = ctx.env.OPEN_CORS === '1';
  const host = new URL(ctx.request.url).host;

  const ok = isAllowedOrigin(origin, host, {exacts, suffixes, allowLocalhost, openCors});
  const allow = ok ? (origin || (exacts[0] || '')) : '';

  return new Response(null, {
    status: ok ? 204 : 403,
    headers: ok ? {
      'Access-Control-Allow-Origin': allow,
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Max-Age': '86400'
    } : {}
  });
};

export const onRequestGet = async (ctx) => {
  try {
    const origin = ctx.request.headers.get('Origin') || '';
    const host   = new URL(ctx.request.url).host;

    const exacts   = parseCsv(ctx.env.ALLOWED_ORIGINS);
    const suffixes = parseCsv(ctx.env.ALLOWED_SUFFIXES);
    const allowLocalhost = ctx.env.ALLOW_LOCALHOST === '1';
    const openCors = ctx.env.OPEN_CORS === '1';

    const ok = isAllowedOrigin(origin, host, {exacts, suffixes, allowLocalhost, openCors});
    if (!ok) {
      const diag = { error: 'Forbidden (origin mismatch)', received:{origin,host}, expected:{exacts,suffixes,allowLocalhost,openCors} };
      return new Response(JSON.stringify(diag,null,2), { status: 403, headers: { 'content-type': 'application/json' } });
    }

    const projectId = ctx.env.PROJECT_ID;
    const modelId   = ctx.env.MODEL_ID;
    const stoken    = ctx.env.SHARE_TOKEN;

    if (!projectId || !modelId || !stoken) {
      return new Response('Missing env vars (PROJECT_ID, MODEL_ID, SHARE_TOKEN)', { status: 500 });
    }

    const body = JSON.stringify({ projectId, modelId, stoken });
    const allow = origin || (exacts[0] || '');

    return new Response(body, {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        ...(allow ? { 'Access-Control-Allow-Origin': allow } : {})
      }
    });
  } catch (e) {
    return new Response('config error: ' + (e && e.message ? e.message : String(e)), { status: 500 });
  }
};
