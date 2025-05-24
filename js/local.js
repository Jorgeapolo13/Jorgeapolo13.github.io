$(function () {
  let user
  let cart = []
  const $sidebar = $("#carritoSidebar");
  const $overlay = $("#overlayCarrito");
  const $carrito = $("#cart-items");
  // Verificar si hay session activa
  fetch("http://localhost/ejercicios/API/comprobar_sesion.php", {
    method: "GET",
    credentials: "include" // 🔑 para enviar cookies de sesión
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.usuario) {
        user = data.usuario;
        initializeUserSession()
        if (window.location.pathname === "/portofino/orders") {
          if(user.rol == "admin"){
            initializeOrdersAdmin()
          }else{
            initializeOrders(user)
          }
        }
      } else {
        if (window.location.pathname === "/portofino/orders") {
          window.location.href = "/portofino/";
        }
      }
    });

  // Abrir modal Registro
  $(".menu-item-createAccount").on("click", function () {
    $("#error-CreateAccount").addClass("hidden")
    $("#modalCreateAccount").removeClass("hidden").addClass("flex");
  });

  // Cerrar modal desde botones
  $("#closeModalBtn, #closeModalBtn2").on("click", function () {
    $("#modalCreateAccount").removeClass("flex").addClass("hidden");
  });

  // Cerrar al hacer clic fuera del contenido del modal
  $("#modalCreateAccount").on("click", function (e) {
    if (e.target === this) {
      $("#modalCreateAccount").removeClass("flex").addClass("hidden");
    }
  });

  $("#submit-CreateAccount").on("click", function (e) {
    e.preventDefault(); // evita que se recargue el formulario si está dentro de uno

    let name = $("#nameCreateAccount").val();
    let email = $("#emailCreateAccount").val();
    let password = $("#passwordCreateAccount").val();

    if (!email || !password || !name) {
      $("#error-CreateAccount").removeClass("hidden").text("Debes completar todos los campos.");
      return;
    }

    const formData = new FormData();
    formData.append("nombre", name);
    formData.append("email", email);
    formData.append("contrasena", password);

    fetch("http://localhost/ejercicios/API/registro.php", {
      method: "POST",
      body: formData,
      credentials: "include"
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert(data.success);
          $("#nameCreateAccount").val("");
          $("#emailCreateAccount").val("");
          $("#passwordCreateAccount").val("");
          initializeLogin(email, password)
        } else {
          $("#error-CreateAccount").removeClass("hidden").text(data.error)
        }
      })
      .catch((error) => {
        console.error("Error en la solicitud:", JSON.stringify(error));
        alert("No se pudo completar el registro.");
      });
  });

  // Modal Login
  $(".menu-item-login").on("click", function () {
    $("#error-Login").addClass("hidden")
    $("#modalLogin").removeClass("hidden").addClass("flex");
  });


  $("#closeModalBtn, #closeModalBtn2").on("click", function () {
    $("#modalLogin").removeClass("flex").addClass("hidden");
  });


  $("#modalLogin").on("click", function (e) {
    if (e.target === this) {
      $("#modalLogin").removeClass("flex").addClass("hidden");
    }
  });

  $("#submit-Login").on("click", function (e) {
    e.preventDefault(); // evita que se recargue el formulario si está dentro de uno
    let email = $("#emailLogin").val().trim();
    let password = $("#passwordLogin").val().trim();

    if (!email || !password) {
      $("#error-Login").removeClass("hidden").text("Debes completar todos los campos.");
      return;
    }

    initializeLogin(email, password)
  });

  function initializeLogin(email, password) {
    const formData = new FormData();
    formData.append("email", email);
    formData.append("contrasena", password);

    fetch("http://localhost/ejercicios/API/login.php", {
      method: "POST",
      body: formData,
      credentials: "include"
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          $("#emailLogin").val("");
          $("#passwordLogin").val("");
          window.location.reload()
        } else {
          $("#error-Login").removeClass("hidden").text(data.error)
        }
      })
      .catch((error) => {
        console.error("Error en la solicitud:", error);
        alert("No se pudo completar el login.");
      });
  }

  function initializeUserSession() {
    $(".menu-item-createAccount").addClass("hidden")
    $(".menu-item-login").addClass("hidden")
    $(".menu-item-logout").removeClass("hidden")
  }

  $(".menu-item-logout").on("click", function () {
    fetch("http://localhost/ejercicios/API/logout.php", {
      method: "GET",
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          $(".menu-item-logout").addClass("hidden")
          $(".menu-item-createAccount").removeClass("hidden")
          $(".menu-item-login").removeClass("hidden")
          localStorage.removeItem("cart")

          window.location.reload()
        }
      })
      .catch(err => {
        console.error("Error al cerrar sesión:", err);
      });

  })

  if (window.location.pathname == "/portofino/menu") {


    if (localStorage.getItem("cart")) {
      cart = JSON.parse(localStorage.getItem("cart")) || [];
      updateCart()
    }

    $(".btn-item").on("click", function () {
      if (user == null) {
        $("#error-Login").addClass("hidden")
        $("#modalLogin").removeClass("hidden").addClass("flex");
      } else {
        let idItem = $(this).attr("data-id")
        let priceItem = parseFloat($(this).attr("data-price"))
        if (cart.some(item => item.id == idItem)) {
          increaseItem(idItem)
        } else {
          let nameItem = $(this).attr("data-name")

          let html = cart_item_html(idItem, priceItem, nameItem, 1)

          $carrito.append(html);
          let item = {
            id: idItem,
            name: nameItem,
            price: priceItem,
            total: priceItem,
            amount: 1
          };
          cart.push(item)

          localStorage.setItem("cart", JSON.stringify(cart));
          console.log(JSON.parse(localStorage.getItem("cart") || "[]"));
          console.log($carrito.html())
          updateTotal()
          $("#btn-buy").removeClass("hidden")
          $("#cart-items").removeClass("hidden")
          $("#empty-cart").addClass("hidden")
          $("#carritoSidebar").addClass("flex")
        }
        $sidebar.removeClass("translate-x-full");
        $overlay.removeClass("hidden");
      }
    })

    function updateCart() {
      for (item of cart) {
        let html = cart_item_html(item.id, item.price, item.name, item.amount)
        $carrito.append(html);
      }
      updateTotal()
      $("#btn-buy").removeClass("hidden")
      $("#cart-items").removeClass("hidden")
      $("#empty-cart").addClass("hidden")
      $("#carritoSidebar").addClass("flex")
      $sidebar.removeClass("translate-x-full");
      $overlay.removeClass("hidden");
    }

    function cart_item_html(idItem, priceItem, nameItem, amount) {
      return `<div class="cart-item flex flex-col gap-2" data-id=${idItem}>
                      <div class="flex justify-between items-center">
                        <span class="font-bold">${nameItem}</span>
                        <span><i class="totalItem">${priceItem.toFixed(2)}</i>€</span>
                      </div>
                      <div class="self-end flex justify-center items-center gap-2">
                        <button
                        type="button"
                        class="button-less group rounded-xl p-2 inline-flex items-center"
                        >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="2"
                          stroke="currentColor"
                          class="size-4 group-hover:scale-110 transition duration-300"
                        >
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14" />
                        </svg>
                        </button>
                        <span class="amount">${amount}</span>
                        <button
                        type="button"
                        class="button-more group text-white rounded-xl px-2.5 py-2.5 inline-flex items-center"
                        >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="2"
                          stroke="currentColor"
                          class="size-4 group-hover:scale-110 transition duration-300"
                        >
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        </button>
                        <button
                        type="button"
                        class="button-delete group text-white rounded-xl px-2 py-2 inline-flex items-center"
                        >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="2"
                          stroke="currentColor"
                          class="size-5 group-hover:scale-110 transition duration-300"
                        >
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6 7.5V19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.5M4.5 7.5h15M10 11v6m4-6v6M9 7.5V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1.5" />
                        </svg>
                        </button>
                      </div>
                      <hr>
                    </div>`;;
    }

    $("#btn-basket").on("click", function () {
      if ($sidebar.hasClass("translate-x-full")) {
        $sidebar.removeClass("translate-x-full");
        $overlay.removeClass("hidden");
      } else {
        $sidebar.addClass("translate-x-full");
        $overlay.addClass("hidden");
      }
    })

    $(document).on("click", ".button-more", function () {
      let idItem = $(this).closest(".cart-item").attr("data-id")
      increaseItem(idItem)
    })

    $(document).on("click", ".button-less", function () {
      let idItem = $(this).closest(".cart-item").attr("data-id")
      decreaseItem(idItem)
    })

    $(document).on("click", ".button-delete", function () {
      let idItem = $(this).closest(".cart-item").attr("data-id")
      deleteItem(idItem)
    })

    $overlay.on("click", function () {
      $sidebar.addClass("translate-x-full");
      $overlay.addClass("hidden");
    });

    function increaseItem(idItem) {
      const item = cart.find(item => item.id == idItem)
      item.amount += 1;
      item.total += item.price;
      for (let cartItem of $(".cart-item")) {
        let id = $(cartItem).attr("data-id")
        if (id == idItem) {
          $(cartItem).find(".amount").text(item.amount)
          $(cartItem).find(".totalItem").text(`${item.total.toFixed(2)}`)
          break
        }
      }
      updateTotal()
    }

    function decreaseItem(idItem) {
      const item = cart.find(item => item.id == idItem)
      item.amount -= 1;
      item.total -= item.price;
      if (item.amount < 1) {
        deleteItem(idItem)
      } else {
        for (let cartItem of $(".cart-item")) {
          let id = $(cartItem).attr("data-id")
          if (id == idItem) {
            $(cartItem).find(".amount").text(item.amount)
            $(cartItem).find(".totalItem").text(`${item.total.toFixed(2)}`)
            break
          }
        }
        updateTotal()
      }
    }

    function deleteItem(idItem) {
      for (let cartItem of $(".cart-item")) {
        let id = $(cartItem).attr("data-id")
        if (id == idItem) {
          $(cartItem).remove()
          cart = cart.filter(item => item.id !== idItem);
          break
        }
      }
      updateTotal()
      checkItems()
    }

    function checkItems() {
      if (cart.length < 1) {
        localStorage.removeItem("cart")
        $("#btn-buy").addClass("hidden")
        $("#cart-items").addClass("hidden")
        $("#empty-cart").removeClass("hidden")
        $("#carritoSidebar").removeClass("flex")
      }
    }

    function updateTotal() {
      localStorage.setItem("cart", JSON.stringify(cart));
      let total = cart.reduce((sum, item) => sum + item.total, 0);
      $("#total-cart").text(total.toFixed(2))
    }

    $("#btn-buy").on("click", function () {
      let total = cart.reduce((sum, item) => sum + item.total, 0);
      const payload = {
        user_id: user.id,
        total,
        cart: cart
      };

      fetch("http://localhost/ejercicios/API/save_order.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })
        .then(res => res.json())
        .then(data => {
          if(data.success) {
            localStorage.removeItem("cart")

            window.location.reload()
          }
        })
        .catch(err => console.error("Error:", err));
    })
  }

  function initializeOrders(user) {
    const dateToday = new Date().toISOString().split("T")[0];
    let orders
    fetch("http://localhost/ejercicios/API/user_orders.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        fecha: dateToday
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.length != 0) {
          orders = data
          updateOrders(orders)
        } else {
          $("#orders-container").addClass("hidden")
          $("#empty-orders").removeClass("hidden")
        }
      })
      .catch(err => console.error("Error:", err));
  }

  function initializeOrdersAdmin(user) {
    const dateToday = new Date().toISOString().split("T")[0];
    let orders
    fetch("http://localhost/ejercicios/API/user_orders.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fecha: dateToday
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.length != 0) {
          orders = data
          updateOrders(orders)
        } else {
          $("#orders-container").addClass("hidden")
          $("#empty-orders").removeClass("hidden")
        }
      })
      .catch(err => console.error("Error:", err));
  }

  function updateOrders(orders) {
    for(let order of orders) {
      let idOrder = order.id
      let orderTimestamp = order.fecha.split(" ")[1]
      let total = parseFloat(order.total)
      let html = $(htmlOrder(idOrder, orderTimestamp, total))
      for(let item of order.productos) {
        let name = item.nombre_producto
        let amount = parseInt(item.cantidad)
        let price = parseFloat(item.precio_unitario)
        $(html).find(".detailsOrder").append(htmlProduct(name, amount, price))
      }
      $("#orders-container").append(html)
    }
  }

  function htmlOrder(id, orderTimestamp, total) {
    return `<div class="p-4 flex flex-col justify-between border rounded-lg shadow-sm bg-white h-100 w-90">
              <h5 class="font-bold text-lg mb-4">Pedido #${id} - ${orderTimestamp}</h5>

              <div class="detailsOrder space-y-2 overflow-y-auto max-h-70">
                
              </div>

              <div class="flex justify-end mt-4">
                <p class="font-bold">Total: ${total.toFixed(2)} €</p>
              </div>
            </div>`
  }

  function htmlProduct (name, amount, price) {
    let total = amount * price
    return `<div class="flex justify-between items-center border-b pb-2">
              <div>
                <p class="font-medium">${name}</p>
                <p class="text-sm text-gray-500">Cantidad: ${amount} × ${price.toFixed(2)} €</p>
              </div>
              <p class="font-semibold">${total} €</p>
            </div>`
  }
  
  $(".redirectMenu").on("click", function() {
    window.location.href = "/portofino/menu";
  })
});

