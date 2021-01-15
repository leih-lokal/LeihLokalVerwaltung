const WC_CATEGORIES = {
  Küche: {
    id: 73,
    name: "Küche",
    slug: "kueche",
  },
  Garten: {
    id: 28,
    name: "Garten",
    slug: "garten",
  },
  Freizeit: {
    id: 32,
    name: "Freizeit",
    slug: "freizeit",
  },
  Haushalt: {
    id: 26,
    name: "Haushalt",
    slug: "haushalt",
  },
  Kinder: {
    id: 31,
    name: "Kinder",
    slug: "kinder",
  },
  Heimwerker: {
    id: 29,
    name: "Heimwerker",
    slug: "heimwerker",
  },
};

class WoocommerceClient {
  constructor() {
    this.baseUrl = "ENV_WC_BASE_URL";
    this.consumerKey = "ENV_WC_CONSUMER_KEY";
    this.consumerSecret = "";

    if (localStorage.hasOwnProperty("wc_secret")) {
      this.consumerSecret = localStorage.getItem("wc_secret");
    } else {
      const secret = prompt("Woocommerce Secret", "");
      if (secret != null) {
        localStorage.setItem("wc_secret", secret);
        this.consumerSecret = secret;
      }
    }
  }

  _productsUrl() {
    return `${this.baseUrl}/products?consumer_key=${this.consumerKey}&consumer_secret=${this.consumerSecret}`;
  }

  _productUrl(productId) {
    return `${this.baseUrl}/products/${productId}?consumer_key=${this.consumerKey}&consumer_secret=${this.consumerSecret}`;
  }

  _translateItemAttributesForWc(item) {
    return {
      name: item.item_name,
      sku: item._id,
      ...(item.status_on_website && { stock_status: item.status_on_website }),
      attributes: [
        {
          id: 1,
          name: "Pfand",
          position: 0,
          visible: true,
          variation: false,
          options: [(item.deposit ?? "0") + " €"],
        },
      ],
      categories: item.category
        .split(", ")
        .filter((category) => category in WC_CATEGORIES)
        .map((category) => WC_CATEGORIES[category]),
      short_description: `<div class="hidden">Art.Nr.: ${item._id}</div>${item.properties}`,
      meta_data: [
        {
          key: "marke",
          value: item.brand ?? "-",
        },
        {
          key: "typenbezeichnung",
          value: item.itype ?? "-",
        },
        {
          key: "anzahl_teile",
          value: item.parts ?? "-",
        },
      ],
    };
  }

  async fetchItem(wcItemId) {
    var response = await fetch(this._productUrl(wcItemId));
    if (!response.ok) {
      throw new Error("Failed to load wc product, http response code " + response.status);
    }
    response = await response.json();
    return response;
  }

  async updateItem(item) {
    var response = await fetch(this._productUrl(item.wc_id), {
      method: "PUT",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(this._translateItemAttributesForWc(item)),
    });
    if (!response.ok) {
      throw new Error("Failed to update wc product, http response code " + response.status);
    }
  }

  async createItem(item) {
    var response = await fetch(this._productsUrl(), {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(this._translateItemAttributesForWc(item)),
    });
    if (!response.ok) {
      throw new Error("Failed to create wc product, http response code " + response.status);
    }
    return await response.json();
  }
}

export default WoocommerceClient;
