# Moving 1694.io off 167.235.218.39 onto the shared edge

This records how the `1694.io` zone was moved from the old single-VM proxy at
`167.235.218.39` onto the cluster's public edge on 2026-09-21, and how to put it
back.

## Why

Every public name in this zone used to resolve to `167.235.218.39`. That host is
one VM, so it was one point of failure for the site, the API and both preview
environments, and it is being retired.

Traffic now enters through an HAProxy DaemonSet that runs on all 8 cluster nodes
and forwards to the same Traefik the cluster already used. Routes, certificates,
ingresses and backends are unchanged. The only thing that moved is the address
clients resolve. The DaemonSet and the `edge.2lovelaces.io` record are defined in
the infrastructure repo under `helm_repo/public-edge`; the background is in
`runbooks/edge-everywhere-migration.md` in that same repo.

`edge.2lovelaces.io` is one name holding an RRset of 8 A records, one per node.
Pointing at that name rather than at the addresses means that when a node is
added or drained, one RRset changes and this zone follows. It also makes rollback
a single edit per record.

## What changed

Cloudflare zone `1694.io`, zone id `03355dbf80a08c2931014e464dd3c6dc`.

Five records were **updated in place** from `A 167.235.218.39` to
`CNAME edge.2lovelaces.io`. Nothing was deleted and nothing was recreated, so the
record ids below are still live handles and are what a rollback operates on.
All five were Cloudflare-proxied (orange) before and after, and all five kept
TTL auto, which is the literal value `1` in the API.

| name                  | record id                          |
| --------------------- | ---------------------------------- |
| `1694.io`             | `cdfddc9198ec2be75daccb4ba2c18987` |
| `www.1694.io`         | `b8785ededc913ed3e4be6d03906e4be1` |
| `api.1694.io`         | `49769364b99b98232a04ee1f06eeac90` |
| `preview.1694.io`     | `fa8917fbdc153464ec0574a19c886612` |
| `preview-api.1694.io` | `2b7d965dba4678e2604c11531594d378` |

The zone's SSL/TLS encryption mode was **Full** on the day of the change. It is
read from the Cloudflare dashboard, SSL/TLS overview for the `1694.io` zone. That
matters, see the apex section below.

DNS edits on this zone need a Cloudflare API token with `Zone.DNS:Edit` on
`1694.io`. Darlington holds one; it is not in this repository and must never be.

Four other names were in the zone at the time of the migration and were left
alone by choice: `outcomes.1694.io`, `outcomes-preview.1694.io`,
`pgadmin.1694.io` and `sancho.1694.io`, all `A` records to `142.132.245.12`,
a different host and not part of this migration.

They are no longer in the zone. Re-reading it about forty minutes after the
change, only the five names above remain and all four of those records are
gone, so `sancho.1694.io` and the rest now fail to resolve rather than
answering anything. That deletion was not part of this migration and is not
undone by the rollback below, which only restores the five names it changed.
If those four names mattered to someone, they need recreating from whatever
record of them exists outside this document.

## Which hostnames are actually live

The committed chart values are defaults, not the truth. `.gitlab-ci.yml`
overrides both hostnames at deploy time in both environments, at lines 163 to 164
in the `app-preview` job and 219 to 220 in the `production` job:

```
--set ingress.hosts[0]="$AUTO_DEVOPS_WEB_DOMAIN"
--set ingress.api="$API"
```

`--set` beats `-f`, and neither variable is defined in this repository - they are
GitLab CI/CD variables. So the values file can drift from what is live without
anything failing, and it had. `chart/values.yaml` still named `sancho.1694.io` as
the preview frontend host and `frontend/cypress.config.ts` still pointed its
tests at `https://sancho.1694.io/api`, while the live preview host has been
`preview.1694.io` for some time and `sancho.1694.io` now answers 525. Both were
corrected in this change. Expect the drift to come back: a default nobody reads
is a default nobody notices going wrong.

The authority is the cluster, not the values file:

```
kubectl get ingress -n voltaire -o jsonpath='{.items[*].spec.rules[*].host}'
kubectl get ingress -n voltaire-preview -o jsonpath='{.items[*].spec.rules[*].host}'
```

`ingress.redirectApex` and `ingress.apexHost` are the exception. They are set only
in `chart/values.prod.yaml` and are never overridden by `--set`, so for the apex
the values file can be trusted.

## Prove the edge serves you before you change DNS

The old proxy and the edge both forward to the same Traefik, so the destination
can be tested before anything is switched. Resolve each hostname to an edge node
and compare against the same call through `167.235.218.39`.

