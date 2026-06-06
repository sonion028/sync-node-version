#!/usr/bin/env node
/* global process */

import { syncNodeVersion } from './sync.js';

syncNodeVersion(process.cwd());
