# Manual installation

## Table of Contents
- [Linux and Mac Installation](#linux-and-mac)
- [Windows](#windows)
- [For all OS](#for-all-os)

## Linux and Mac
Ubuntu OS will be used for this example

### First install required packages

#### Linux
```bash
sudo apt-get install build-essential autoconf libtool pkg-config make python2.7-dev wget git
```
####
if you are on a different Linux OS you maybe have to adapt things like:

- package manager (for example yum instead of apt-get)
- package names

#### Mac

```bash
brew install --devel protobuf
brew install  autoconf libtool pkg-config wget git
```

### Mac + Linux installation
make shure you installed everything above

- get pip for pyton2.7

```bash
wget https://bootstrap.pypa.io/get-pip.py
python2.7 get-pip.py
rm -f get-pip.py
```

####
- clone git repository (please keep in mind that master is not always up-to-date whereas 'dev' is. In the installation note below change `master` to `dev` if you want to get and use the latest version)

```bash
git clone -b master https://github.com/smourph/PGo-TrainerTools.git
cd PGo-TrainerTools
```

####
- install virtualenv, create an python environment in root folder and activate it

```bash
pip install virtualenv
virtualenv .
source bin/activate
```

####
- install the requirements

```bash
pip install -r requirements.txt
```

####
- get the needed encryption.so

```bash
wget http://pgoapi.com/pgoencrypt.tar.gz && tar -xzvf pgoencrypt.tar.gz
cd pgoencrypt/src/
make
cd ../../
mv pgoencrypt/src/libencrypt.so libencrypt.so
rm -r pgoencrypt && rm pgoencrypt.tar.gz
```

####
- check if your git repo is up to date (before, make sure you have activated virtualenv env by using `source bin/activate`)

```bash
git pull
pip install -r requirements.txt
```

####
- finaly launch your first scan

```bash
python trainertools.py
```
####

> after rebooting or closing the terminal at every new start go into the root folder by going into the folder where you started installing it an then
> ```bash
> cd PGo-TrainerTools
> #activate virtualenv and start
> source bin/activate
> python trainertools.py
> ```

## Windows
### Windows vista, 7, 8:
Go to : http://pyyaml.org/wiki/PyYAML , download the right version for your pc and install it

#### Windows 10:
Go to [this](http://www.lfd.uci.edu/~gohlke/pythonlibs/#pyyaml) page and download: PyYAML-3.11-cp27-cp27m-win32.whl
(If running 64-bit python or if you get a 'not a supported wheel on this platform' error,
download the 64 bit version instead: PyYAML-3.11-cp27-cp27m-win_amd64.whl )

*(Run the following commands from Git Bash.)*

```
// switch to the directory where you downloaded PyYAML
cd download-directory
// install 32-bit version
pip2 install PyYAML-3.11-cp27-cp27m-win32.whl
// if you need to install the 64-bit version, do this instead:
// pip2 install PyYAML-3.11-cp27-cp27m-win_amd64.whl
```

After this, just do:

```
git clone -b master https://github.com/smourph/PGo-TrainerTools.git
cd PGo-TrainerTools.git
virtualenv .
script\activate
pip2 install -r requirements.txt
git submodule init
git submodule update
```

#### Get encrypt.so (Windows part writing need fine tune)
Due to copywrite on the encrypt.so we are not directly hosting it. Please find a copy elsewhere on the internet and compile it yourself. We accept no responsibility should you encounter any problems with files you download elsewhere.

Ensure you are in the main root folder and run:

`wget http://pgoapi.com/pgoencrypt.tar.gz && tar -xf pgoencrypt.tar.gz && cd pgoencrypt/src/ && make && mv libencrypt.so ../../libencrypt.so && cd ../..`

#### Update
To update your project do (in the project folder): `git pull`

To update python requirement packages do (in the project folder): `pip install --upgrade -r requirements.txt`

## For all OS

###
- copy and edit the config files :
   - config/config.json.example -> config/config.json
   - web/config/settings.js.example -> web/config/settings.js

**Trainer username in `settings.js` must be the same configured in `config.json`**

Example for unix user :
```bash
cp config/config.json.example config/config.json
vi config/config.json
```

```bash
cp web/config/settings.js.example web/config/settings.js
vi web/config/settings.js
```