```bash
#!/usr/bin/env bash
EDGE=$(dig +short A edge.2lovelaces.io | sort -u | head -1)
echo "testing against edge node $EDGE"
while read -r H P; do
  old=$(curl -sk -o /dev/null --resolve "$H:443:167.235.218.39" -w '%{http_code}' "https://$H$P")
  new=$(curl -sk -o /dev/null --resolve "$H:443:$EDGE" -w '%{http_code}' "https://$H$P")
  printf '%-22s %-8s old=%s edge=%s\n' "$H" "$P" "$old" "$new"
done <<'EOF'
1694.io /
www.1694.io /en
api.1694.io /dreps
preview.1694.io /en
preview-api.1694.io /dreps
EOF
```

Declare the block `bash` and run it with bash. Under zsh, which is the default
shell on macOS, an unquoted expansion is not word-split, so a `set -- $spec`
style loop hands curl a malformed `--resolve` argument, every request fails, and
both columns show zeros. That reads as "identical" and fails into a false pass.

Use `--resolve`, not `-H "Host: ..."`. A `Host:` header and an SNI name are not
the same thing, and a backend that picks its site by SNI answers differently.

What a match proves is narrow but it is the thing that decides the migration: the
edge serves the same responses from the same Traefik as the old proxy. It says
nothing about the post-change path, which goes through Cloudflare and exercises
WAF rules, page rules and caching that neither leg of this test touches.

One way this test can fail without anything being wrong with the migration:
`167.235.218.39` is in Traefik's `trustedIPs` and in the
`2lovelaces-infra/ipallowlist` MiddlewareTCP, so an origin can restrict by source
address. A refusal on one leg from a laptop outside those ranges is a property of
where you are calling from, not a reason to stop.

Worth running against every node rather than one, since after the change any of
them can serve the traffic. Replace the `head -1` above with a loop over the full
list:

```
dig +short A edge.2lovelaces.io | sort -u
```

Expect 8 addresses. If it prints fewer, or nothing, resolution is the problem and
nothing below it means anything.

## Verify after the change

Compare against the baseline that was written down, not against "looks fine":

```
curl -s -o /dev/null -w "%{http_code} ip=%{remote_ip} tls=%{ssl_verify_result}\n" https://www.1694.io/en
```

Status codes must be identical to the baseline. `tls=0` means the certificate
validated. For these names `remote_ip` is one of Cloudflare's addresses, which is
correct: they are all proxied.

Test the path that matters. A landing page proves very little here, because `www`
and `preview` answer `/` with a 307 to `/en` and the two API names answer `/` with
NestJS's own `Cannot GET /` 404. The paths worth checking, with the values
observed both before and after the change on 2026-09-21:

| name                  | path     | expected                            |
| --------------------- | -------- | ----------------------------------- |
| `1694.io`             | `/`      | 301 to `https://www.1694.io/`       |
| `www.1694.io`         | `/`      | 307 to `https://www.1694.io/en`     |
| `www.1694.io`         | `/en`    | 200                                 |
| `api.1694.io`         | `/`      | 404, JSON `Cannot GET /`            |
| `api.1694.io`         | `/dreps` | 200, JSON body with a `data` array  |
| `preview.1694.io`     | `/`      | 307 to `https://preview.1694.io/en` |
| `preview.1694.io`     | `/en`    | 200                                 |
| `preview-api.1694.io` | `/dreps` | 200                                 |

A bare `404 page not found` body is Traefik's no-router default, not the
application. The API names return a JSON body instead, which is how you know the
request reached NestJS.

## Rollback

Each record is reverted by updating it back to an `A` record in place, using the
id from the table above. The zone id and every id are in this document, so this
can be run without opening the dashboard. `$CF_TOKEN` is the Cloudflare API token
described above.

```
curl -sS -X PATCH \
  -H "Authorization: Bearer $CF_TOKEN" \
  -H 'content-type: application/json' \
  -d '{"type":"A","name":"www.1694.io","content":"167.235.218.39","proxied":true,"ttl":1}' \
  "https://api.cloudflare.com/client/v4/zones/03355dbf80a08c2931014e464dd3c6dc/dns_records/b8785ededc913ed3e4be6d03906e4be1"
```

The other four are the same call with the name and record id swapped. `proxied`
stays `true` and `ttl` stays `1` for all five: `1` is what Cloudflare's API calls
auto, and writing `300` here would silently change behaviour.

`167.235.218.39` is untouched by this migration and keeps working throughout, so
it is a fallback rather than something being switched off underneath us.

