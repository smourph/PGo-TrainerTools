#!/usr/bin/env python

import os
from setuptools import setup, find_packages
from pip.req import parse_requirements

setup_dir = os.path.dirname(os.path.realpath(__file__))
path_req = os.path.join(setup_dir, 'requirements.txt')
install_reqs = parse_requirements(path_req, session=False)

reqs = [str(ir.req) for ir in install_reqs]

setup(name='PGo-TrainerTools',
      author='smourph',
      description='Provide trainer infos and tools for Pokemon Go players',
      version='0.1.0',
      url='',
      packages=find_packages(),
      install_requires=reqs,
      )
