const app = document.getElementById("app");
const catalogMenu = document.getElementById("nav-catalog");
const categories = [
  {
    id: "paper",
    title: "3D-бумага",
    action: "Рисовать",
    color: "#d5eefa",
    product: "mini",
  },
  {
    id: "cream",
    title: "Крем-клей",
    action: "Украшать",
    color: "#ffded2",
    product: "cream",
  },
  {
    id: "molds",
    title: "Молды",
    action: "Отливать",
    color: "#d0ece0",
    product: "turtles",
  },
  {
    id: "squishy",
    title: "Сквиши",
    action: "Мять",
    color: "#fff0bd",
    product: "chick",
  },
];
const categoryLink = (c) => "#/catalog/" + c.id;
const amount = (p) => p.toLocaleString("ru-RU") + " ₽";
document.getElementById("nav-links").innerHTML =
  '<a href="#/catalog">Все товары</a>' +
  categories
    .map((c) => `<a href="${categoryLink(c)}">${c.title}</a>`)
    .join("") +
  '<a class="mobile-extra" href="#/activities">Чем заняться</a><a class="mobile-extra" href="#/about">О WowKids</a>';
document.addEventListener("click", (e) => {
  if (!catalogMenu.contains(e.target) || e.target.closest("a"))
    catalogMenu.open = false;
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && catalogMenu.open) {
    catalogMenu.open = false;
    catalogMenu.querySelector("summary").focus();
  }
});
function switcher(b) {
  return `<nav class="version" aria-label="Сравнить концепции главной"><span>Главная</span><a href="#/" aria-label="Главная А" ${b ? "" : 'aria-current="page"'}>А</a><a href="#/b" aria-label="Главная Б" ${b ? 'aria-current="page"' : ""}>Б</a></nav>`;
}
function heroA() {
  return `<section class="table-hero">
    <div class="hero-copy"><h1>Творчество <span class="hero-bridge">на кончиках</span> <em class="word-sticker">пальцев</em></h1>
    <p>Наборы и материалы для тех, кто любит<br class="wide-only"> создавать своими руками.</p>
    <a class="wk-button" href="#/catalog">Смотреть все товары <b aria-hidden="true">↗</b></a></div>
    <div class="table-photo"><img fetchpriority="high" src="assets/table.webp" alt="Объёмный тост из губки, крем-клей, молд с мишкой и мягкий сквиш на столе">
    ${categories.map((c) => `<a class="hot hot-${c.id}" href="${categoryLink(c)}"><i aria-hidden="true">+</i>${c.title}</a>`).join("")}</div>
    ${switcher(false)}</section>`;
}
function activityCards(large = false) {
  return `<div class="activity-grid ${large ? "large" : ""}">${categories
    .map(
      (
        c,
      ) => `<a href="${categoryLink(c)}" class="activity-card" style="--panel:${c.color}">
    <img src="assets/action-${c.id}.webp" alt="" ${large ? "" : 'loading="lazy"'}>
    <div class="activity-caption"><div><small>${c.title}</small><strong>${c.action}</strong></div><span aria-hidden="true">↗</span></div></a>`,
    )
    .join("")}</div>`;
}
function collection() {
  return `<section class="wk-section"><div class="section-title"><h2>На полке WowKids</h2><a class="text-link" href="#/catalog">В каталог ↗</a></div><div class="picks">${[
    "mini",
    "cream",
    "turtles",
    "chick",
  ]
    .map((id) => {
      const p = window.products.find((x) => x.id === id);
      return `<a href="#/product/${id}" class="pick"><div class="pick-img"><img loading="lazy" src="${p.image}" alt=""></div><small>${categories.find((c) => c.id === p.cat).title}</small><h3>${p.name}</h3><span>${p.detail}</span><strong>${amount(p.price)}</strong></a>`;
    })
    .join("")}</div></section>`;
}
function activities() {
  return `<section class="wk-section"><div class="section-title"><h2>Чем займёмся?</h2></div>${activityCards()}</section>`;
}
function home(b) {
  const heroB = `<section class="action-hero"><div class="action-title"><h1>Что попробуем <em class="word-sticker">сегодня?</em></h1>${switcher(true)}</div>${activityCards(true)}</section>`;
  app.innerHTML = `<div class="home-wrap">${b ? heroB : heroA()}${b ? "" : activities()}${collection()}</div>`;
}
function render() {
  const path = location.hash.replace(/^#\/?/, "").replace(/\/$/, "");
  catalogMenu.open = false;
  document.title = "WowKids — магазин творчества";
  if (!path || path === "b") home(path === "b");
  else if (path === "activities")
    app.innerHTML = `<div class="home-wrap inner-wrap"><h1>Чем займёмся?</h1>${activityCards(true)}</div>`;
  else if (path === "about")
    app.innerHTML = `<div class="home-wrap"><section class="about-wk"><div><h1>О WowKids</h1><p>В WowKids собраны вещи для творчества и игры. На 3D-бумаге можно нарисовать объёмный тост, крем-клеем — украсить шкатулку, а в силиконовой форме — отлить фигурку.</p><a class="wk-button" href="#/catalog">Выбрать занятие ↗</a></div><img src="assets/action-paper.webp" alt="Рисование на круглой заготовке"></section></div>`;
  else window.renderShop(path);
  const heading = app.querySelector("h1")?.textContent?.trim();
  if (path && heading) document.title = heading + " — WowKids";
  window.updateCartBadge?.();
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", render);
render();
