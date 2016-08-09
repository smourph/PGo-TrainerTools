# Pokemon Go - Trainer Tools

The Pokemon GO tool to extract and display player informations (without cheats and scripted actions !)

## Table of Contents

* [About branches](#about-branches)
* [Features](#features)
* [Getting started](#getting-started)
  * [Installation](#installation)
  * [Usage](#usage)
* [FAQ](#faq)
* [TODO list](#todo-list)
* [Contributing guidelines](#contributing-guidelines)
* [Contributors](#contributors)
* [Credits](#credits)

## About branches

### Dev

Dev branch has the most up-to-date features, but be aware that there might be some broken changes.
Your contribution and PR for fixes are warm welcome.

### Master

Master branch is the stable branch.
No PR on master branch to keep things easier.

## Features

* TODO

## Getting started

### Installation

[Wiki - Installation](https://github.com/smourph/PGo-TrainerTools/wiki/Installation)

Make sure you install :

* the required tools: [Requirements](https://github.com/smourph/PGo-TrainerTools/wiki/Installation#required-tools)
* pip packages: [pip package installation](https://github.com/smourph/PGo-TrainerTools/wiki/Installation#pip-packages-installation)

#### Note on virtualenv

We recommend you use virtualenv, not only will this tool keep your OS clean from all the python plugins.
It also provide an virtual space for more than 1 instance!

### Usage

#### Scan tool

1. Copy `config.json.example` to `config.json`
2. Edit `config.json` and replace auth_service (`google` or `apc`), username, password and location with your parameters
3. Launch the python script
   ```bash
   python scanner.py
   ```

#### Web view tool

1. Go to `web` dir
2. Copy `trainersdata.js.example` to `trainersdata.js`
3. Edit `trainersdata.js` and replace trainer with your parameters (same as Scan tool username)
4. Configure a web server (see next section)

#### Web server

* Use apache or nginx

 TODO

* Use SimpleHTTPServer with python

 Launch web server :
 ```bash
 python -m SimpleHTTPServer [port]
 ```

You can now visit the page http://127.0.0.1:8000

## FAQ

TODO

## TODO list

* [ ] **Redesign pokemons in bag, items in bag and pokedex**
* [ ] **Launch a scan directly with javascript**
* [ ] Use an Object Oriented API
* [ ] Complete README.md section
* [ ] Complete wiki section (Home, Getting started, FAQ, Dev guidelines)

## Contributing guidelines

See CONTRIBUTING (TODO)

---------

## Contributors

*Don't forget add yours here when you create PR*

* 

-------

## Credits

* [tejado](https://github.com/tejado) for the API
* [OpenPoGo](https://github.com/OpenPoGo/OpenPoGoWeb) for the front web tools
* [PokemonGoF](https://github.com/PokemonGoF/PokemonGo-Bot) for the docs and wiki
