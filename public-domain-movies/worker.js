
const UPSTREAM = "https://caching.stremio.net/publicdomainmovies.now.sh";

export default {
  async fetch(request) {
    const incoming = new URL(request.url);

    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "*"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    if (!["GET", "HEAD"].includes(request.method)) {
      return new Response("Method not allowed", {
        status: 405,
        headers: cors
      });
    }

    const upstreamUrl = new URL(UPSTREAM);
    upstreamUrl.pathname += incoming.pathname;
    upstreamUrl.search = incoming.search;

    const response = await fetch(upstreamUrl.toString(), {
      method: request.method,
      headers: {
        "Accept": request.headers.get("Accept") || "*/*"
      },
      redirect: "follow"
    });

    const headers = new Headers(response.headers);

    Object.entries(cors).forEach(([key, value]) => {
      headers.set(key, value);
    });

    if (incoming.pathname === "/manifest.json" && response.ok) {
      const manifest = await response.json();

      if (Array.isArray(manifest.catalogs)) {
        manifest.catalogs = manifest.catalogs.map((catalog, index) => ({
          ...catalog,
          name: catalog.name || (
            index === 0
              ? "Public Domain Movies"
              : `Public Domain Movies ${index + 1}`
          )
        }));
      }

      headers.set("Content-Type", "application/json; charset=utf-8");
      headers.delete("Content-Length");
      headers.delete("Content-Encoding");
      headers.delete("ETag");

      return new Response(JSON.stringify(manifest), {
        status: response.status,
        headers
      });
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
};
