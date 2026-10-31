const FOOD_API = "https://storage.googleapis.com/acciojob-open-file-collections/appsmith-uploads/bb3807e9b0bc49958d39563eb1759406.json";

let foodItems = [];
let cart = [];

const foodGrid = document.getElementById("foodGrid");
const searchInput = document.getElementById("searchInput");
const cartCount = document.getElementById("cartCount");
const cartItemsContainer = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const toast = document.getElementById("toast");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2500);
}

// 1. Fetch menu data and display it when the page loads.
async function getMenu() {
  try {
    const response = await fetch(FOOD_API);
    if (!response.ok) throw new Error("Unable to fetch menu. Please try again.");
    foodItems = await response.json();
    renderMenu();
  } catch (error) {
    console.error("Menu loading error:", error);
    foodGrid.innerHTML = `<p class="loading">Menu could not be loaded. Check your internet connection and refresh the page.</p>`;
  }
}

function renderMenu(list = foodItems) {
  if (!list.length) {
    foodGrid.innerHTML = `<p class="loading">No food items found.</p>`;
    return;
  }

  const isHome = document.body.dataset.page === "home";
  const visibleItems = isHome ? list.slice(0, 6) : list;

  foodGrid.innerHTML = visibleItems.map(item => `
    <article class="food-card">
      <img class="food-image" src="${item.imgSrc}" alt="${item.name}" loading="lazy">
      <div class="food-info">
        <div>
          <h3>${item.name}</h3>
          <p>$${Number(item.price).toFixed(2)}/-</p>
        </div>
        <button class="add-btn" data-add="${item.id}" aria-label="Add ${item.name} to cart">+</button>
      </div>
    </article>
  `).join("");
}

function addToCart(id) {
  const item = foodItems.find(food => String(food.id) === String(id));
  if (!item) return;
  const existingItem = cart.find(food => String(food.id) === String(id));
  if (existingItem) existingItem.quantity += 1;
  else cart.push({ ...item, quantity: 1 });
  updateCart();
  showToast(`${item.name} added to your cart`);
}

function updateCart() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = count;

  if (!cart.length) {
    cartItemsContainer.innerHTML = `<p class="empty-cart">Your cart is empty.</p>`;
  } else {
    cartItemsContainer.innerHTML = cart.map(item => `
      <div class="cart-row">
        <div><strong>${item.name}</strong><small>$${Number(item.price).toFixed(2)} × ${item.quantity}</small></div>
        <div class="quantity-controls">
          <button data-decrease="${item.id}" aria-label="Decrease quantity">−</button>
          <span>${item.quantity}</span>
          <button data-increase="${item.id}" aria-label="Increase quantity">+</button>
        </div>
      </div>
    `).join("");
  }

  const total = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  cartTotal.textContent = `$${total.toFixed(2)}`;
}

function changeQuantity(id, amount) {
  const item = cart.find(food => String(food.id) === String(id));
  if (!item) return;
  item.quantity += amount;
  if (item.quantity <= 0) cart = cart.filter(food => String(food.id) !== String(id));
  updateCart();
}

function openCart() {
  document.body.classList.add("cart-open");
}
function closeCart() {
  document.body.classList.remove("cart-open");
}

// 2. Select three random menu items and resolve the order after 2500 ms.
// The supplied JSON contains only one item with "burger" in its name,
// so the function falls back to three random menu items.
function TakeOrder() {
  return new Promise((resolve, reject) => {
    if (foodItems.length < 3) {
      reject(new Error("At least three menu items are required to place an order."));
      return;
    }

    setTimeout(() => {
      try {
        const burgers = foodItems.filter(item => item.name.toLowerCase().includes("burger"));
        const source = burgers.length >= 3 ? burgers : foodItems;
        const shuffled = [...source].sort(() => Math.random() - 0.5);
        const selectedItems = shuffled.slice(0, 3);

        const order = {
          items: selectedItems,
          order_status: true,
          paid: false
        };
        resolve(order);
      } catch (error) {
        reject(error);
      }
    }, 2500);
  });
}

// 3. Prepare the order after 1500 ms.
function orderPrep() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ order_status: true, paid: false });
    }, 1500);
  });
}

// 4. Complete payment after 1000 ms.
function payOrder() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ order_status: true, paid: true });
    }, 1000);
  });
}

// 5. Show the thank-you message only after successful payment.
function thankyouFnc() {
  alert("Thank you for eating with us today!");
}

// Handle all promises sequentially and report any error.
async function placeOrder() {
  const checkoutButton = document.getElementById("checkoutBtn");
  if (!foodItems.length) {
    showToast("The menu is still loading. Please wait.");
    return;
  }

  checkoutButton.disabled = true;
  checkoutButton.textContent = "Processing order...";

  try {
    const order = await TakeOrder();
    console.log("Order received:", order);

    const preparedOrder = await orderPrep();
    console.log("Order prepared:", preparedOrder);

    const payment = await payOrder();
    console.log("Payment completed:", payment);

    if (payment.paid === true) {
      closeCart();
      cart = [];
      updateCart();
      thankyouFnc();
    }
  } catch (error) {
    console.error("Order processing error:", error);
    showToast(error.message || "Something went wrong. Please try again.");
  } finally {
    checkoutButton.disabled = false;
    checkoutButton.textContent = "Place Order";
  }
}

document.addEventListener("click", event => {
  const addButton = event.target.closest("[data-add]");
  const increaseButton = event.target.closest("[data-increase]");
  const decreaseButton = event.target.closest("[data-decrease]");
  const actionButton = event.target.closest("[data-action]");

  if (addButton) addToCart(addButton.dataset.add);
  if (increaseButton) changeQuantity(increaseButton.dataset.increase, 1);
  if (decreaseButton) changeQuantity(decreaseButton.dataset.decrease, -1);

  if (actionButton) {
    event.preventDefault();
    showToast(`${actionButton.dataset.action} feature can be added later.`);
  }
});

document.getElementById("openCart").addEventListener("click", openCart);
document.getElementById("closeCart").addEventListener("click", closeCart);
document.getElementById("cartBackdrop").addEventListener("click", closeCart);
document.getElementById("checkoutBtn").addEventListener("click", placeOrder);

searchInput.addEventListener("input", event => {
  const searchTerm = event.target.value.trim().toLowerCase();
  const filteredItems = foodItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm)
  );
  renderMenu(filteredItems);
});

// Load the menu immediately when the page opens.
getMenu();
