import { get } from "svelte/store";
import { settingsStore } from "../../utils/settingsStore";

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
  _settings() {
    return get(settingsStore);
  }

  _productsUrl() {
    return `${get(settingsStore).baseUrl}/products?consumer_key=${
      get(settingsStore).consumerKey
    }&consumer_secret=${get(settingsStore).consumerSecret}`;
  }

  _productUrl(productId) {
    return `${get(settingsStore).baseUrl}/products/${productId}?consumer_key=${
      get(settingsStore).consumerKey
    }&consumer_secret=${get(settingsStore).consumerSecret}`;
  }

  _translateItemAttributesForWc(item) {
    const translateStatus = (status) =>
      status === "reserved" || status === "onbackorder" ? "outofstock" : status;

    const hasSynonyms = item.synonyms && item.synonyms.trim().length > 0;
    return {
      name: item.name,
      sku: String(item.id),
      stock_status: translateStatus(item.status),
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
      short_description: `<div class="hidden">Art.Nr.: ${item.id}</div>${
        item.description ?? ""
      }<br /> ${hasSynonyms ? `<small>(Synonyme: ${item.synonyms})</small>` : ""}`,
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

  async deleteItem(item) {
    var response = await fetch(this._productUrl(item.wc_id), {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete wc product, http response code " + response.status);
    }
  }
}

export default WoocommerceClient;
