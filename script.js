const categories = {
  premium: {name: "Premium", price: 60},
  standard: {name: "Standard", price: 45},
  economy: {name: "Economy", price: 30},
};

const sections = [
  { id: "left",    name: "Left Side", category: "side",      rows: 10, seats: 8,  price: categories.standard.price },
  { id: "center",  name: "Orchestra", category: "orchestra", rows: 15, seats: 10, price: categories.premium.price },
  { id: "right",   name: "Right Side", category: "side",     rows: 10, seats: 8,  price: categories.standard.price },
  { id: "balcony", name: "Balcony",   category: "balcony",   rows: 5, seats: 20, price: categories.economy.price },
];

// zoneId-row-seat
const unavailable = new Set(["center-1-4", "center-1-5", "center-2-7", "left-3-2", "balcony-2-9"]); 

const STORAGE_KEY = "theatre-cart";

const state = {
  inspected: null,
  cart: [],
  scale: 1,   // zoom level
  x: 0,       // pan offsets in px
  y: 0,
};

/* ---------- Venue Generation ---------- */

function buildVenue() {
  sections.forEach(sec => {
    const zone = document.querySelector(`#zone-${sec.id}`);
    zone.classList.add(`cat-${sec.category}`);
    zone.style.setProperty("--cols", sec.seats);

    for (let r = 1; r <= sec.rows; r++) {
      for (let s = 1; s <= sec.seats; s++) {
        const seat = document.createElement("button");
        seat.type = "button";
        seat.className = "seat";
        seat.dataset.id = `${sec.id}-${r}-${s}`;
        if (unavailable.has(seat.dataset.id)) seat.disabled = true;
        seat.setAttribute("aria-label", `${sec.name}, row ${r}, seat ${s}, $${sec.price}`);
        zone.append(seat);
      }
    }
  });
}

/* ---------- Helpers ---------- */

function parseSeat(id) {
  const [zoneId, row, seat] = id.split("-");
  const section = sections.find(sec => sec.id === zoneId);
  return { section, row: Number(row), seat: Number(seat) };
}

function isRealSeat(id) {
  if (typeof id !== "string") return false;
  const { section, row, seat } = parseSeat(id);
  return Boolean(section) &&
    Number.isInteger(row) && row >= 1 && row <= section.rows &&
    Number.isInteger(seat) && seat >= 1 && seat <= section.seats;
}

function saveCart() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart));
  } catch (err) {
    console.warn("Could not save the cart:", err);
  }
}
 
function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(saved)) { state.cart = []; return; }
    state.cart = [...new Set(saved)].filter(id => isRealSeat(id) && !unavailable.has(id));
    saveCart();
  } catch (err) {
    state.cart = [];
  }
}
 
function addToCart() {
  const id = state.inspected;
  if (!id || unavailable.has(id) || state.cart.includes(id)) return;
  state.cart.push(id);
  saveCart();
  render();
}
 
function removeFromCart(id) {
  state.cart = state.cart.filter(item => item !== id);
  saveCart();
  render();
}
 
function clearCart() {
  state.cart = [];
  saveCart();
  render();
}


 
const ZOOM_STEP = 0.2;
const MIN_SCALE = 0.25;
const MAX_SCALE = 2.5;
const PAN_STEP = 80;
const KEEP_VISIBLE = 120;
const WHEEL_STEP = 0.1;
 
const viewport = document.querySelector("#viewport");
const map = document.querySelector("#map");
const zoomInBtn = document.querySelector("#zoomIn");
const zoomOutBtn = document.querySelector("#zoomOut");

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
 
function clampPan() {
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  const mw = map.offsetWidth * state.scale;
  const mh = map.offsetHeight * state.scale;
  state.x = clamp(state.x, KEEP_VISIBLE - mw, vw - KEEP_VISIBLE);
  state.y = clamp(state.y, KEEP_VISIBLE - mh, vh - KEEP_VISIBLE);
}
 
