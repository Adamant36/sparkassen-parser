const fs = require('fs');
const jsdom = require('jsdom');
const fetch = require('node-fetch');
const wdk = require('wikidata-sdk')

const { JSDOM } = jsdom;

const URL = 'https://de.wikipedia.org/wiki/Liste_der_Sparkassen_in_Deutschland';

if (fs.existsSync('sparkassen.raw.json')) {
  const raw = JSON.parse(fs.readFileSync('sparkassen.raw.json', 'utf-8'));
  fs.writeFileSync('sparkassen.json', JSON.stringify(beautify(raw), null, '\t'), 'utf-8');
} else {
  fetch(URL).then(res => res.text()).then(body => parse(body));
}

function parse(body) {
  const dom = new JSDOM(body);
  const table = dom.window.document.querySelectorAll('table')[1];
  json(table);
}

async function json(table) {
  const rows = table.querySelectorAll('tr');

  const data = [];

  for (let row of rows) {
    const columns = row.querySelectorAll('td');
    if (columns.length > 0) {
      if (typeof columns[0].firstChild === 'undefined') {
        return console.log('There is no Wikipedia entry for this item');
      }

      const title = columns[0].firstChild.title;
      const wikipedia = `de:${title}`;
      const name = columns[0].firstChild.textContent.trim();
      const link = `https://de.wikipedia.org${columns[0].firstChild.href}`;
      const countries = columns[2].textContent.trim().split('/').map(c => `DE-${c}`);
      const amount = columns[4].textContent.trim();

      process.stdout.write(title);

      const wikidata = await entity(wdk.getWikidataIdsFromWikipediaTitles({
        titles: title,
        sites: 'de',
        props: ['info', 'aliases'],
        format: 'json'
      }));

      const id = wikidata.id;
      const aliases = wikidata.aliases;

      data.push({
        title,
        aliases,
        wikipedia,
        id,
        link,
        countries,
        amount
      });

      process.stdout.clearLine();
      process.stdout.cursorTo(0);
    }
  }

  // Sort by amount of branches
  data.sort((a, b) => {
    return (a.amount > b.amount) ? -1 : ((b.amount > a.amount) ? 1 : 0);
  });

  process.stdout.write('\n');
  process.stdout.write(`Found ${data.length} Sparkassen`);
  fs.writeFileSync('sparkassen.raw.json', JSON.stringify(data, null, '\t'), 'utf-8');
  fs.writeFileSync('sparkassen.json', JSON.stringify(beautify(data), null, '\t'), 'utf-8');
}

function beautify(json) {
  // Sort alphabetically
  json.sort((a, b) => {
    return (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0);
  });

  let data = {};

  json.forEach(item => {
    const values = {
      countryCodes: ["de"],
      nocount: true,
      tags: {
        amenity: "bank",
        brand: item.title,
        "brand:wikidata": item.id,
        "brand:wikipedia": item.wikipedia,
        name: 'Sparkasse',
        "official_name": item.title
      }
    };
    if (typeof item.aliases !== 'undefined') {
      values.match = item.aliases.map(v => `amenity/bank|${v}`);
    }
    data[`amenity/bank|${item.title}`] = values;
  });

  return data;
}

// Get the information of a Wikidata item
function entity(url) {
  return new Promise((resolve, reject) => {
    fetch(url)
    .then(response => response.json())
    .then(json => {
      const data = {
        id: Object.keys(json.entities)[0]
      }
      const aliases = json.entities[data.id].aliases.de;
      if (typeof aliases !== 'undefined') {
        data.aliases = aliases.map(alias => alias.value);
      }
      resolve(data);
    }).catch(error => {
      console.error(error);
    });
  });
}
