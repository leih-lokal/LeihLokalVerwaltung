<script>
  import { getContext } from 'svelte';
  import Table from '../Table/Table.svelte';
  import EditCustomerPopup from './EditCustomerPopup.svelte';
  import {saveParseDateToString} from '../../utils/utils.js'
  import Database from '../../utils/database.js'
  
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
  Database.fetchAllCustomers().then(customers => rows = customers);
</script>

<Table {rows} {columns}></Table>