import { NextRequest, NextResponse } from "next/server";
import { serverCheckRoles } from "@/utils/permissionUtils";
import { getAllOrders } from "@/utils/dbUtils";

export async function GET(req: NextRequest) {
  const auth = await serverCheckRoles([]);
  if (!auth.isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const checkoutId = url.searchParams.get("checkoutId") || "";
  const orderId = url.searchParams.get("orderId") || "";

  if (!checkoutId) {
    return NextResponse.json({ error: "Missing checkoutId" }, { status: 400 });
  }

  if (orderId) {
    const orders = await getAllOrders();
    const order = orders.find((o) => o.id === Number(orderId));
    if (order && order.user_istid !== auth.user?.istid) {
      return NextResponse.json({ error: "Not order owner" }, { status: 403 });
    }
  }

  const csp =
    "default-src 'none'; " +
    "connect-src 'self' https://api.sumup.com https://gateway.sumup.com; " +
    "img-src 'self' data: https://static.sumup.com; " +
    "script-src 'self' https://gateway.sumup.com https://static.sumup.com; " +
    "style-src 'self' 'unsafe-inline' https://static.sumup.com; " +
    "frame-ancestors 'self';";

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Pagamento</title>
    <style>html,body,#sumup-root{height:100%;margin:0;padding:0;}#sumup-root{display:flex;align-items:center;justify-content:center;padding:16px;}</style>
  </head>
  <body>
    <div id="sumup-root">A carregar módulo de pagamento…</div>
    <script src="https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js"></script>
    <script>
      (function () {
        var checkoutId = ${JSON.stringify(checkoutId)};
        function post(type, payload) {
          try { parent.postMessage({ type: type, payload: payload }, '*'); } catch(e) {}
        }
        if (window.SumUpCard && typeof window.SumUpCard.mount === 'function') {
          var instance = window.SumUpCard.mount({
            checkoutId: checkoutId,
            onResponse: function (type, body) {
              post('sumup:widget:response', { type: type, body: body });
            },
            onLoad: function () {
              post('sumup:widget:loaded', {});
            },
            showFooter: true
          });
          window._sumupInstance = instance;
        } else {
          var tries = 0;
          var int = setInterval(function () {
            if (window.SumUpCard && typeof window.SumUpCard.mount === 'function') {
              clearInterval(int);
              var instance = window.SumUpCard.mount({
                checkoutId: checkoutId,
                onResponse: function (type, body) {
                  post('sumup:widget:response', { type: type, body: body });
                },
                onLoad: function () { post('sumup:widget:loaded', {}); },
                showFooter: true
              });
              window._sumupInstance = instance;
            }
            if (++tries > 20) {
              clearInterval(int);
              post('sumup:widget:response', { type: 'error', body: { message: 'SumUp SDK unavailable' } });
            }
          }, 200);
        }
        window.addEventListener('message', function (e) {
          if (!e.data || typeof e.data !== 'object') return;
          if (e.data && e.data.type === 'sumup:widget:unmount') {
            try { if (window._sumupInstance && typeof window._sumupInstance.unmount === 'function') window._sumupInstance.unmount(); } catch(_) {}
          }
        });
      })();
    </script>
  </body>
</html>`;

  const res = new NextResponse(html, { status: 200 });
  res.headers.set("Content-Type", "text/html; charset=utf-8");
  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("X-Content-Type-Options", "nosniff");
  return res;
}
