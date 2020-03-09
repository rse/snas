
# snas(1) -- Simple Node Application Server

## SYNOPSIS

`snas`
\[`-h`|`--help`\]
\[`-V`|`--version`\]
\[`-u`|`--ingress-url` *url*\]
\[`-a`|`--ingress-addr` *addr*\]
\[`-p`|`--ingress-port` *port*\]
\[`-A`|`--service-addr` *addr*\]
\[`-P`|`--service-port` *port*\]
\[`-d`|`--service-directory* *directory*\]
\[`-t`|`--service-admin-token` *token*\]

## DESCRIPTION

Simple Node Application Server (SNAS) allows you to run one or more
continuously running Node.js-based network services, whose source code
is intended to be directly edited by an administrator via WebDAV.
Internally, SNAS uses supervisord(8) as the process manager and nginx(8)
as the gateway for ingress HTTP/WebSocket traffic. SNAS is intended to
be used for permanently establishing ad-hoc network services, usually
for network service integration purposes.

## OPTIONS

The following top-level options and arguments exist:

- \[`-h`|`--help`\]:
  Display program usage information and immediately exit.

- \[`-V`|`--version`\]:
  Display program version information and immediately exit.

- \[`-u`|`--ingress-url` *url*\]:
  The ingress HTTP/WebSocket traffic URL. SNAS does not deal with it,
  but appends the service name onto it and passes it through to the
  services in the environment variable `SERVICE_URL`. It is up to the
  service to use this URL in HTTP redirects or in displayed outputs.

- \[`-a`|`--ingress-addr` *addr*\]:
  The ingress HTTP/WebSocket traffic IP address (or hostname) of the underlying host.

- \[`-p`|`--ingress-port` *port*\]:
  The ingress HTTP/WebSocket traffic TCP port at the underlying host.

- \[`-A`|`--service-addr` *addr*\]:
  The service HTTP/WebSocket traffic IP address services can bind to.
  SNAS does not deal with it, but and passes it through to the services
  in the environment variable `SERVICE_ADDR`. It is up to the service to
  listen to this IP address.

- \[`-P`|`--service-port` *port*\]:
  The service HTTP/WebSocket traffic TCP port services can bind to. SNAS
  does not deal with it, but adds a unique service offset to it and
  then passes it through to the services in the environment variable
  `SERVICE_PORT`. It is up to the service to listen to this TCP port.

- \[`-d`|`--service-directory* *directory*\]:
  The directory where services are stored. This directory is
  served via WebDAV under the URL `/admin/`.

- \[`-t`|`--service-admin-token` *token*\]:
  The password/token for the username `admin` for accessing the service
  directory via WebDAV under the URL `/admin/`.

## HISTORY

SNAS was developed in March 2020 for being able to easily setup service
integrations on a server without having to hook individual services into
the system.

## AUTHOR

Dr. Ralf S. Engelschall <rse@engelschall.com>

