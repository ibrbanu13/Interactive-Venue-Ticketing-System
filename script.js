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

const state = {
  inspected: null,
  cart: [],
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
}

function render() {
  renderSeats();
  renderDetails();
}

/* ---------- Events ---------- */

  document.querySelector("#map").addEventListener("click", e => {
  const seat = e.target.closest(".seat");
  if (!seat) return;
  state.inspected = seat.dataset.id;
  render();
});


buildVenue();
render();