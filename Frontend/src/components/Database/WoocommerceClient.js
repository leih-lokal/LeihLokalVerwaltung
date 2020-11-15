class WoocommerceClient {
  constructor() {
    this.baseUrl = "ENV_WC_BASE_URL";
    this.consumerKey = "ENV_WC_CONSUMER_KEY";
    this.consumerSecret = "ENV_WC_CONSUMER_SECRET";
  }

  _productUrl(productId) {
    return `${this.baseUrl}/products/${productId}?consumer_key=${this.consumerKey}&consumer_secret=${this.consumerSecret}`;
  }

  async fetchItem(wcItemId) {
    var response = await fetch(this._productUrl(wcItemId));
    if (!response.ok) {
      throw new Error("Failed to load wc product, http response code " + response.status);
    }
    response = await response.json();
    return response;
  }

  async updateItemStatus(wcItemId, updatedStatus) {
    var response = await fetch(this._productUrl(wcItemId), {
      method: "PUT",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        stock_status: updatedStatus,
      }),
    });
    if (!response.ok) {
      throw new Error("Failed to update wc product, http response code " + response.status);
    }
  }
}

export default WoocommerceClient;
