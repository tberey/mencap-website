<br>
<div align="center">
  <a href="https://github.com/tberey">
    <img src="public/assets/images/mencap-logo-a.png" alt="Logo" width="250" height="150">
  </a><br><br>
  <div align="center"><h1>Mencap Liverpool & Sefton Website</h1>Empowering learning disabilities</div>
  <div align="right">
    <br>
    <a href="https://github.com/tberey/mencap-website/blob/main/README.md"><strong>Documentation »</strong></a>
    <br>
    <a href="#usage">View Demo</a>
    ·
    <a href="https://github.com/tberey/mencap-website/issues">Report Bug</a>
    ·
    <a href="https://github.com/tberey/mencap-website/issues">Request Feature</a>
  </div>
</div>

<!-- TABLE OF CONTENTS -->

<details open="open" style="padding:4px;display:inline;border-width:1px;border-style:solid;">
  <summary><b style="display: inline-block"><u>Contents</u></b></summary>
    <ol>
        <li>
        <a href="#about-this-project">About</a>
        <ul>
            <li><a href="#tech-stack">Tech Stack</a></li>
        </ul>
        </li>
        <li>
        <a href="#startup">Startup</a>
        <ul>
            <li><a href="#prerequisites">Prerequisites</a></li>
            <li><a href="#installation">Installation</a></li>
        </ul>
        </li>
        <li>
          <a href="#usage">Usage</a>
          <ul>
            <li><a href="#screenshots">Screenshots</a></li>
        </ul>
        </li>
        <li><a href="#complete-setup-instructions">Complete Setup Instructions</a></li>
        <li><a href="#changelog">Changelog</a></li>
        <li><a href="#contributing">Contributing</a></li>
        <li><a href="#contact">Contact</a></li>
    </ol>
</details><hr><br>

<!-- ABOUT THis PROJECT -->

## About This Project

This is the codebase for the Mencap website.

<br>

### Tech Stack

