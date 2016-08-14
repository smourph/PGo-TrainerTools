# Pokemon Go - Trainer Tools

The Pokemon GO tool to extract and display player informations (without cheats and scripted actions !)

## Table of Contents

* [About branches](#about-branches)
* [Features](#features)
* [Getting started](#getting-started)
  * [Basic installation](#basic-installation)
  * [Usage](#usage)
  * [Remote API with server installation](#remote-api-with-server-installation)
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

### Basic installation

[Basic Installation (see INSTALL.md)](INSTALL.md)

> #### Note on virtualenv
> We recommend you use virtualenv, not only will this tool keep your OS clean from all the python plugins.
> It also provide an virtual space for more than 1 instance!

### Usage

#### Start a scan

```bash
python trainertools.py
```

#### Launch a web server

* Use apache or nginx

 TODO

* Use SimpleHTTPServer with python

 From `web` directory :
 ```bash
 python -m SimpleHTTPServer
 ```

You can now visit the web page at http://127.0.0.1:8000

### Remote API with server installation

[Remote server installation (see remote_INSTALL.md)](remote_INSTALL.md) (TODO)

#### Start server

```bash
python trainertools.py -os
```

## FAQ

[Wiki - FAQ](https://github.com/smourph/PGo-TrainerTools/wiki/FAQ) (TODO)

## TODO list

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
