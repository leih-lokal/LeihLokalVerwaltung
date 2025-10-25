import { parseTimestampToDatetimeString } from '../../utils/utils.js'
import ColorDefs from '../../components/Input/ColorDefs.js'

const backgroundColor = async (reservation) => reservation.done ? ColorDefs.HIGHLIGHT_GREEN : ''

export default [
    {
        title: 'Nutzer Nr',
        key: 'customer_iid',
        numeric: true,
        display: (value) => value ? String(value).padStart(4, '0') : '-',
        backgroundColor,
    },
    {
        title: 'Nutzer Name',
        key: 'customer_name',
        backgroundColor,
    },
    {
        title: 'Nutzer E-Mail',
        key: 'customer_email',
        disableSort: true,
        backgroundColor,
    },
    {
        title: 'Nutzer Telefon',
        key: 'customer_phone',
        disableSort: true,
        backgroundColor,
    },
    {
        title: 'Neukunde?',
        key: 'is_new_customer',
        disableSort: true,
        display: (value) => value ? 'Ja' : 'Nein',
        backgroundColor,
    },
    {
        title: 'Abholungstermin',
        key: 'pickup',
        initialSort: 'desc',
        display: (value) => parseTimestampToDatetimeString(value),
        backgroundColor,
    },
    {
        title: 'Gegenstände',
        key: 'expand',
        safeHtml: true,
        disableSort: true,
        display: (value) => value.items.map(i => `${String(i.iid).padStart(4, '0')} (${i.name})`).join('<br>'),
        minRowHeight: (value) => Math.max(40, 40 + ((value.items || []).length - 2) * 18),
        backgroundColor,
    },
    {
        title: 'Kommentar',
        key: 'comments',
        disableSort: true,
        backgroundColor,
    }
]