* [Typescript](https://www.typescriptlang.org/) - Write in TypeScript (or JS), Compiles down to JavaScript.
* [NodeJS](https://nodejs.org/en/) - Node Runtime Environment.
* [ExpressJS](https://expressjs.com/) - Server & Router Infrastructure Framework.
* [EJS](https://ejs.co/) - Serves Client Views.
* [ESLint](https://eslint.org/) - Code Parsing, Styling & Error Checking.
* [Mocha-Chai](https://mochajs.org/) - Testing with Mocha Framework, using the Chai Library.
* [Nodemon](https://nodemon.io/) - Restart Application without Compiling, on a Change to Watched Files.
* [Rimraf](https://www.npmjs.com/package/rimraf) - Directory Cleaner Tool.
* [Dotenv](https://www.npmjs.com/package/dotenv) - Project Secrets Stored in a Local .env File.
* [SimpleTxtLogger](https://www.npmjs.com/package/simple-txt-logger) - Logging tool.
* [@types/*](https://www.npmjs.com/package/@types/node) - Various JS->TS Typesetting modules, to import types. Needed to use a JavaScript module with TypeScript when strict settings are enabled, or to make use of TS only features against a imported module.

<br>

*- See [Complete Instructions](#complete-setup-instructions) to create this template yourself, without any of the extra optional modules.*

<br><hr><br>

<!-- STARTUP -->

## Startup

For help or guidance in downloading and running the application, see the following subsections.

<br>

#### Prerequisites

[You must have npm (node package manager) and Nodejs installed on your system!](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

1. Update npm:

```sh
  npm install npm@latest -g
```

<br>

#### Installation

1. Clone/Download:

```sh
  git clone https://github.com/tberey/mencap-website.git
```

2. Install:

```sh
  npm install
```

3. Start:

```sh
  npm run start
```

<br><hr><br>

<!-- USAGE EXAMPLES -->

## Usage

| Endpoint                          | Action/Desc.                                   | Full URI `<i>`(hosted locally, for some port; e.g.: 3000, which is default for this template)`</i>` |
| :-------------------------------- | :--------------------------------------------- | :------------------------------------------------------------------------------------------------------ |
| `<ul><li>`GET "/"`</li></ul>` | Homepage:`<br>`The client-side landing page. | `<ul><li>`"`http://localhost:3000/`"`</li></ul>`                                                  |

<br>

### Screenshots

Logging Sample `<br>`
![Screenshot#1](https://github.com/tberey/mencap-website/blob/master/screenshots/local-logs-sample.png?raw=true)

<br><hr><br>

## Complete Setup Instructions

The following steps are complete instruction to create this template, but without any of the extra modules, and begin a brand new project in Nodejs with TypeScript from a blank slate. The commands are shell commands, to be carried out in a terminal, console or other shell environment.

1. Create a new local directory and change current directory to new one:

```sh
  mkdir <PROJECT_NAME> && cd <PROJECT_NAME>
```

2. Initialize a new package.json file:

```sh
  npm init -y
```

3. Install TypeScript dependencies:

```sh
  npm i --save-dev typescript ts-node
```

4. Initialize a new tsconfig.json file:

```sh
  npx tsc --init
```

5. [Optional] Some basic parameters to use in the tsconfig.json file. [My settings for this file can be found here](https://github.com/tberey/mencap-website/blob/master/tsconfig.json) also, to copy & paste. Otherwise, adjust this further with own preferences, or leave it as is.

```sh
  {
    "compilerOptions": {
      "target": "es6",
      "module": "commonjs",
      "declaration": true,
      "sourceMap": true,
      "outDir": "build",
      "rootDir": "./",
      "strict": true,
      "esModuleInterop": true
    }
  }
```

6. Create main.ts, the entry point into the application:

```sh
  echo "console.info('Hello, World');" > main.ts
```

7. [Optional] Some basic information and scripts, for the package.json file:

```sh
  {
    "name": "<App-Name>",
    "version": "1.0.0",
    "description": "<App_Desc>",
    "main": "build/main.js",
    "types": "build/main.d.ts"
    "scripts": {
      "setup": "npm update && npm install",
      "build": "tsc",
      "start": "node build/main.js",
      "start:src": "ts-node main.ts"
    }
  }
```

8. [Optional] Install, compile and start application (it won't do much yet, but you're off to a running start now):

```sh
  npm run setup
  npm run build
  npm run start
```

`<sub><b>``<i>`^ Step 8.: These commands require the optional Step 7 to have been followed, to work as intended.`<br>`'npm run setup' installs and updates the project and it's dependencies, 'build' will compile the project into browser/app runnable JS, and 'start' will run the project, from the compiled files in build. 'start:src' runs the project from the source TS file, so compilation is not necessary.`</i></b>``</sub>`

<br><hr><br>

<!-- ROADMAP -->

## Roadmap

Below is the refined and confirmed roadmap, that has been planned for completion. See [open issues][issues-url] and also the [project board][project-url], for any other proposed features or known issues, which may not be listed below.

| Feature/Task/Bugfix       | Details                           | Version `<i>`(if released)`</i>` | Notes                     |
| :------------------------ | :-------------------------------- | :----------------------------------- | :------------------------ |
| `<i>`Bug#1 `</i>`     | `<i>`Bug details...`</i>`     | `<i>`0.0.1 `</i>`                | `<i>`example#1 `</i>` |
| `<i>`Feature#4 `</i>` | `<i>`Feature details...`</i>` |                                      | `<i>`example#2 `</i>` |

<br><hr><br>

<!-- CHANGELOG -->

## Changelog

| Version | Date | Changes |
| :------ | :--- | :------ |
| 1.0.0 | 2024-04-04 | `<ul><li>`Initial Commit.`</li><li>`Add initial directory structure and files.`</li><li>`1.0 full working version of the site. `</li><li>`Create and format README.md `</li></ul>` |
| 1.0.1 | 2024-04-10 | `<ul><li>`Minor updates to site wording, sticky menu background colour, and a link.`</li><li>`Add staff help page.`</li><li>`Update Dependencies.`</li><li>`Update README.md`</li><ul>` |
| 1.0.2 | 2024-04-11 | `<ul><li>`Mobile formatting and bug fixes.`</li><li>`Add email obfuscation for public repo exposure`</li><li>`Adds new slim social media widgets bar to header`</li><li>`Update README.md`</li><ul>` |
| 1.0.3 | 2024-05-01 | `<ul><li>`Adjust page formatting and layout bug fixes.`</li><li>`Adds hide button to the sticky menu.`</li><li>`General minor improvements or tidy up, based on feedback.`</li><li>`Update README.md`</li><ul>` |

<br><hr><br>

<!-- CONTRIBUTING -->

## Contributing

Contributions are welcomed and, of course, **greatly appreciated**.

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/Feature`)
3. Commit your Changes (`git commit -m 'Add some Feature'`)
4. Push to the Branch (`git push origin feature/Feature`)
5. Open a Pull Request.

<br><hr><br>

<!-- CONTACT -->

### Contact

`<b>`Tom Berey `</b>`;`<br>`tomberey@mencapliverpool.org.uk
