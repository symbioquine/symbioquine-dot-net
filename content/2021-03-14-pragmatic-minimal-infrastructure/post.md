---
date: 2021-03-14
title: 'Pragmatic Minimal Infrastructure'
slug: 2020-03-14-pragmatic-minimal-infrastructure
categories:
    - Opinions
tags:
  - Operational Excellence
  - Software Engineering
---

A 2019 article by David Futcher [appeared on Hacker News recently][0] titled [You Don’t Need All That Complex/Expensive/Distracting Infrastructure][1].
The article is well written and makes a really important point about building to your actual requirements. It's hard to over-emphasize [YAGNI][2] at all
levels of coding, software engineering, and operations. Critical thinking about the tradeoffs of increasing the upfront cost - whether in time, cash,
or complexity - is essential to reaching your audience faster and still having the flexibility/budget to respond to the ever-changing playing field.

It's important to acknowledge which tradeoffs have recurring concrete costs and which have hypothetical costs. For instance, a typical high availability (HA)
configuration with a load balancer and multiple hosts incurs many costs. It incurs an up-front cost to configure the infrastructure and ongoing hardware/maintenance
costs. It also incurs a complexity cost of deploying to multiple hosts, reasoning about distributed systems, etc. Most of these costs don't buy you anything on a
day-to-day basis. Your machines will tend to be running smoothly and the network will tend to be stable - at least in the ways your HA setup protects against.
You might never pay the hypothetical cost of an availability zone outage or a host hardware failure.

That said, you *will* have to upgrade your hosts' operating systems, deploy new versions of your software, and troubleshoot hard-to-reproduce behavior from your
system. All of these benefit from building out a little infrastructure.

For the sake of simplicity let's assume you've taken the argument against infrastructure deeply to heart and your startup's software is a gzipped folder with
all your web content and some sort of server binary. You `scp` it to your host, unpack, execute, and away you go. Life is good, there's no complicated container
systems, no build servers, no CD pipelines, no statefulness, just good old-fashioned operations - and presumably all the time in the world to find customers and
market your nascent business.

You can even get most of the benefits naively associated with having more infrastructure. Need to upgrade a host or deploy your software? No problem, you get to make
the call about whether to risk downtime. You check your logs and try to guess whether any "important customers" are likely to try and use your site. If not, just go
ahead and bounce the host or kill your server process then start a new version. Otherwise, you can spin up a new host, get it set up correctly running your software,
then do a DNS flip and wait for the traffic to move to the new machine before stopping the old one.

It may take a while and feel repetitive after the third or fourth time, but boring is good right?

Well, yes and no. The minimalistic strategy I just described is great because it puts you in the driver's seat and hopefully delivering value to your customers faster.
Where it falls down is that it is an extreme local optimum on the cost vs external value graph. In my opinion, even considering a very small set of externalities can
both erode the advantages of the minimalistic strategy and help offset the costs of a more infrastructure-intensive strategy.

One of the key aspects to consider is which kinds of growing pains you have control over and can predict/schedule. If your business venture is even a little successful,
you can be sure unforeseen bugs in your software will necessitate "emergency" code changes. You can also be sure you'll very quickly have enough web traffic that every
deployment will require that new-host/dns-flip strategy or else involve downtime affecting those existing/potential customers. What's harder to predict is where the
break-even point is on more complex infrastructure - especially since it can itself introduce unforeseen bugs. I would argue though, that paying the cost early on to
get an as-simple-as-possible no-downtime deployment mechanism is worthwhile.

Should it be prioritized over the bare-minimum work to have a product or web-presence? Probably not. Should it be prioritized along with launching your first few features
or releases? Probably. Once you have any customers, traffic, or value; you have an obligation to respect others' time and yours. In 2021 this means having very few
if any "planned outages" and definitely not having "expected" intermittent downtime for deployments. The tooling is becoming ubiquitous enough and customers discerning
enough that certain kinds of availability form a new baseline.

Another aspect that should be considered is that there are ancillary benefits to early judicious infrastructure investment. If your business succeeds, your time spent
learning enough NGINX, Kubernetes, etc. to achieve that baseline availability will serve you well by providing foundational competency to evaluate future architectures.
If your business fails there's a good chance you can re-use the core configuration/scripts/learnings in your next endeavor.

Finally, there's a sentiment case to be made for employing "cool" infrastructure that is a good fit for a given use-case and current growth. You probably don't need
and shouldn't build the fanciest multi-AZ autoscaling cluster with real-time machine-learning metrics/log analysis. But if a few scripts can give you a satisfying
minimal git-ops workflow for day-to-day deployments which makes you feel like your time is being well spent, it is likely worth it. Not to mention that your "3 AM self"
will thank you if deploying is easy, fast, and makes it hard to break things.

In short, I too want to see more pragmatic business decisions as opposed to hype-driven over-engineering. However, those decisions need to take into account the
costs of not keeping up with the times.

[0]: https://news.ycombinator.com/item?id=26423110
[1]: https://blog.usejournal.com/you-dont-need-all-that-complex-expensive-distracting-infrastructure-a70dbe0dbccb
[2]: https://martinfowler.com/bliki/Yagni.html
