(function () {
  var DATA_URL = "./site-data.json";
  var SVG_NS = "http://www.w3.org/2000/svg";

  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }
    callback();
  }

  function slot(name) {
    return document.querySelector('[data-dynamic-slot="' + name + '"]');
  }

  function clear(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function setHidden(element, hidden) {
    if (hidden) {
      element.setAttribute("hidden", "");
      return;
    }
    element.removeAttribute("hidden");
  }

  function safeUrl(value) {
    if (!value || typeof value !== "string") return "";
    try {
      var parsed = new URL(value, window.location.href);
      if (["http:", "https:", "mailto:", "tel:"].indexOf(parsed.protocol) === -1) return "";
      return parsed.href;
    } catch (error) {
      return "";
    }
  }

  function applyDataset(element, dataset) {
    if (!dataset || typeof dataset !== "object") return;
    Object.keys(dataset).forEach(function (key) {
      var value = dataset[key];
      if (value === undefined || value === null || value === "") return;
      element.setAttribute("data-" + key, String(value));
    });
  }

  function createIcon(icon) {
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "brand-icon");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");

    var path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("fill", "currentColor");
    path.setAttribute("d", icon && typeof icon.path === "string" ? icon.path : "");
    svg.appendChild(path);
    return svg;
  }

  function createAction(action) {
    var href = safeUrl(action && action.url);
    if (!href) return null;

    var anchor = document.createElement("a");
    anchor.className = action.className || "link-button";
    anchor.href = href;
    anchor.rel = "noreferrer";
    anchor.target = "_blank";
    applyDataset(anchor, action.dataset);

    if (action.socialConfirm) {
      anchor.setAttribute("data-social-confirm", String(action.socialConfirm));
      anchor.setAttribute("aria-label", action.label || "Social link");
      var socialIcon = document.createElement("span");
      socialIcon.setAttribute("aria-hidden", "true");
      socialIcon.appendChild(createIcon(action.icon));
      anchor.appendChild(socialIcon);
      return anchor;
    }

    var copy = document.createElement("span");
    copy.className = "link-button-copy";
    var label = document.createElement("strong");
    label.textContent = action.label || "Open";
    copy.appendChild(label);

    if (action.meta) {
      var meta = document.createElement("small");
      meta.textContent = action.meta;
      copy.appendChild(meta);
    }

    var iconWrap = document.createElement("span");
    iconWrap.className = "link-button-icon";
    iconWrap.setAttribute("aria-hidden", "true");
    iconWrap.appendChild(createIcon(action.icon));

    anchor.appendChild(copy);
    anchor.appendChild(iconWrap);
    return anchor;
  }

  function renderTopBanner(banner) {
    var target = slot("top_banner");
    if (!target) return;
    clear(target);
    if (!banner) return;

    var aside = document.createElement("aside");
    aside.className = "campaign-banner";
    if (banner.campaignId) aside.setAttribute("data-blm-campaign-id", banner.campaignId);

    var label = document.createElement("strong");
    label.textContent = banner.label || "";
    aside.appendChild(label);

    if (banner.body) {
      var body = document.createElement("span");
      body.textContent = banner.body;
      aside.appendChild(body);
    }

    var href = safeUrl(banner.url);
    if (href) {
      var button = document.createElement("a");
      button.className = "banner-button";
      button.href = href;
      button.rel = "noreferrer";
      button.target = "_blank";
      button.textContent = "Open";
      applyDataset(button, banner.dataset);
      aside.appendChild(button);
    }

    target.appendChild(aside);
  }

  function renderActionSlot(name, action) {
    var target = slot(name);
    if (!target) return;
    clear(target);
    var node = createAction(action);
    if (node) target.appendChild(node);
  }

  function renderLinks(data) {
    var target = slot("links");
    if (!target) return;
    clear(target);

    var count = 0;
    var pinned = createAction(data.campaigns && data.campaigns.pinnedLinkButton);
    if (pinned) {
      target.appendChild(pinned);
      count += 1;
    }

    (data.links || []).forEach(function (item) {
      var node = createAction(item);
      if (!node) return;
      target.appendChild(node);
      count += 1;
    });

    if (count === 0) {
      var empty = document.createElement("p");
      empty.className = "links-empty";
      empty.textContent = "Links coming soon.";
      target.appendChild(empty);
    }
  }

  function renderSocial(data) {
    var target = slot("social");
    if (!target) return;
    clear(target);

    var count = 0;
    (data.social || []).forEach(function (item) {
      var node = createAction(item, "social");
      if (!node) return;
      target.appendChild(node);
      count += 1;
    });

    setHidden(target, count === 0);
  }

  function renderExtraActions(data) {
    var target = slot("extra_actions");
    if (!target) return;
    clear(target);

    var count = 0;
    (data.extraActions || []).forEach(function (item) {
      var node = createAction(item);
      if (!node) return;
      target.appendChild(node);
      count += 1;
    });

    setHidden(target, count === 0);
  }

  function renderFooterCopy(copy) {
    var target = slot("footer_copy");
    if (!target) return;
    clear(target);
    if (!copy) return;

    var wrap = document.createElement("div");
    wrap.className = "footer-copy";
    if (copy.campaignId) wrap.setAttribute("data-blm-campaign-id", copy.campaignId);

    var label = document.createElement("strong");
    label.textContent = copy.label || "";
    wrap.appendChild(label);

    if (copy.body) {
      var body = document.createElement("span");
      body.textContent = copy.body;
      wrap.appendChild(body);
    }

    target.appendChild(wrap);
  }

  function render(data) {
    data = data || {};
    data.campaigns = data.campaigns || {};
    renderTopBanner(data.campaigns.topBanner);
    renderActionSlot("bio_button", data.campaigns.bioButton);
    renderLinks(data);
    renderSocial(data);
    renderExtraActions(data);
    renderFooterCopy(data.campaigns.footerCopy);
  }

  onReady(function () {
    fetch(DATA_URL + "?t=" + Date.now(), { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("SITE_DATA_NOT_AVAILABLE");
        return response.json();
      })
      .then(render)
      .catch(function () {
        render({});
      });
  });
}());
