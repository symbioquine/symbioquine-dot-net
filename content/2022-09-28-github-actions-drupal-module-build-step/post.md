---
date: 2022-09-28
title: 'Building Drupal Modules with GitHub Actions'
slug: 2022-09-28-github-actions-drupal-module-build-step
categories:
    - Tutorials
tags:
  - Software Engineering
---

Sometimes CI architectures are more a product of circumstance than we'd like. The strategy described in this post is a prime example of that.

Many Drupal modules don't require a build step, typically they are just some PHP, yaml, and maybe some Twig/JS/CSS files all checked-in. Those
files then directly form the contents of the release for the module.

Drupal.org's infrastructure is tailored to that style of module. Internally Drupal.org uses an instance of GitLab to host the source code for
each module. Project maintainers tag releases in GitLab then manually create releases at the project level which then become the installable
versions for the Composer "drupal/" prefix. (See the [Drupal docs on using Composer](https://www.drupal.org/docs/develop/using-composer/manage-dependencies).)

Unfortunately, there's another style of module which doesn't seem to be well served by the current Drupal.org infrastructure - modules which
need an arbitrary build step. The example I am going to use in this post is a module that includes some Javascript code that is built with
[Webpack](https://webpack.js.org/).

### Project Setup / Code

To start off, create a new GitHub repository and Drupal.org module project. For clarity and convenience, I recommend making the GitHub repository
name and the Drupal.org project "short name" the same. For that, the name needs to follow the Drupal
[conventions for module naming](https://www.drupal.org/docs/creating-custom-modules/naming-and-placing-your-drupal-module) - basically just
alphanumeric characters and underscores. I've chosen to call my example for this tutorial "symbioquine_dot_net_built_drupal_module_example".

* https://github.com/symbioquine/symbioquine_dot_net_built_drupal_module_example
* https://www.drupal.org/project/symbioquine_dot_net_built_drupal_module_example

I let GitHub generate a default branch, readme, and `.gitignore` file. Then I renamed the branch from `main` to `release` - this will be important
later since our GitHub workflow will update that branch using the results of our automated build when we push specific tags to the development branch.

```sh
git clone https://github.com/symbioquine/symbioquine_dot_net_built_drupal_module_example
git checkout -b development
```

#### `src/main.js`

```js
// Wait until all attached Drupal libraries get loaded
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#example-page-app').innerHTML = "Hello world!";
});
```

#### `package.json`

```js
{
  "name": "symbioquine_dot_net_built_drupal_module_example",
  "version": "1.0.0",
  "description": "A module showing how to automatically build JS code with Webpack and push releases to Drupal.org",
  "license": "GPL-3.0-or-later",
  "repository": {
    "type": "git",
    "url": "https://github.com/symbioquine/symbioquine_dot_net_built_drupal_module_example.git"
  },
  "scripts": {
    "build": "webpack --config webpack.config.js --mode production"
  },
  "devDependencies": {
    "webpack": "^5.36.0",
    "webpack-cli": "^4.6.0"
  },
  "dependencies": {
  }
}
```

#### `webpack.config.js`

```js
module.exports = {
  entry: {
    'built_drupal_module_example': {
      'import': `${__dirname}/src/main.js`,
    },
  },
  output: {
    path: `${__dirname}/drupal_module_src/js`,
    filename: '[name].js',
    clean: true,
  },
};
```

#### `drupal_module_src/composer.json`

```json
{
  "name": "symbioquine/symbioquine_dot_net_built_drupal_module_example",
  "description": "A module showing how to automatically build JS code with Webpack and push releases to Drupal.org",
  "type": "drupal-module",
  "homepage": "https://github.com/symbioquine/symbioquine_dot_net_built_drupal_module_example",
  "authors": [
    {
      "name": "Symbioquine",
      "homepage": "https://github.com/symbioquine",
      "role": "Maintainer"
    }
  ],
  "support": {
    "issues": "https://github.com/symbioquine/symbioquine_dot_net_built_drupal_module_example/issues",
    "source": "https://github.com/symbioquine/symbioquine_dot_net_built_drupal_module_example"
  },
  "license": "GPL-3.0-or-later",
  "minimum-stability": "dev"
}
```

#### `drupal_module_src/symbioquine_dot_net_built_drupal_module_example.info.yml`

```yml
name: Symbioquine.net Built Drupal Module Example
description: This module shows an example of how to automatically build JS code with Webpack and push releases to Drupal.org
type: module
package: Example
core_version_requirement: ^9

```

#### `drupal_module_src/symbioquine_dot_net_built_drupal_module_example.libraries.yml`

```yml
built_drupal_module_example:
  js:
    js/built_drupal_module_example.js:
      preprocess: false
      minified: true

```

#### `drupal_module_src/symbioquine_dot_net_built_drupal_module_example.routing.yml`

```yml
symbioquine_dot_net_built_drupal_module_example_page.content:
  path: '/symbioquine_dot_net_built_drupal_module_example'
  defaults:
    _controller: symbioquine_dot_net_built_drupal_module_example.top_level_controller:content
    _title: 'Example Page'
  requirements:
    _permission: 'access content'

```

#### `drupal_module_src/symbioquine_dot_net_built_drupal_module_example.services.yml`

```yml
services:
  symbioquine_dot_net_built_drupal_module_example.top_level_controller:
    class: Drupal\symbioquine_dot_net_built_drupal_module_example\Controller\ExamplePageController
    arguments: {}

```

#### `drupal_module_src/src/Controller/ExamplePageController.php`

```php
<?php

namespace Drupal\symbioquine_dot_net_built_drupal_module_example\Controller;

use Drupal\Core\Controller\ControllerBase;

/**
 * Defines ExamplePageController class.
 */
class ExamplePageController extends ControllerBase {

  /**
   * Constructs a new ExamplePageController object.
   *
   */
  public function __construct() {
  }

  /**
   * Top-level handler for demo page requests.
   */
  public function content() {
    return [
      'app' => [
        '#markup' => '<div id="example-page-app"></div>',
        '#attached' => [
          'library' => [
            'symbioquine_dot_net_built_drupal_module_example/built_drupal_module_example'
          ],
        ],
      ],
    ];
  }

}
```

#### `.github/workflows/create-release.yml`

```yml
name: Build
on:
  push:
    # Sequence of patterns matched against refs/tags
    tags:
      - 'unbuilt-v*' # Push events to matching unbuilt-v*, i.e. unbuilt-v1.0.0

jobs:
  build:
    name: Create Release
    runs-on: ubuntu-latest
    steps:
      - name: Set RELEASE_VERSION environment variable
        run: echo "RELEASE_VERSION=${GITHUB_REF:19}" >> $GITHUB_ENV

      - name: Checkout code
        uses: actions/checkout@v2
        with:
          path: main

      - name: Checkout release branch
        uses: actions/checkout@v2
        with:
          path: release
          ref: release
          fetch-depth: 0

      - uses: actions/setup-node@v1
        with:
          node-version: '16.x'

      - name: NPM Build
        run: |
          cd ./main/
          npm ci
          npm run build

      - name: Copy Module to Release Working Dir
        run: |
          # Don't let stale build artifacts accumulate in our release branch
          rm -rf ./release/js
          cp ./main/{README.md,CHANGELOG.md,LICENSE} ./release/
          cp -r ./main/drupal_module_src/* ./release/

      - name: Push Changes to Release Branch and Tag
        run: |
          cd ./release
          git config user.name github-actions
          git config user.email github-actions@github.com
          git add .
          git commit -m "Release ${{ env.RELEASE_VERSION }}"
          git tag ${{ env.RELEASE_VERSION }}
          git push --atomic origin HEAD:release ${{ env.RELEASE_VERSION }}

      - name: Setup SSH Keys and known_hosts for drupal.org
        env:
          SSH_AUTH_SOCK: /tmp/ssh_agent.sock
        run: |
          mkdir -p ~/.ssh/
          echo "${{ secrets.DRUPAL_DOT_ORG_SSH_KNOWN_HOSTS }}" >> ~/.ssh/known_hosts
          ssh-agent -a $SSH_AUTH_SOCK > /dev/null
          ssh-add - <<< "${{ secrets.DRUPAL_DOT_ORG_SSH_PRIVATE_KEY }}"

      - name: Push Changes to Release Branch and Tag on drupal.org Gitlab
        env:
          SSH_AUTH_SOCK: /tmp/ssh_agent.sock
        run: |
          cd ./release
          git config user.name github-actions
          git config user.email github-actions@github.com
          git remote add drupal-dot-org git@git.drupal.org:project/symbioquine_dot_net_built_drupal_module_example.git
          git fetch drupal-dot-org
          git push --tags --force drupal-dot-org 'HEAD:refs/heads/release'

```

### Test Build

```sh
npm install
npm run build
```

### Drupal.org GitLab Deploy Key Setup

Add a new Deploy key to the Drupal.org GitLab for the project. For my example this is at `https://git.drupalcode.org/project/symbioquine_dot_net_built_drupal_module_example/-/settings/repository`.

I've been using the RSA key generation instructions from https://git.drupalcode.org/help/user/ssh

e.g.

```sh
$ ssh-keygen -t rsa -b 2048 -C "symbioquine_dot_net_built_drupal_module_example drupal.org Gitlab deploy key"
Generating public/private rsa key pair.
Enter file in which to save the key (/home/symbioquine/.ssh/id_rsa): /home/symbioquine/.ssh/symbioquine_dot_net_built_drupal_module_example
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
Your identification has been saved in /home/symbioquine/.ssh/symbioquine_dot_net_built_drupal_module_example
Your public key has been saved in /home/symbioquine/.ssh/symbioquine_dot_net_built_drupal_module_example.pub
The key fingerprint is:
SHA256:YmArT17dAmWhTRKPYL6DHrBBktL6pC1hbTf1f+edWaI symbioquine_dot_net_built_drupal_module_example drupal.org Gitlab deploy key
The key's randomart image is:
+---[RSA 2048]----+
|.+  o o.=.       |
|= .o . @         |
|+.. + = +        |
|o=.= * o o       |
|o*= * = S o      |
|o.o* + . . . ....|
| .. o       ..o.=|
|            E  +.|
|                 |
+----[SHA256]-----+
```

Then I copied the contents of `/home/symbioquine/.ssh/symbioquine_dot_net_built_drupal_module_example.pub` into a new Drupal.org GitLab deploy key. Make sure
to check the box that says "Grant write permissions to this key" since we'll be using that key to push releases into the Drupal.org GitLab repo.

### GitHub Secrets Setup

Add two new secrets for GitHub Actions. For my example these are added at `https://github.com/symbioquine/symbioquine_dot_net_built_drupal_module_example/settings/secrets/actions`.

First I copied the contents of `/home/symbioquine/.ssh/symbioquine_dot_net_built_drupal_module_example` into a secret named `DRUPAL_DOT_ORG_SSH_PRIVATE_KEY`.

Next I copied the output of running `ssh-keyscan git.drupal.org` into a secret named `DRUPAL_DOT_ORG_SSH_KNOWN_HOSTS`.

### Tag and Push Initial Release

```sh
echo "node_modules" >> .gitignore
echo "drupal_module_src/js" >> .gitignore
git add -A
git commit -m "Release 1.0.0"
git tag unbuilt-v1.0.0
git push --atomic origin HEAD:development unbuilt-v1.0.0
```

### Create Drupal.org release

Once the GitHub Actions workflow completes a new `1.0.0` tag will have been created on the Drupal.org GitLab for the project.

Then I go to the project page on Drupal.org and create the corresponding release.

### Conclusion

Now we have a Drupal module with JS code built via GitHub actions and installable via the `drupal/` composer prefix;

```sh
composer require drupal/symbioquine_dot_net_built_drupal_module_example
drush en symbioquine_dot_net_built_drupal_module_example
```

Once installed, the example page can be accessed under the Drupal site at `/symbioquine_dot_net_built_drupal_module_example`. e.g. https://drupal.example.com/symbioquine_dot_net_built_drupal_module_example

The full source of this example can be found in the GitHub repository at [https://github.com/symbioquine/symbioquine_dot_net_built_drupal_module_example](https://github.com/symbioquine/symbioquine_dot_net_built_drupal_module_example).

For further reference, here are a number of other modules that I maintain which use variations of this same strategy;

* https://github.com/symbioquine/farmOS_land_drawing_tool
* https://github.com/symbioquine/farmOS_wfs
* https://github.com/symbioquine/farm_map_sjc
* https://github.com/symbioquine/farmOS_asset_link
* https://github.com/symbioquine/farm_map_google
* https://github.com/symbioquine/drupal_jupyterlite

Have fun and build some cool stuff!
