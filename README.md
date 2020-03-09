
SNAS
====

**Simple Node Application Server**

<p/>
<img src="https://nodei.co/npm/snas.png?downloads=true&stars=true" alt=""/>

<p/>
<img src="https://david-dm.org/rse/snas.png" alt=""/>

Abstract
--------

Simple Node Application Server (SNAS) allows you to run one or more
continuously running Node.js-based network services, whose source code
is intended to be directly edited by an administrator via WebDAV.
Internally, SNAS uses supervisord(8) as the process manager and nginx(8)
as the gateway for ingress HTTP/WebSocket traffic. SNAS is intended to
be used for permanently establishing ad-hoc network services, usually
for network service integration purposes.

Installation
------------

```
$ npm install -g snas
```

SNAS has the following external run-time dependencies:

- program `node` from [Node.js](https://nodejs.org/)
- program `npm`  from [Node.js](https://nodejs.org/)
- program `supervisord` from [SupervisorD-Go](https://github.com/ochinchina/supervisord/)
- program `nginx` from [NGINX](https://nginx.org/)
- program `postproc` from [PostProc](https://github.com/rse/postproc/)

Usage
-----

The [Unix manual page](https://github.com/rse/snas/blob/master/snas.md) contains
detailed usage information.

License
-------

Copyright &copy; 2020 Dr. Ralf S. Engelschall (http://engelschall.com/)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

