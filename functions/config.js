// /functions/config.js  — Cloudflare Pages Functions

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const q = {
    projectId: (url.searchParams.get('projectId') || '').trim(),
    modelId:   (url.searchParams.get('modelId')   || '').trim(),
    stoken:    (url.searchParams.get('stoken')    || '').trim()
  };

  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
    });

  // 1) Önce ALLOWED_JSON varsa kullan
  if (env.ALLOWED_JSON) {
    try {
      const list = JSON.parse(env.ALLOWED_JSON); // [{projectId, modelId, stoken}|{projectId, modelId, stokens:[]}, ...]
      const ok = Array.isArray(list) && list.some(item => {
        if (!item || !item.projectId || !item.modelId) return false;
        if (Array.isArray(item.stokens)) {
          return item.projectId === q.projectId &&
                 item.modelId   === q.modelId   &&
                 item.stokens.includes(q.stoken);
        }
        if (typeof item.stoken === 'string') {
          return item.projectId === q.projectId &&
                 item.modelId   === q.modelId   &&
                 item.stoken    === q.stoken;
        }
        return false;
      });

      if (!ok) return json({ ok:false, reason:'forbidden' }, 403);

      // Doğrulandı → aynı paramları geri ver
      return json({ projectId: q.projectId, modelId: q.modelId, stoken: q.stoken });
    } catch (e) {
      return json({ ok:false, reason:'bad_allowed_json' }, 500);
    }
  }

  // 2) Numaralı env değişkenleri (Yöntem B) varsa onları tara:
  //    PROJECT_ID_1, MODEL_ID_1, STOKEN_1
  const tuples = [];
  const bySuffix = {};
  for (const [key, val] of Object.entries(env)) {
    const m = key.match(/^(PROJECT_ID|MODEL_ID|STOKEN|SHARE_TOKEN)_(\d+)$/);
    if (!m) continue;
    const [, kind, idx] = m;
    bySuffix[idx] ||= {};
    bySuffix[idx][kind] = val;
  }
  for (const idx of Object.keys(bySuffix)) {
    const rec = bySuffix[idx];
    const p = rec.PROJECT_ID || '';
    const m = rec.MODEL_ID   || '';
    const t = rec.STOKEN || rec.SHARE_TOKEN || '';
    if (p && m && t) tuples.push({ projectId: p, modelId: m, stoken: t });
  }
  if (tuples.length) {
    const ok = tuples.some(it =>
      it.projectId === q.projectId &&
      it.modelId   === q.modelId   &&
      it.stoken    === q.stoken
    );
    return ok ? json(q) : json({ ok:false, reason:'forbidden' }, 403);
  }

  // 3) Son çare: tekli değişkenler (geri uyumluluk)
  const P = env.PROJECT_ID || '';
  const M = env.MODEL_ID   || '';
  const T = env.SHARE_TOKEN || env.STOKEN || '';
  if (!P || !M || !T) return json({ ok:false, reason:'env_not_set' }, 500);

  const match = q.projectId === P && q.modelId === M && q.stoken === T;
  return match ? json({ projectId:P, modelId:M, stoken:T })
               : json({ ok:false, reason:'forbidden' }, 403);
}
