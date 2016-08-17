#!/usr/bin/env python
"""
pgoapi - Pokemon Go API
Copyright (c) 2016 tjado <https://github.com/tejado>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE
OR OTHER DEALINGS IN THE SOFTWARE.

Author: tjado <https://github.com/tejado>
"""

# import modules
import os
import sys
import json
import time
import logging
import getpass
import argparse

# import Pokemon Go API lib
from pgoapi import pgoapi
from pgoapi import utilities as util

# other stuff
from shutil import copyfile
from flask import Flask, request, make_response, jsonify, current_app, send_from_directory
from datetime import timedelta
from functools import update_wrapper

# add directory of this file to PATH, so that the package will be found
sys.path.append(os.path.dirname(os.path.realpath(__file__)))

static_folder_root = os.path.join(os.path.dirname(os.path.realpath(__file__)), "web")

app = Flask(__name__)
log = logging.getLogger(__name__)


def init_config(config_file="config/config.json"):
    parser = argparse.ArgumentParser()

    # If config file exists, load variables from json
    load = {}
    if os.path.isfile(config_file):
        with open(config_file) as data:
            load.update(json.load(data))

    # Read passed in Arguments
    required = lambda x: not x in load
    parser.add_argument("-a", "--auth_service", help="Auth Service ('ptc' or 'google')",
                        required=required("auth_service"))
    parser.add_argument("-u", "--username", help="Username", required=required("username"))
    parser.add_argument("-p", "--password", help="Password")
    parser.add_argument("-l", "--location", help="Location", required=required("location"))
    parser.add_argument("-rh", "--remote-host", help="Remote host")
    parser.add_argument("-rp", "--remote-port", help="Remote port")
    parser.add_argument("-os", "--only-server", help="Only remote server mode", action='store_true', default=False)
    parser.add_argument("-d", "--debug", help="Debug Mode", action='store_true')
    parser.add_argument("-t", "--test", help="Only parse the specified location", action='store_true')
    parser.set_defaults(DEBUG=False, TEST=False)
    config = parser.parse_args()

    # Passed in arguments shoud trump
    for key in config.__dict__:
        if key in load and config.__dict__[key] == None:
            config.__dict__[key] = str(load[key])

    if config.__dict__["password"] is None:
        log.info("Secure Password Input (if there is no password prompt, use --password <pw>):")
        config.__dict__["password"] = getpass.getpass()

    if config.auth_service not in ['ptc', 'google']:
        log.error("Invalid Auth service specified! ('ptc' or 'google')")
        return None

    return config


def get_all_player_data(config, custom_location=None, allow_debug=True):
    # log settings
    if allow_debug:
        # log format
        logging.basicConfig(level=logging.DEBUG, format='%(asctime)s [%(module)11s] [%(levelname)5s] %(message)s')
        # log level for http request class
        logging.getLogger("requests").setLevel(logging.WARNING)
        # log level for main pgoapi class
        logging.getLogger("pgoapi").setLevel(logging.INFO)
        # log level for internal pgoapi class
        logging.getLogger("rpc_api").setLevel(logging.INFO)

    if custom_location:
        config.location = custom_location

    # debug mode
    if allow_debug and config.debug:
        logging.getLogger("requests").setLevel(logging.DEBUG)
        logging.getLogger("pgoapi").setLevel(logging.DEBUG)
        logging.getLogger("rpc_api").setLevel(logging.DEBUG)

    # get current timestamp
    now = str(int(time.time()))

    # get root dir
    app_root_dir = os.path.dirname(os.path.realpath(__file__))

    # declare output files location
    web_inventory_user = os.path.join(app_root_dir, 'web/playerdata/inventory-%s.json' % config.username)
    web_player_user = os.path.join(app_root_dir, 'web/playerdata/player-%s.json' % config.username)
    web_settings_user = os.path.join(app_root_dir, 'web/playerdata/settings-%s.json' % config.username)

    # declare output request log
    web_log_api = os.path.join(app_root_dir, 'web/playerdata/api-request.' + now + '.log')

    # instantiate pgoapi
    api = pgoapi.PGoApi()

    # parse position
    position = util.get_pos_by_name(config.location)
    if not position and allow_debug:
        log.error('Your given location could not be found by name')
        return
    elif config.test:
        return

    # set player position on the earth
    api.set_position(*position)

    # new authentication initialitation
    api.set_authentication(provider=config.auth_service, username=config.username, password=config.password)

    # provide the path for your encrypt dll, see http://pgoapi.com/
    if os.path.isfile('libencrypt.dll'):
        api.activate_signature("libencrypt.dll")
    elif os.path.isfile('libencrypt.so'):
        api.activate_signature("libencrypt.so")

    # create thread-safe request
    # ----------------------
    req = api.create_request()

    # get player profile call
    # ----------------------
    req.get_player()

    # get inventory call
    # ----------------------
    req.get_inventory()

    # get download setting call
    # ----------------------
    req.download_settings()

    # execute the RPC call after 2 seconds
    time.sleep(2)
    response_dict = req.call()

    # backup latest output files
    if os.path.isfile(web_inventory_user):
        copyfile(web_inventory_user, web_inventory_user + '.' + now)
    if os.path.isfile(web_player_user):
        copyfile(web_player_user, web_player_user + '.' + now)
    if os.path.isfile(web_settings_user):
        copyfile(web_settings_user, web_settings_user + '.' + now)

    # write the output inventory file
    inventory_dict = response_dict['responses']['GET_INVENTORY']['inventory_delta']
    with open(web_inventory_user, 'w') as output_file:
        json.dump(inventory_dict, output_file, indent=2, cls=util.JSONByteEncoder)

    # write the output player file
    player_dict = response_dict['responses']['GET_PLAYER']['player_data']
    with open(web_player_user, 'w') as output_file:
        json.dump(player_dict, output_file, indent=2, cls=util.JSONByteEncoder)

    # write the output setting file
    setting_dict = response_dict['responses']['DOWNLOAD_SETTINGS']['settings']
    with open(web_settings_user, 'w') as output_file:
        json.dump(setting_dict, output_file, indent=2, cls=util.JSONByteEncoder)

    # log the request
    config.password = 'HIDDEN_PASSWORD'
    with open(web_log_api, 'w') as output_file:
        output_file.write(repr(config))


