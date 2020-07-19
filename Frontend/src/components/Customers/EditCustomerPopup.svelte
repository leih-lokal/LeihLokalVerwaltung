<script>
  export let customer;
</script>

<h2>Kunde bearbeiten</h2>
<form>
  <div class="row">
    <div class="col-25">
      <label for="id">Id</label>
    </div>
    <div class="col-75">
      <input type="text" id="id" name="id" value={customer._id}>
    </div>
  </div>
  <div class="row">
    <div class="col-25">
      <label for="firstname">Vorname</label>
    </div>
    <div class="col-75">
      <input type="text" id="firstname" name="firstname" value={customer.firstname}>
    </div>
  </div>
  <div class="row">
    <div class="col-25">
      <label for="lastname">Nachname</label>
    </div>
    <div class="col-75">
      <input type="text" id="lastname" name="lastname" value={customer.lastname}>
    </div>
  </div>
  <div class="row">
    <div class="col-25">
      <label for="street">Strasse</label>
    </div>
    <div class="col-75">
      <input type="text" id="street" name="street" value={customer.street}>
    </div>
  </div>
  <div class="row">
    <div class="col-25">
      <label for="house_number">Hausnummer</label>
    </div>
    <div class="col-75">
      <input type="text" id="house_number" name="house_number" value={customer.house_number}>
    </div>
  </div>
  <div class="row">
    <div class="col-25">
      <label for="postal_code">Postleitzahl</label>
    </div>
    <div class="col-75">
      <input type="text" id="postal_code" name="postal_code" value={customer.postal_code}>
    </div>
  </div>
  <div class="row">
    <div class="col-25">
      <label for="city">Stadt</label>
    </div>
    <div class="col-75">
      <input type="text" id="city" name="city" value={customer.city}>
    </div>
  </div>
  <div class="row">
    <div class="col-25">
      <label for="registration_date">Beitritt</label>
    </div>
    <div class="col-75">
      <input type="text" id="registration_date" name="registration_date" value={customer.registration_date}>
    </div>
  </div>
  <div class="row">
    <div class="col-25">
      <label for="renewed_on">Verlängert am</label>
    </div>
    <div class="col-75">
      <input type="text" id="renewed_on" name="renewed_on" value={customer.renewed_on}>
    </div>
  </div>
  <div class="row">
    <div class="col-25">
      <label for="remark">Bemerkung</label>
    </div>
    <div class="col-75">
      <input type="text" id="remark" name="remark" value={customer.remark}>
    </div>
  </div>
  <div class="row">
    <div class="col-25">
      <label for="email">E-Mail</label>
    </div>
    <div class="col-75">
      <input type="text" id="email" name="email" value={customer.email}>
    </div>
  </div>
  <div class="row">
    <div class="col-25">
      <label for="telephone_number">Telefonnummer</label>
    </div>
    <div class="col-75">
      <input type="text" id="telephone_number" name="telephone_number" value={customer.telephone_number}>
    </div>
  </div>
  <div class="row">
    <div class="col-25">
      <label for="subscribed_to_newsletter">Newsletter</label>
    </div>
    <div class="col-75">
      <input type="checkbox" id="subscribed_to_newsletter" name="subscribed_to_newsletter" checked={customer.subscribed_to_newsletter}>
    </div>
  </div>
  <div class="row">
    <div class="col-25">
      <label for="heard">Aufmerksam geworden</label>
    </div>
    <div class="col-75">
      <input type="text" id="heard" name="heard" value={customer.heard}>
    </div>
  </div>
</form>

<style>
  input[type=text], select, textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    resize: vertical;
  }

  label {
    padding: 12px 12px 12px 0;
    display: inline-block;
  }

  .col-25 {
    float: left;
    width: 25%;
    margin-top: 6px;
  }

  .col-75 {
    float: left;
    width: 75%;
    margin-top: 6px;
  }

  .row:after {
    content: "";
    display: table;
    clear: both;
  }

  @media screen and (max-width: 600px) {
    .col-25, .col-75, input[type=submit] {
      width: 100%;
      margin-top: 0;
    }
  }
</style>