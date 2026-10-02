(function () {
  const Data = window.FinderData;

  function money(n) {
    return n.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }

  function monthly(n) {
    return (n / 12).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function displayName(p) {
    if (!p) return "";
    if (p.chip && /MacBook Pro|Mac mini/.test(p.name)) return p.name + " with " + p.chip;
    return p.name;
  }

  function inBand(price, band) {
    if (!band || band.soft) return true;
    if (price < band.min) return false;
    if (band.max == null) return true;
    return price <= band.max;
  }

  function valueScore(price) {
    return Math.max(0, Math.min(10, 10 - price / 450));
  }

  function selectedOptions(step, answers) {
    if (!step) return [];
    const raw = answers[step.key];
    const ids = Array.isArray(raw) ? raw : raw ? [raw] : [];
    return ids
      .map((id) => step.options.find((o) => o.id === id))
      .filter(Boolean);
  }

  function scoreParts(product, answers) {
    const flow = Data.getFlow(answers);
    const scores = Object.assign({}, product.scores, { value: valueScore(product.price) });
    let fit = 0;
    flow.forEach((step) => {
      if (step.key === "category" || step.key === "budget") return;
      const weight = step.key === "extras" ? 3.5 : step.key === "place" ? 5 : step.key === "priority" ? 6 : 8;
      selectedOptions(step, answers).forEach((opt) => {
        Object.keys(opt.weights || {}).forEach((key) => {
          fit += (scores[key] || 0) * opt.weights[key] * weight;
        });
      });
    });
    return fit;
  }

  function budgetAdjust(price, band) {
    if (!band || band.soft) return band && band.soft ? -(price / 380) : 0;
    if (inBand(price, band)) return 28;
    if (band.max != null && price > band.max) {
      const ratio = (price - band.max) / Math.max(band.max, 1);
      return -25 - ratio * 55;
    }
    const ratio = (band.min - price) / Math.max(band.min, 1);
    return -8 - ratio * 22;
  }

  function findStep(answers, key) {
    return Data.getFlow(answers).find((s) => s.key === key);
  }

  function buildReasons(product, answers, ctx) {
    const use = selectedOptions(findStep(answers, "use"), answers)[0];
    const place = selectedOptions(findStep(answers, "place"), answers)[0];
    const priority = selectedOptions(findStep(answers, "priority"), answers)[0];
    const band = selectedOptions(findStep(answers, "budget"), answers)[0];
    const name = displayName(product);

    const based = [];
    if (use) based.push(use.title.toLowerCase());
    if (place) based.push(place.title.toLowerCase());
    if (priority) based.push(priority.title.toLowerCase() + " as the priority");

    let priceBody;
    if (ctx.overBudget) {
      priceBody =
        money(product.price) +
        " is above the budget you set. It is still the closest match in this lineup.";
    } else if (band && band.soft) {
      priceBody =
        "It starts at " +
        money(product.price) +
        ". That is the match for what you described, not simply the most expensive model.";
    } else if (band && !inBand(product.price, band)) {
      priceBody =
        "It starts at " +
        money(product.price) +
        ". That’s just outside the range you set, and it’s the closest " +
        (product.kind === "macbook" ? "laptop" : "desktop") +
        " for how you said you’d use it.";
    } else if (band) {
      priceBody =
        "At " +
        money(product.price) +
        ", it sits in the " +
        band.title +
        " range you chose.";
    } else {
      priceBody = "It starts at " + money(product.price) + ".";
    }

    return [
      { title: "Why this one", body: product.pitch },
      {
        title: "Your answers",
        body: based.length
          ? "You told us " +
            based.join(", ") +
            ". That combination points to " +
            name +
            " rather than a cheaper or a more expensive model."
          : product.pitch,
      },
      { title: "The price", body: priceBody },
    ];
  }

  function macShape(product) {
    if (!product || product.category !== "mac") return "";
    if (product.kind === "macbook") return "laptop";
    if (product.kind === "imac" || product.kind === "mini" || product.kind === "studio") return "desktop";
    return "";
  }

  function preferredShape(answers) {
    if (!answers || answers.category !== "mac") return "";
    const extras = answers.extras || [];
    if (answers.place === "mobile") return "laptop";
    if (answers.place === "desk") return "desktop";
    if (extras.indexOf("light") >= 0) return "laptop";
    if (answers.place === "mix" || extras.indexOf("ports") >= 0) {
      return extras.indexOf("ports") >= 0 ? "desktop" : "laptop";
    }
    return "";
  }

  function closestToBand(rows, band) {
    function distance(price) {
      if (band.max != null && price > band.max) return price - band.max;
      if (price < band.min) return (band.min - price) * 0.35;
      return 0;
    }
    const sorted = rows.slice().sort((a, b) => distance(a.p.price) - distance(b.p.price) || b.score - a.score);
    const nearest = distance(sorted[0].p.price);
    return sorted.filter((row) => distance(row.p.price) <= nearest + 120);
  }

  function buildRecommendation(answers) {
    const band = selectedOptions(findStep(answers, "budget"), answers)[0];
    const category = answers.category;
    const pool = Data.products.filter((p) => {
      if (p.recommendable === false || p.price == null) return false;
      if (category && category !== "any" && p.category !== category) return false;
      return true;
    });

    const ranked = pool
      .map((p) => {
        const fit = scoreParts(p, answers);
        const score = fit + budgetAdjust(p.price, band);
        return { p, fit, score };
      })
      .sort((a, b) => b.score - a.score || a.p.price - b.p.price);

    let shortlist = ranked;
    let overBudget = false;
    const shape = preferredShape(answers);
    const shaped = shape ? ranked.filter((row) => macShape(row.p) === shape) : [];
    const candidates = shaped.length ? shaped : ranked;

    if (band && !band.soft) {
      const inside = candidates.filter((row) => inBand(row.p.price, band));
      if (inside.length) shortlist = inside;
      else if (shaped.length) {
        shortlist = closestToBand(shaped, band).sort((a, b) => b.score - a.score);
        overBudget = band.max != null && shortlist[0].p.price > band.max;
      } else {
        overBudget = true;
      }
    } else if (shaped.length) {
      shortlist = shaped;
    }

    const winner = shortlist[0];
    const alternatives = shortlist.slice(1, 3);
    let stretch = null;
    if (winner && band && !band.soft && !overBudget) {
      const aspirational = (shaped.length ? shaped : ranked).find(
        (row) =>
          row.p.id !== winner.p.id &&
          row.p.price > winner.p.price + 80 &&
          row.fit > winner.fit + 8
      );
      if (aspirational && aspirational.p.price > winner.p.price) stretch = aspirational;
    }

    return {
      winner: winner ? winner.p : null,
      alternatives: alternatives.map((row) => row.p),
      stretch: stretch ? stretch.p : null,
      overBudget,
      reasons: winner ? buildReasons(winner.p, answers, { overBudget }) : [],
      compared: shortlist.slice(0, 3).map((row) => row.p),
      answers,
    };
  }

  function withWinner(result, id) {
    if (!result || !result.winner || !id || result.winner.id === id) return result;
    const pool = [result.winner]
      .concat(result.alternatives || [])
      .concat(result.stretch ? [result.stretch] : [])
      .concat(result.compared || []);
    const chosen = pool.find((p) => p && p.id === id);
    if (!chosen) return result;
    const others = [];
    const seen = new Set([chosen.id]);
    pool.forEach((p) => {
      if (p && !seen.has(p.id)) {
        seen.add(p.id);
        others.push(p);
      }
    });
    return {
      winner: chosen,
      alternatives: others.slice(0, 2),
      stretch: result.winner.id !== chosen.id && result.winner.price > chosen.price ? result.winner : null,
      overBudget: false,
      reasons: buildReasons(chosen, result.answers, { overBudget: false }),
      compared: [chosen].concat(others).slice(0, 3),
      answers: result.answers,
      pinned: true,
    };
  }

  window.FinderRecommend = {
    money,
    monthly,
    displayName,
    buildRecommendation,
    withWinner,
  };
})();
