# sparkassen-parser

> Parse the Wikipedia table of all German Sparkassen into a JSON file

## About

This project was originally created for the OSM [name-suggestion-index](https://github.com/osmlab/name-suggestion-index) but it can also be used for other purposes.

It consists of 4 files:

- `sparkassen.js` (The actual parser and the logic behind the whole project)
- `sparkassen.raw.json` (The first output of the parser which can be used for some further processing)
- `sparkassen.json` (The second output of the parser which could be used directly by the OSM [name-suggestion-index](https://github.com/osmlab/name-suggestion-index))
- `sparkassen.verified.json` (A human-verified version of the `sparkassen.json` file without some issues which exist in the `sparkassen.json` file)

## Status

Last update: 16.03.2019

## License

This software is released under the terms of the [GNU General Public License](http://www.gnu.org/licenses/gpl-3.0.html).
