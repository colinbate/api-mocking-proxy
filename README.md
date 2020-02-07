# API Mocking Proxy (AMP)

[![Build Status](https://travis-ci.org/colinbate/api-mocking-proxy.svg?branch=master)](https://travis-ci.org/colinbate/api-mocking-proxy)

AMP intercepts HTTP requests and replays captured responses. Its main purpose is to support test automation and daily development work by removing depedencies on 3rd party APIs - typically, but not only, based on JSON or XML.

There is no GUI to this tool. However, the captured responses are stored as plain text files, which makes them easy to access and manipulate. 

## Main Features

* Supports the most frequently used HTTP methods (GET, POST, PUT, DELETE, PATCH, OPTIONS)
* Caters for various kinds of parameterized requests (query string, url-encoded form data, REST, JSON)
* Authentic replay - not only the data, but also the status code and response headers
* Saved responses can be uniquely distinguished by headers and parameters of the original request
* Minimalistic, yet powerful, configuration

## Installation

The recommended way to install AMP is to create a simple project and install AMP locally to it.

```
npm install api-mocking-proxy
```

You can set up a `package.json` with an easy way to start your app:

```
"scripts": {
  "start": "amp"
}
```

Now running `npm start` will launch your server.

## Configuration

The configuration is flexible, you can use JSON or TOML, and there are useful defaults in place. Most importantly, by default your server will run on port 8088.

Configuration files go in your `config` folder. The default configuration is put in `default.toml` or `default.json`.

The only configuration you need to provide is a mapping, which maps a folder on your server to a remote API host.

```toml
[mappings.example]
host = "https://example.org"
```

This is the minimal required configuration. It will map `http://localhost:<port>/example/*` to `https://example.org/*`.


Here is a fully annotated configuration file in TOML showing all of the available options.

```toml
[server]
host = "localhost"
port = 8088
# These are the default values

[proxy]
timeout = 5000
disable = false
# Set to true to have requests not proxied out.

[cache]
dataRoot = "data" # Folder to store the cached responses. 
disable = false # Disable caching of responses (or reading of existing cache).
touchFiles = false
# Will touch or create (empty) the cache files even if disabled

[mappings.example]
# Part after the dot is the local path
host = "https://example.org"
# Only value required. The scheme + host + port (no path) of the remote host
dir = "example"
# Where to store the cache files for this host
# By default the name of the path is used
matchHeaders = ["X-UserName"]
# Create a whitelist of headers to match in request when checking cache
# If you set to true it will match them all. Default is to ignore headers.
# If you prefix a header with @ it will match based on presence of the header
# and not the value of it.
secure = true
# enable and disable ssl security validations for given mapping
matchProps = ["id"]
# Create a whitelist of properties (query/body) to base cache on.
# Or set to false to match no properties. Default is to match all.
matchPropsRecursive = false
# iterate through every object and array in the request boday to find matchProps values
ignoreProps = ["nonce"]
# Create a list of properties to ignore when otherwise matching all.
contentType = "application/json"
# Override the request Content-Type header for deciding how to decode body
noproxy = false # Don't proxy for this mapping
nocache = false # Don't use the cache for this mapping
touchFiles = false # Touch cache files for this mapping
delay = 1000 # Add a delay of 1000 ms to the response

# You can have as many mappings as you'd like:
[mappings.twitter]
host = "https://api.twitter.com"
```

## Usage

With AMP installed, and the configuration in place, you can run the server with `npm start` if you set that up as mentioned above.

The server will start up running on the port configured (or 8088), and if you access it directly in a browser, it will return the list of configured endpoints (mappings).

You can then point your original application at `http://localhost:8088/example/whatever` instead of at `https://example.org/whatever`.

For any request, if the AMP server does not have any cached copy (mock) then it will forward the request onto the original host (proxy). The response from that request will be saved and returned for subsequent requests.

These saved responses are stored in the `data` folder unless configured otherwise. They are grouped based on mapping name below that. How the response file is named is based on the request. Parts of the request are used to create a path which will allow for the reponse to that request to be found.

### Request Mapping

When AMP receives a request, it maps information from that request into a filename which it checks for a cached response. How that filename is created depends in part on the configuration, but the general anatomy of the mapped path looks like this:

```
<dataRoot>/<mappingDir>/<method>/<matchedHeaders*>/<urlPath>--<queryParams>.mock
```

| Part                   | Note                                                                                 |
|------------------------|--------------------------------------------------------------------------------------|
| `dataRoot`             | This is the folder set in the configuration, or `data` by default                    |
| `mappingDir`           | This is also a configurable value, usually the same as the base path for the mapping |
| `method`               | The HTTP method of the request (GET, POST, PUT, etc)                                 |
| `matchedHeaders`       | If `matchHeaders` is configured, will be a folder for each header-value combination  |
| `urlPath`              | The path of the URL                                                                  |
| `queryParams`          | A combination of query string parameters and body parameters (for POST, PUT)         |
| `matchPropsRecursive`  | Match deeply nested body parameters or the full query if no queryParams provided     |

An example is probably best.

Say there existed an API at `https://example.org/api/1/get-cool-stuff` and you had configured the mapping in your config file under `[mappings.example]`. After starting AMP, you could make a request to:

```
GET http://localhost:8088/example/api/1/get-cool-stuff
```

And first it would look in the file:

```
data/example/GET/api__1__get-cool-stuff.mock
```

If you made the request with a value in the query string, like `?key=mylongkey`, then it would look for this file:

```
data/example/GET/api__1__get-cool-stuff--key=mylongkey.mock
```

For PUT and POST requests, any parameters passed in the body using either `application/x-www-form-urlencoded` or `application\json` are parsed and formatted as if they were extra query string parameters.

And if you configured AMP to match your `Accept` header, the path might look like this:

```
data/example/GET/accept__application__json/api__1__get-cool-stuff--key=mylongkey.mock
```

The contents of this file, if found and not empty, will be returned to the calling application. Otherwise AMP will forward the request on to the configured `host` and save that response in the `.mock` file to be returned next time.

### Response File

The response (`.mock`) file is designed to be edited by hand, so you can make adjustments to existing saved responses, or create your own to test various conditions.

In general the format is the status code, blank line, headers (one per line), blank line, then the body.

And example might be:

```
Original request body :: {}

200

Connection: Keep-Alive
Content-Length: 15
Content-Type: application/json
Date: Thu, 11 Feb 2016 17:24:10 GMT

{"status":"ok"}
```

## Advanced

There are some more advanced configuration options available. For example, AMP uses [node-config][nc] to manage its config files, so there are options for providing different config files per environment.

Beyond that, an alternative `dataRoot` can be passed in on the commandline when starting the server with the `--root` or `-r` switch.

[nc]: https://github.com/lorenwest/node-config
