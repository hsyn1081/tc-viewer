// /functions/config.js  (Cloudflare Pages Functions)
//
// Bu endpoint, URL’den gelen projectId/modelId/stoken değerlerini
// Cloudflare Pages Environment Variables ile karşılaştırır.
// Eşleşirse 200 + JSON döner, aksi halde 403.

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const q = {
    projectId: url.searchParams.get('projectId') || '',
    modelId:   url.searchParams.get('modelId')   || '',
    stoken:    url.searchParams.get('stoken')    || ''
  };

  // ---- 1) Çoklu liste (ALLOWED_JSON) varsa onu kullan
  if (env.ALLOWED_JSON) {
    try {
      const list = JSON.parse(env.ALLOWED_JSON); // [{projectId, modelId, stoken}, ...]
      const ok = Array.isArray(list) && list.some(
        it => it.projectId === q.projectId && it.modelId === q.modelId && it.stoken === q.stoken
      );
      if (!ok) {
        return new Response(JSON.stringify({ ok:false, reason:'forbidden' }), {
          status: 403,
          headers: { 'content-type':'application/json', 'cache-control':'no-store' }
        });
      }
      // İstek doğrulandı → aynısını geri döndür
      return new Response(JSON.stringify({
        projectId: q.projectId, modelId: q.modelId, stoken: q.stoken
      }), {
        headers: { 'content-type':'application/json', 'cache-control':'no-store' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ ok:false, reason:'bad_allowed_json' }), {
        status: 500,
        headers: { 'content-type':'application/json', 'cache-control':'no-store' }
      });
    }
  }

  // ---- 2) Tekli env değişkenleri (Plain text) ile doğrula
  const ENV_PROJECT = env.PROJECT_ID || '';
  const ENV_MODEL   = env.MODEL_ID   || '';
  const ENV_TOKEN   = env.SHARE_TOKEN || env.STOKEN || '';

  if (!ENV_PROJECT || !ENV_MODEL || !ENV_TOKEN) {
    return new Response(JSON.stringify({ ok:false, reason:'env_not_set' }), {
      status: 500,
      headers: { 'content-type':'application/json', 'cache-control':'no-store' }
    });
  }

  const match =
    q.projectId === ENV_PROJECT &&
    q.modelId   === ENV_MODEL &&
    q.stoken    === ENV_TOKEN;

  if (!match) {
    return new Response(JSON.stringify({ ok:false, reason:'mismatch' }), {
      status: 403,
      headers: { 'content-type':'application/json', 'cache-control':'no-store' }
    });
  }

  // Doğrulandı → config ver
  return new Response(JSON.stringify({
    projectId: ENV_PROJECT, modelId: ENV_MODEL, stoken: ENV_TOKEN
  }), {
    headers: { 'content-type':'application/json', 'cache-control':'no-store' }
  });
}
