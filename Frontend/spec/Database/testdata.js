import COLORS from "../../src/components/Input/ColorDefs";
import rentalColumns from "../../src/components/TableEditors/Rentals/Columns";

export default (time = new Date().getTime()) => {
  const ONE_DAY = 86400000;
  const ONE_WEEK = ONE_DAY * 7;
  const TODAY = time - (time % ONE_DAY);
  const ONE_WEEK_AGO = TODAY - ONE_WEEK;
  const TWO_WEEKS_AGO = TODAY - 2 * ONE_WEEK;
  const IN_ONE_WEEK = TODAY + ONE_WEEK;

  return [
    {
      _id: "1",
      id: 1,
      type: "customer",
      lastname: "Cohen",
      firstname: "Velasquez",
      registration_date: 1538949600000,
      renewed_on: 0,
      remark: "",
      subscribed_to_newsletter: false,
      email: "rmcfarla@outlook.com",
      street: "Blumentorstrasse",
      house_number: "8",
      postal_code: 76135,
      city: "Karlsruhe",
      telephone_number: "01761881433",
      heard: "",
      highlight: COLORS.HIGHLIGHT_YELLOW,
    },
    {
      _id: "2",
      id: 2,
      type: "customer",
      lastname: "Nicholas",
      firstname: "Collins",
      registration_date: 1539295200000,
      renewed_on: 1570838400000,
      remark: "",
      subscribed_to_newsletter: true,
      email: "hachi@gmail.com",
      street: "Klauprechtstraße",
      house_number: "56",
      postal_code: 76131,
      city: "Karlsruhe",
      telephone_number: "01768701629",
      heard: "",
    },
    {
      _id: "3",
      id: 3,
      type: "customer",
      lastname: "Albert",
      firstname: "Morris",
      registration_date: 0,
      renewed_on: 0,
      remark: "",
      subscribed_to_newsletter: false,
      email: "andersbr@att.net",
      street: "Berckmüllerstraße",
      house_number: "10",
      postal_code: 76131,
      city: "Karlsruhe",
      telephone_number: "01761411340",
      heard: "",
    },
    {
      _id: "4",
      id: 4,
      type: "customer",
      lastname: "Uriel",
      firstname: "Gibson",
      registration_date: 1546038000000,
      renewed_on: 1577577600000,
      remark: "Bemerkung 123",
      subscribed_to_newsletter: false,
      email: "mcraigw@yahoo.com",
      street: "Werthmannstraße",
      house_number: 58,
      postal_code: 76137,
      city: "Karlsruhe",
      telephone_number: "01761881433",
      heard: "gesehen, vorbeigelaufen",
    },
    {
      _id: "5",
      id: 5,
      type: "customer",
      lastname: "Viviana",
      firstname: "Peters",
      registration_date: 1546214400000,
      renewed_on: 0,
      remark: "",
      subscribed_to_newsletter: false,
      email: "kannan@sbcglobal.net",
      street: "Gerwigstraße",
      house_number: 97,
      postal_code: 75417,
      city: "Karlsruhe",
      telephone_number: "01764337303",
      heard: "",
    },
    {
      _id: "6",
      id: 6,
      type: "customer",
      lastname: "Bailee",
      firstname: "Jennings",
      registration_date: 1546470000000,
      renewed_on: 0,
      remark: "",
      subscribed_to_newsletter: true,
      email: "augusto@yahoo.com",
      street: "Am Sandberg",
      house_number: 6,
      postal_code: 76131,
      city: "Karlsruhe",
      telephone_number: "01765338748",
      heard: "gesehen, vorbeigelaufen",
    },
    {
      _id: "7",
      id: 7,
      type: "customer",
      lastname: "Kadyn",
      firstname: "Hernandez",
      registration_date: 1546560000000,
      renewed_on: 0,
      remark: "",
      subscribed_to_newsletter: true,
      email: "thaljef@hotmail.com",
      street: "Schückstrasse",
      house_number: 88,
      postal_code: 76131,
      city: "Karlsruhe",
      telephone_number: "01769851841",
      heard: "Internet",
    },
    {
      _id: "8",
      id: 8,
      type: "customer",
      lastname: "Dominic",
      firstname: "Wise",
      registration_date: 1546646400000,
      renewed_on: 0,
      remark: "",
      subscribed_to_newsletter: false,
      email: "brainless@me.com",
      street: "Striederstraße",
      house_number: 67,
      postal_code: 76744,
      city: "Maximiliansau",
      telephone_number: "01762916259",
      heard: "",
    },
    {
      _id: "9",
      id: 9,
      type: "customer",
      lastname: "Lizeth",
      firstname: "Krause",
      registration_date: 1546732800000,
      renewed_on: 0,
      remark: "",
      subscribed_to_newsletter: false,
      email: "webdragon@optonline.net",
      street: "Glümerstraße",
      house_number: 11,
      postal_code: 76139,
      city: "Karlsruhe",
      telephone_number: "01769252281",
      heard: "",
    },
    {
      _id: "10",
      id: 10,
      type: "customer",
      lastname: "Ada",
      firstname: "Mcmillan",
      registration_date: 1546819200000,
      renewed_on: 0,
      remark: "",
      subscribed_to_newsletter: false,
      email: "mhassel@optonline.net",
      street: "Dunantstraße",
      house_number: 93,
      postal_code: 76131,
      city: "Karlsruhe",
      telephone_number: "01761569947",
      heard: "",
    },

    {
      _id: "0001",
      id: 1,
      type: "item",
      name: "Dekupiersäge",
      brand: "King Craft",
      itype: "KFZ-400RV",
      category: "Heimwerker",
      deposit: 55,
      parts: "1",
      added: 1579255200000,
      description: "",
      status: "instock",
      wc_url:
        "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/heimwerker/dekupiersaege-3/",
      wc_id: 3302,
      image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/01/005.jpg",
      highlight: COLORS.HIGHLIGHT_BLUE,
    },
    {
      _id: "0002",
      id: 2,
      type: "item",
      name: "Raclette2",
      brand: "Tefal",
      itype: "Grill Deluxe",
      category: "Küche",
      deposit: 15,
      parts: "12",
      added: 1580346000000,
      description: "8 Pfännchen ohne Schieber mit Crèpezubehör, mit Grillfunktion",
      status: "instock",
      wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kueche/raclette-8/",
      wc_id: 3328,
      image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/01/002.jpg",
    },
    {
      _id: "0003",
      id: 3,
      type: "item",
      name: "Schinkenmaker",
      brand: "gs-mm Germany",
      itype: "KASCHKA",
      category: "",
      deposit: 5,
      parts: "7",
      added: 1580342400000,
      description: "Schinkenmacher zur Herstellung von Bioaufschnitt, aus Edelstahl",
      status: "deleted",
    },
    {
      _id: "0004",
      id: 4,
      type: "item",
      name: "Mini- Ofen",
      brand: "Tefal",
      itype: "KASCHKA",
      category: "",
      deposit: 15,
      parts: "1",
      added: 1580342400000,
      description: "",
      status: "deleted",
    },
    {
      _id: "0005",
      id: 5,
      type: "item",
      name: "Eishörnchen- Waffeleisen",
      brand: "Tchibo",
      itype: "239725",
      category: "Küche",
      deposit: 15,
      parts: "1",
      added: 1580349600000,
      description: "",
      status: "outofstock",
      wc_url:
        "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kueche/eishoernchen-waffeleisen/",
      wc_id: 3346,
      image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/01/005.jpg",
    },
    {
      _id: "0006",
      id: 6,
      type: "item",
      name: "Photoscanner",
      brand: "Ion",
      itype: "Photo slide and Film scanner",
      category: "Freizeit",
      deposit: 15,
      parts: "8",
      added: 1580342400000,
      description: "mit zwei 2GB Speicherkarten",
      status: "instock",
      wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/freizeit/photoscanner/",
      wc_id: 3348,
      image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/01/006.jpg",
    },
    {
      _id: "0007",
      id: 7,
      type: "item",
      name: "Akku Bohrschrauber",
      brand: "Bonus, Max Bahr",
      itype: "909003 2008",
      category: "Heimwerker",
      deposit: 15,
      parts: "8",
      added: 1580342400000,
      description: "ABS 18VE (18 V) mit 2 Maschinen 3 Akkus 2 Ladestationen und 1 Ladekabel",
      status: "outofstock",
      synonyms: "Bohrer",
      wc_url:
        "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/heimwerker/akku-bohrschrauber/",
      wc_id: 3349,
      image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/01/007.jpg",
    },
    {
      _id: "0008",
      id: 8,
      type: "item",
      name: "Nähmaschine",
      brand: "Medion",
      itype: "overlook MD 16600",
      category: "Haushalt",
      deposit: 55,
      parts: "1",
      added: 1580342400000,
      description: "Nähen, Schneidern, Versäubern (1300 Stiche pro Minute)/nur 3 Aufstecker",
      status: "instock",
      wc_url:
        "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/haushalt/naehmaschine-2/",
      wc_id: 3350,
      image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/01/008.jpg",
    },
    {
      _id: "0009",
      id: 9,
      type: "item",
      name: "Joghurt-Automat",
      brand: "gourmetmaxx",
      itype: "XJ -10101",
      category: "Küche",
      deposit: 15,
      parts: "8",
      added: 1580342400000,
      description: "7Gläser inkl. Deckel",
      status: "instock",
      wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kueche/einmachglaeser/",
      wc_id: 3351,
      image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/01/009.jpg",
    },
    {
      _id: "0010",
      id: 10,
      type: "item",
      name: "nicht neu vergeben jetzt 217",
      brand: "",
      itype: "",
      category: "",
      deposit: 0,
      parts: "",
      added: 0,
      description: "",
      status: "deleted",
    },
    {
      _id: "0011",
      id: 11,
      type: "item",
      name: "el. Universal Pfanne",
      brand: "elta",
      itype: "PP 110N",
      category: "Küche",
      deposit: 15,
      parts: "3",
      added: 1581292800000,
      description: "Backen- Grillen- kochen- Dünsten und Warmhalten",
      status: "instock",
      wc_url:
        "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kueche/e-universal-pfanne/",
      wc_id: 3406,
      image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/02/11.jpg",
    },
    {
      _id: "0012",
      id: 12,
      type: "item",
      name: "Raclette",
      brand: "TCM",
      itype: "64698",
      category: "Küche",
      deposit: 15,
      parts: "1188",
      added: 1581292800000,
      description: "mit Stufenloser Temperatur- Einstellung, 8 Pfännchen inkl. Schaber",
      status: "instock",
      wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kueche/raclette-9/",
      wc_id: 3420,
      image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/02/12.jpg",
    },
    {
      _id: "0013",
      id: 13,
      type: "item",
      name: "Waffeleisen",
      brand: "Rowenta",
      itype: "KG-85 A86",
      category: "Küche",
      deposit: 15,
      parts: "1",
      added: 1581292800000,
      description: "",
      status: "onbackorder",
      wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kueche/waffeleisen-6/",
      wc_id: 3421,
      image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/02/13.jpg",
    },
    {
      _id: "0014",
      id: 14,
      type: "item",
      name: "Weihnachtskerzen",
      brand: "Weihnachtskerzen",
      itype: "KASCHKA",
      category: "Haushalt",
      deposit: 5,
      parts: "1",
      added: 1581292800000,
      description:
        "20 teilig LED, mit Saugnäpfen,kabellos →  jede einzelne braucht Batterie +Fernbedienug (nicht alle funktionieren)",
      status: "deleted",
    },
    {
      _id: "0015",
      id: 15,
      type: "item",
      name: "Stichsäge",
      brand: "TOP Craft",
      itype: "TPS 550E",
      category: "Heimwerker",
      deposit: 15,
      parts: "2",
      added: 1581292800000,
      description: "mit Auffangbeutel von Bosch",
      status: "outofstock",
      wc_url:
        "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/heimwerker/stichsaege-6/",
      wc_id: 3423,
      image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/02/15.jpg",
    },

    {
      _id: "000eb2bf4e2402858e0e8174d16ec523",
      item_id: 17,
      type: "rental",
      item_name: "Mini-Handkreissäge",
      rented_on: TWO_WEEKS_AGO,
      extended_on: 0,
      to_return_on: ONE_WEEK_AGO,
      passing_out_employee: "MM",
      customer_id: 409,
      customer_name: "Kauk",
      deposit: 15,
      deposit_returned: -15,
      returned_on: ONE_WEEK_AGO,
      receiving_employee: "MM",
      remark: "",
      image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/1908.jpg",
      expectedCellBackgroundColors: new Array(rentalColumns.length).fill(
        COLORS.DEFAULT_ROW_BACKGROUND_ODD
      ),
    },
    {
      _id: "00149eb362e4e8a2ab43ad5e5f6d2904",
      item_id: 2,
      type: "rental",
      item_name: "el. Universalzerkleinerer",
      rented_on: TWO_WEEKS_AGO,
      extended_on: 0,
      to_return_on: ONE_WEEK_AGO,
      passing_out_employee: "VD",
      customer_id: 29,
      customer_name: "Troost",
      deposit: 5,
      deposit_returned: -5,
      returned_on: 0,
      receiving_employee: "WS",
      remark: "",
      expectedCellBackgroundColors: new Array(rentalColumns.length).fill(COLORS.RENTAL_LATE_RED),
    },
    {
      _id: "00161450d33a9688152864ddc1109dda",
      item_id: 3,
      type: "rental",
      item_name: "Bohrer",
      rented_on: TWO_WEEKS_AGO,
      extended_on: ONE_WEEK_AGO,
      to_return_on: TODAY,
      passing_out_employee: "MM",
      customer_id: 427,
      customer_name: "Weber ",
      deposit: 217,
      deposit_returned: -10,
      returned_on: 0,
      receiving_employee: "MM",
      remark: "4 Stück 4.4.5.6.",
      image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/04/5023.jpg",
      expectedCellBackgroundColors: new Array(rentalColumns.length).fill(
        COLORS.RENTAL_TO_RETURN_TODAY_BLUE
      ),
    },
    {
      _id: "001e458f159f72cb68f97cf9e66da014",
      item_id: 4,
      type: "rental",
      item_name: "Mini Handkreissäge",
      rented_on: ONE_WEEK_AGO,
      extended_on: 0,
      to_return_on: TODAY,
      passing_out_employee: "KA",
      customer_id: 258,
      customer_name: "0",
      deposit: 25,
      deposit_returned: -25,
      returned_on: 0,
      receiving_employee: "CI",
      remark: "",
      image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/1107.jpg",
      expectedCellBackgroundColors: new Array(rentalColumns.length).fill(
        COLORS.RENTAL_TO_RETURN_TODAY_BLUE
      ),
    },
    {
      _id: "00476565ea2f645b74692e0aac9f7514",
      item_id: 1,
      type: "rental",
      item_name: "Dekupiersäge",
      rented_on: ONE_WEEK_AGO,
      extended_on: 0,
      to_return_on: TODAY,
      passing_out_employee: "AN",
      customer_id: 90,
      customer_name: "Lambert",
      deposit: 15,
      deposit_returned: -15,
      returned_on: TODAY,
      receiving_employee: "SK",
      remark: "",
      image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/01/005.jpg",
      expectedCellBackgroundColors: rentalColumns.map((col) => {
        if (col.key === "item_id" || col.key === "item_name") return COLORS.HIGHLIGHT_BLUE;
        else return COLORS.RENTAL_RETURNED_TODAY_GREEN;
      }),
    },
    {
      _id: "005604ea4fce99a1b3ad7a06915629f8",
      item_id: 6,
      type: "rental",
      item_name: "Handkreissäge",
      rented_on: TODAY,
      extended_on: 0,
      to_return_on: IN_ONE_WEEK,
      passing_out_employee: "KA",
      customer_id: 222,
      customer_name: "Herbert",
      deposit: 25,
      deposit_returned: -25,
      returned_on: 0,
      receiving_employee: "",
      remark: "",
      image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/1708.jpg",
      expectedCellBackgroundColors: new Array(rentalColumns.length).fill(
        COLORS.DEFAULT_ROW_BACKGROUND_ODD
      ),
    },
    {
      _id: "0068a7b96d0cb7d41c72d9e7b9085e83",
      item_id: 7,
      type: "rental",
      item_name: "Dampfreiniger",
      rented_on: TODAY,
      extended_on: 0,
      to_return_on: IN_ONE_WEEK,
      passing_out_employee: "MM",
      customer_id: 744,
      customer_name: "Maile",
      deposit: 55,
      deposit_returned: -55,
      returned_on: 0,
      receiving_employee: "MM",
      remark: "0176 45809592 Frau 175 anrufen, wenn wieder da",
      image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/11/3312.jpg",
      expectedCellBackgroundColors: new Array(rentalColumns.length).fill(
        COLORS.DEFAULT_ROW_BACKGROUND_ODD
      ),
    },
    {
      _id: "007737b7e60654e862fb3756beffbc06",
      item_id: 8,
      type: "rental",
      item_name: "CD-Radio",
      rented_on: TODAY,
      extended_on: 0,
      to_return_on: IN_ONE_WEEK,
      passing_out_employee: "KA",
      customer_id: 1,
      customer_name: "Cohen",
      deposit: 217,
      deposit_returned: -10,
      returned_on: 0,
      receiving_employee: "CI",
      remark: "kommt zum RC",
      image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/1814.jpg",
      expectedCellBackgroundColors: rentalColumns.map((col) => {
        if (col.key === "customer_name" || col.key === "customer_id")
          return COLORS.HIGHLIGHT_YELLOW;
        else return COLORS.DEFAULT_ROW_BACKGROUND_ODD;
      }),
    },
    {
      _id: "00a8d5c18c7377bf6e3802faaac1a089",
      item_id: 9,
      type: "rental",
      item_name: "Holz-Sägen",
      rented_on: TODAY,
      extended_on: 0,
      to_return_on: IN_ONE_WEEK,
      passing_out_employee: "LH",
      customer_id: 1046,
      customer_name: "Weiß",
      deposit: 5,
      deposit_returned: -5,
      returned_on: 0,
      receiving_employee: "LH",
      remark: "",
      image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/10/5003.jpg",
      expectedCellBackgroundColors: new Array(rentalColumns.length).fill(
        COLORS.DEFAULT_ROW_BACKGROUND_ODD
      ),
    },
    {
      _id: "00b2e7344faa8300caa973a712445c01",
      item_id: 10,
      type: "rental",
      item_name: "Infrarot-Strahler",
      rented_on: TODAY,
      extended_on: 0,
      to_return_on: IN_ONE_WEEK,
      passing_out_employee: "MM",
      customer_id: 343,
      customer_name: "Weck",
      deposit: 5,
      deposit_returned: -5,
      returned_on: 0,
      receiving_employee: "MM",
      remark: "am 17.7.20 per email erinnert",
      image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/1218.jpg",
      expectedCellBackgroundColors: new Array(rentalColumns.length).fill(
        COLORS.DEFAULT_ROW_BACKGROUND_ODD
      ),
    },
  ];
};