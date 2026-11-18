(() => {
  const categories = { paper: '3D-бумага', cream: 'Крем-клей', molds: 'Молды', squishy: 'Сквиши' };
  const featured = ['mini', 'cream', 'turtles', 'chick'];
  const colors = { paper: '#fff0c7', cream: '#f9e2ec', molds: '#dff0ef', squishy: '#e9e4ff' };
  const sizes = { mini: 'Мини', midi: 'Миди', maxi: 'Макси' };
  const delivery = { pickup: { label: 'СДЭК · Пункт выдачи', price: 249 }, courier: { label: 'СДЭК · Курьер', price: 399 } };
  const pickupPoints = ['Москва, ул. Арбат, 6', 'Москва, ул. Тверская, 18', 'Москва, ул. Профсоюзная, 56'];
  const money = amount => new Intl.NumberFormat('ru-RU').format(amount) + ' ₽';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]);
  const products = () => window.products || [];
  const find = id => products().find(product => product.id === id);
  const root = () => document.querySelector('#app');
  const storage = {
    read(key, fallback) {
      try { return JSON.parse(localStorage.getItem('wowkids-demo-' + key)) ?? fallback; } catch { return fallback; }
    },
    write(key, value) {
      try { localStorage.setItem('wowkids-demo-' + key, JSON.stringify(value)); } catch {}
    }
  };
  let cart = storage.read('cart', {});
  let order = storage.read('order', null);
  let orderDestination = '';
  let sort = storage.read('sort', '');
  let checkout = { method: 'pickup', pay: 'card', point: '', name: '', phone: '', email: '', address: '' };

  const qty = id => Math.min(99, Math.max(0, Math.floor(Number(cart[id]) || 0)));
  const lines = () => products().filter(product => qty(product.id)).map(product => ({ product, quantity: qty(product.id) }));
  const subtotal = () => lines().reduce((total, {product, quantity}) => total + product.price * quantity, 0);
  window.updateCartBadge = () => {
    const count = lines().reduce((total, line) => total + line.quantity, 0);
    document.querySelectorAll('[data-cart-count]').forEach(badge => { badge.textContent = count; });
    return count;
  };
  function setQty(id, value) {
    if (value > 0) cart[id] = Math.min(99, value);
    else delete cart[id];
    storage.write('cart', cart);
    window.updateCartBadge();
  }

  function crumb(items) {
    return '<nav class="wk-crumb" aria-label="Путь по сайту"><a href="#/">Главная</a>' +
      items.map(([name, hash]) => '<span aria-hidden="true">›</span>' + (hash ? '<a href="#/' + hash + '">' + escape(name) + '</a>' : '<span aria-current="page">' + escape(name) + '</span>')).join('') + '</nav>';
  }
  function visual(product, klass = '') {
    const color = colors[product.cat] || '#fff0c7';
    return '<div class="wk-visual ' + klass + '" style="--wk-image-bg:' + color + '">' +
      (product.image ? '<img src="' + escape(product.image) + '" alt="' + escape(product.name) + '">' : '<span class="wk-image-fallback" aria-hidden="true">✦</span>') +
      '</div>';
  }
  function catalog(cat) {
    const orderBy = { asc: (a, b) => a.price - b.price, desc: (a, b) => b.price - a.price };
    const items = products().filter(product => !cat || product.cat === cat);
    if (orderBy[sort]) items.sort(orderBy[sort]);
    else if (!cat) {
      const rank = id => featured.includes(id) ? featured.indexOf(id) : featured.length;
      items.sort((a, b) => rank(a.id) - rank(b.id));
    }
    const tabs = [['', 'Все товары'], ...Object.entries(categories)].map(([key, title]) =>
      '<a href="#/catalog' + (key ? '/' + key : '') + '"' + (key === cat ? ' aria-current="page"' : '') + '>' + title + '</a>').join('');
    const noun = items.length % 100 >= 11 && items.length % 100 <= 14 ? 'товаров' : ({1:'товар',2:'товара',3:'товара',4:'товара'})[items.length % 10] || 'товаров';
    return crumb(cat ? [['Каталог', 'catalog'], [categories[cat]]] : [['Каталог']]) +
      '<h1>' + (cat ? categories[cat] : 'Каталог') + '</h1><nav class="wk-tabs" aria-label="Категории">' + tabs + '</nav>' +
      '<div class="wk-filterbar"><span>' + items.length + ' ' + noun + '</span><label><span class="wk-sr">Сортировка</span><select data-sort>' +
      '<option value="">По умолчанию</option><option value="asc"' + (sort === 'asc' ? ' selected' : '') + '>Сначала дешевле</option><option value="desc"' + (sort === 'desc' ? ' selected' : '') + '>Сначала дороже</option></select></label></div>' +
      (items.length ? '<div class="wk-products">' + items.map(product =>
        '<article class="wk-product-card"><a class="wk-product-link" href="#/product/' + escape(product.id) + '">' + visual(product) +
        '<h2>' + escape(product.name) + '</h2></a><p>' + escape(product.detail) + '</p><div class="wk-card-foot"><strong>' +
        money(product.price) + '</strong><a class="wk-button wk-button-secondary" href="#/product/' + escape(product.id) + '">Подробнее<span class="wk-sr"> о товаре ' + escape(product.name) + '</span></a></div></article>').join('') + '</div>' :
        '<div class="wk-empty"><p>В этой категории пока нет товаров.</p><a class="wk-button" href="#/catalog">Весь каталог</a></div>');
  }

  function productPage(product) {
    const isPaper = Boolean(sizes[product.id]);
    const variants = isPaper ? '<p class="wk-option-label">Размер набора</p><nav class="wk-tabs wk-variants" aria-label="Размер набора">' +
      Object.entries(sizes).filter(([id]) => find(id)).map(([id, label]) =>
        '<a href="#/product/' + id + '"' + (id === product.id ? ' aria-current="page"' : '') + '>' + label + '</a>').join('') + '</nav>' : '';
    const example = visual({ cat: product.cat, image: 'assets/action-' + product.cat + '.webp', name: 'Пример занятия · ' + categories[product.cat] }, 'wk-gallery-main');
    const composition = { cat: product.cat, image: 'assets/maxi-contents.webp', name: 'Комплектация набора Макси' };
    const gallery = '<div class="wk-gallery"><div data-slide="photo">' + visual(product, 'wk-gallery-main') + '</div>' +
      '<div data-slide="example" hidden>' + example + '</div>' +
      (product.id === 'maxi' ? '<div data-slide="composition" hidden>' + visual(composition, 'wk-gallery-main wk-fit') + '</div>' : '') +
      (isPaper ? '<div data-slide="demo" hidden><div class="wk-demo"><div class="wk-stage" aria-hidden="true"><span class="wk-droplet"></span><span class="wk-avocado"></span></div><span class="wk-demo-label">Плоская заготовка</span></div><div class="wk-demo-tools"><button type="button" class="wk-button wk-button-secondary" data-water>Капнуть водой</button><p data-demo-state role="status">Капля воды делает рисунок объёмным.</p></div></div>' : '') +
      '<div class="wk-gallery-controls" role="group" aria-label="Галерея товара"><button class="wk-thumbnail" type="button" data-gallery="photo" aria-pressed="true">' + visual({...product, name: ''}) + '<span>Товар</span></button>' +
      '<button class="wk-thumbnail" type="button" data-gallery="example" aria-pressed="false">' + visual({ cat: product.cat, image: 'assets/action-' + product.cat + '.webp', name: '' }) + '<span>Пример занятия</span></button>' +
      (product.id === 'maxi' ? '<button class="wk-thumbnail" type="button" data-gallery="composition" aria-pressed="false">' + visual({...composition, name: ''}, 'wk-fit') + '<span>Комплектация</span></button>' : '') +
      (isPaper ? '<button class="wk-thumbnail wk-thumbnail-water" type="button" data-gallery="demo" aria-pressed="false"><span aria-hidden="true">◈</span><span>Опыт с водой</span></button>' : '') + '</div></div>';
    return crumb([['Каталог', 'catalog'], [categories[product.cat] || 'Товары', categories[product.cat] ? 'catalog/' + product.cat : 'catalog'], [product.name]]) +
      '<div class="wk-detail">' + gallery + '<div class="wk-product-info"><h1>' + escape(product.name) + '</h1><p class="wk-detail-note">' + escape(product.detail) +
      '</p>' + variants + '<div class="wk-buy"><strong>' + money(product.price) + '</strong><button type="button" class="wk-button" data-add="' +
      escape(product.id) + '">В корзину</button></div><div class="wk-add-result" data-added role="status"></div>' +
      (product.description ? '<p class="wk-description">' + escape(product.description) + '</p>' : '') +
      (product.contents?.length ? '<div class="wk-contents"><h2>Что внутри</h2>' + (product.id === 'maxi' ? '<p>32 заготовки</p>' : '') + '<ul>' + product.contents.map(item => '<li>' + escape(item) + '</li>').join('') + '</ul></div>' : '') +
      (isPaper ? '<details class="wk-compare"><summary>Сравнить размеры</summary><dl>' + Object.entries(sizes).filter(([id]) => find(id)).map(([id, label]) =>
        '<div><dt><a href="#/product/' + id + '">' + label + '</a></dt><dd>' + (id === 'maxi' ? '32 заготовки, в том числе ' : '') + escape(find(id).detail) + '</dd></div>').join('') + '</dl></details>' : '') +
      '</div></div>';
  }

  function emptyCart() {
    return '<div class="wk-empty"><h2>В корзине пока пусто</h2><p>Выберите набор в каталоге.</p><a class="wk-button" href="#/catalog">Открыть каталог</a></div>';
  }
  function summary(shipping) {
    return '<div class="wk-totals"><div><span>Товары</span><span>' + money(subtotal()) + '</span></div>' +
      '<div><span>Доставка</span><span data-shipping>' + (shipping === undefined ? 'При оформлении' : money(shipping)) + '</span></div>' +
      '<div class="wk-total"><strong>' + (shipping === undefined ? 'Всего за товары' : 'К оплате') + '</strong><strong data-total>' + money(subtotal() + (shipping || 0)) + '</strong></div></div>';
  }
  function cartPage() {
    return crumb([['Корзина']]) + '<h1>Корзина</h1>' + (lines().length ? '<div class="wk-order-layout"><div class="wk-cart-lines">' +
      lines().map(({ product, quantity }) => '<article class="wk-cart-item">' + visual(product) + '<div class="wk-cart-product"><a href="#/product/' + escape(product.id) + '">' +
      escape(product.name) + '</a><span>' + money(product.price) + ' за шт.</span><button type="button" class="wk-text-button" data-cart-action="remove" data-id="' + escape(product.id) + '" aria-label="Удалить ' +
      escape(product.name) + '">Удалить</button></div><div class="wk-stepper" role="group" aria-label="Количество · ' + escape(product.name) + '">' +
      '<button type="button" data-cart-action="minus" data-id="' + escape(product.id) + '" aria-label="Уменьшить количество">−</button><output>' + quantity +
      '</output><button type="button" data-cart-action="plus" data-id="' + escape(product.id) + '" aria-label="Увеличить количество"' + (quantity === 99 ? ' disabled' : '') + '>+</button></div><strong class="wk-line-price">' + money(product.price * quantity) + '</strong></article>').join('') +
      '<a class="wk-return" href="#/catalog">← Продолжить покупки</a></div><aside class="wk-summary"><h2>Ваш заказ</h2>' + summary() +
      '<a class="wk-button" href="#/checkout">Оформить заказ</a></aside></div>' : emptyCart());
  }
  function field(name, label, options = '') {
    return '<label class="wk-field"><span>' + label + '</span><input name="' + name + '" value="' + escape(checkout[name]) + '" ' + options + ' required></label>';
  }
  function radio(name, value, label) {
    return '<label class="wk-radio"><input type="radio" name="' + name + '" value="' + value + '"' + (checkout[name] === value ? ' checked' : '') + '><span>' + label + '</span></label>';
  }
  function checkoutPage() {
    const shipping = delivery[checkout.method].price;
    return crumb([['Корзина', 'cart'], ['Оформление заказа']]) + '<h1>Оформление заказа</h1>' + (lines().length ?
      '<form class="wk-order-layout" data-checkout><div class="wk-checkout-fields"><div class="wk-form-intro"><p>Демонстрационный заказ. Можно заполнить примером.</p>' +
      '<button class="wk-text-button" type="button" data-fill>Подставить тестовые данные</button></div><fieldset class="wk-fieldset"><legend>Контакты</legend><div class="wk-fields-grid">' +
      field('name', 'Имя и фамилия', 'autocomplete="name"') + field('phone', 'Телефон', String.raw`type="tel" autocomplete="tel" pattern="[+0-9\s\(\)\-]{10,20}" placeholder="+7 900 000-00-00"`) +
      field('email', 'Электронная почта', 'type="email" autocomplete="email"') + '</div></fieldset><fieldset class="wk-fieldset"><legend>Доставка</legend>' +
      '<div class="wk-choices">' + Object.entries(delivery).map(([id, method]) => radio('method', id, method.label + ' · ' + money(method.price))).join('') +
      '</div><label class="wk-field" data-point' + (checkout.method !== 'pickup' ? ' hidden' : '') + '><span>Пункт выдачи</span><select name="point"' + (checkout.method === 'pickup' ? ' required' : ' disabled') +
      '><option value="">Выберите пункт</option>' + pickupPoints.map(point => '<option' + (checkout.point === point ? ' selected' : '') + '>' + point + '</option>').join('') +
      '</select></label><div data-address' + (checkout.method !== 'courier' ? ' hidden' : '') + '>' + field('address', 'Город, улица, дом и квартира', 'autocomplete="street-address"' +
      (checkout.method === 'courier' ? '' : ' disabled')) + '</div></fieldset><fieldset class="wk-fieldset"><legend>Оплата</legend><div class="wk-choices">' +
      radio('pay', 'card', 'Банковская карта') + radio('pay', 'sbp', 'СБП') + '</div></fieldset></div><aside class="wk-summary"><h2>Ваш заказ</h2><ul class="wk-summary-items">' +
      lines().map(({product, quantity}) => '<li><span>' + escape(product.name) + ' × ' + quantity + '</span><span>' + money(product.price * quantity) + '</span></li>').join('') +
      '</ul>' + summary(shipping) + '<button class="wk-button" type="submit">Подтвердить демо-заказ</button><p class="wk-summary-note">Списания не будет.</p></aside></form>' : emptyCart());
  }

  function success() {
    return crumb([['Подтверждение']]) + (order ? '<div class="wk-empty wk-confirmation"><span class="wk-confirmation-mark" aria-hidden="true">✓</span><h1>Демо-заказ оформлен</h1><p>Заказ № ' +
      escape(order.number) + ' · ' + money(order.total) + '</p><p>' + escape(order.delivery) + ' · ' + escape(order.payment) + '</p>' +
      (orderDestination ? '<p>' + escape(orderDestination) + '</p>' : '') +
      (order.items?.length ? '<ul class="wk-summary-items">' + order.items.map(item => '<li><span>' + escape(item.name) + ' × ' + item.quantity + '</span><span>' + money(item.price) + '</span></li>').join('') + '</ul>' : '') +
      '<a class="wk-button" href="#/catalog">Вернуться в каталог</a></div>' :
      '<div class="wk-empty"><h1>Заказ не найден</h1><a class="wk-button" href="#/catalog">В каталог</a></div>');
  }

  function missing() {
    return crumb([['Страница не найдена']]) + '<div class="wk-empty"><h1>Страница не найдена</h1><a class="wk-button" href="#/catalog">В каталог</a></div>';
  }
  window.renderShop = path => {
    const [page, key, extra] = path.replace(/^#?\/?|\/$/g, '').split('/');
    let content;
    if (page === 'catalog' && !extra && (!key || categories[key])) content = catalog(key || '');
    else if (page === 'product' && key && !extra && find(key)) content = productPage(find(key));
    else if (!key && page === 'cart') content = cartPage();
    else if (!key && page === 'checkout') content = checkoutPage();
    else if (!key && page === 'success') content = success();
    else content = missing();
    root().innerHTML = '<section class="wk-shop">' + content + '</section>';
    window.updateCartBadge();
  };

  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || !button.closest('.wk-shop')) return;
    const { add, cartAction, id, gallery } = button.dataset;
    if (add && find(add)) {
      setQty(add, qty(add) + 1);
      root().querySelector('[data-added]').innerHTML = 'Добавлено. В корзине ' + qty(add) + ' шт. <a href="#/cart">Открыть корзину →</a>';
    }
    if (cartAction && find(id)) {
      setQty(id, cartAction === 'remove' ? 0 : qty(id) + (cartAction === 'plus' ? 1 : -1));
      window.renderShop('cart');
      const candidates = [...root().querySelectorAll('[data-cart-action]')];
      (candidates.find(candidate => candidate.dataset.id === id && candidate.dataset.cartAction === cartAction && !candidate.disabled)
        || candidates.find(candidate => candidate.dataset.id === id && !candidate.disabled)
        || candidates[0] || root().querySelector('.wk-button'))?.focus();
    }
    if (gallery) {
      root().querySelectorAll('[data-gallery]').forEach(tab => tab.setAttribute('aria-pressed', String(tab === button)));
      root().querySelectorAll('[data-slide]').forEach(slide => { slide.hidden = slide.dataset.slide !== gallery; });
    }
    if ('water' in button.dataset) {
      const demo = root().querySelector('.wk-demo');
      const wet = demo.classList.toggle('wk-wet');
      button.textContent = wet ? 'Повторить с начала' : 'Капнуть водой';
      root().querySelector('.wk-demo-label').textContent = wet ? 'Объёмный рисунок' : 'Плоская заготовка';
      root().querySelector('[data-demo-state]').textContent = wet ? 'Рисунок приподнялся. Это схематический показ эффекта.' : 'Капля воды делает рисунок объёмным.';
    }
    if ('fill' in button.dataset) {
      const form = button.closest('form');
      const sample = { name: 'Анна Иванова', phone: '+7 900 000-00-00', email: 'demo@example.com', point: pickupPoints[0], address: 'Москва, ул. Арбат, 6, кв. 12' };
      for (const [name, value] of Object.entries(sample)) {
        checkout[name] = value;
        form.elements.namedItem(name).value = value;
      }
    }
  });
  document.addEventListener('change', event => {
    const input = event.target;
    if (input.matches('.wk-shop [data-sort]')) {
      sort = input.value;
      storage.write('sort', sort);
      window.renderShop(location.hash);
      root().querySelector('[data-sort]').focus();
    }
    const form = input.closest('[data-checkout]');
    if (!form) return;
    checkout[input.name] = input.value;
    if (input.name !== 'method') return;
    const pickup = checkout.method === 'pickup';
    form.querySelector('[data-point]').hidden = !pickup;
    form.querySelector('[data-address]').hidden = pickup;
    form.elements.point.disabled = !pickup;
    form.elements.point.required = pickup;
    form.elements.address.disabled = pickup;
    const shipping = delivery[checkout.method].price;
    form.querySelector('[data-shipping]').textContent = money(shipping);
    form.querySelector('[data-total]').textContent = money(subtotal() + shipping);
  });
  document.addEventListener('submit', event => {
    const form = event.target;
    if (!form.matches('[data-checkout]')) return;
    event.preventDefault();
    if (!lines().length) return;
    const values = new FormData(form);
    const method = delivery[values.get('method')];
    orderDestination = values.get(values.get('method') === 'pickup' ? 'point' : 'address');
    order = {
      number: String(Date.now()).slice(-7),
      total: subtotal() + method.price,
      delivery: method.label,
      payment: values.get('pay') === 'card' ? 'Банковская карта' : 'СБП',
      items: lines().map(({ product, quantity }) => ({ name: product.name, quantity, price: product.price * quantity }))
    };
    storage.write('order', order);
    cart = {};
    storage.write('cart', cart);
    window.updateCartBadge();
    checkout = { method: 'pickup', pay: 'card', point: '', name: '', phone: '', email: '', address: '' };
    location.hash = '/success';
  });
})();

