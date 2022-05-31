import testdata from "../../../TestDataGenerator/testdata.json";
import {
  millisAtStartOfToday,
  saveParseTimestampToString,
} from "../utils/utils";

class WoocommerceClientMock {
  constructor() {}

  async fetchItem(wcItemId) {
    await new Promise((r) => setTimeout(r, 1500));
    const item = testdata.docs.find((item) => item.wc_id == wcItemId);
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

  _translateItemAttributesForWc(item) {
    const hasReturnDateInFuture =
      item.status === "outofstock" &&
      item.rental &&
      item.rental.to_return_on &&
      item.rental.to_return_on >= millisAtStartOfToday() &&
      !item.rental.returned_on;

    let expReturnDate = hasReturnDateInFuture
      ? saveParseTimestampToString(item.rental.to_return_on)
      : "";

    console.log(
      hasReturnDateInFuture,
      item.status,
      item.status === "outofstock",
      item.rental.to_return_on,
      item.rental.to_return_on >= millisAtStartOfToday(),
      item.rental.returned_on,
      !item.rental.returned_on
    );
    console.log(expReturnDate);
  }

  async updateItem(item) {
    this._translateItemAttributesForWc(item);
    await new Promise((r) => setTimeout(r, 1500));
  }

  async deleteItem(item) {
    await new Promise((r) => setTimeout(r, 1500));
  }

  async createItem(item) {
    this._translateItemAttributesForWc(item);
    await new Promise((r) => setTimeout(r, 1500));
    return {
      permalink: "link",
      id: "wcId",
    };
  }
}

export default new WoocommerceClientMock();
