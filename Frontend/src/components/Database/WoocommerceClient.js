class WoocommerceClient {
  constructor() {
    this.baseUrl = "https://www.buergerstiftung-karlsruhe.de/wp-json/wc/v3";
    this.consumerKey = process.env.WC_CONSUMER_KEY;
    this.consumerSecret = process.env.WC_CONSUMER_SECRET;
  }

  async fetchItem(wcItemId) {
    var response = await fetch(
      `${this.baseUrl}/products/${wcItemId}?consumer_key=${this.consumerKey}&consumer_secret=${this.consumerSecret}`
    );
    if (!response.ok) {
      throw new Error("Failed to load wc product, http response code " + response.status);
    }
    response = await response.json();
    return response;
  }
}

export default WoocommerceClient;
