let products = [];
let currentFilters = {
  category: '',
  wattage: '',
  colorTemp: ''
};

$(document).ready(function () {
  // Load JSON
  $.getJSON("../data/lighting.json", function (data) {
    products = data;
    console.log("Products loaded:", products.length); // Check in console
    renderProducts(products);
    populateFilterOptions(products);
  }).fail(function() {
    console.error("Failed to load lighting.json. Check the path.");
  });

  // Search (model number)
  $("#search").on("keyup", function () {
    applyFilters();
  });

  // Category filter
  $("#categoryFilter").on("change", function () {
    currentFilters.category = $(this).val();
    applyFilters();
  });

  // Wattage filter
  $("#wattageFilter").on("change", function () {
    currentFilters.wattage = $(this).val();
    applyFilters();
  });

  // Colour temperature filter
  $("#colorTempFilter").on("change", function () {
    currentFilters.colorTemp = $(this).val();
    applyFilters();
  });
});

// Populate filter dropdowns with unique values from products
function populateFilterOptions(products) {
  const wattages = new Set();
  const colorTemps = new Set();

  products.forEach(p => {
    if (p.wattage) wattages.add(p.wattage);

    // Handle color_temp: it can be an array OR a string
    if (p.color_temp) {
      if (Array.isArray(p.color_temp)) {
        p.color_temp.forEach(ct => colorTemps.add(ct));
      } else {
        colorTemps.add(p.color_temp);
      }
    }
  });

  const wattageSelect = $("#wattageFilter");
  wattageSelect.empty().append('<option value="">All Wattages</option>');
  Array.from(wattages).sort().forEach(w => {
    wattageSelect.append(`<option value="${w}">${w}</option>`);
  });

  const colorTempSelect = $("#colorTempFilter");
  colorTempSelect.empty().append('<option value="">All Colour Temperatures</option>');
  Array.from(colorTemps).sort().forEach(ct => {
    colorTempSelect.append(`<option value="${ct}">${ct}</option>`);
  });
}

// Apply all filters and re-render
function applyFilters() {
  let filtered = [...products];

  // Search by model number
  const searchTerm = $("#search").val().toLowerCase();
  if (searchTerm) {
    filtered = filtered.filter(p => p.id.toLowerCase().includes(searchTerm));
  }

  // Category filter
  if (currentFilters.category) {
    filtered = filtered.filter(p => p.category === currentFilters.category);
  }

  // Wattage filter
  if (currentFilters.wattage) {
    filtered = filtered.filter(p => p.wattage === currentFilters.wattage);
  }

  // Colour temperature filter – handle both array and string
  if (currentFilters.colorTemp) {
    filtered = filtered.filter(p => {
      if (!p.color_temp) return false;
      if (Array.isArray(p.color_temp)) {
        return p.color_temp.includes(currentFilters.colorTemp);
      } else {
        return p.color_temp === currentFilters.colorTemp;
      }
    });
  }

  renderProducts(filtered);
}

// Render product grid with AOS attributes
function renderProducts(data) {
  let grid = $("#productGrid");
  grid.html("");

  if (data.length === 0) {
    grid.html('<div class="col-12 text-center"><p>No products found.</p></div>');
    return;
  }

  data.forEach(product => {
    grid.append(`
      <div class="col-md-4" data-aos="fade-up" data-aos-duration="600">
        <div class="product-card" onclick="openModal('${product.id}')">
          <img src="../${product.image}" alt="${product.id}" onerror="this.src='../assets/img/placeholder.jpg'">
          <h5>${product.id}</h5>
          <p>${product.short_desc}</p>
          <small>${product.wattage || ''}${product.lumens ? ' | ' + product.lumens : ''}</small>
        </div>
      </div>
    `);
  });

  if (typeof AOS !== 'undefined') {
    AOS.refresh();
  }
}

// Open modal and load product details dynamically
function openModal(id) {
  let product = products.find(p => p.id === id);
  if (!product) return;

  // Build colour temperature display – handle array or string
  let colorTempHtml = '';
  if (product.color_temp) {
    if (Array.isArray(product.color_temp)) {
      colorTempHtml = `<li><strong>Colour Temperature:</strong> ${product.color_temp.join(' / ')}</li>`;
    } else {
      colorTempHtml = `<li><strong>Colour Temperature:</strong> ${product.color_temp}</li>`;
    }
  }

  // Build features list if available
  let featuresHtml = '';
  if (product.features && product.features.length) {
    featuresHtml = `<h5>Features</h5><ul>${product.features.map(f => `<li>${f}</li>`).join('')}</ul>`;
  }

  // Build applications list if available
  let appsHtml = '';
  if (product.applications && product.applications.length) {
    appsHtml = `<h5>Applications</h5><ul>${product.applications.map(a => `<li>${a}</li>`).join('')}</ul>`;
  }

  $("#modalBody").html(`
    <h2>${product.id}</h2>
    <p class="text-muted">${product.series || product.category}</p>
    <img src="../${product.image}" alt="${product.id}" style="width:100%; max-width:400px;" onerror="this.src='../assets/img/placeholder.jpg'">
    <p>${product.description}</p>

    <h5>Specifications</h5>
    <ul>
      <li><strong>Wattage:</strong> ${product.wattage || 'N/A'}</li>
      <li><strong>Lumens:</strong> ${product.lumens || 'N/A'}</li>
      ${colorTempHtml}
      <li><strong>Dimensions:</strong> ${product.dimensions || 'N/A'}</li>
      <li><strong>Material:</strong> ${product.material || 'N/A'}</li>
      <li><strong>Voltage:</strong> ${product.voltage || '220-240V'}</li>
    </ul>

    ${featuresHtml}
    ${appsHtml}

    <button class="btn btn-glow mt-3" onclick="requestQuote('${product.id}')">Request Quote</button>
  `);

  $("#productModal").fadeIn(300);
}

// Close modal
$(".close-btn").click(function () {
  $("#productModal").fadeOut(300);
});
$(window).click(function (e) {
  if ($(e.target).is("#productModal")) {
    $("#productModal").fadeOut(300);
  }
});

// Quote action (opens email with product details)
function requestQuote(productId) {
  const subject = encodeURIComponent(`Quote Request: ${productId}`);
  const body = encodeURIComponent(`I would like to request a quote for product ${productId}. Please contact me with pricing and availability.`);
  window.location.href = `mailto:info@fanucci.co.za?subject=${subject}&body=${body}`;
}