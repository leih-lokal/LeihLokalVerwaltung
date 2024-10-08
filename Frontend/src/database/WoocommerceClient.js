import { get } from "svelte/store";
import { settingsStore } from "../utils/settingsStore";
import Logger from "js-logger";

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
    return `${this._settings().wcUrl}/products?consumer_key=${
      this._settings().wcKey
    }&consumer_secret=${this._settings().wcSecret}`;
  }

  _productUrl(productId) {
    return `${this._settings().wcUrl}/products/${productId}?consumer_key=${
      this._settings().wcKey
    }&consumer_secret=${this._settings().wcSecret}`;
  }

  _translateItemAttributesForWc(item) {
    const translateStatus = (status) => {
      if (["reserved"].includes(status)) return "outofstock";
      if (["lost", "repairing", "forsale"].includes(status)) return "onbackorder";
      return status;
    }

    const hasSynonyms = item.synonyms && item.synonyms.trim().length > 0;
    const isRentedAndHasReturnDateInFuture =
      item.expected_return_date && item.status == "outofstock" ? true : false;

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
        // line break after closing div below is intended
      short_description: `<div class="hidden">Art.Nr.: ${item.id}</div>
      ${
        item.description ?? ""
      }<br /> ${
        hasSynonyms ? `<small>(Synonyme: ${item.synonyms})</small>` : ""
      }`,
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
        {
          key: "zuruckerwartet",
          value: isRentedAndHasReturnDateInFuture
            ? item.expected_return_date
            : "",
        },
      ],
    };
  }

  async fetchWithRetry(url, body = {}, retries = 0) {
    try {
      let response = await fetch(url, body);
      if (response.ok) {
        return response;
      } else {
        throw new Error(
          `Failed to fetch '${url}', response code ${response.status}`
        );
      }
    } catch (e) {
      if (retries < 3) {
        Logger.warn(e);
        return await this.fetchWithRetry(url, body, retries + 1);
      } else {
        throw e;
      }
    }
  }

  async fetchItem(wcItemId) {
    var response = await this.fetchWithRetry(this._productUrl(wcItemId));
    response = await response.json();
    return response;
  }

  async updateItem(item) {
    await this.fetchWithRetry(this._productUrl(item.wc_id), {
      method: "PUT",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(this._translateItemAttributesForWc(item)),
    });
  }

  async createItem(item) {
    var response = await this.fetchWithRetry(this._productsUrl(), {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(this._translateItemAttributesForWc(item)),
    });
    return await response.json();
  }

  async deleteItem(item) {
    await this.fetchWithRetry(this._productUrl(item.wc_id), {
      method: "DELETE",
    });
  }
}

export default new WoocommerceClient();
