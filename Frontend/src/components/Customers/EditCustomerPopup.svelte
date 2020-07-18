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
      <input type="text" id="id" name="id" value={customer.id}>
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
      <label for="number">Hausnummer</label>
    </div>
    <div class="col-75">
      <input type="text" id="number" name="number" value={customer.number}>
    </div>
  </div>
  <div class="row">
    <div class="col-25">
      <label for="zipcode">Postleitzahl</label>
    </div>
    <div class="col-75">
      <input type="text" id="zipcode" name="zipcode" value={customer.zipcode}>
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
      <label for="created">Beitritt</label>
    </div>
    <div class="col-75">
      <input type="text" id="created" name="created" value={customer.created}>
    </div>
  </div>
  <div class="row">
    <div class="col-25">
      <label for="newsletter">Newsletter</label>
    </div>
    <div class="col-75">
      <input type="checkbox" id="newsletter" name="newsletter" checked={customer.newsletter}>
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