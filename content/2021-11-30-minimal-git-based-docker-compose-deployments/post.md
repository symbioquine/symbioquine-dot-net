---
date: 2021-11-30
title: 'Minimal git-based docker-compose deployments'
slug: 2021-11-30-minimal-git-based-docker-compose-deployments
categories:
    - Tutorials
tags:
  - Operational Excellence
  - Software Engineering
---

Deployment automation infrastructure is perhaps one the most crowded domains. Many of the options out there address key facets of the domain such as testing, QA approvals, pipeline transparency,
rollback, zero-downtime rollouts, etc. There are also adjacent domains such as the DevOps space with tools like Puppet and Ansible.

Those tools are great when you need them, but sometimes they introduce more complexity cost than they're worth.

This recipe shows how to set up a minimal repository that will clone itself and run docker-compose on new pushes. It doesn't do a lot of the things those full-featured deployment tools do,
but it is pretty impressive what you _can_ get with a tiny git hook and a script in the right place.

_**Note:** The pattern of calling a script in a repository from a git hook is a bit of a security risk in multi-user environments if write access on the repository are set too permissively. Please exercise caution._

## Prerequisites

_If you're here, I'm going to assume you already know how to set up SSH and are confident enough to customize this recipe for your needs._

### Both Target and Development Hosts

* `git`

### Target Host

* `docker`
* `docker-compose`

## Server Repository Setup (on Target Host)

First we'll create a [bare repository](https://git-scm.com/book/en/v2/Git-on-the-Server-Getting-Git-on-a-Server) on the server - feel free to replace "myproject" with another name (It probably can't have spaces, but I haven't tested that.);

```sh
ssh myuser@myserver
git init --bare /home/myuser/myproject.git
```

Next we'll install the git hook in that bare repository;

```sh
echo '[ -d "/home/myuser/myproject" ] && /home/myuser/myproject/deploy.sh || git clone /home/myuser/myproject.git /home/myuser/myproject && /home/myuser/myproject/deploy.sh' > /home/myuser/myproject.git/hooks/post-receive && chmod +x /home/myuser/myproject.git/hooks/post-receive
```

At this point, the repository can be pushed to and it will automatically clone itself and execute a `deploy.sh` script that must be placed at the root of the repository.

## Client Repository Setup

Clone the repository and cd into it;

```sh
git clone myuser@myserver:/home/myuser/myproject.git myproject
cd myproject
```

Create the `deploy.sh` file with the following contents;

```sh
#!/bin/bash
set -e

cd /home/myuser/myproject

STAGE="$1"

if [ "$STAGE" == "plan" ]; then
    ./deploy.sh execute
    exit 0;
fi

if [ "$STAGE" == "execute" ]; then
    docker-compose up -d --build --remove-orphans
    exit 0;
fi

echo pwd=`pwd`
echo GIT_DIR=${GIT_DIR}
unset GIT_DIR
git pull
./deploy.sh plan
```

Create the `docker-compose.yml` file with the following contents;

```sh
version: '3.7'
services:

  hello-world:
    image: armhf/hello-world
```

Mark the `deploy.sh` script as executable and commit/push the initial change;

```sh
chmod +x deploy.sh 
git add -A
git commit -m "Initial commit"
```

You should then see something like this;

```
$ git commit -m "Initial commit"
[master (root-commit) f90ae92] Initial commit
 2 files changed, 28 insertions(+)
 create mode 100755 deploy.sh
 create mode 100644 docker-compose.yml
$ git push
Enumerating objects: 4, done.
Counting objects: 100% (4/4), done.
Delta compression using up to 12 threads
Compressing objects: 100% (4/4), done.
Writing objects: 100% (4/4), 530 bytes | 530.00 KiB/s, done.
Total 4 (delta 0), reused 0 (delta 0), pack-reused 0
remote: Cloning into '/home/myuser/myproject'...
remote: done.
remote: pwd=/home/myuser/myproject
remote: GIT_DIR=.
remote: Already up to date.
remote: Creating network "myproject_default" with the default driver
remote: Pulling hello-world (armhf/hello-world:)...
remote: latest: Pulling from armhf/hello-world
remote: Digest: sha256:9701edc932223a66e49dd6c894a11db8c2cf4eccd1414f1ec105a623bf16b426
remote: Status: Downloaded newer image for armhf/hello-world:latest
remote: Creating myproject_hello-world_1 ... 
remote: Creating myproject_hello-world_1 ... done
To myserver:/home/myuser/myproject.git
 * [new branch]      master -> master
```

Congratulations, you've now bootstrapped some minimal git-based deployment infrastructure. Use it wisely and build something cool!

## Related Work

* https://kenfavors.com/code/using-git-to-deploy-code/
* https://ricardoanderegg.com/posts/git-push-deployments-docker-tags/
