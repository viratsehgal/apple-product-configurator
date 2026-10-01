(function () {
  const Data = window.FinderData;
  const Rec = window.FinderRecommend;
  const KEY = "apple-product-finder-v2";

  const NAV = [
    ["mac", "Mac", "#/mac"],
    ["ipad", "iPad", "#/ipad"],
    ["iphone", "iPhone", "#/iphone"],
    ["watch", "Watch", "#/watch"],
    ["airpods", "AirPods", "#/airpods"],
  ];

  const CATALOG = {
    mac: ["Mac", "If you can dream it, Mac can do it.", "Which Mac is right for you?"],
    ipad: ["iPad", "Touch, draw, and get it done.", "Which iPad is right for you?"],
    iphone: ["iPhone", "All models. Take your pick.", "Which iPhone is right for you?"],
    watch: ["Apple Watch", "The ultimate device for a healthy life.", "Which Apple Watch is right for you?"],
    airpods: ["AirPods", "Effortless listening. All day." , "Which AirPods are right for you?"],
  };

  const state = {
    menuOpen: false,
    bagOpen: false,
    answers: { extras: [] },
    step: 0,
    result: null,
    pin: null,
    finishes: {},
    shake: false,
  };

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function persist() {
    try {
      sessionStorage.setItem(
        KEY,
        JSON.stringify({
          answers: state.answers,
          step: state.step,
          finishes: state.finishes,
          pin: state.pin,
          saved: Boolean(state.result && state.result.winner),
        })
      );
    } catch (err) {
      /* private mode */
    }
  }

  function restore() {
    try {
      const raw = JSON.parse(sessionStorage.getItem(KEY) || "null");
      if (!raw) return;
      state.answers = raw.answers || { extras: [] };
      state.step = raw.step || 0;
      state.finishes = raw.finishes || {};
      state.pin = raw.pin || null;
      if (raw.saved) {
        state.result = Rec.buildRecommendation(state.answers);
        if (state.pin && state.result) state.result = Rec.withWinner(state.result, state.pin);
      }
    } catch (err) {
      /* ignore broken storage */
    }
  }

  function parseRoute() {
    const parts = (location.hash || "#/").replace(/^#/, "").split("/").filter(Boolean);
    if (!parts.length) return { name: "home" };
    if (parts[0] === "p" && parts[1]) return { name: "product", id: decodeURIComponent(parts[1]) };
    if (parts[0] === "finder") return { name: "finder" };
    if (parts[0] === "result") return { name: "result" };
    if (CATALOG[parts[0]]) return { name: "catalog", id: parts[0] };
    return { name: "home" };
  }

  function go(hash) {
    if ((location.hash || "#/") !== hash) location.hash = hash;
    else render(true);
  }

  function currentNav() {
    const route = parseRoute();
    if (route.name === "catalog") return route.id;
    return "";
  }

  function photo(product, extra) {
    if (!product || !product.photo) return "";
    return (
      '<img class="product-photo' +
      (extra ? " " + extra : "") +
      '" src="' +
      esc(product.photo) +
      '" alt="' +
      esc(Rec.displayName(product)) +
      '">'
    );
  }

  function textLink(label, attrs, tone) {
    return (
      '<a class="text-link' +
      (tone ? " " + tone : "") +
      '" ' +
      attrs +
      ">" +
      esc(label) +
      ' <span class="chev" aria-hidden="true">›</span></a>'
    );
  }

  function logo() {
    return (
      '<a class="logo" href="#/" aria-label="Home">' +
      '<svg viewBox="0 0 14 44" aria-hidden="true"><path d="M13.0729 17.6825a3.61 3.61 0 0 0-1.7248 3.0365 3.5132 3.5132 0 0 0 2.1379 3.2223 8.394 8.394 0 0 1-1.0948 2.2618c-.6816.9812-1.3943 1.9623-2.4787 1.9623s-1.3633-.63-2.613-.63c-1.2187 0-1.6525.6507-2.644.6507s-1.6834-.9089-2.4787-2.0243a9.7842 9.7842 0 0 1-1.6628-5.2776c0-3.0984 2.014-4.7405 3.9969-4.7405 1.0535 0 1.9314.6919 2.5924.6919.63 0 1.6112-.7333 2.8092-.7333a3.7579 3.7579 0 0 1 3.1604 1.5802zm-3.7284-2.8918a3.5615 3.5615 0 0 0 .8469-2.22 1.5353 1.5353 0 0 0-.031-.32 3.5686 3.5686 0 0 0-2.3445 1.2084 3.4629 3.4629 0 0 0-.8779 2.3295 1.419 1.419 0 0 0 .031.2892 1.19 1.19 0 0 0 .2169.0207 3.0935 3.0935 0 0 0 2.1586-1.2878z"/></svg></a>'
    );
  }

  function icons() {
    const dot = state.result && state.result.winner ? '<i class="bag-dot"></i>' : "";
    return (
      '<div class="nav-tools">' +
      '<button class="icon-btn" data-action="toggle-bag" aria-label="Your match">' +
      dot +
      '<svg viewBox="0 0 14 44" aria-hidden="true"><path d="M11.3535 16.0283h-1.0205a3.4229 3.4229 0 0 0-3.333-2.9648 3.4229 3.4229 0 0 0-3.333 2.9648h-1.02a2.1184 2.1184 0 0 0-2.117 2.1162v7.7155a2.1186 2.1186 0 0 0 2.1162 2.1167h8.707a2.1186 2.1186 0 0 0 2.1168-2.1167v-7.7155a2.1184 2.1184 0 0 0-2.1165-2.1162zm-4.3535-1.8652a2.3169 2.3169 0 0 1 2.2222 1.8652h-4.4444a2.3169 2.3169 0 0 1 2.2222-1.8652zm5.37 11.6969a1.0182 1.0182 0 0 1-1.0166 1.0171h-8.707a1.0182 1.0182 0 0 1-1.0165-1.0171v-7.7155a1.0178 1.0178 0 0 1 1.0166-1.0166h8.707a1.0178 1.0178 0 0 1 1.0164 1.0166z"/></svg></button>' +
      '<button class="menu-btn" data-action="toggle-menu" aria-label="Menu" aria-expanded="' +
      (state.menuOpen ? "true" : "false") +
      '"><svg viewBox="0 0 18 44"><path d="M1 16h16v1.2H1zM1 21h16v1.2H1zM1 26h16v1.2H1z"/></svg></button>' +
      "</div>"
    );
  }

  function header() {
    const active = currentNav();
    const links = NAV.map(function (item) {
      const on = item[0] === active ? ' aria-current="page"' : "";
      return '<li><a href="' + item[2] + '"' + on + ">" + esc(item[1]) + "</a></li>";
    }).join("");
    return (
      '<header class="globalnav"><div class="nav-inner">' +
      logo() +
      '<ul class="nav-links">' +
      links +
      "</ul>" +
      icons() +
      "</div></header>" +
      (state.bagOpen ? bagPanel() : "") +
      (state.menuOpen ? menuPanel() : "")
    );
  }

  function bagPanel() {
    const winner = state.result && state.result.winner;
    if (!winner) {
      return (
        '<div class="bag-panel"><h2>Your match</h2><p>Answer a few questions and the product will show up here.</p>' +
        '<button class="pill" data-action="start">Get started</button></div>'
      );
    }
    return (
      '<div class="bag-panel"><h2>' +
      esc(Rec.displayName(winner)) +
      "</h2><p>From " +
      esc(Rec.money(winner.price)) +
      ". Checkout happens on Apple’s website.</p><div class=\"bag-actions\">" +
      '<a class="pill" href="#/result">View</a>' +
      '<a class="text-link" href="' +
      esc(winner.buy) +
      '" target="_blank" rel="noopener noreferrer">Buy</a></div></div>'
    );
  }

  function menuPanel() {
    const links = NAV.map(function (item) {
      return '<a href="' + item[2] + '">' + esc(item[1]) + "</a>";
    }).join("");
    return '<nav class="mobile-menu" aria-label="Menu">' + links + "</nav>";
  }

  function crumb(items) {
    const html = items
      .map(function (item, index) {
        const node = item[1]
          ? '<a href="' + item[1] + '">' + esc(item[0]) + "</a>"
          : "<span>" + esc(item[0]) + "</span>";
        return index ? '<span aria-hidden="true">›</span>' + node : node;
      })
      .join("");
    return '<nav class="crumb" aria-label="Breadcrumb">' + html + "</nav>";
  }

  function footer() {
    const cols = [
      [
        "Shop and Learn",
        [
          ["Mac", "#/mac"],
          ["iPad", "#/ipad"],
          ["iPhone", "#/iphone"],
          ["Watch", "#/watch"],
          ["AirPods", "#/airpods"],
        ],
      ],
      [
        "Product Finder",
        [
          ["Get started", "start"],
          ["See an example", "example"],
        ],
      ],
      [
        "Apple",
        [
          ["Official store", "https://www.apple.com/"],
          ["Apple Support", "https://support.apple.com/"],
          ["Apple Trade In", "https://www.apple.com/shop/trade-in"],
        ],
      ],
      [
        "About this guide",
        [
          ["Get started", "start"],
          ["See an example", "example"],
        ],
      ],
    ];
    const grid = cols
      .map(function (col) {
        const links = col[1]
          .map(function (link) {
            if (link[1] === "start") return '<button data-action="start">' + esc(link[0]) + "</button>";
            if (link[1] === "example") return '<button data-action="example">' + esc(link[0]) + "</button>";
            const external = link[1].indexOf("http") === 0;
            return (
              '<a href="' +
              esc(link[1]) +
              '"' +
              (external ? ' target="_blank" rel="noopener noreferrer"' : "") +
              ">" +
              esc(link[0]) +
              "</a>"
            );
          })
          .join("");
        return "<div class=\"footer-col\"><h3>" + esc(col[0]) + "</h3>" + links + "</div>";
      })
      .join("");
    return (
      '<footer class="footer"><div class="footer-inner">' +
      '<p class="footer-note">Unofficial buying guide. Not affiliated with Apple Inc. Apple, Mac, iPhone, iPad, Apple Watch, and AirPods are trademarks of Apple Inc., registered in the U.S. and other countries. Recommendations use the publicly listed 2026 lineup. You always check out on apple.com.</p>' +
      '<div class="footer-grid">' +
      grid +
      "</div>" +
      '<div class="footer-base"><span>United States</span><span>Copyright © 2026 Product Finder</span></div>' +
      "</div></footer>"
    );
  }

  function home() {
    const tiles = Data.homeTiles
      .map(function (tile) {
        const product = Data.byId(tile.productId);
        return (
          '<article class="tile' +
          (tile.wide ? " wide" : "") +
          '"><h2>' +
          esc(tile.kicker) +
          '</h2><p class="tag">' +
          esc(tile.title) +
          '</p><div class="links">' +
          textLink("Learn more", 'href="#/p/' + esc(product.id) + '"') +
          textLink("Find yours", 'href="#/finder" data-action="start" data-cat="' + esc(tile.start) + '"') +
          "</div>" +
          photo(product) +
          "</article>"
        );
      })
      .join("");
    const stage =
      photo(Data.byId("mba-13"), "stage") +
      photo(Data.byId("iphone-18-pro"), "stage") +
      photo(Data.byId("watch-s12"), "stage") +
      photo(Data.byId("airpods-pro"), "stage");
    return (
      '<div class="ribbon"><p>iPhone 18 Pro is here. <a href="#/finder" data-action="start" data-cat="iphone">See if it’s the one ›</a></p></div>' +
      '<section class="hero"><h1>Which one is yours.</h1>' +
      '<p class="sub">A few questions. A clear recommendation across Mac, iPhone, iPad, Watch, and AirPods.</p>' +
      '<div class="hero-links">' +
      textLink("Get started", 'href="#/finder" data-action="start"', "light") +
      textLink("See an example", 'href="#/result" data-action="example"', "light") +
      "</div><div class=\"stage\">" +
      stage +
      "</div></section>" +
      '<div class="tiles">' +
      tiles +
      "</div>" +
      '<section class="cta-band"><h2>Not sure where to start?</h2><p>Tell us how you work, create, and get around.</p>' +
      '<button class="pill" data-action="start">Get started</button></section>' +
      '<section class="how"><div class="how-inner"><h2>How it works.</h2><div class="how-grid">' +
      "<div><h3>Tell us.</h3><p>What you’re buying, what you’ll do with it, and what you want to spend.</p></div>" +
      "<div><h3>We match.</h3><p>Your answers are scored against the current lineup. The priciest model does not win by default.</p></div>" +
      "<div><h3>You decide.</h3><p>See why it fits, compare two alternatives, then buy from Apple.</p></div>" +
      "</div></div></section>"
    );
  }

  function catalog(id) {
    const meta = CATALOG[id];
    const cards = Data.catalogs[id]
      .map(function (pid) {
        const product = Data.byId(pid);
        const price = product.price == null ? "Coming soon" : "From " + Rec.money(product.price);
        return (
          '<article class="card"><p class="chip-line">' +
          esc(product.chip) +
          "</p>" +
          photo(product) +
          "<h2>" +
          esc(product.name) +
          '</h2><p class="price">' +
          esc(price) +
          '</p><p class="tag">' +
          esc(product.tagline) +
          '</p><div class="links">' +
          textLink("Learn more", 'href="#/p/' + esc(product.id) + '"') +
          textLink("Buy", 'href="' + esc(product.buy) + '" target="_blank" rel="noopener noreferrer"') +
          "</div></article>"
        );
      })
      .join("");
    const coming =
      id === "iphone"
        ? '<section class="coming"><p class="eyebrow">iPhone Duo</p><h2>Hello, hello.</h2><p>Pre-order starting 5:00 a.m. PT on 10.16. Available starting 10.23.</p><div class="hero-actions">' +
          textLink("See it on Apple", 'href="https://www.apple.com/" target="_blank" rel="noopener noreferrer"', "light") +
          "</div></section>"
        : "";
    return (
      crumb([
        ["Home", "#/"],
        [meta[0], ""],
      ]) +
      '<header class="catalog-head"><h1>' +
      esc(meta[0]) +
      "</h1><p>" +
      esc(meta[1]) +
      "</p></header>" +
      '<section class="help-banner"><h2>' +
      esc(meta[2]) +
      '</h2><p>A few questions. A specific recommendation.</p><button class="pill" data-action="start" data-cat="' +
      esc(id) +
      '">Get help choosing</button></section>' +
      coming +
      '<div class="grid">' +
      cards +
      "</div>"
    );
  }

  function page(id) {
    if (id === "vision") {
      return (
        crumb([["Home", "#/"], ["Vision", ""]]) +
        '<header class="page-hero"><p class="eyebrow">Apple Vision Pro</p><h1>The spatial computer.</h1>' +
        "<p>Vision Pro is a specialized product, so the finder keeps it out of everyday recommendations. Most people are better matched with a Mac, iPhone, or iPad.</p>" +
        '<div class="hero-actions"><a class="pill" href="https://www.apple.com/apple-vision-pro/" target="_blank" rel="noopener noreferrer">Buy</a>' +
        '<button class="text-link" data-action="start">Find another product</button></div></header>' +
        '<section class="section"><p class="fine" style="margin:0 auto;">From $3,699 after the 2026 price adjustment. Confirm the current price on Apple’s site.</p></section>'
      );
    }
    if (id === "tv") {
      const cards = Data.tvProducts
        .map(function (item) {
          return (
            '<article class="info-card"><h2>' +
            esc(item.name) +
            "</h2><p>" +
            esc(item.detail) +
            "</p><p>" +
            esc(item.price) +
            "</p>" +
            textLink("Learn more", 'href="' + esc(item.href) + '" target="_blank" rel="noopener noreferrer"') +
            "</article>"
          );
        })
        .join("");
      return (
        crumb([["Home", "#/"], ["TV & Home", ""]]) +
        '<header class="page-hero"><h1>TV & Home</h1><p>For the living room. Personal devices live in the product finder.</p></header>' +
        '<div class="service-grid">' +
        cards +
        "</div>"
      );
    }
    if (id === "entertainment") {
      const cards = Data.services
        .map(function (item) {
          return (
            '<article class="service"><h2>' +
            esc(item.name) +
            "</h2><p>" +
            esc(item.detail) +
            "</p>" +
            textLink("Learn more", 'href="' + esc(item.href) + '" target="_blank" rel="noopener noreferrer"', "light") +
            "</article>"
          );
        })
        .join("");
      return (
        crumb([["Home", "#/"], ["Entertainment", ""]]) +
        '<header class="page-hero"><h1>Entertainment</h1><p>Six services. One Apple ID.</p></header><div class="service-grid">' +
        cards +
        "</div>"
      );
    }
    if (id === "accessories") {
      const cards = Data.accessories
        .map(function (item) {
          return (
            '<article class="info-card"><h2>' +
            esc(item.name) +
            "</h2><p>" +
            esc(item.detail) +
            "</p>" +
            textLink("Shop", 'href="' + esc(item.href) + '" target="_blank" rel="noopener noreferrer"') +
            "</article>"
          );
        })
        .join("");
      return (
        crumb([["Home", "#/"], ["Accessories", ""]]) +
        '<header class="page-hero"><h1>Accessories</h1><p>Essentials that pair with the product you choose.</p></header>' +
        '<div class="service-grid">' +
        cards +
        "</div>"
      );
    }
    const topics = [
      ["Which iPhone should I buy?", "iphone"],
      ["Which Mac should I buy?", "mac"],
      ["Which iPad should I buy?", "ipad"],
      ["Which Apple Watch should I buy?", "watch"],
      ["Which AirPods should I buy?", "airpods"],
      ["I’m not sure where to start", ""],
    ];
    const list = topics
      .map(function (topic) {
        return (
          '<button class="topic" data-action="start" data-cat="' +
          esc(topic[1]) +
          '"><span>' +
          esc(topic[0]) +
          '</span><span aria-hidden="true">›</span></button>'
        );
      })
      .join("");
    return (
      crumb([["Home", "#/"], ["Support", ""]]) +
      '<header class="page-hero"><h1>Support</h1><p>Start with the product. Official repairs and billing stay on Apple’s site.</p>' +
      '<a class="text-link" href="https://support.apple.com/" target="_blank" rel="noopener noreferrer">Go to Apple Support</a></header>' +
      '<div class="topic-list">' +
      list +
      "</div>"
    );
  }

  function selectedIds(step) {
    const raw = state.answers[step.key];
    if (Array.isArray(raw)) return raw;
    return raw ? [raw] : [];
  }

  function finder() {
    const flow = Data.getFlow(state.answers);
    const index = Math.min(state.step, flow.length - 1);
    const step = flow[index];
    const chosen = selectedIds(step);
    const last = index === flow.length - 1;
    const options = step.options
      .map(function (option) {
        const on = chosen.indexOf(option.id) >= 0;
        return (
          '<button class="choice' +
          (on ? " on" : "") +
          '" data-action="choice" data-key="' +
          esc(step.key) +
          '" data-id="' +
          esc(option.id) +
          '" data-type="' +
          esc(step.type) +
          '" aria-pressed="' +
          (on ? "true" : "false") +
          '"><span class="mark' +
          (step.type === "multi" ? " box" : "") +
          '"></span><span><strong>' +
          esc(option.title) +
          "</strong><small>" +
          esc(option.detail) +
          "</small></span></button>"
        );
      })
      .join("");
    const ready = step.type === "multi" || chosen.length > 0;
    return (
      crumb([
        ["Home", "#/"],
        ["Product Finder", ""],
      ]) +
      '<div class="finder-wrap"><p class="q-kicker">Question ' +
      (index + 1) +
      " of " +
      flow.length +
      '</p><div class="progress" role="progressbar" aria-valuenow="' +
      (index + 1) +
      '" aria-valuemin="1" aria-valuemax="' +
      flow.length +
      '"><span style="width:' +
      ((index + 1) / flow.length) * 100 +
      '%"></span></div><p class="q-kicker">' +
      esc(step.kicker) +
      '</p><h1 class="q-title">' +
      esc(step.title) +
      '</h1><p class="q-detail">' +
      esc(step.detail) +
      '</p><div class="choices' +
      (state.shake ? " shake" : "") +
      '">' +
      options +
      '</div><div class="finder-bar"><button class="text-link" data-action="back">' +
      (index === 0 ? "Cancel" : "Back") +
      '</button><button class="pill" data-action="next"' +
      (ready ? "" : " disabled") +
      ">" +
      (last ? "See your match" : "Continue") +
      "</button></div></div>"
    );
  }

  function heroBlock(product, mode) {
    const price =
      product.price == null
        ? esc(product.coming || "Coming soon")
        : "From " + esc(Rec.money(product.price)) + " or " + esc(Rec.monthly(product.price)) + "/mo. for 12 mo.*";
    const buy =
      product.price == null
        ? textLink("See it on Apple", 'href="' + esc(product.buy) + '" target="_blank" rel="noopener noreferrer"', product.theme === "dark" ? "light" : "")
        : '<a class="pill" href="' + esc(product.buy) + '" target="_blank" rel="noopener noreferrer">Buy</a>';
    const secondary =
      mode === "result"
        ? '<button class="text-link' +
          (product.theme === "dark" ? " light" : "") +
          '" data-action="restart">Start over</button>'
        : '<button class="text-link' +
          (product.theme === "dark" ? " light" : "") +
          '" data-action="start" data-cat="' +
          esc(product.category) +
          '">Is this the one?</button>';
    return (
      '<section class="product-hero ' +
      esc(product.theme || "light") +
      '"><p class="eyebrow">' +
      esc(mode === "result" ? "Our recommendation" : product.chip) +
      "</p><h1>" +
      esc(Rec.displayName(product)) +
      '</h1><p class="tagline">' +
      esc(product.tagline) +
      '</p><p class="price">' +
      price +
      '</p><div class="hero-actions">' +
      buy +
      secondary +
      "</div>" +
      '<div class="hero-device">' +
      photo(product) +
      "</div>" +
      '<p class="fine">Confirm storage and price on Apple’s store before you buy.</p></section>'
    );
  }

  function specs(product) {
    if (!product.specs || !product.specs.length) return "";
    const cells = product.specs
      .map(function (row) {
        return "<div><dt>" + esc(row[0]) + "</dt><dd>" + esc(row[1]) + "</dd></div>";
      })
      .join("");
    return '<dl class="spec-row">' + cells + "</dl>";
  }

  function compare(list) {
    if (!list || list.length < 2) return "";
    const rows = [
      ["Price", function (p) { return p.price == null ? "—" : Rec.money(p.price); }],
      ["Chip", function (p) { return p.chip; }],
      ["Highlight", function (p) { return p.specs[1] ? p.specs[1][1] : p.tagline; }],
      ["Best for", function (p) {
        const found = (p.specs || []).find(function (row) { return row[0] === "Best for"; });
        return found ? found[1] : p.tagline;
      }],
    ];
    const head =
      "<tr><th></th>" +
      list.map(function (p) { return "<th>" + esc(Rec.displayName(p)) + "</th>"; }).join("") +
      "</tr>";
    const body = rows
      .map(function (row) {
        return (
          "<tr><td>" +
          esc(row[0]) +
          "</td>" +
          list.map(function (p) { return "<td>" + esc(row[1](p)) + "</td>"; }).join("") +
          "</tr>"
        );
      })
      .join("");
    return (
      '<section class="section"><h2>Compare the top matches.</h2><div class="table-wrap"><table class="compare">' +
      head +
      body +
      "</table></div></section>"
    );
  }

  function resultView(result) {
    const product = result.winner;
    const reasons = (result.reasons || [])
      .map(function (reason) {
        return "<div><h3>" + esc(reason.title) + "</h3><p>" + esc(reason.body) + "</p></div>";
      })
      .join("");
    const stretch = result.stretch
      ? '<aside class="stretch"><strong>If you can stretch. </strong>' +
        esc(Rec.displayName(result.stretch)) +
        " is the stronger pick for what you described, from " +
        esc(Rec.money(result.stretch.price)) +
        '. <button data-action="pick" data-id="' +
        esc(result.stretch.id) +
        '">Show that instead</button></aside>'
      : "";
    const alts = (result.alternatives || [])
      .map(function (alt) {
        return (
          '<article class="alt">' +
          photo(alt) +
          "<h3>" +
          esc(Rec.displayName(alt)) +
          '</h3><p class="price">From ' +
          esc(Rec.money(alt.price)) +
          "</p><p>" +
          esc(alt.chooseIf) +
          '</p><button class="pill" data-action="pick" data-id="' +
          esc(alt.id) +
          '">Choose this instead</button></article>'
        );
      })
      .join("");
    const flow = Data.getFlow(result.answers || {});
    const chips = flow
      .map(function (step, index) {
        const ids = (function () {
          const raw = (result.answers || {})[step.key];
          return Array.isArray(raw) ? raw : raw ? [raw] : [];
        })();
        const labels = ids
          .map(function (id) {
            const opt = step.options.find(function (item) { return item.id === id; });
            return opt ? opt.title : "";
          })
          .filter(Boolean);
        if (!labels.length) return "";
        return '<button class="chip" data-action="edit" data-step="' + index + '">' + esc(labels.join(", ")) + "</button>";
      })
      .join("");
    return (
      crumb([["Home", "#/"], ["Your match", ""]]) +
      heroBlock(product, "result") +
      '<section class="section"><h2>Why this one.</h2><div class="why-grid">' +
      reasons +
      "</div>" +
      specs(product) +
      stretch +
      "</section>" +
      (alts
        ? '<section class="section alts"><h2>Also consider.</h2><div class="alt-grid">' + alts + "</div></section>"
        : "") +
      compare(result.compared) +
      '<section class="section"><div class="answer-row"><p>Your answers. Select one to change it.</p><div class="chips">' +
      chips +
      "</div></div></section>" +
      footnotes()
    );
  }

  function productPage(id) {
    const product = Data.byId(id);
    if (!product) {
      return '<header class="page-hero"><h1>That product is not in this guide.</h1><button class="pill" data-action="start">Get started</button></header>';
    }
    const family = CATALOG[product.category] ? CATALOG[product.category][0] : "Products";
    const hash = CATALOG[product.category] ? "#/" + product.category : "#/";
    return (
      crumb([
        ["Home", "#/"],
        [family, hash],
        [product.name, ""],
      ]) +
      heroBlock(product, "product") +
      '<section class="section"><h2>The short version.</h2><div class="why-grid"><div><h3>What it’s for</h3><p>' +
      esc(product.pitch) +
      "</p></div><div><h3>Choose it if</h3><p>" +
      esc(product.chooseIf || product.tagline) +
      "</p></div><div><h3>Where to buy</h3><p>This guide does not take payment. The Buy button opens Apple’s store.</p></div></div>" +
      specs(product) +
      "</section>" +
      footnotes()
    );
  }

  function footnotes() {
    return (
      '<div class="footnotes"><p>* Monthly figure is the U.S. starting price divided by 12. It is not a financing offer. Taxes, trade-in, carrier credit, and configuration changes are extra.</p>' +
      "<p>1. Prices and specs are summarized from Apple’s public store and September 2026 newsroom: iPhone 18 Pro 256GB at $1,199, Apple Watch Series 12 GPS at $399, Mac Studio at $2,499, plus published 2026 starting prices for Mac and iPad. AirPods 5 is listed at $179 as an estimate. Always confirm on apple.com.</p></div>"
    );
  }

  function emptyResult() {
    return (
      '<header class="page-hero"><h1>No match yet.</h1><p>Tell us what you need and we’ll pick from the current lineup.</p>' +
      '<button class="pill" data-action="start">Get started</button></header>'
    );
  }

  function titleFor() {
    const route = parseRoute();
    if (route.name === "catalog") return CATALOG[route.id][2].replace("?", "") + " — Product Finder";
    if (route.name === "finder") return "Product Finder";
    if (route.name === "result" && state.result && state.result.winner) {
      return Rec.displayName(state.result.winner) + " — Your Match";
    }
    if (route.name === "product") {
      const product = Data.byId(route.id);
      return product ? product.name + " — Product Finder" : "Product Finder";
    }
    if (route.name === "page") return route.id.charAt(0).toUpperCase() + route.id.slice(1) + " — Product Finder";
    return "Find Your Apple Product";
  }

  function main() {
    const route = parseRoute();
    if (route.name === "catalog") return catalog(route.id);
    if (route.name === "finder") return finder();
    if (route.name === "product") return productPage(route.id);
    if (route.name === "result") {
      if (!state.result || !state.result.winner) {
        if (state.answers && state.answers.use) state.result = Rec.buildRecommendation(state.answers);
      }
      if (!state.result || !state.result.winner) return emptyResult();
      return resultView(state.result);
    }
    return home();
  }

  function render(toTop) {
    const app = document.getElementById("app");
    app.innerHTML =
      '<a class="skip" href="#main">Skip to content</a>' + header() + '<main id="main">' + main() + "</main>" + footer();
    document.body.classList.toggle("lock", state.menuOpen);
    document.title = titleFor();
    if (toTop) window.scrollTo(0, 0);
  }

  function showExample() {
    state.answers = {
      category: "iphone",
      use: "photos",
      place: "mobile",
      priority: "camera",
      budget: "high",
      extras: [],
    };
    state.step = 5;
    state.pin = null;
    state.result = Rec.buildRecommendation(state.answers);
    persist();
    go("#/result");
  }

  function onClick(event) {
    const btn = event.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === "toggle-menu") {
      state.menuOpen = !state.menuOpen;
      state.bagOpen = false;
      render(false);
      return;
    }
    if (action === "toggle-bag") {
      state.bagOpen = !state.bagOpen;
      state.menuOpen = false;
      render(false);
      return;
    }
    if (action === "start") {
      const cat = btn.dataset.cat || "";
      state.answers = cat ? { category: cat, extras: [] } : { extras: [] };
      state.step = cat ? 1 : 0;
      state.result = null;
      state.pin = null;
      state.menuOpen = false;
      state.bagOpen = false;
      persist();
      go("#/finder");
      return;
    }
    if (action === "example") {
      event.preventDefault();
      showExample();
      return;
    }
    if (action === "choice") {
      const key = btn.dataset.key;
      const id = btn.dataset.id;
      if (btn.dataset.type === "multi") {
        const cur = new Set(state.answers.extras || []);
        if (cur.has(id)) cur.delete(id);
        else cur.add(id);
        state.answers.extras = Array.from(cur);
      } else if (key === "category") {
        state.answers = { category: id, extras: [] };
      } else {
        state.answers[key] = id;
      }
      persist();
      render(false);
      return;
    }
    if (action === "next") {
      const flow = Data.getFlow(state.answers);
      const step = flow[Math.min(state.step, flow.length - 1)];
      const chosen = selectedIds(step);
      if (step.type !== "multi" && !chosen.length) {
        state.shake = true;
        render(false);
        state.shake = false;
        return;
      }
      if (state.step < flow.length - 1) {
        state.step += 1;
        persist();
        render(true);
      } else {
        state.pin = null;
        state.result = Rec.buildRecommendation(state.answers);
        persist();
        go("#/result");
      }
      return;
    }
    if (action === "back") {
      if (state.step === 0) go("#/");
      else {
        state.step -= 1;
        persist();
        render(true);
      }
      return;
    }
    if (action === "edit") {
      state.step = Number(btn.dataset.step) || 0;
      persist();
      go("#/finder");
      return;
    }
    if (action === "restart") {
      state.answers = { extras: [] };
      state.step = 0;
      state.result = null;
      state.pin = null;
      persist();
      go("#/finder");
      return;
    }
    if (action === "pick") {
      state.pin = btn.dataset.id;
      state.result = Rec.withWinner(state.result, state.pin);
      persist();
      render(true);
    }
  }

  function onKey(event) {
    if (event.key === "Escape") {
      state.menuOpen = false;
      state.bagOpen = false;
      render(false);
      return;
    }
    if (event.key === "Enter" && parseRoute().name === "finder") {
      const next = document.querySelector("[data-action='next']");
      if (next && document.activeElement && document.activeElement.tagName !== "TEXTAREA") next.click();
    }
  }

  restore();
  const app = document.getElementById("app");
  app.addEventListener("click", onClick);
  document.addEventListener("keydown", onKey);
  window.addEventListener("hashchange", function () {
    state.menuOpen = false;
    state.bagOpen = false;
    render(true);
  });
  render(false);
})();