**When to roll back.** Any of the status codes in the table above stops matching
its expected value, `tls` stops reading `0` on a proxied name, or the site starts
erroring for users. Partial rollback is fine: the five records are independent and
reverting one does not require reverting the others. The one pairing worth keeping
in mind is that the apex only ever redirects to `www`, so if `www` goes back, move
the apex with it or the redirect lands somewhere you are not watching.

**After rolling back**, re-run the verification table above. Every row must read
the same as it did before the migration, which is the same as it reads after it -
that is the point of the whole exercise.

**Then tell the infrastructure owners**, in the infrastructure repo, because a
rollback means the edge failed for a case they believe is covered.

Revert is effectively instant for these records. Clients keep resolving the same
Cloudflare anycast addresses, so only Cloudflare's own origin changes and no
client-side TTL has to expire. Expect it to take effect within about 30 seconds.
If it has not after 5 minutes, escalate rather than editing again.

## Two things to know about the apex

`1694.io` is a CNAME, which is normally illegal at a zone apex. Cloudflare always
flattens a CNAME at the apex, so the record is legal there - this is not a
configurable default that someone could have switched off, and looking for such a
toggle will waste time. Because the record is also proxied, clients resolve
Cloudflare's own addresses and Cloudflare uses `edge.2lovelaces.io` as its origin.

The apex has no certificate of its own, which is measurable rather than inferred.
Against any edge node:

```bash
EDGE=$(dig +short A edge.2lovelaces.io | head -1)
openssl s_client -connect "$EDGE:443" -servername 1694.io </dev/null 2>/dev/null \
  | openssl x509 -noout -subject -ext subjectAltName
```

On 2026-09-21 that returned `subject=CN = TRAEFIK DEFAULT CERT` with a
`*.traefik.default` SAN, on all eight nodes. The same probe with
`-servername www.1694.io` returned the Let's Encrypt certificate, whose SAN list
is exactly one entry, `DNS:*.1694.io`. A wildcard does not match the apex, so
the apex falls through to Traefik's self-signed default.

Every certificate here comes from cert-manager's ingress-shim rather than from a
`Certificate` resource in the chart. The
`cert-manager.io/cluster-issuer: letsencrypt-prod-cluster-issuer` annotation that
all three ingresses inherit from `chart/values.yaml` is the whole mechanism, and
the hosts it asks for are whatever sits under `ingress.tls[].hosts`.

The fix is one certificate covering both names. `chart/values.prod.yaml` now
carries its own `ingress.tls` list with `*.1694.io` and `1694.io` on the same
entry, into the same secret `wildcard-1694-tls`. No template changed. All three
production ingresses render the same two-SAN TLS block, and the certificate
Traefik already serves for `www` starts covering the apex as well.

It is scoped to production on purpose. Helm replaces a list rather than merging
it, so putting the apex in `chart/values.prod.yaml` leaves preview asking for the
wildcard alone. That matters: `voltaire-preview` has no apex router, and a
namespace ordering a certificate for a name it does not serve is a validation
failure waiting to happen.

Two consequences worth knowing before you deploy.

**One order now covers both names, so one failing name fails both.** ACME issues
a separate authorization per identifier, and cert-manager picks a solver per
identifier. If `1694.io` cannot be validated, the whole order fails and the
production certificate stops renewing. That is the certificate serving `www` and
`api`. The preview names are unaffected: `voltaire-preview` holds its own
`wildcard-1694-tls`, a separate Certificate with its own expiry, and this change
does not touch it.

Survivable rather than dangerous, because a failed order does not touch the
existing secret. The production certificate in place on 2026-09-21 runs to
`2026-12-03`, so there are about ten weeks of grace. It is only dangerous if
nobody looks, and on Cloudflare **Full** an expired origin certificate still
passes at the edge, so the outside world will not tell you. Run the post-deploy
check below on the day you deploy, not the week after.

**Production and preview no longer share a duplicate-certificate bucket.** Both
namespaces used to order the identical SAN set `{*.1694.io}`, which counts against
Let's Encrypt's limit of 5 duplicate certificates per week across the account.
Production now orders `{*.1694.io, 1694.io}`, a different set. A small improvement,
not a reason for the change.

### The solver question, answered

One thing decides whether the apex can be validated at all, and therefore whether
putting it on the same certificate is safe: which ACME solver cert-manager picks
for the identifier `1694.io`. Do not reason from the wildcard. The wildcard proves
a DNS-01 solver exists for something matching `*.1694.io`, and cert-manager selects
from `solvers[].selector` against the identifier, not from which TXT name a
validation ends up using.

Read it:

```bash
kubectl get clusterissuer letsencrypt-prod-cluster-issuer \
  -o jsonpath='{.spec.acme.solvers}'
```

On 2026-09-21 that returned two solvers:

