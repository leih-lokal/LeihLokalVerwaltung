import columns from "../../../src/components/TableEditors/Rentals/Columns";
import COLORS from "../../../src/components/Input/ColorDefs";

export default (time = new Date().getTime()) => {
  const ONE_DAY = 86400000;
  const ONE_WEEK = ONE_DAY * 7;
  const TODAY = time - (time % ONE_DAY);
  const ONE_WEEK_AGO = TODAY - ONE_WEEK;
  const TWO_WEEKS_AGO = TODAY - 2 * ONE_WEEK;
  const IN_ONE_WEEK = TODAY + ONE_WEEK;

  return [
    {
      _id: "000eb2bf4e2402858e0e8174d16ec523",
      item_id: "0017",
      item_name: "Mini-Handkreissäge",
      rented_on: TWO_WEEKS_AGO,
      extended_on: 0,
      to_return_on: ONE_WEEK_AGO,
      passing_out_employee: "MM",
      customer_id: "409",
      name: "Kauk",
      deposit: 15,
      deposit_returned: -15,
      returned_on: ONE_WEEK_AGO,
      receiving_employee: "MM",
      remark: "",
      image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/1908.jpg",
      expectedCellBackgroundColors: new Array(columns.length).fill(
        COLORS.DEFAULT_ROW_BACKGROUND_ODD
      ),
    },
    {
      _id: "00149eb362e4e8a2ab43ad5e5f6d2904",
      item_id: "0002",
      item_name: "el. Universalzerkleinerer",
      rented_on: TWO_WEEKS_AGO,
      extended_on: 0,
      to_return_on: ONE_WEEK_AGO,
      passing_out_employee: "VD",
      customer_id: "29",
      name: "Troost",
      deposit: 5,
      deposit_returned: -5,
      returned_on: 0,
      receiving_employee: "WS",
      remark: "",
      expectedCellBackgroundColors: new Array(columns.length).fill(COLORS.RENTAL_LATE_RED),
    },
    {
      _id: "00161450d33a9688152864ddc1109dda",
      item_id: "0003",
      item_name: "Bohrer",
      rented_on: TWO_WEEKS_AGO,
      extended_on: ONE_WEEK_AGO,
      to_return_on: TODAY,
      passing_out_employee: "MM",
      customer_id: "427",
      name: "Weber ",
      deposit: 217,
      deposit_returned: -10,
      returned_on: 0,
      receiving_employee: "MM",
      remark: "4 Stück 4.4.5.6.",
      image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/04/5023.jpg",
      expectedCellBackgroundColors: new Array(columns.length).fill(
        COLORS.RENTAL_TO_RETURN_TODAY_BLUE
      ),
    },
    {
      _id: "001e458f159f72cb68f97cf9e66da014",
      item_id: "0004",
      item_name: "Mini Handkreissäge",
      rented_on: ONE_WEEK_AGO,
      extended_on: 0,
      to_return_on: TODAY,
      passing_out_employee: "KA",
      customer_id: "258",
      name: "0",
      deposit: 25,
      deposit_returned: -25,
      returned_on: 0,
      receiving_employee: "CI",
      remark: "",
      image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/1107.jpg",
      expectedCellBackgroundColors: new Array(columns.length).fill(
        COLORS.RENTAL_TO_RETURN_TODAY_BLUE
      ),
    },
    {
      _id: "00476565ea2f645b74692e0aac9f7514",
      item_id: "0001",
      item_name: "Dekupiersäge",
      rented_on: ONE_WEEK_AGO,
      extended_on: 0,
      to_return_on: TODAY,
      passing_out_employee: "AN",
      customer_id: "90",
      name: "Lambert",
      deposit: 15,
      deposit_returned: -15,
      returned_on: TODAY,
      receiving_employee: "SK",
      remark: "",
      image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/01/005.jpg",
      expectedCellBackgroundColors: columns.map((col) => {
        if (col.key === "item_id" || col.key === "item_name") return COLORS.HIGHLIGHT_BLUE;
        else return COLORS.RENTAL_RETURNED_TODAY_GREEN;
      }),
    },
    {
      _id: "005604ea4fce99a1b3ad7a06915629f8",
      item_id: "0006",
      item_name: "Handkreissäge",
      rented_on: TODAY,
      extended_on: 0,
      to_return_on: IN_ONE_WEEK,
      passing_out_employee: "KA",
      customer_id: "222",
      name: "0",
      deposit: 25,
      deposit_returned: -25,
      returned_on: 0,
      receiving_employee: "",
      remark: "",
      image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/1708.jpg",
      expectedCellBackgroundColors: new Array(columns.length).fill(
        COLORS.DEFAULT_ROW_BACKGROUND_ODD
      ),
    },
    {
      _id: "0068a7b96d0cb7d41c72d9e7b9085e83",
      item_id: "0007",
      item_name: "Dampfreiniger",
      rented_on: TODAY,
      extended_on: 0,
      to_return_on: IN_ONE_WEEK,
      passing_out_employee: "MM",
      customer_id: "744",
      name: "Maile",
      deposit: 55,
      deposit_returned: -55,
      returned_on: 0,
      receiving_employee: "MM",
      remark: "0176 45809592 Frau 175 anrufen, wenn wieder da",
      image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/11/3312.jpg",
      expectedCellBackgroundColors: new Array(columns.length).fill(
        COLORS.DEFAULT_ROW_BACKGROUND_ODD
      ),
    },
    {
      _id: "007737b7e60654e862fb3756beffbc06",
      item_id: "0008",
      item_name: "CD-Radio",
      rented_on: TODAY,
      extended_on: 0,
      to_return_on: IN_ONE_WEEK,
      passing_out_employee: "KA",
      customer_id: "1",
      name: "Cohen",
      deposit: 217,
      deposit_returned: -10,
      returned_on: 0,
      receiving_employee: "CI",
      remark: "kommt zum RC",
      image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/1814.jpg",
      expectedCellBackgroundColors: columns.map((col) => {
        if (col.key === "name" || col.key === "customer_id") return COLORS.HIGHLIGHT_YELLOW;
        else return COLORS.DEFAULT_ROW_BACKGROUND_ODD;
      }),
    },
    {
      _id: "00a8d5c18c7377bf6e3802faaac1a089",
      item_id: "0009",
      item_name: "Holz-Sägen",
      rented_on: TODAY,
      extended_on: 0,
      to_return_on: IN_ONE_WEEK,
      passing_out_employee: "LH",
      customer_id: "1046",
      name: "Weiß",
      deposit: 5,
      deposit_returned: -5,
      returned_on: 0,
      receiving_employee: "LH",
      remark: "",
      image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/10/5003.jpg",
      expectedCellBackgroundColors: new Array(columns.length).fill(
        COLORS.DEFAULT_ROW_BACKGROUND_ODD
      ),
    },
    {
      _id: "00b2e7344faa8300caa973a712445c01",
      item_id: "0010",
      item_name: "Infrarot-Strahler",
      rented_on: TODAY,
      extended_on: 0,
      to_return_on: IN_ONE_WEEK,
      passing_out_employee: "MM",
      customer_id: "343",
      name: "Weck",
      deposit: 5,
      deposit_returned: -5,
      returned_on: 0,
      receiving_employee: "MM",
      remark: "am 17.7.20 per email erinnert",
      image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/1218.jpg",
      expectedCellBackgroundColors: new Array(columns.length).fill(
        COLORS.DEFAULT_ROW_BACKGROUND_ODD
      ),
    },
  ];
};
