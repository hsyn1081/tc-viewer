// netlify/functions/config.js

// Basit Origin tabanlı koruma:
// - Sadece ALLOWED_ORIGIN ile eşleşen "Origin" başlığından gelen istekleri kabul ediyoruz.
// - Token ve model bilgileri buradan JSON olarak dönüyor (URL’den asla okunmuyor).

export async function handler(event, context) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN; // örn: https://senin-domainin.netlify.app
  const origin = event.headers.origin || event.headers.Origin || '';

  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    const ok = allowedOrigin && origin === allowedOrigin;
    return {
      statusCode: ok ? 204 : 403,
      headers: ok ? {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Max-Age': '86400'
      } : {}
    };
  }

  // Sadece izin verdiğimiz origin
  if (!allowedOrigin || origin !== allowedOrigin) {
    return { statusCode: 403, body: 'Forbidden (origin)' };
  }

  // (İsteğe bağlı) Netlify Identity ile yetkilendirme:
  // Bu bölümü açarsan, frontend'te fetch ederken Authorization: Bearer <token> göndermelisin.
  // const user = context.clientContext && context.clientContext.user;
  // if (!user) {
  //   return { statusCode: 401, body: 'Unauthorized' };
  // }

  // Model / token bilgilerini env varlardan al
  const payload = {
    projectId: process.env.PROJECT_ID,
    modelId:   process.env.MODEL_ID,
    stoken:    process.env.SHARE_TOKEN,
    // İstersen sabitleri de dönebilirsin:
    // asmKey: 'Tekla Assembly.Assembly/Cast unit Mark'
  };

  if (!payload.projectId || !payload.modelId || !payload.stoken) {
    return { statusCode: 500, body: 'Missing env vars (PROJECT_ID, MODEL_ID, SHARE_TOKEN)' };
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': allowedOrigin
    },
    body: JSON.stringify(payload)
  };
}
