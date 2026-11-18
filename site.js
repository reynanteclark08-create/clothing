// Shared by every page: cart count in the menu and the small "Added!" message.

// Read the cart saved in the browser
function getCart() {
  try {
    return JSON.parse(localStorage.getItem("cart")) || [];
  } catch (e) {
    return [];
  }
}

// Show the total number of items on the cart symbol in the menu
function updateCartCount() {
  var badge = document.getElementById("cart-badge");
  if (badge === null) {
    return;
  }
  var cart = getCart();
  var count = 0;
  for (var i = 0; i < cart.length; i++) {
    count = count + cart[i].qty;
  }
  if (count > 0) {
    badge.innerHTML = count;
    badge.style.display = "block";
  } else {
    badge.innerHTML = "";
    badge.style.display = "none";
  }
}

// Small message at the bottom of the screen (replaces alert)
function showToast(text) {
  var toast = document.getElementById("toast");
  if (toast === null) {
    return;
  }
  toast.innerHTML = text;
  toast.className = "toast show";
  setTimeout(function () {
    toast.className = "toast";
  }, 2000);
}

// ---------- Products: add to cart, search, sort ----------

function addToCart(name, price) {
  var cart = getCart();

  // If the item is already in the cart, just add 1 to its quantity
  var found = false;
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].name === name) {
      cart[i].qty = cart[i].qty + 1;
      found = true;
    }
  }

  // Otherwise add it as a new item
  if (found === false) {
    cart.push({ name: name, price: price, qty: 1 });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  showToast(name + " added to cart");
}

// Search: hide products that don't match what was typed
function filterProducts() {
  var text = document.getElementById("search").value.toLowerCase().trim();
  var cards = document.querySelectorAll(".product-card");
  var groups = document.querySelectorAll(".group");
  var shown = 0;

  for (var i = 0; i < cards.length; i++) {
    if (cards[i].getAttribute("data-name").indexOf(text) !== -1) {
      cards[i].style.display = "";
      shown = shown + 1;
    } else {
      cards[i].style.display = "none";
    }
  }

  // Hide a category title when none of its products match
  for (var g = 0; g < groups.length; g++) {
    var visible = 0;
    var inside = groups[g].querySelectorAll(".product-card");
    for (var k = 0; k < inside.length; k++) {
      if (inside[k].style.display !== "none") {
        visible = visible + 1;
      }
    }
    groups[g].style.display = visible === 0 ? "none" : "";
  }

  document.getElementById("no-results").style.display = shown === 0 ? "block" : "none";
}

// Sort: reorder the products inside each category
function sortProducts() {
  var how = document.getElementById("sort").value;
  var groups = document.querySelectorAll(".group");

  for (var g = 0; g < groups.length; g++) {
    var grid = groups[g].querySelector(".grid");
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".product-card"));

    cards.sort(function (a, b) {
      var priceA = Number(a.getAttribute("data-price"));
      var priceB = Number(b.getAttribute("data-price"));
      if (how === "low") {
        return priceA - priceB;
      } else if (how === "high") {
        return priceB - priceA;
      } else if (how === "name") {
        return a.getAttribute("data-name").localeCompare(b.getAttribute("data-name"));
      }
      return Number(a.getAttribute("data-order")) - Number(b.getAttribute("data-order"));
    });

    for (var i = 0; i < cards.length; i++) {
      grid.appendChild(cards[i]);
    }
  }
}

updateCartCount();

// ---------- Wishlist ----------

function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem("wishlist")) || [];
  } catch (e) {
    return [];
  }
}

function isWished(name) {
  var list = getWishlist();
  for (var i = 0; i < list.length; i++) {
    if (list[i].name === name) {
      return true;
    }
  }
  return false;
}

// Add or remove an item from the wishlist (heart button on product cards)
function toggleWishlist(name, price, img, btn) {
  var list = getWishlist();
  var index = -1;
  for (var i = 0; i < list.length; i++) {
    if (list[i].name === name) {
      index = i;
    }
  }
  if (index === -1) {
    list.push({ name: name, price: price, img: img });
    showToast(name + " added to wishlist");
  } else {
    list.splice(index, 1);
    showToast(name + " removed from wishlist");
  }
  localStorage.setItem("wishlist", JSON.stringify(list));
  if (btn) {
    btn.className = isWished(name) ? "heart-btn active" : "heart-btn";
  }
}

// Put a heart button on every product card that has an Add to Cart button
function addHearts() {
  var cards = document.querySelectorAll(".product-card");
  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    var cartBtn = card.querySelector("button[onclick^='addToCart']");
    var img = card.querySelector("img");
    if (cartBtn === null || img === null) {
      continue;
    }
    var m = cartBtn.getAttribute("onclick").match(/addToCart\('(.+)',\s*(\d+)\)/);
    if (m === null) {
      continue;
    }
    var heart = document.createElement("button");
    heart.type = "button";
    heart.innerHTML = "&#10084;";
    heart.title = "Wishlist";
    heart.setAttribute("aria-label", "Add to wishlist");
    heart.className = isWished(m[1]) ? "heart-btn active" : "heart-btn";
    heart.onclick = (function (n, p, s, h) {
      return function () { toggleWishlist(n, p, s, h); };
    })(m[1], Number(m[2]), img.getAttribute("src"), heart);
    card.style.position = "relative";
    card.appendChild(heart);
  }
}

// ---------- Accounts (stored in the browser only, for school project use) ----------

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem("users")) || [];
  } catch (e) {
    return [];
  }
}

function currentUser() {
  try {
    return JSON.parse(localStorage.getItem("currentUser"));
  } catch (e) {
    return null;
  }
}

// Escape text before putting it in HTML (stops broken markup / injection)
function esc(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ---------- Back to top button ----------

function addBackToTop() {
  var b = document.createElement("button");
  b.id = "to-top";
  b.type = "button";
  b.innerHTML = "&#8679;";
  b.setAttribute("aria-label", "Back to top");
  b.onclick = function () { window.scrollTo({ top: 0, behavior: "smooth" }); };
  document.body.appendChild(b);
  window.addEventListener("scroll", function () {
    b.style.display = window.scrollY > 300 ? "block" : "none";
  });
}

addHearts();
addBackToTop();