- HTTP-01, ingress class `nginx`, gated behind
  `selector.matchLabels: {use-http01-solver: "true"}`
- DNS-01 through Cloudflare, `cnameStrategy: Follow`, **no selector at all**

`matchLabels` matches labels on the `Certificate` resource. Nothing in this chart
puts `use-http01-solver` on an ingress, so ingress-shim never puts it on the
Certificate, so that solver never matches. Every identifier falls to the
unselectored DNS-01 solver, `1694.io` included. The HTTP-01 solver also targets
ingress class `nginx`, and this cluster runs Traefik, so it could not have worked
here anyway.

That is what makes one certificate the right shape rather than a gamble. If that
ClusterIssuer ever grows a selector that excludes the apex, split `1694.io` onto
its own certificate and secret before the next renewal, because from then on a
failing apex would take the wildcard's renewal down with it.

The other question was whether changing the TLS block could disturb the existing
Certificate. It cannot, and the reason is worth writing down. All three production
ingresses reference `wildcard-1694-tls`, ingress-shim sets a controller
ownerReference on the Certificate it creates, and the owner here is
`Ingress/www-1694-backend-ingress`, not the apex one. Nothing in this change
removes a TLS reference from any ingress in any case, so there is no path to the
Certificate being dropped and re-ordered.

### Check this after deploying

```bash
kubectl get certificate wildcard-1694-tls -n voltaire
kubectl describe certificate wildcard-1694-tls -n voltaire

for ip in $(dig +short A edge.2lovelaces.io); do
  printf '%-16s ' "$ip"
  openssl s_client -connect "$ip:443" -servername 1694.io </dev/null 2>/dev/null \
    | openssl x509 -noout -subject -ext subjectAltName | tr -s ' \n' ' '
  echo
done
```

The `READY` column should read `True`, and every node should present a
certificate whose SANs include both `DNS:*.1694.io` and `DNS:1694.io`, rather than
`CN = TRAEFIK DEFAULT CERT`. Check all eight, not one: a single lagging node is
exactly the case this is looking for. Issuance normally takes a minute or two.
The `letsencrypt-prod-cluster-issuer` ClusterIssuer is cluster-scoped and lives in
the infrastructure repo, not here.

`_acme-challenge.1694.io` is now a shared TXT name: `1694.io` and `*.1694.io` from
the one production order, and `*.1694.io` from `voltaire-preview`. cert-manager
appends TXT values rather than replacing them, so this works, but overlapping
orders at one name are a known source of races. An order stuck at `Pending` with a
failed propagation check is the symptom. Give it five minutes, then look at the
record directly with `dig +short TXT _acme-challenge.1694.io` before touching
anything.

To back the certificate change out, remove `1694.io` from `ingress.tls[0].hosts`
in `chart/values.prod.yaml` and redeploy. The apex returns to Traefik's
self-signed default, which is where it was, and Cloudflare **Full** keeps passing
it through. That statement covers the apex only. It is not a blanket all-clear:
the wildcard is the part with something to lose here, which is why the check
above is not optional.

One more thing about deploys. The `production` job in `.gitlab-ci.yml` is
`when: manual`, but `deploy-indexer-production` is not: it fires on a pipeline
trigger carrying `INDEXER_TAG` and `INDEXER_SHA`, and it runs
`helm upgrade ./chart --reuse-values`. That means a chart change merged to `main`
can reach production on the next governance-indexer build, with nobody watching
and nobody running the checks above. `--reuse-values` also means new values keys
do not reach that release, which is why the apex secret name has a `default` in
the template rather than relying on `chart/values.yaml`.

Second, the apex only has a Traefik router at all because
`ingress.redirectApex` is `true` in `chart/values.prod.yaml`. If that is ever
turned off, the apex loses its router and starts returning Traefik's default 404
instead of the redirect to `www`.

## What could not move

Nothing in this zone was blocked by a port or protocol constraint. The edge
publishes 80, 443/tcp, 443/udp and 2222 on every node, and every name here is
plain HTTPS. The four names on `142.132.245.12` were left alone by choice, and
have since been deleted from the zone by someone else entirely, not
because they could not move.

The port-bound names in the wider migration - the Cardano relays, tx submit,
icebreaker, IPFS - live in `lidonation.com` and are not part of this project.

## Do not

- Do not remove `167.235.218.39` from Traefik's `trustedIPs` (Traefik's own
  values in the infrastructure repo) or from the `2lovelaces-infra/ipallowlist`
  MiddlewareTCP. Those entries are what still let through every service that has
  not moved yet.
- Do not change a `proxied` flag as part of a migration. Orange stays orange,
  grey stays grey. That is a separate decision with separate consequences.
