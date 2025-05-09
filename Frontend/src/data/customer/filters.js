const ONE_YEAR_AGO_MILLIS = new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 365).toLocaleDateString('fr-CA');

// PocketBase filter syntax

export default {
  filters: {
    "Newsletter: Ja": 'newsletter = true',
    "Newsletter: Nein": 'newsletter = false',
    "Beitritt vor > 1 Jahr": `registered_on < '${ONE_YEAR_AGO_MILLIS}'`,
    "Beitritt vor < 1 Jahr": `registered_on > '${ONE_YEAR_AGO_MILLIS}'`,
    "Verlängert vor > 1 Jahr": `renewed_on < '${ONE_YEAR_AGO_MILLIS}'`,
    "Verlängert vor < 1 Jahr": `renewed_on > '${ONE_YEAR_AGO_MILLIS}'`,
  },
  activeByDefault: [],
};
