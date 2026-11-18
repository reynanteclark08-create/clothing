// Load the cart saved by products.html (Add to Cart buttons).
// If nothing was added yet, the cart starts empty.
var cart = getCart();

// Save the cart so it is still here after the page is refreshed
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

var discountPercent = Number(localStorage.getItem("discount")) || 0;  // saved voucher
var deliveryFee = 100;     // flat delivery fee

// Turn a number into pesos, example: 1600 -> ₱1,600.00
function peso(amount) {
  return "₱" + amount.toLocaleString("en-PH", { minimumFractionDigits: 2 });
}

// Draw the cart table
function showCart() {
  var body = document.getElementById("cart-body");
  body.innerHTML = "";

  for (var i = 0; i < cart.length; i++) {
    var item = cart[i];
    body.innerHTML +=
      "<tr>" +
        "<td>" + esc(item.name) + "</td>" +
        "<td>" + peso(item.price) + "</td>" +
        "<td>" +
          "<button class='qty-btn' onclick='minus(" + i + ")'>-</button> " +
          item.qty +
          " <button class='qty-btn' onclick='plus(" + i + ")'>+</button>" +
        "</td>" +
        "<td>" + peso(item.price * item.qty) + "</td>" +
        "<td><button class='remove-btn' onclick='removeItem(" + i + ")'>Remove</button></td>" +
      "</tr>";
  }

  // Show or hide the "cart is empty" message
  var empty = document.getElementById("empty-message");
  if (cart.length === 0) {
    empty.style.display = "block";
  } else {
    empty.style.display = "none";
  }

  showTotals();
}

// (+) add quantity
function plus(i) {
  cart[i].qty = cart[i].qty + 1;
  saveCart();
  showCart();
}

// (-) lower quantity (stops at 1, use Remove to delete the item)
function minus(i) {
  if (cart[i].qty > 1) {
    cart[i].qty = cart[i].qty - 1;
  }
  saveCart();
  showCart();
}

// Remove the item from the cart
function removeItem(i) {
  cart.splice(i, 1);
  saveCart();
  showCart();
}

// Work out subtotal, discount, delivery fee and total
function getTotals() {
  var subtotal = 0;
  for (var i = 0; i < cart.length; i++) {
    subtotal = subtotal + cart[i].price * cart[i].qty;
  }

  var discount = subtotal * discountPercent / 100;
  var shipping = 0;
  if (cart.length > 0) {
    shipping = deliveryFee;
  }
  return {
    subtotal: subtotal,
    discount: discount,
    shipping: shipping,
    total: subtotal - discount + shipping
  };
}

function showTotals() {
  var t = getTotals();
  document.getElementById("subtotal").innerHTML = peso(t.subtotal);
  document.getElementById("discount").innerHTML = "-" + peso(t.discount);
  document.getElementById("shipping").innerHTML = peso(t.shipping);
  document.getElementById("total").innerHTML = peso(t.total);
}

// Voucher
function applyVoucher() {
  var code = document.getElementById("voucher-code").value.trim().toUpperCase();
  var message = document.getElementById("voucher-message");

  if (code === "SAVE10") {
    discountPercent = 10;
    message.innerHTML = "Voucher applied! You get 10% off.";
  } else {
    discountPercent = 0;
    message.innerHTML = "Invalid voucher code.";
  }
  localStorage.setItem("discount", discountPercent);
  showTotals();
}

// Show the card fields only when "Credit / Debit Card" is selected
function showCardFields() {
  var method = document.querySelector("input[name='payment']:checked");
  var box = document.getElementById("card-fields");
  if (method !== null && method.value === "Credit/Debit Card") {
    box.style.display = "block";
  } else {
    box.style.display = "none";
  }
}

var radios = document.querySelectorAll("input[name='payment']");
for (var r = 0; r < radios.length; r++) {
  radios[r].addEventListener("change", showCardFields);
}

// Check out
function checkout() {
  var message = document.getElementById("checkout-message");
  var name = document.getElementById("full-name").value.trim();
  var phone = document.getElementById("phone").value.trim();
  var address = document.getElementById("address").value.trim();
  var city = document.getElementById("city").value.trim();
  var method = document.querySelector("input[name='payment']:checked");

  if (cart.length === 0) {
    message.innerHTML = "Your cart is empty.";
  } else if (name === "" || phone === "" || address === "" || city === "") {
    message.innerHTML = "Please fill in all delivery information.";
  } else if (!/^[0-9]{10,11}$/.test(phone)) {
    message.innerHTML = "Please enter a valid phone number (10 or 11 digits).";
  } else if (method === null) {
    message.innerHTML = "Please choose a payment method.";
  } else if (method.value === "Credit/Debit Card" &&
             (document.getElementById("card-number").value.replace(/ /g, "").length < 12 ||
              !/^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(document.getElementById("card-expiry").value.trim()))) {
    message.innerHTML = "Please enter a valid card number and expiry date (MM/YY).";
  } else {
    showConfirmation(name, phone, address, city, method.value);
  }
}

// Keep the order so it shows in My Account > Order History
function saveOrder(number, name, phone, address, city, method, t) {
  var orders = [];
  try { orders = JSON.parse(localStorage.getItem("orders")) || []; } catch (e) {}
  var user = currentUser();
  orders.push({
    number: number,
    date: new Date().toLocaleString("en-PH"),
    email: user ? user.email : "guest",
    name: name, phone: phone, address: address, city: city,
    method: method, total: t.total,
    items: JSON.parse(JSON.stringify(cart))
  });
  localStorage.setItem("orders", JSON.stringify(orders));
}

// Fill in the name for logged-in customers
var user = currentUser();
if (user) {
  document.getElementById("full-name").value = user.name;
}

// Order confirmation: order number and summary, then empty the cart
function showConfirmation(name, phone, address, city, method) {
  var t = getTotals();
  var orderNumber = "ORD-" + Date.now().toString().slice(-6);

  saveOrder(orderNumber, name, phone, address, city, method, t);

  var list = "<ul>";
  for (var i = 0; i < cart.length; i++) {
    list += "<li>" + esc(cart[i].name) + " x " + cart[i].qty + " - " + peso(cart[i].price * cart[i].qty) + "</li>";
  }
  list += "</ul>";

  document.getElementById("order-number").innerHTML = "Order number: " + orderNumber;
  document.getElementById("order-details").innerHTML =
    list +
    "<p><strong>Total paid:</strong> " + peso(t.total) + " (" + method + ")</p>" +
    "<p><strong>Deliver to:</strong> " + esc(name) + ", " + esc(address) + ", " + esc(city) + " (" + esc(phone) + ")</p>" +
    "<p>Thank you for shopping with us!</p>";

  // hide the cart and payment, show the confirmation
  var sections = document.querySelectorAll(".hero.cart");
  for (var s = 0; s < sections.length; s++) {
    sections[s].style.display = "none";
  }
  document.getElementById("confirmation").style.display = "block";
  window.scrollTo(0, 0);

  cart = [];
  discountPercent = 0;
  localStorage.setItem("discount", 0);
  saveCart();
}

// Run when the page opens
if (discountPercent > 0) {
  document.getElementById("voucher-message").innerHTML = "Voucher applied! You get " + discountPercent + "% off.";
}
showCart();
