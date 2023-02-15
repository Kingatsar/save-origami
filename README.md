# Saving Origami

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/username/repo.svg)](https://github.com/username/repo/issues)
[![GitHub stars](https://img.shields.io/github/stars/username/repo.svg)](https://github.com/username/repo/stargazers)

This is a WebGL project. You will find 5 small 'living' origamis on a computer desktop. Each of the origamis is trapped in a spherical glass. Try to break the glass to set them free... 

![Saving the origamis project](./app/assets/models/save-origami.JPG).

## Table of Contents

- [Installation](#installation)
- [License](#license)
- [Useful git repositories](#usefulgitrepositories)

## Installation

Instructions for installing the project locally. Project using the ES6 modules of three.js and rollup.

### Install node JS
This projects requires to install npm and the latest version of node. Here are the following instructions to install it with a node version manager (nvm):

``` cmd
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash 
nvm -v
nvm ls-remote
nvm install node
node -v
npm -v
```

### Install project

After downloading the repository, execute `npm install` once in the root directory to install all dependencies.

You can then start a local server by using `npm run dev` then `npm start` and open `http://localhost:3000/app/` for testing.


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Useful git repositories 

Useful git repositories that helped for this project:

- Mugen87: [three-jsm](https://github.com/Mugen87/three-jsm)
- fdoganis: [three-parcel](https://github.com/fdoganis/three_parcel)
- mrdoob/three.js/: [physics_ammo_break](https://github.com/mrdoob/three.js/blob/master/examples/physics_ammo_break.html)

