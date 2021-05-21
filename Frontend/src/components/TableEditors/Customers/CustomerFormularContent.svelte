<script>
  import InputTypes from "../../Input/InputTypes";
  import ColorDefs from "../../Input/ColorDefs";
  import InputGroup from "../../Input/PopupFormular/InputGroup.svelte";
  import Database from "../../Database/ENV_DATABASE";
  import { millisAtStartOfToday } from "../../../utils/utils";
  import InputRow from "../../Input/PopupFormular/InputRow.svelte";
  import TextInput from "../../Input/TextInput.svelte";
  import Checkbox from "svelte-checkbox";
  import AutocompleteInput from "../../Input/AutocompleteInput.svelte";
  import DateInput from "../../Input/DateInput.svelte";
  import SelectInput from "../../Input/SelectInput.svelte";
  import CustomerFormularFooter from "./CustomerFormularFooter.svelte";

  export let createNew;
  export let customerDoc = {};
  export let closePopup = () => {};

  if (createNew) {
    customerDoc = {
      registration_date: millisAtStartOfToday(),
      type: "customer",
      lastname: "",
      firstname: "",
      renewed_on: 0,
      remark: "",
      subscribed_to_newsletter: false,
      email: "",
      street: "",
      house_number: "",
      postal_code: "",
      city: "",
      telephone_number: "",
      heard: "",
      highlight: "",
    };
    Database.nextUnusedId("customer").then((id) => (customerDoc["id"] = id));
  }
</script>

<div class="content">
  <h1>{`Kunde ${createNew ? "anlegen" : "bearbeiten"}`}</h1>
  <InputGroup title={"Name"}>
    <InputRow label={"Vorname"} id={"firstname"}>
      <TextInput id={"firstname"} bind:value={customerDoc.firstname} />
    </InputRow>
    <InputRow label={"Nachname"} id={"lastname"}>
      <TextInput id={"lastname"} bind:value={customerDoc.lastname} />
    </InputRow>
  </InputGroup>
  <InputGroup title={"Adresse"}>
    <InputRow label={"Straße"} id={"street"}>
      <AutocompleteInput
        inputId={"street"}
        noResultsText={"Straße noch nicht in Datenbank"}
        bind:value={customerDoc.street}
        searchFunction={(searchTerm) =>
          Database.fetchUniqueCustomerFieldValues("street", searchTerm)}
      />
    </InputRow>
    <InputRow label={"Hausnummer"} id={"house_number"}>
      <TextInput id={"house_number"} bind:value={customerDoc.house_number} />
    </InputRow>
    <InputRow label={"Postleitzahl"} id={"postal_code"}>
      <AutocompleteInput
        inputType={InputTypes.NUMBER}
        inputId={"postal_code"}
        noResultsText={"PLZ noch nicht in Datenbank"}
        bind:value={customerDoc.postal_code}
        searchFunction={(searchTerm) =>
          Database.fetchUniqueCustomerFieldValues("postal_code", searchTerm, true)}
      />
    </InputRow>
    <InputRow label={"Stadt"} id={"city"}>
      <AutocompleteInput
        inputId={"city"}
        noResultsText={"Stadt noch nicht in Datenbank"}
        bind:value={customerDoc.city}
        searchFunction={(searchTerm) => Database.fetchUniqueCustomerFieldValues("city", searchTerm)}
      />
    </InputRow>
  </InputGroup>
  <InputGroup title={"Kontakt"}>
    <InputRow label={"E-Mail"} id={"email"}>
      <TextInput id={"email"} bind:value={customerDoc.email} />
    </InputRow>
    <InputRow label={"Telefonnummer"} id={"telephone_number"}>
      <TextInput id={"telephone_number"} bind:value={customerDoc.telephone_number} />
    </InputRow>
    <InputRow label={"Newsletter"} id={"subscribed_to_newsletter"}>
      <Checkbox
        id={"subscribed_to_newsletter"}
        name={"subscribed_to_newsletter"}
        size="2rem"
        bind:checked={customerDoc.subscribed_to_newsletter}
      />
    </InputRow>
  </InputGroup>
  <InputGroup title={"Mitgliedschaft"}>
    <InputRow label={"Beitritt"} id={"registration_date"}>
      <DateInput bind:value={customerDoc.registration_date} />
    </InputRow>
    <InputRow label={"Verlängert am"} id={"renewed_on"} hide={createNew}>
      <DateInput bind:value={customerDoc.renewed_on} quickset={{ 0: "Heute" }} />
    </InputRow>
    <InputRow label={"Aufmerksam geworden"} id={"heard"}>
      <SelectInput
        bind:value={customerDoc.heard}
        selectionOptions={["Internet", "Freunde & Bekannte", "Zeitung / Medien", "Nachbarschaft"]}
        isMulti={true}
        isCreatable={true}
        isClearable={true}
      />
    </InputRow>
  </InputGroup>
  <InputGroup title={"Sonstiges"}>
    <InputRow label={"Kundennummer"} id={"id"}>
      <TextInput id={"id"} bind:value={customerDoc.id} inputType={InputTypes.NUMBER} />
    </InputRow>
    <InputRow label={"Bemerkung"} id={"remark"}>
      <TextInput id={"remark"} bind:value={customerDoc.remark} multiline={true} />
    </InputRow>
    <InputRow label={"Markieren"} id={"highlight"}>
      <SelectInput
        bind:value={customerDoc.highlight}
        selectionOptions={[
          { value: "", label: "Nicht markieren" },
          {
            value: ColorDefs.HIGHLIGHT_GREEN,
            label: "<a style='color:" + ColorDefs.HIGHLIGHT_GREEN + "'>■</a> Grün",
          },
          {
            value: ColorDefs.HIGHLIGHT_BLUE,
            label: "<a style='color: " + ColorDefs.HIGHLIGHT_BLUE + "'>■</a> Blau",
          },
          {
            value: ColorDefs.HIGHLIGHT_YELLOW,
            label: "<a style='color: " + ColorDefs.HIGHLIGHT_YELLOW + "'>■</a> Gelb",
          },
          {
            value: ColorDefs.HIGHLIGHT_RED,
            label: "<a style='color: " + ColorDefs.HIGHLIGHT_RED + "'>■</a> Rot",
          },
        ]}
        isMulti={false}
        isCreatable={false}
        isClearable={true}
      />
    </InputRow>
  </InputGroup>
</div>
<CustomerFormularFooter {createNew} {customerDoc} {closePopup} />

<style>
  h1 {
    height: 2rem;
    padding: 0.7rem 0.7rem 0.9rem 0.7rem;
    margin: 0;
    width: 100%;
  }
  .content {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-start;
    flex: 1;
    flex-grow: 1;
    overflow: auto;
    min-height: 2em;
  }
</style>
