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

Four other names in the zone were left alone by choice: `outcomes.1694.io`,
`outcomes-preview.1694.io`, `pgadmin.1694.io` and `sancho.1694.io` all point at
`142.132.245.12`, which is a different host and not part of this migration.
`sancho.1694.io` currently answers 525, so it is stale as well as out of scope.

## Which hostnames are actually live

The committed chart values are defaults, not the truth. `.gitlab-ci.yml`
overrides both hostnames at deploy time in both environments, at lines 163 to 164
for production and 219 to 220 for preview:

```
--set ingress.hosts[0]="$AUTO_DEVOPS_WEB_DOMAIN"
--set ingress.api="$API"
```

`--set` beats `-f`, and neither variable is defined in this repository - they are
GitLab CI/CD variables. That is why the preview frontend serves
`preview.1694.io` while `chart/values.yaml` still says `sancho.1694.io`, and why
`frontend/cypress.config.ts` still points at `sancho.1694.io` too. Both are
stale.

The authority is the cluster, not the values file:

```
kubectl get ingress -n voltaire-mainnet -o jsonpath='{.items[*].spec.rules[*].host}'
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

The served certificate does not cover the apex. cert-manager issues the wildcard
from the `cert-manager.io/cluster-issuer: letsencrypt-prod-cluster-issuer`
annotation the ingresses inherit from `chart/values.yaml`, for the hosts in
`ingress.tls[].hosts`, into the secret `wildcard-1694-tls`. That is `*.1694.io`,
and a wildcard does not match the apex, so `1694.io` is served Traefik's default
self-signed certificate.

It works today only because the zone is on Cloudflare **Full**, which does not
verify the origin certificate. The apex redirect to `www` is not what saves it:
the TLS handshake completes before any Traefik middleware runs, so the wrong
certificate is presented first and the redirect happens after. If this zone is
ever moved to **Full (strict)**, the apex answers 526, which is a handshake
failure, and no amount of redirect configuration changes that.

The fix, if that day comes, is to add `1694.io` to `ingress.tls[].hosts` in
`chart/values.yaml` and redeploy. A wildcard SAN implies a DNS-01 order, and the
`letsencrypt-prod-cluster-issuer` ClusterIssuer lives in the infrastructure repo,
not here.

Ignore the `certificate:` and `certmanager:` blocks at the top of
`chart/values.yaml`. No template reads them. They name a different secret
(`www-1694-tls`) and a Let's Encrypt staging endpoint, and both are inert.
Editing them changes nothing.

Second, the apex only has a Traefik router at all because
`ingress.redirectApex` is `true` in `chart/values.prod.yaml`. If that is ever
turned off, the apex loses its router and starts returning Traefik's default 404
instead of the redirect to `www`.

## What could not move

Nothing in this zone was blocked by a port or protocol constraint. The edge
publishes 80, 443/tcp, 443/udp and 2222 on every node, and every name here is
plain HTTPS. The four names on `142.132.245.12` were left alone by choice, not
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
