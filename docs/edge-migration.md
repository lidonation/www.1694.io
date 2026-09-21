# Moving 1694.io off 167.235.218.39 onto the shared edge

This records how the `1694.io` zone was moved from the old single-VM proxy at
`167.235.218.39` onto the cluster's public edge, and how to put it back if it
ever needs to go back.

## Why

Every public name in this zone used to resolve to `167.235.218.39`. That host is
one VM, so it is one point of failure for the site, the API and both preview
environments, and it is being retired.

Traffic now enters through an HAProxy DaemonSet that runs on all 8 cluster
nodes and forwards to the same Traefik the cluster already used. Routes,
certificates, ingresses and backends are unchanged. The only thing that moved is
the address clients resolve.

`edge.2lovelaces.io` is a single record holding all 8 node IPs. Pointing at that
name rather than at the IPs means that when a node is added or drained, one
record changes and this zone follows. It also makes rollback a single edit.

## The records

Baseline before the change, captured 2026-09-21. All five were `A` records to
`167.235.218.39`, all Cloudflare-proxied (orange), all TTL auto:

| name                  | record id                          |
| --------------------- | ---------------------------------- |
| `1694.io`             | `cdfddc9198ec2be75daccb4ba2c18987` |
| `www.1694.io`         | `b8785ededc913ed3e4be6d03906e4be1` |
| `api.1694.io`         | `49769364b99b98232a04ee1f06eeac90` |
| `preview.1694.io`     | `fa8917fbdc153464ec0574a19c886612` |
| `preview-api.1694.io` | `2b7d965dba4678e2604c11531594d378` |

Each became a `CNAME` to `edge.2lovelaces.io`, keeping `proxied` and TTL exactly
as they were. The apex is a CNAME too: Cloudflare's "Flatten CNAME at root" is on
by default and synthesises A records from the target at query time.

Four other names in this zone were left alone. `outcomes.1694.io`,
`outcomes-preview.1694.io`, `pgadmin.1694.io` and `sancho.1694.io` point at
`142.132.245.12`, which is a different host and not part of this migration.

## Prove the edge serves you before you change DNS

The old proxy and the edge both forward to the same Traefik, so the destination
can be tested before anything is switched. Resolve the hostname to an edge node
and compare against the same call through `167.235.218.39`:

```
for spec in "www.1694.io /en" "api.1694.io /dreps" "1694.io /" "preview.1694.io /en" "preview-api.1694.io /dreps"; do
  set -- $spec; H=$1; P=$2
  echo "$H$P  old=$(curl -sk -o /dev/null --resolve "$H:443:167.235.218.39" -w '%{http_code}' "https://$H$P")" \
       "edge=$(curl -sk -o /dev/null --resolve "$H:443:46.4.102.74" -w '%{http_code}' "https://$H$P")"
done
```

The two columns must be identical. If they differ, stop: something is wrong
before anything has been changed.

Use `--resolve`, not `-H "Host: ..."`. A `Host:` header and an SNI name are not
the same thing, and a backend that picks its site by SNI will answer differently.

Worth doing on all 8 edge nodes rather than one, since after the change every
node can serve the traffic:

```
getent ahostsv4 edge.2lovelaces.io | awk '{print $1}' | sort -u
```

## Verify after the change

Compare against the baseline that was written down, not against "looks fine":

```
curl -s -o /dev/null -w "%{http_code} ip=%{remote_ip} tls=%{ssl_verify_result}\n" https://www.1694.io/en
```

Status codes must be identical to the baseline. `tls=0` means the certificate
validated. For these names `remote_ip` is one of Cloudflare's addresses, which
is correct: they are all proxied.

Test the path that matters. A landing page proves very little here, because
`www` and `preview` answer `/` with a 307 to `/en` and the two API names answer
`/` with NestJS's own `Cannot GET /` 404. The paths worth checking:

| name                  | path       | expected |
| --------------------- | ---------- | -------- |
| `1694.io`             | `/`        | 301 to `https://www.1694.io/` |
| `www.1694.io`         | `/`        | 307 to `/en` |
| `www.1694.io`         | `/en`      | 200 |
| `api.1694.io`         | `/dreps`   | 200 |
| `preview.1694.io`     | `/en`      | 200 |
| `preview-api.1694.io` | `/dreps`   | 200 |

A bare `404 page not found` body is Traefik's no-router default, not the
application. The API names return a JSON body instead, which is how you know the
request reached NestJS.

## Rollback

Recreate the `A` record to `167.235.218.39` with the same `proxied` flag and the
same TTL, using the record ids in the table above. That is the whole procedure.
`167.235.218.39` is untouched by this migration and keeps working throughout, so
it is a fallback rather than something being switched off underneath us. For a
proxied name the revert is effectively instant.

## Two things to know about the apex

The chart issues a wildcard certificate for `*.1694.io`. A wildcard does not
match the apex, so `1694.io` is served Traefik's default self-signed
certificate. It works today because the zone is on Cloudflare **Full**, which
does not verify the origin certificate, and because the apex router redirects to
`www` before anything else happens.

That is pre-existing and the migration does not change it, but it is worth
knowing: if this zone is ever moved to **Full (strict)**, the apex will start
answering 526 until `1694.io` is added to the certificate SANs. The fix is to add
the apex to `ingress.tls[].hosts` and the certificate hosts in
`chart/values.yaml`, not to change the encryption mode back.

Second, the apex only has a Traefik router because `ingress.redirectApex` is
`true` in `chart/values.prod.yaml`. If that is ever turned off, the apex stops
having a router and starts returning Traefik's default 404 instead of the
redirect to `www`.

## What could not move

Nothing in this zone. The edge publishes 80, 443/tcp, 443/udp and 2222 on every
node, and every name here is plain HTTPS.

The port-bound names in the wider migration - the Cardano relays, tx submit,
icebreaker, IPFS - live in `lidonation.com` and are not part of this project.

## Do not

- Do not remove `167.235.218.39` from Traefik's `trustedIPs` or from the
  `2lovelaces-infra/ipallowlist` MiddlewareTCP. Those entries are what still let
  through every service that has not moved yet.
- Do not change a `proxied` flag as part of a migration. Orange stays orange,
  grey stays grey. That is a separate decision with separate consequences.