function applyView() {
  clampPan();
  map.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scale})`;
  zoomInBtn.disabled = state.scale >= MAX_SCALE;
  zoomOutBtn.disabled = state.scale <= MIN_SCALE;
}
 
function zoomAt(cx, cy, delta) {
  const next = clamp(+(state.scale + delta).toFixed(2), MIN_SCALE, MAX_SCALE);
  const ratio = next / state.scale;
  state.x = cx - (cx - state.x) * ratio;
  state.y = cy - (cy - state.y) * ratio;
  state.scale = next;
  applyView();
}

function zoomBy(delta) {
  zoomAt(viewport.clientWidth / 2, viewport.clientHeight / 2, delta);
}
 
function panBy(dx, dy) {
  state.x += dx;
  state.y += dy;
  applyView();
}
 
function resetView() {
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  const fit = Math.min(vw / map.offsetWidth, vh / map.offsetHeight, 1);
  state.scale = clamp(Math.floor(fit * 100) / 100, MIN_SCALE, 1);
  state.x = (vw - map.offsetWidth * state.scale) / 2;
  state.y = (vh - map.offsetHeight * state.scale) / 2;
  applyView();
}


/* ---------- Render ---------- */

function renderSeats() {
  document.querySelectorAll(".seat").forEach(btn => {
    const id = btn.dataset.id;
    btn.classList.toggle("unavailable", unavailable.has(id));
    btn.classList.toggle("in-cart", state.cart.includes(id));
    btn.classList.toggle("inspected", state.inspected === id);
  });
}

function renderDetails() {
  const box = document.querySelector("#details");
  const addBtn = document.querySelector("#addBtn");
 
  if (!state.inspected) {
    box.innerHTML = '<p class="empty">No seat selected. Click a seat on the map.</p>';
    addBtn.disabled = true;
    addBtn.textContent = "Add to cart";
    return;
  }
 
  const { section, row, seat } = parseSeat(state.inspected);
  const isUnavailable = unavailable.has(state.inspected);
  const inCart = state.cart.includes(state.inspected);
  const status = isUnavailable ? "Unavailable" : inCart ? "In cart" : "Available";
 
  box.innerHTML = `
    <dl>
      <dt>Section</dt><dd>${section.name}</dd>
      <dt>Row</dt><dd>${row}</dd>
      <dt>Seat</dt><dd>${seat}</dd>
      <dt>Price</dt><dd>$${section.price}</dd>
      <dt>Status</dt><dd>${status}</dd>
    </dl>`;
 
  addBtn.disabled = isUnavailable || inCart;
  addBtn.textContent = inCart ? "Already in cart" : "Add to cart";
}


function renderCart() {
  const list = document.querySelector("#cartList");
  list.innerHTML = "";
 
  let total = 0;
  state.cart.forEach(id => {
    const { section, row, seat } = parseSeat(id);
    total += section.price;
 
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="item-info">
        <strong>${section.name}</strong>
        <span>Row ${row}, Seat ${seat}</span>
        <span class="item-price">$${section.price}</span>
      </span>`;
 
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-btn";
    remove.dataset.id = id;
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove ${section.name}, row ${row}, seat ${seat}`);
    li.append(remove);
    list.append(li);
  });
 
  document.querySelector("#cartEmpty").hidden = state.cart.length > 0;
  document.querySelector("#total").textContent = `$${total}`;
  document.querySelector("#clearBtn").disabled = state.cart.length === 0;
} 

function render() {
  renderSeats();
  renderDetails();
  renderCart();
}

/* ---------- Events ---------- */

map.addEventListener("click", e => {
  const seat = e.target.closest(".seat");
  if (!seat || seat.disabled) return;
  state.inspected = seat.dataset.id;
  render();
});
 
document.querySelector("#addBtn").addEventListener("click", addToCart);
document.querySelector("#clearBtn").addEventListener("click", clearCart);
document.querySelector("#cartList").addEventListener("click", e => {
  const btn = e.target.closest(".remove-btn");
  if (btn) removeFromCart(btn.dataset.id);
});


document.querySelector("#zoomIn").addEventListener("click",    () => zoomBy(ZOOM_STEP));
document.querySelector("#zoomOut").addEventListener("click",   () => zoomBy(-ZOOM_STEP));
document.querySelector("#moveUp").addEventListener("click",    () => panBy(0, PAN_STEP));
document.querySelector("#moveDown").addEventListener("click",  () => panBy(0, -PAN_STEP));
document.querySelector("#moveLeft").addEventListener("click",  () => panBy(PAN_STEP, 0));
document.querySelector("#moveRight").addEventListener("click", () => panBy(-PAN_STEP, 0));
document.querySelector("#resetView").addEventListener("click", resetView);

window.addEventListener("resize", applyView);

window.addEventListener("storage", e => {
  if (e.key !== STORAGE_KEY) return;
  loadCart();
  render();
});


/* ---------- Mouse navigation (bonus) ---------- */

// Mouse wheel: zoom toward the cursor
viewport.addEventListener("wheel", e => {
  e.preventDefault();
  const rect = viewport.getBoundingClientRect();
  const cx = e.clientX - rect.left - viewport.clientLeft;
  const cy = e.clientY - rect.top - viewport.clientTop;
  zoomAt(cx, cy, e.deltaY < 0 ? WHEEL_STEP : -WHEEL_STEP);
}, { passive: false });

buildVenue();
loadCart();
render();
resetView();