def crossdomain(origin=None, methods=None, headers=None,
                max_age=21600, attach_to_all=True,
                automatic_options=True):
    if methods is not None:
        methods = ', '.join(sorted(x.upper() for x in methods))
    if headers is not None and not isinstance(headers, basestring):
        headers = ', '.join(x.upper() for x in headers)
    if not isinstance(origin, basestring):
        origin = ', '.join(origin)
    if isinstance(max_age, timedelta):
        max_age = max_age.total_seconds()

    def get_methods():
        if methods is not None:
            return methods

        options_resp = current_app.make_default_options_response()
        return options_resp.headers['allow']

    def decorator(f):
        def wrapped_function(*args, **kwargs):
            if automatic_options and request.method == 'OPTIONS':
                resp = current_app.make_default_options_response()
            else:
                resp = make_response(f(*args, **kwargs))
            if not attach_to_all and request.method != 'OPTIONS':
                return resp

            h = resp.headers

            h['Access-Control-Allow-Origin'] = origin
            h['Access-Control-Allow-Methods'] = get_methods()
            h['Access-Control-Max-Age'] = str(max_age)
            if headers is not None:
                h['Access-Control-Allow-Headers'] = headers
            return resp

        f.provide_automatic_options = False
        return update_wrapper(wrapped_function, f)

    return decorator


@app.route('/doScan', methods=['POST'])
@crossdomain(origin='*')
def do_a_remote_scan():
    config = init_config()

    if not config:
        return jsonify('error')

    if request.form['location']:
        location = request.form['location']
    else:
        return jsonify('error')

    allow_debug = False
    if request.form['debug'] == 'true' or request.form['debug'] == 'True':
        allow_debug = True

    try:
        get_all_player_data(config, location, allow_debug)
    except:
        return jsonify('error')
    else:
        return jsonify('success')


def serve_index():
    return serve_page("index.html")


def serve_page(file_relative_path_to_root):
    return send_from_directory(static_folder_root, file_relative_path_to_root)


def run_server(config):
    if config.remote_host:
        host = config.remote_host
    else:
        host = '0.0.0.0'

    if config.remote_port:
        port = config.remote_port
    else:
        port = '12345'

    if os.path.isfile('server.crt') and os.path.isfile('server.key'):
        context = ('server.crt', 'server.key')
        app.run(host=host, port=port, ssl_context=context)
    else:
        app.run(host=host, port=port)


def main():
    config = init_config()
    if not config:
        return

    if config.only_server:
        app.add_url_rule('/<path:file_relative_path_to_root>', 'serve_page', serve_page, methods=['GET'])
        app.add_url_rule('/', 'index', serve_index, methods=['GET'])
        run_server(config)
    else:
        get_all_player_data(config)


if __name__ == '__main__':
    main()
