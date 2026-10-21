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

