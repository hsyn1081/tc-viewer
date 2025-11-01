export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // URL'den gelen parametreler
  const projectId = (url.searchParams.get('projectId') || '').trim();
  const modelId   = (url.searchParams.get('modelId')   || '').trim();
  const stoken    = (url.searchParams.get('stoken')    || '').trim();

  // Basit CORS/origin kontrolü (opsiyonel)
  const origin = request.headers.get('origin') || '';
  const allowedOrigins = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (allowedOrigins.length && origin && !allowedOrigins.includes(origin)) {
    return new Response(JSON.stringify({ error: 'origin forbidden' }), {
      status: 403,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
    });
  }

  // Allow-list JSON: [{"projectId":"...","modelId":"...","stoken":"..."}, ...]
  let list = [];
  try {
    list = JSON.parse(env.ALLOWED_CONFIGS || '[]');
  } catch {
    return new Response(JSON.stringify({ error: 'server misconfig' }), {
      status: 500,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
    });
  }

  const match = list.find(item =>
    String(item.projectId || '').trim() === projectId &&
    String(item.modelId   || '').trim() === modelId   &&
    String(item.stoken    || '').trim() === stoken
  );

  if (!projectId || !modelId || !stoken || !match) {
    return new Response(JSON.stringify({ error: 'forbidden' }), {
      status: 403,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
    });
  }

  // Geçti: istemciye gerekli bilgileri dön
  return new Response(JSON.stringify({ projectId, modelId, stoken }), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}
