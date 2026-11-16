/* Faz o app funcionar fora do Claude: implementa window.claude.use() falando com o servidor. */
(function () {
  "use strict";
  var meP = null, subs = [];
  function req(method, url, body, extra) {
    var o = { method: method, credentials: "same-origin", headers: { "x-app": "1" } };
    if (body !== undefined) { o.headers["content-type"] = "application/json"; o.body = JSON.stringify(body); }
    if (extra) { Object.keys(extra).forEach(function (k) { o[k] = extra[k]; }); }
    return fetch(url, o).then(function (r) {
      if (r.status === 401) { location.reload(); return new Promise(function () {}); }
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) { var e = new Error(j.error || "Erro"); e.code = j.code || (r.status === 429 ? "rate_limited" : r.status === 403 ? "not_granted" : "upstream_error"); throw e; }
        return j;
      });
    });
  }
  function me() { return meP || (meP = req("GET", "/api/me")); }
  function newId() { var a = new Uint8Array(15); crypto.getRandomValues(a); return Array.from(a, function (b) { return b.toString(36).padStart(2, "0"); }).join("").slice(0, 20); }
  function refreshAll() { subs.forEach(function (s) { s.poll(); }); }

  function collection(name) {
    var order = null;
    var api = {
      doc: function (id) {
        id = id || newId();
        return {
          id: id,
          set: function (d) { return req("PUT", "/api/c/" + name + "/" + id, { data: d }).then(refreshAll); },
          update: function (p) { return req("PATCH", "/api/c/" + name + "/" + id, { data: p }).then(refreshAll); },
          delete: function () { return req("DELETE", "/api/c/" + name + "/" + id).then(refreshAll); }
        };
      },
      orderBy: function (field, dir) { order = { f: field, d: dir || "asc" }; return api; },
      onSnapshot: function (ok, bad) {
        var last = null, stopped = false, timer = null;
        function poll() {
          req("GET", "/api/c/" + name).then(function (j) {
            if (stopped) return;
            var docs = j.docs.slice();
            if (order) docs.sort(function (a, b) {
              var x = a.data[order.f] || "", y = b.data[order.f] || "";
              return (x < y ? -1 : x > y ? 1 : 0) * (order.d === "desc" ? -1 : 1);
            });
            var key = JSON.stringify(docs);
            if (key === last) return;
            last = key;
            ok({ docs: docs.map(function (d) { return { id: d.id, data: function () { return d.data; } }; }) });
          }).catch(function (e) { if (!stopped && bad) bad(e); });
        }
        var sub = { poll: poll }; subs.push(sub);
        poll(); timer = setInterval(poll, 4000);
        document.addEventListener("visibilitychange", function () { if (!document.hidden) poll(); });
        return function () { stopped = true; clearInterval(timer); subs = subs.filter(function (s) { return s !== sub; }); };
      }
    };
    return api;
  }

  function toBase64(blob) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(String(r.result).split(",")[1] || ""); };
      r.onerror = rej; r.readAsDataURL(blob);
    });
  }

  var caps = {
    db: function () { return Promise.resolve({ collection: collection }); },
    user: function () {
      return Promise.resolve({
        can: function () { return Promise.resolve(true); },
        canEdit: function () { return Promise.resolve(true); },
        isOwner: function () { return me().then(function (m) { return m.role === "admin"; }); }
      });
    },
    sample: function () {
      return me().then(function (m) {
        if (!m.ai) return null;
        var fn = function () { return Promise.reject({ code: "refused" }); };
        fn.limits = function () { return Promise.resolve({ images: { mediaTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"], maxCount: 2 } }); };
        fn.json = function (_prompt, opts) {
          var blobs = (opts && opts.images) || [];
          return Promise.all(blobs.map(function (b) { return toBase64(b).then(function (d) { return { type: b.type || "image/png", data: d }; }); }))
            .then(function (images) { return req("POST", "/api/ler-ordem", { images: images }, opts && opts.signal ? { signal: opts.signal } : null); })
            .then(function (j) { return j.data; });
        };
        return fn;
      }).catch(function () { return null; });
    },
    assets: function () {
      return Promise.resolve({
        upload: function (blob, o) {
          var type = (o && o.type) || blob.type || "application/octet-stream";
          return fetch("/api/assets", { method: "POST", credentials: "same-origin", headers: { "x-app": "1", "content-type": type }, body: blob })
            .then(function (r) { return r.json().then(function (j) { if (!r.ok) { var e = new Error(j.error || "Erro"); e.code = "upstream_error"; throw e; } return j; }); });
        }
      });
    },
    downloads: function () {
      return Promise.resolve({
        save: function (o) {
          var blob = new Blob([o.data], { type: /\.pdf$/i.test(o.filename) ? "application/pdf" : "text/csv;charset=utf-8" });
          var a = document.createElement("a");
          a.href = URL.createObjectURL(blob); a.download = o.filename;
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
          return Promise.resolve();
        }
      });
    }
  };
  window.claude = { use: function (name) { return caps[name] ? caps[name]() : Promise.resolve(null); } };
})();
