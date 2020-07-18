<script>
  import { getContext } from 'svelte';
  import Table from '../Table/Table.svelte';
  import EditCustomerPopup from './EditCustomerPopup.svelte';
  
  const { open } = getContext('simple-modal');

  Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
  }

  let columns = [
    {
      'title': 'Id',
      'key': 'id'
    },
    {
      'title': 'Nachname',
      'key': 'lastname'
    },
    {
      'title': 'Vorname',
      'key': 'firstname'
    },
    {
      'title': 'Strasse',
      'key': 'street'
    },
    {
      'title': 'Hausnummer',
      'key': 'number'
    },
    {
      'title': 'Postleitzahl',
      'key': 'zipcode'
    },
    {
      'title': 'Stadt',
      'key': 'city'
    },
    {
      'title': 'Beitritt',
      'key': 'created',
      'map': date => `${String(date.getDate()).padStart(2, 0)}.${String(date.getMonth() + 1).padStart(2, 0)}.${date.getFullYear()}`
    },
    {
      'title': 'E-Mail',
      'key': 'mail'
    },
    {
      'title': 'Telefonnummer',
      'key': 'phone'
    },
    {
      'title': 'Newsletter',
      'key': 'newsletter',
      'map': value => value ? 'Ja' : 'Nein'
    },
    {
      'title': 'Aufmerksam geworden',
      'key': 'heard'
    }
  ]

  let rows = [];

  for (let i = 0; i < 1000; i++) {
    let customer = {
      'id': i,
      'lastname': 'Mustermann',
      'firstname': `Max`,
      'street': 'Musterstrasse',
      'number': i,
      'zipcode': '76131',
      'city': 'Karlsruhe',
      'created': new Date().addDays(i - 1000),
      'mail': 'max.mustermann@gmail.com',
      'phone': '123456',
      'newsletter': i % 2 == 0,
      'heard': 'Internet'
    };
    rows.push({
      ...customer,
      'onclick': () => open(EditCustomerPopup, { customer })
    })
  }
</script>

<Table {rows} {columns}></Table>