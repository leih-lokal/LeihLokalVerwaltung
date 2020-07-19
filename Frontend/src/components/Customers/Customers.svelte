<script>
  import { getContext } from 'svelte';
  import Table from '../Table/Table.svelte';
  import EditCustomerPopup from './EditCustomerPopup.svelte';
  import PouchDB from 'pouchdb-browser'
  import {saveParseDateToString} from '../../utils/utils.js'

  var customerDb = new PouchDB({
    'name': 'http://192.168.178.50:5984/customers',
    'auth.username': 'admin',
    'auth.password': 'password'
    });

  async function fetchCustomersFromDb() {
    const allDocs = await customerDb.allDocs({
      include_docs: true
    })
    return allDocs.rows.map(row => row.doc)
  }
  
  const { open } = getContext('simple-modal');

  let columns = [
    {
      'title': 'Id',
      'key': '_id',
      'map': id => parseInt(id)
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
      'key': 'house_number'
    },
    {
      'title': 'Postleitzahl',
      'key': 'postal_code'
    },
    {
      'title': 'Stadt',
      'key': 'city'
    },
    {
      'title': 'Beitritt',
      'key': 'registration_date',
      'map': date => saveParseDateToString(date)
    },
    {
      'title': 'Verlängert am',
      'key': 'renewed_on',
      'map': date => saveParseDateToString(date)
    },
    {
      'title': 'Bemerkung',
      'key': 'remark'
    },
    {
      'title': 'E-Mail',
      'key': 'email'
    },
    {
      'title': 'Telefonnummer',
      'key': 'telephone_number'
    },
    {
      'title': 'Newsletter',
      'key': 'subscribed_to_newsletter',
      'map': value => String(value).toLowerCase() == 'true' ? 'Ja' : 'Nein'
    }
  ]
  // TODO: spalten aufmerksam + kommentar fehlen

  let rows = [];
  fetchCustomersFromDb().then(customers => {
    rows = customers
    console.log(rows[0])
  });

  
</script>

<Table {rows} {columns}></Table>