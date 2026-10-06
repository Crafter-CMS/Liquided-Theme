(function () {
  var GAMES = {
    minecraft: 'Minecraft',
    fivem: 'FiveM',
    rust: 'Rust',
    gmod: "Garry's Mod",
    cs2: 'CS2',
    ark: 'ARK',
    dayz: 'DayZ',
    empyrion: 'Empyrion',
    mtasa: 'MTA:SA',
    samp: 'SA-MP',
    forest: 'The Forest',
    unturned: 'Unturned',
    valheim: 'Valheim'
  };

  var TYPES = Object.assign({
    in_game: 'Oyuna teslim',
    digital: 'Dijital kod',
    downloadable: 'İndirilebilir'
  }, window.CRAFTER_TYPE_LABELS || {});

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function productType(product) {
    return product && product.type ? product.type : 'in_game';
  }

  function typeLabel(type) {
    return TYPES[type] || TYPES.in_game;
  }

  function gameLabel(game) {
    return GAMES[game] || GAMES.minecraft;
  }

  function salePrice(product) {
    var price = Number(product.price) || 0;
    var discount = Number(product.discountValue) || 0;
    if (discount <= 0) return price;
    if (product.discountType === 'percentage') return Math.max(0, price - (price * discount) / 100);
    return Math.max(0, price - discount);
  }

  function productImage(product) {
    if (product.images && product.images.length) return product.images[0];
    return product.image || '';
  }

  function productHref(product) {
    var slug = product.slug || product.id;
    var category = product.categorySlug || product.category_slug;
    var server = product.serverSlug || product.server_slug;
    if (!slug) return '/store';
    if (server && category) {
      return '/store/' + encodeURIComponent(server) + '/' + encodeURIComponent(category) + '/' + encodeURIComponent(slug);
    }
    if (category) {
      return '/store/shop/' + encodeURIComponent(category) + '/' + encodeURIComponent(slug);
    }
    return '/store';
  }

  function inStock(product) {
    if (product.available === false) return false;
    var type = productType(product);
    var stock = product.stock;
    if (type === 'in_game') return true;
    if (stock == null || stock < 0) return true;
    return Number(stock) > 0;
  }

  function deliveryText(product) {
    var type = productType(product);
    if (type === 'digital') return 'Kod, giriş yapmış sahibinin lisans listesinde görünür.';
    if (type === 'downloadable') {
      return product.hasFile ? 'Dosya satın alınca lisanstan indirilir.' : 'Bu ürüne henüz dosya eklenmemiş.';
    }
    var servers = product.serverIds || [];
    if (servers.length > 1) return servers.length + ' sunucuya teslim edilir.';
    return typeLabel('in_game') + '.';
  }

  function money(value) {
    return (Number(value) || 0).toFixed(2) + ' ₺';
  }

  function snapshot(product, quantity) {
    return {
      id: product.id || product._id,
      name: product.name || 'Ürün',
      price: Number(product.price) || 0,
      image: productImage(product),
      quantity: quantity || 1,
      type: productType(product),
      discountType: product.discountType || null,
      discountValue: Number(product.discountValue) || 0,
      slug: product.slug || '',
      serverSlug: product.serverSlug || product.server_slug || '',
      categorySlug: product.categorySlug || product.category_slug || '',
      hasFile: !!product.hasFile
    };
  }

  function card(product) {
    var type = productType(product);
    var price = Number(product.price) || 0;
    var current = salePrice(product);
    var image = productImage(product);
    var href = productHref(product);
    var soldOut = !inStock(product);
    var priceHtml = current < price
      ? '<span class="text-sm text-gray-400 line-through">' + money(price) + '</span><span class="text-lg font-black text-primary">' + money(current) + '</span>'
      : '<span class="text-lg font-black text-primary">' + money(price) + '</span>';
    var media = image
      ? '<img src="' + esc(image) + '" alt="' + esc(product.name) + '" class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500">'
      : '<div class="w-16 h-16 rounded-2xl bg-gray-100"></div>';
    return (
      '<article class="group bg-white border border-gray-100 rounded-3xl p-4 flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">' +
        '<a href="' + esc(href) + '" class="relative block aspect-square rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden mb-4">' +
          '<span class="absolute top-3 left-3 z-10 text-[10px] font-black uppercase tracking-widest bg-white/95 text-gray-900 rounded-full px-2.5 py-1">' + esc(typeLabel(type)) + '</span>' +
          '<span class="flex items-center justify-center w-full h-full p-6">' + media + '</span>' +
        '</a>' +
        '<a href="' + esc(href) + '" class="font-black text-gray-900 leading-tight line-clamp-2 hover:text-primary">' + esc(product.name) + '</a>' +
        '<p class="text-xs text-gray-500 mt-2 min-h-[2rem]">' + esc(deliveryText(product)) + '</p>' +
        '<div class="mt-auto pt-4 flex items-end justify-between gap-3">' +
          '<div class="flex flex-col">' + priceHtml + '</div>' +
          (soldOut
            ? '<span class="text-xs font-bold text-gray-400">Tükendi</span>'
            : '<button type="button" class="store-add text-sm font-bold bg-gray-900 text-white rounded-xl px-3 py-2" data-id="' + esc(product.id) + '">Sepete ekle</button>') +
        '</div>' +
      '</article>'
    );
  }

  function bindAddButtons(root, products) {
    var byId = {};
    products.forEach(function (product) { byId[product.id] = product; });
    root.querySelectorAll('.store-add').forEach(function (button) {
      button.addEventListener('click', function () {
        var product = byId[button.getAttribute('data-id')];
        if (product && window.addToCart) window.addToCart(snapshot(product), 1);
      });
    });
  }

  function selectedValues(form, name) {
    return Array.prototype.map.call(form.querySelectorAll('input[name="' + name + '"]:checked'), function (input) {
      return input.value;
    });
  }

  function renderFilterGroup(group) {
    if (!group || group.id === 'price' || group.id === 'available' || group.id === 'type') return '';
    var values = group.values || [];
    if (!values.length) return '';
    var chips = values.map(function (item) {
      return '<label class="filter-chip">' +
        '<input type="checkbox" name="' + esc(group.id) + '" value="' + esc(item.id) + '">' +
        '<span>' + esc(item.label) + '<em>' + esc(item.count) + '</em></span></label>';
    }).join('');
    return '<section class="pt-5 mt-5 border-t border-gray-100">' +
      '<h3 class="text-sm font-black text-gray-900 mb-3">' + esc(group.label || group.id) + '</h3>' +
      '<div class="flex flex-wrap gap-2">' + chips + '</div></section>';
  }

  var knownTypes = null;

  function typesIn(products) {
    var seen = {};
    products.forEach(function (product) { seen[productType(product)] = true; });
    return ['in_game', 'digital', 'downloadable'].filter(function (type) { return seen[type]; });
  }

  function paintTypeRow(types) {
    var row = document.getElementById('store-type-row');
    if (!row || row.getAttribute('data-ready') === 'true') return;
    if (!types || !types.length) {
      row.className = 'hidden';
      row.innerHTML = '';
      return;
    }
    row.setAttribute('data-ready', 'true');
    row.className = 'flex flex-wrap gap-2';
    var all = types.length > 1
      ? '<button type="button" data-store-type="" class="bg-gray-900 text-white text-sm font-bold rounded-full px-4 py-2">Tümü</button>'
      : '';
    row.innerHTML = all + types.map(function (type) {
      var alone = types.length === 1;
      var selected = alone ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-gray-200';
      return '<button type="button" data-store-type="' + esc(type) + '" class="' + selected + ' text-sm font-bold rounded-full px-4 py-2">' + esc(typeLabel(type)) + '</button>';
    }).join('');
  }

  function lockedCategory(options) {
    if (!options) return [];
    return [options.category, options.categorySlug].filter(Boolean);
  }

  function inCategory(product, locked) {
    if (!locked.length) return true;
    var values = [product.category, product.categoryId, product.category_id, product.categorySlug, product.category_slug].filter(Boolean);
    return locked.some(function (value) { return values.indexOf(value) !== -1; });
  }

  async function mountCatalog(options) {
    var grid = document.getElementById('store-grid');
    var form = document.getElementById('store-filter-form');
    if (!grid || !window.crafter || !window.crafter.store) return;
    var price = { min: '', max: '' };
    var requestId = 0;
    try {
      var payload = await window.crafter.store.getFilters();
      var groups = payload.filters || (payload.data && payload.data.filters) || [];
      var priceGroup = groups.filter(function (group) { return group.id === 'price'; })[0] || {};
      price = priceGroup;
      if (form) {
        var filterHost = form.querySelector('[data-filter-groups]');
        if (filterHost) {
          filterHost.innerHTML = groups.filter(function (group) {
            return !(lockedCategory(options).length && group.id === 'category');
          }).map(renderFilterGroup).join('');
        }
        var min = form.querySelector('[name="priceMin"]');
        var max = form.querySelector('[name="priceMax"]');
        if (min && price.min != null) min.placeholder = String(price.min);
        if (max && price.max != null) max.placeholder = String(price.max);
      }
    } catch (error) {}

    async function load() {
      var current = ++requestId;
      if (grid.querySelector('article')) grid.classList.add('is-refreshing');
      var filter = {};
      if (form) {
        ['type', 'server', 'category', 'tag'].forEach(function (key) {
          var values = selectedValues(form, key);
          if (values.length) filter[key] = values;
        });
        if (form.available && form.available.checked) filter.available = true;
        if (form.q && form.q.value.trim()) filter.q = form.q.value.trim();
        if (form.priceMin && form.priceMin.value !== '') filter.priceMin = Number(form.priceMin.value);
        if (form.priceMax && form.priceMax.value !== '') filter.priceMax = Number(form.priceMax.value);
      }
      if (!filter.type && options && options.type) filter.type = options.type;
      var locked = lockedCategory(options);
      if (locked.length) filter.category = locked;
      try {
        var products = await window.crafter.store.getProducts(filter);
        if (current !== requestId) return;
        products = Array.isArray(products) ? products : (products && products.data) || [];
        products = products.filter(function (product) { return inCategory(product, locked); });
        if (!knownTypes && !filter.type) knownTypes = typesIn(products);
        paintTypeRow(knownTypes || typesIn(products));
        grid.classList.remove('is-refreshing');
        grid.innerHTML = products.length
          ? products.map(card).join('')
          : '<div class="col-span-full bg-white border border-gray-100 rounded-3xl p-12 text-center"><h2 class="text-xl font-black text-gray-900">Bu süzgeçte ürün yok</h2><p class="text-gray-500 mt-2">Farklı bir tür veya sunucu deneyin.</p></div>';
        bindAddButtons(grid, products);
      } catch (error) {
        if (current !== requestId) return;
        grid.classList.remove('is-refreshing');
        grid.innerHTML = '<div class="col-span-full text-sm font-bold text-red-500">Katalog yüklenemedi.</div>';
      }
    }

    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        load();
      });
      form.addEventListener('change', load);
      form.addEventListener('reset', function () {
        setTimeout(load, 0);
      });
    }
    var search = document.getElementById('store-search');
    if (search) {
      var timer;
      search.addEventListener('input', function () {
        if (form && form.q) form.q.value = search.value;
        clearTimeout(timer);
        timer = setTimeout(load, 250);
      });
    }
    var typeRow = document.getElementById('store-type-row');
    if (typeRow) {
      typeRow.addEventListener('click', function (event) {
        var button = event.target.closest('[data-store-type]');
        if (!button || !typeRow.contains(button)) return;
        typeRow.querySelectorAll('[data-store-type]').forEach(function (item) {
          item.classList.remove('bg-gray-900', 'text-white');
          item.classList.add('bg-white', 'text-gray-700', 'border', 'border-gray-200');
        });
        button.classList.add('bg-gray-900', 'text-white');
        button.classList.remove('bg-white', 'text-gray-700', 'border', 'border-gray-200');
        var value = button.getAttribute('data-store-type');
        options = Object.assign({}, options, { type: value || undefined });
        if (!value) delete options.type;
        load();
      });
    }
    load();
  }

  async function purchaseItems(items, coupon) {
    return window.crafter.cart.purchase({
      items: items,
      coupon: coupon || undefined
    });
  }

  function goToCardCheckout(product, qty, signedIn) {
    if (product && window.addToCart) window.addToCart(snapshot(product, qty), qty);
    var target = '/checkout?purpose=cart';
    if (!signedIn) {
      window.location.href = '/auth/sign-in?return=' + encodeURIComponent(target);
      return;
    }
    window.location.href = target;
  }

  function bindProduct(product, options) {
    var qtyInput = document.getElementById('buy-qty');
    function quantity() {
      var qty = parseInt(qtyInput && qtyInput.value, 10);
      return qty > 0 ? qty : 1;
    }
    var add = document.getElementById('buy-add');
    if (add) {
      add.addEventListener('click', function () {
        window.addToCart(snapshot(product, quantity()), quantity());
      });
    }
    var balance = document.getElementById('buy-balance');
    if (balance) {
      balance.addEventListener('click', async function () {
        if (!options.signedIn) {
          window.location.href = '/auth/sign-in?return=' + encodeURIComponent(window.location.pathname);
          return;
        }
        balance.disabled = true;
        try {
          await purchaseItems([{ productId: product.id, quantity: quantity() }]);
          window.showToast && window.showToast('Satın alma tamamlandı.', 'success');
          window.location.href = productType(product) === 'in_game' ? '/chest' : '/licenses';
        } catch (error) {
          window.showToast && window.showToast(error.message || 'Satın alma tamamlanamadı.', 'error');
          balance.disabled = false;
        }
      });
    }
    var cardButton = document.getElementById('buy-card');
    if (cardButton) {
      cardButton.addEventListener('click', function () {
        goToCardCheckout(product, quantity(), options.signedIn);
      });
    }
  }

  window.CrafterStore = {
    productType: productType,
    typeLabel: typeLabel,
    gameLabel: gameLabel,
    salePrice: salePrice,
    productHref: productHref,
    deliveryText: deliveryText,
    snapshot: snapshot,
    card: card,
    mountCatalog: mountCatalog,
    purchaseItems: purchaseItems,
    goToCardCheckout: goToCardCheckout,
    bindProduct: bindProduct,
    esc: esc
  };
})();
