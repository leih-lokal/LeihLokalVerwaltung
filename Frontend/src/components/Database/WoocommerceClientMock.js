import items from "../../../spec/Database/testdata";

class WoocommerceClientMock {
  constructor() {}

  async fetchItem(wcItemId) {
    await new Promise((r) => setTimeout(r, 1500));
    const item = items.find((item) => item.wc_id == wcItemId);
    if (wcItemId && item) {
      return {
        stock_status: item.status,
        attributes: [
          {
            options: [item.deposit + " €"],
          },
        ],
        ...(item.image && {
          images: [
            {
              src: item.image,
            },
          ],
        }),
        permalink: item.wc_url,
        categories: [
          {
            name: item.category,
          },
        ],
      };
    } else {
      throw new Error("Failed to load wc product, http response code 404");
    }
  }

  async updateItem(item) {
    await new Promise((r) => setTimeout(r, 1500));
  }

  async createItem(item) {
    await new Promise((r) => setTimeout(r, 1500));
    return {
      permalink: "link",
      id: "wcId",
    };
  }
}

export default WoocommerceClientMock;
